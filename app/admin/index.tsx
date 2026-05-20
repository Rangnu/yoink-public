import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';
import { useWatchlist } from '@/contexts/watchlist-context';
import { canAccessAdmin, hasAdminConfig } from '@/utils/admin';
import { fetchCoinMarketRows, getLatestTimestamp, type CoinMarketRow } from '@/utils/coin-market';
import { supabase } from '@/utils/supabase';

type AdminStatusPayload = {
  source: 'edge-function';
  actor: {
    email: string | null;
  };
  admin: {
    allowlistConfigured: boolean;
    allowlistSource: 'table' | 'secret';
  };
  ingest: {
    runCount: number;
    lastRun: {
      id: number;
      status: string;
      started_at: string;
      finished_at: string | null;
      error: string | null;
    } | null;
    lastSuccess: {
      id: number;
      status: string;
      started_at: string;
      finished_at: string | null;
      error: string | null;
    } | null;
    lastFailure: {
      id: number;
      status: string;
      started_at: string;
      finished_at: string | null;
      error: string | null;
    } | null;
    failedRuns24h: number;
  };
  coinData: {
    coinsCount: number;
    snapshotsCount: number;
    whaleMetricsCount: number;
    topTradersCount: number;
    latestSnapshotTs: string | null;
  };
  ops: {
    watchlistsCount: number;
    watchlistItemsCount: number;
    activityEventsCount: number;
  };
  moderation: {
    available: boolean;
    reason: string;
  };
};

type AccessMode = 'pending' | 'edge' | 'fallback' | 'denied' | 'backend_unavailable';

export default function AdminScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { mode, syncState, symbols } = useWatchlist();
  const [rows, setRows] = useState<CoinMarketRow[]>([]);
  const [edgeStatus, setEdgeStatus] = useState<AdminStatusPayload | null>(null);
  const [accessMode, setAccessMode] = useState<AccessMode>('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);

  const clientAdminConfigured = hasAdminConfig();
  const clientAdminAllowed = canAccessAdmin(user);

  const readFunctionErrorBody = useCallback(async (response?: Response) => {
    if (!response) return null;

    try {
      const contentType = response.headers.get('Content-Type') ?? '';
      if (!contentType.includes('application/json')) return null;
      return await response.clone().json() as { error?: string; code?: string };
    } catch {
      return null;
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    if (!user) {
      setRows([]);
      setEdgeStatus(null);
      setAccessMode('pending');
      setError(null);
      setAccessMessage(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setAccessMessage(null);

      const adminStatusResult = await supabase.functions.invoke('admin-status', { body: {} });

      if (!adminStatusResult.error && adminStatusResult.data) {
        const nextRows = await fetchCoinMarketRows(120);
        setRows(nextRows);
        setEdgeStatus(adminStatusResult.data as AdminStatusPayload);
        setAccessMode('edge');
        return;
      }

      const response = adminStatusResult.response;
      const responseStatus = response?.status;
      const responseBody = await readFunctionErrorBody(response);
      const errorCode = responseBody?.code ?? null;

      if (responseStatus === 401 || responseStatus === 403) {
        setRows([]);
        setEdgeStatus(null);
        setAccessMode('denied');
        setAccessMessage(responseBody?.error ?? 'This signed-in account is not authorized for admin access.');
        return;
      }

      if (clientAdminAllowed) {
        const nextRows = await fetchCoinMarketRows(120);
        setRows(nextRows);
        setEdgeStatus(null);
        setAccessMode('fallback');
        setAccessMessage(
          errorCode === 'admin_allowlist_missing'
            ? 'Backend admin allowlist is not configured yet. Showing protected local fallback data only.'
            : 'Protected backend is unavailable. Showing protected local fallback data only.'
        );
        return;
      }

      setRows([]);
      setEdgeStatus(null);
      setAccessMode('backend_unavailable');
      setAccessMessage(
        errorCode === 'admin_allowlist_missing'
          ? 'The backend admin allowlist is not configured yet, so privileged admin access cannot be granted.'
          : 'The protected admin backend is not available yet. Deploy the admin-status function and configure backend admin emails.'
      );
    } catch (err: any) {
      setRows([]);
      setEdgeStatus(null);
      if (clientAdminAllowed) {
        try {
          const nextRows = await fetchCoinMarketRows(120);
          setRows(nextRows);
          setAccessMode('fallback');
          setAccessMessage('Protected backend request failed. Showing protected local fallback data only.');
        } catch {
          setAccessMode('backend_unavailable');
          setError(err?.message ?? 'Failed to load admin metrics.');
        }
      } else {
        setAccessMode('backend_unavailable');
        setError(err?.message ?? 'Failed to load admin metrics.');
      }
    } finally {
      setLoading(false);
    }
  }, [clientAdminAllowed, readFunctionErrorBody, user]);

  useEffect(() => {
    if (authLoading) return;
    loadAdminData();
  }, [authLoading, loadAdminData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAdminData().finally(() => setRefreshing(false));
  }, [loadAdminData]);

  const latestTimestamp = useMemo(() => getLatestTimestamp(rows), [rows]);
  const privilegedLatestTimestamp = edgeStatus?.coinData.latestSnapshotTs ?? null;
  const effectiveLatestTimestamp = privilegedLatestTimestamp ?? latestTimestamp;
  const privilegedStatus = accessMode === 'edge' ? 'edge' : 'fallback';
  const effectiveMinutesSinceUpdate = effectiveLatestTimestamp
    ? Math.max(0, Math.round((Date.now() - new Date(effectiveLatestTimestamp).getTime()) / 60000))
    : null;
  const effectiveFeedHealth = effectiveMinutesSinceUpdate == null
    ? 'unknown'
    : effectiveMinutesSinceUpdate <= 10
      ? 'healthy'
      : effectiveMinutesSinceUpdate <= 20
        ? 'delayed'
        : 'stale';
  const effectiveFeedHealthTone = effectiveFeedHealth === 'healthy'
    ? colors.success
    : effectiveFeedHealth === 'delayed'
      ? '#FFB020'
      : colors.danger;
  const missingPrices = rows.filter((row) => row.price_usd == null).length;
  const missing24h = rows.filter((row) => row.change_24h_pct == null).length;
  const missing1h = rows.filter((row) => row.change_1h_pct == null).length;
  const topVolumeLeader = useMemo(
    () => [...rows].sort((a, b) => (b.volume_24h_usd ?? 0) - (a.volume_24h_usd ?? 0))[0] ?? null,
    [rows]
  );
  const stalePreview = useMemo(
    () =>
      [...rows]
        .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
        .slice(0, 5),
    [rows]
  );
  const formatRelativeTime = useCallback((iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
    if (diffMinutes < 1) return t('RelativeJustNow');
    if (diffMinutes < 60) return t('RelativeMinutesAgo').replace('{count}', `${diffMinutes}`);
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return t('RelativeHoursAgo').replace('{count}', `${diffHours}`);
    const diffDays = Math.round(diffHours / 24);
    return t('RelativeDaysAgo').replace('{count}', `${diffDays}`);
  }, [t]);

  const pushLogin = () =>
    router.push({ pathname: '/auth/login', params: { redirectTo: '/admin' } } as any);

  if (authLoading) {
    return (
      <SafeAreaView edges={['left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
          <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>{t('AdminCheckingAccess')}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView edges={['left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <AccessCard
            title={t('AdminSignInRequiredTitle')}
            body={t('AdminSignInRequiredBody')}
            icon="person.crop.circle.badge.exclamationmark"
            colors={colors}
            actionLabel={t('AuthModeSignIn')}
            onPress={pushLogin}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (accessMode === 'denied') {
    return (
      <SafeAreaView edges={['left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <AccessCard
            title={t('AdminAccessDeniedTitle')}
            body={accessMessage ?? t('AdminAccessDeniedBody')}
            icon="xmark.shield"
            colors={colors}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (accessMode === 'backend_unavailable' && !loading) {
    return (
      <SafeAreaView edges={['left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <AccessCard
            title={t('AdminBackendUnavailableTitle')}
            body={accessMessage ?? t('AdminBackendUnavailableBody')}
            icon="server.rack"
            colors={colors}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="never"
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            titleColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        )}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1 }}>
              <ThemedText type="title" style={{ color: colors.text }}>
                {t('AdminPanelTitle')}
              </ThemedText>
              <ThemedText style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
                {t('AdminPanelSubtitle')}
              </ThemedText>
            </View>
            <View style={[styles.statusPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <ThemedText style={{ color: effectiveFeedHealthTone, fontWeight: '700', fontSize: 12 }}>
                {effectiveFeedHealth.toUpperCase()}
              </ThemedText>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <AdminStatCard
              label="Tracked coins"
              value={`${edgeStatus?.coinData.coinsCount ?? rows.length}`}
              detail={privilegedStatus === 'edge' ? 'privileged count' : 'public market rows'}
              colors={colors}
            />
            <AdminStatCard
              label="Feed lag"
              value={effectiveMinutesSinceUpdate == null ? '--' : `${effectiveMinutesSinceUpdate}m`}
              detail={effectiveLatestTimestamp ? formatRelativeTime(effectiveLatestTimestamp) : 'no timestamp'}
              colors={colors}
            />
            <AdminStatCard label="Saved mode" value={mode === 'account' ? 'Account' : 'Local'} detail={`${symbols.length} saved`} colors={colors} />
            <AdminStatCard
              label="Backend"
              value={privilegedStatus === 'edge' ? 'Privileged' : 'Fallback'}
              detail={privilegedStatus === 'edge' ? 'edge function live' : 'client-only proxy'}
              colors={colors}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.primary} />
            <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>{t('AdminLoadingMetrics')}</ThemedText>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={{ color: colors.danger, fontWeight: '700' }}>{t('AdminMetricsUnavailable')}</ThemedText>
            <ThemedText style={{ color: colors.textSecondary, marginTop: 6 }}>{error}</ThemedText>
          </View>
        ) : null}

        {accessMessage ? (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={{ color: colors.text, fontWeight: '700' }}>{t('AdminAccessModeNote')}</ThemedText>
            <ThemedText style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
              {accessMessage}
            </ThemedText>
          </View>
        ) : null}

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="subtitle" style={{ color: colors.text, fontSize: 18 }}>
            {t('AdminBackendAvailability')}
          </ThemedText>
          <ThemedText style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
            {t('AdminBackendAvailabilityBody')}
          </ThemedText>

          <View style={styles.infoRows}>
            <InfoRow label={t('AdminEmailLabel')} value={user.email ?? '--'} colors={colors} />
            <InfoRow label={t('AdminClientAllowlistConfigured')} value={clientAdminConfigured ? 'yes' : 'no'} colors={colors} />
            <InfoRow label={t('AdminClientFallbackAllowed')} value={clientAdminAllowed ? 'yes' : 'no'} colors={colors} />
            <InfoRow label={t('AdminPrivilegedSource')} value={privilegedStatus === 'edge' ? 'admin-status function' : 'public fallback'} valueColor={privilegedStatus === 'edge' ? colors.success : '#FFB020'} colors={colors} />
            <InfoRow label={t('AdminBackendAllowlistSource')} value={edgeStatus ? edgeStatus.admin.allowlistSource : '--'} colors={colors} />
            <InfoRow
              label={t('AdminFunctionDeployState')}
              value={accessMode === 'edge' ? t('AdminAvailable') : accessMode === 'fallback' ? t('AdminUnavailableFallback') : t('AdminUnknown')}
              colors={colors}
            />
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="subtitle" style={{ color: colors.text, fontSize: 18 }}>
            {t('AdminIngestHealth')}
          </ThemedText>
          <ThemedText style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
            {privilegedStatus === 'edge'
              ? t('AdminIngestHealthPrivilegedBody')
              : t('AdminIngestHealthFallbackBody')}
          </ThemedText>

          <View style={styles.infoRows}>
            <InfoRow label={t('AdminFeedStatus')} value={effectiveFeedHealth.toUpperCase()} valueColor={effectiveFeedHealthTone} colors={colors} />
            <InfoRow label={t('AdminLatestSnapshot')} value={effectiveLatestTimestamp ? new Date(effectiveLatestTimestamp).toLocaleString() : '--'} colors={colors} />
            <InfoRow label={t('Admin1hChangeGaps')} value={`${missing1h}`} colors={colors} />
            <InfoRow label={t('Admin24hChangeGaps')} value={`${missing24h}`} colors={colors} />
            {edgeStatus ? (
              <>
                <InfoRow label={t('AdminIngestRunsSampled')} value={`${edgeStatus.ingest.runCount}`} colors={colors} />
                <InfoRow label={t('AdminFailedRuns24h')} value={`${edgeStatus.ingest.failedRuns24h}`} valueColor={edgeStatus.ingest.failedRuns24h > 0 ? colors.danger : colors.success} colors={colors} />
                <InfoRow label={t('AdminLastRun')} value={edgeStatus.ingest.lastRun ? `${edgeStatus.ingest.lastRun.status} · ${formatRelativeTime(edgeStatus.ingest.lastRun.started_at)}` : '--'} colors={colors} />
                {edgeStatus.ingest.lastFailure?.error ? (
                  <InfoRow label={t('AdminLastFailure')} value={truncate(edgeStatus.ingest.lastFailure.error, 52)} valueColor={colors.danger} colors={colors} />
                ) : null}
              </>
            ) : null}
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="subtitle" style={{ color: colors.text, fontSize: 18 }}>
            {t('AdminCoinDataStatus')}
          </ThemedText>

          <View style={styles.infoRows}>
            <InfoRow label={t('AdminMissingPrices')} value={`${missingPrices}`} colors={colors} />
            {edgeStatus ? (
              <>
                <InfoRow label={t('AdminSnapshotsStored')} value={formatCompactNumber(edgeStatus.coinData.snapshotsCount)} colors={colors} />
                <InfoRow label={t('AdminWhaleMetricRows')} value={`${edgeStatus.coinData.whaleMetricsCount}`} valueColor={edgeStatus.coinData.whaleMetricsCount > 0 ? colors.success : '#FFB020'} colors={colors} />
                <InfoRow label={t('AdminTopTraderRows')} value={`${edgeStatus.coinData.topTradersCount}`} valueColor={edgeStatus.coinData.topTradersCount > 0 ? colors.success : '#FFB020'} colors={colors} />
              </>
            ) : null}
            <InfoRow
              label={t('AdminTopVolumeLeader')}
              value={topVolumeLeader ? `${topVolumeLeader.symbol} · ${formatCompactDollars(topVolumeLeader.volume_24h_usd)}` : '--'}
              colors={colors}
            />
            <InfoRow label={t('AdminWatchlistSync')} value={mode === 'account' ? syncState : 'local-only'} colors={colors} />
          </View>

          <View style={styles.previewList}>
            {stalePreview.map((row) => (
              <View key={`${row.symbol}-${row.ts}`} style={[styles.previewRow, { borderBottomColor: colors.border }]}>
                <View>
                  <ThemedText style={{ color: colors.text, fontWeight: '700' }}>{row.symbol}</ThemedText>
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {row.name} · rank #{row.rank ?? '--'}
                  </ThemedText>
                </View>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {formatRelativeTime(row.ts)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="subtitle" style={{ color: colors.text, fontSize: 18 }}>
            {t('AdminModerationOps')}
          </ThemedText>

          {edgeStatus ? (
            <View style={styles.infoRows}>
              <InfoRow label={t('AdminWatchlistsCount')} value={`${edgeStatus.ops.watchlistsCount}`} colors={colors} />
              <InfoRow label={t('AdminWatchlistItemsCount')} value={`${edgeStatus.ops.watchlistItemsCount}`} colors={colors} />
              <InfoRow label={t('AdminActivityEventsCount')} value={`${edgeStatus.ops.activityEventsCount}`} colors={colors} />
              <InfoRow label={t('AdminModerationQueue')} value={edgeStatus.moderation.available ? t('AdminAvailable') : t('AdminNotAvailable')} valueColor={edgeStatus.moderation.available ? colors.success : '#FFB020'} colors={colors} />
            </View>
          ) : null}

          <View style={styles.statusList}>
            <StatusRow
              icon="checkmark.circle.fill"
              tone={colors.success}
              text="Protected admin access is enforced via email allowlist."
              colors={colors}
            />
            <StatusRow
              icon="clock.badge.exclamationmark"
              tone={colors.primary}
              text={privilegedStatus === 'edge'
                ? 'Privileged ops view is active through the protected admin function.'
                : 'Current ops view is still on public fallback data until the admin function is deployed.'}
              colors={colors}
            />
            <StatusRow
              icon="lock.shield.fill"
              tone={colors.text}
              text={edgeStatus
                ? `Backend admin access is currently resolved via ${edgeStatus.admin.allowlistSource}.`
                : 'Backend admin access can be resolved by either the admin_allowlist table or the ADMIN_EMAILS secret.'}
              colors={colors}
            />
            <StatusRow
              icon="bubble.left.and.bubble.right"
              tone={colors.text}
              text={edgeStatus?.moderation.reason ?? 'Community moderation queue is a placeholder until posts/comments ship.'}
              colors={colors}
            />
            <StatusRow
              icon="server.rack"
              tone={colors.text}
              text="Repo now includes supabase/functions/admin-status with JWT verification; deploy it to replace fallback mode with live privileged metrics."
              colors={colors}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/menu')}
        >
          <IconSymbol name="chevron.left" size={16} color={colors.textSecondary} />
          <ThemedText style={{ color: colors.textSecondary, fontWeight: '700' }}>{t('AdminBackToMenu')}</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function AccessCard({
  title,
  body,
  icon,
  colors,
  actionLabel,
  onPress,
}: {
  title: string;
  body: string;
  icon: any;
  colors: any;
  actionLabel?: string;
  onPress?: () => void;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.accessHeader}>
        <View style={[styles.accessIcon, { backgroundColor: colors.surfaceElevated }]}>
          <IconSymbol name={icon} size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="subtitle" style={{ color: colors.text, fontSize: 18 }}>
            {title}
          </ThemedText>
          <ThemedText style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
            {body}
          </ThemedText>
        </View>
      </View>

      {actionLabel && onPress ? (
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={onPress}>
          <ThemedText style={{ color: colors.primaryText, fontWeight: '700' }}>{actionLabel}</ThemedText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function AdminStatCard({
  label,
  value,
  detail,
  colors,
}: {
  label: string;
  value: string;
  detail: string;
  colors: any;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</ThemedText>
      <ThemedText style={{ color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 8 }}>
        {value}
      </ThemedText>
      <ThemedText style={{ color: colors.textTertiary, fontSize: 12, marginTop: 6 }}>
        {detail}
      </ThemedText>
    </View>
  );
}

function InfoRow({
  label,
  value,
  colors,
  valueColor,
}: {
  label: string;
  value: string;
  colors: any;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <ThemedText style={{ color: colors.textSecondary }}>{label}</ThemedText>
      <ThemedText style={{ color: valueColor ?? colors.text, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>
        {value}
      </ThemedText>
    </View>
  );
}

function StatusRow({
  icon,
  text,
  tone,
  colors,
}: {
  icon: any;
  text: string;
  tone: string;
  colors: any;
}) {
  return (
    <View style={styles.statusRow}>
      <IconSymbol name={icon} size={16} color={tone} />
      <ThemedText style={{ color: colors.textSecondary, flex: 1, lineHeight: 20 }}>
        {text}
      </ThemedText>
    </View>
  );
}

function formatCompactDollars(value: number | null) {
  if (value == null) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function truncate(value: string, length: number) {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1)}…`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    flexGrow: 1,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    minHeight: 108,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  infoRows: {
    marginTop: 14,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  previewList: {
    marginTop: 16,
  },
  previewRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusList: {
    marginTop: 14,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  primaryButton: {
    marginTop: 18,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  accessHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  accessIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
