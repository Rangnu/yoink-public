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
    recentRuns: {
      id: number;
      status: string;
      started_at: string;
      finished_at: string | null;
      error: string | null;
    }[];
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
    usersCount: number | null;
    watchlistUsersCount: number;
    watchlistsCount: number;
    watchlistItemsCount: number;
    activityEventsCount: number;
    avgWatchlistsPerUser: number;
    avgItemsPerWatchlist: number;
    topSavedCoins: {
      coinId: string;
      symbol: string;
      name: string;
      saveCount: number;
      userCount: number;
    }[];
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
  const { mode, syncState } = useWatchlist();
  const [rows, setRows] = useState<CoinMarketRow[]>([]);
  const [edgeStatus, setEdgeStatus] = useState<AdminStatusPayload | null>(null);
  const [accessMode, setAccessMode] = useState<AccessMode>('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const opsPanel = '#0F172A';
  const opsPanelAlt = '#111827';
  const opsBorder = '#233047';
  const opsText = '#F8FAFC';
  const opsSubtext = '#94A3B8';
  const opsMuted = '#64748B';

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

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const adminStatusResult = await supabase.functions.invoke('admin-status', {
        body: {},
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      });

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
  const usersCount = edgeStatus?.ops.usersCount ?? null;
  const watchlistUsersCount = edgeStatus?.ops.watchlistUsersCount ?? 0;
  const topSavedCoins = edgeStatus?.ops.topSavedCoins ?? [];
  const avgWatchlistsPerUser = edgeStatus?.ops.avgWatchlistsPerUser ?? 0;
  const avgItemsPerWatchlist = edgeStatus?.ops.avgItemsPerWatchlist ?? 0;
  const positive24hCount = rows.filter((row) => (row.change_24h_pct ?? 0) > 0).length;
  const negative24hCount = rows.filter((row) => (row.change_24h_pct ?? 0) < 0).length;
  const flat24hCount = Math.max(0, rows.length - positive24hCount - negative24hCount);
  const recentRuns = edgeStatus?.ingest.recentRuns ?? [];
  const topSavedMaxUsers = Math.max(1, ...topSavedCoins.map((item) => item.userCount));
  const usersWithoutWatchlists = usersCount == null ? 0 : Math.max(0, usersCount - watchlistUsersCount);
  const priceCoveragePct = rows.length ? Math.round(((rows.length - missingPrices) / rows.length) * 100) : 0;
  const change1hCoveragePct = rows.length ? Math.round(((rows.length - missing1h) / rows.length) * 100) : 0;
  const change24hCoveragePct = rows.length ? Math.round(((rows.length - missing24h) / rows.length) * 100) : 0;
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
        <View style={[styles.heroCard, styles.opsHeroCard, { backgroundColor: opsPanel, borderColor: opsBorder }]}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1 }}>
              <ThemedText type="title" style={{ color: opsText }}>
                Control tower
              </ThemedText>
              <ThemedText style={{ color: opsSubtext, marginTop: 6, lineHeight: 20 }}>
                Monitor feed health, adoption, and the coins people save most.
              </ThemedText>
            </View>
            <View style={[styles.statusPill, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: opsBorder }]}>
              <ThemedText style={{ color: effectiveFeedHealthTone, fontWeight: '700', fontSize: 12 }}>
                {effectiveFeedHealth.toUpperCase()}
              </ThemedText>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <AdminStatCard
              label="Tracked coins"
              value={`${edgeStatus?.coinData.coinsCount ?? rows.length}`}
              detail={privilegedStatus === 'edge' ? 'live catalog' : 'public market rows'}
              colors={colors}
              dark
              panelColor={opsPanelAlt}
              panelBorder={opsBorder}
              textColor={opsText}
              subtextColor={opsSubtext}
            />
            <AdminStatCard
              label="Users"
              value={usersCount == null ? '--' : formatCompactNumber(usersCount)}
              detail={usersCount == null ? 'privileged auth count unavailable' : 'auth accounts'}
              colors={colors}
              dark
              panelColor={opsPanelAlt}
              panelBorder={opsBorder}
              textColor={opsText}
              subtextColor={opsSubtext}
            />
            <AdminStatCard
              label="Watchlist users"
              value={formatCompactNumber(watchlistUsersCount)}
              detail="users with saved lists"
              colors={colors}
              dark
              panelColor={opsPanelAlt}
              panelBorder={opsBorder}
              textColor={opsText}
              subtextColor={opsSubtext}
            />
            <AdminStatCard
              label="Saved items"
              value={formatCompactNumber(edgeStatus?.ops.watchlistItemsCount ?? 0)}
              detail={`${formatCompactNumber(edgeStatus?.ops.watchlistsCount ?? 0)} watchlists`}
              colors={colors}
              dark
              panelColor={opsPanelAlt}
              panelBorder={opsBorder}
              textColor={opsText}
              subtextColor={opsSubtext}
            />
            <AdminStatCard
              label="Feed lag"
              value={effectiveMinutesSinceUpdate == null ? '--' : `${effectiveMinutesSinceUpdate}m`}
              detail={effectiveLatestTimestamp ? formatRelativeTime(effectiveLatestTimestamp) : 'no timestamp'}
              colors={colors}
              dark
              panelColor={opsPanelAlt}
              panelBorder={opsBorder}
              textColor={opsText}
              subtextColor={opsSubtext}
            />
            <AdminStatCard
              label="Run failures"
              value={`${edgeStatus?.ingest.failedRuns24h ?? 0}`}
              detail="last 24h"
              colors={colors}
              dark
              panelColor={opsPanelAlt}
              panelBorder={opsBorder}
              textColor={opsText}
              subtextColor={opsSubtext}
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
            <ThemedText style={{ color: colors.text, fontWeight: '700' }}>Mode note</ThemedText>
            <ThemedText style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
              {accessMessage}
            </ThemedText>
          </View>
        ) : null}

        <View style={[styles.sectionCard, styles.opsSectionCard, { backgroundColor: opsPanel, borderColor: opsBorder }]}>
          <ThemedText type="subtitle" style={{ color: opsText, fontSize: 18 }}>
            Market breadth
          </ThemedText>
          <ThemedText style={{ color: opsSubtext, marginTop: 6, lineHeight: 20 }}>
            Positive vs negative 24h movers across the current live market set.
          </ThemedText>

          <View style={styles.breadthBar}>
            <View style={[styles.breadthSegment, { flex: positive24hCount || 1, backgroundColor: colors.success }]} />
            <View style={[styles.breadthSegment, { flex: flat24hCount || 1, backgroundColor: colors.textTertiary }]} />
            <View style={[styles.breadthSegment, { flex: negative24hCount || 1, backgroundColor: colors.danger }]} />
          </View>

          <View style={styles.legendRow}>
            <LegendChip label={`Up ${positive24hCount}`} color={colors.success} colors={colors} dark />
            <LegendChip label={`Flat ${flat24hCount}`} color={opsMuted} colors={colors} dark />
            <LegendChip label={`Down ${negative24hCount}`} color={colors.danger} colors={colors} dark />
          </View>
        </View>

        <View style={[styles.sectionCard, styles.opsSectionCard, { backgroundColor: opsPanel, borderColor: opsBorder }]}>
          <ThemedText type="subtitle" style={{ color: opsText, fontSize: 18 }}>
            Ingest pulse
          </ThemedText>
          <ThemedText style={{ color: opsSubtext, marginTop: 6, lineHeight: 20 }}>
            Recent run strip plus the latest feed timestamp.
          </ThemedText>

          <RunPulse runs={recentRuns} colors={colors} dark />

          <View style={styles.infoRows}>
            <InfoRow label="Feed status" value={effectiveFeedHealth.toUpperCase()} valueColor={effectiveFeedHealthTone} colors={colors} dark />
            <InfoRow label="Latest snapshot" value={effectiveLatestTimestamp ? new Date(effectiveLatestTimestamp).toLocaleString() : '--'} colors={colors} dark />
            <InfoRow label="1h gaps" value={`${missing1h}`} colors={colors} dark />
            <InfoRow label="24h gaps" value={`${missing24h}`} colors={colors} dark />
            <InfoRow label="Recent runs" value={`${edgeStatus?.ingest.runCount ?? 0}`} colors={colors} dark />
            <InfoRow label="Failed runs (24h)" value={`${edgeStatus?.ingest.failedRuns24h ?? 0}`} valueColor={(edgeStatus?.ingest.failedRuns24h ?? 0) > 0 ? colors.danger : colors.success} colors={colors} dark />
            {edgeStatus?.ingest.lastFailure?.error ? (
              <InfoRow label="Last failure" value={truncate(edgeStatus.ingest.lastFailure.error, 52)} valueColor={colors.danger} colors={colors} dark />
            ) : null}
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="subtitle" style={{ color: colors.text, fontSize: 18 }}>
            Adoption
          </ThemedText>
          <ThemedText style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
            How users are actually using saved coins and watchlists right now.
          </ThemedText>

          {usersCount != null ? (
            <>
              <View style={styles.breadthBar}>
                <View style={[styles.breadthSegment, { flex: watchlistUsersCount || 1, backgroundColor: colors.primary }]} />
                <View style={[styles.breadthSegment, { flex: usersWithoutWatchlists || 1, backgroundColor: colors.surfaceElevated }]} />
              </View>
              <View style={styles.legendRow}>
                <LegendChip label={`With lists ${watchlistUsersCount}`} color={colors.primary} colors={colors} />
                <LegendChip label={`Without lists ${usersWithoutWatchlists}`} color={colors.textTertiary} colors={colors} />
              </View>
            </>
          ) : null}

          <View style={styles.metricsGrid}>
            <AdminStatCard label="Users with lists" value={formatCompactNumber(watchlistUsersCount)} detail={usersCount ? `${Math.round((watchlistUsersCount / usersCount) * 100)}% of users` : 'watchlist owners'} colors={colors} />
            <AdminStatCard label="Avg lists / user" value={avgWatchlistsPerUser ? avgWatchlistsPerUser.toFixed(1) : '0.0'} detail="named list density" colors={colors} />
            <AdminStatCard label="Avg items / list" value={avgItemsPerWatchlist ? avgItemsPerWatchlist.toFixed(1) : '0.0'} detail="saves per watchlist" colors={colors} />
            <AdminStatCard label="Activity events" value={formatCompactNumber(edgeStatus?.ops.activityEventsCount ?? 0)} detail="feed of tracked actions" colors={colors} />
          </View>
        </View>

        <View style={[styles.sectionCard, styles.opsSectionCard, { backgroundColor: opsPanel, borderColor: opsBorder }]}>
          <ThemedText type="subtitle" style={{ color: opsText, fontSize: 18 }}>
            Most saved by users
          </ThemedText>
          <ThemedText style={{ color: opsSubtext, marginTop: 6, lineHeight: 20 }}>
            Distinct users first, raw saves second.
          </ThemedText>

          {topSavedCoins.length ? (
            <View style={styles.topSavedList}>
              {topSavedCoins.map((coin) => (
                <TouchableOpacity
                  key={coin.coinId}
                  style={styles.savedRow}
                  onPress={() => router.push({ pathname: '/coin' as any, params: { symbol: coin.symbol } })}
                >
                  <View style={styles.savedRowHeader}>
                    <View>
                      <ThemedText style={{ color: colors.text, fontWeight: '700' }}>{coin.symbol}</ThemedText>
                      <ThemedText style={{ color: opsSubtext, fontSize: 12, marginTop: 2 }}>{coin.name}</ThemedText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <ThemedText style={{ color: opsText, fontWeight: '700' }}>{coin.userCount} users</ThemedText>
                      <ThemedText style={{ color: opsSubtext, fontSize: 12, marginTop: 2 }}>{coin.saveCount} saves</ThemedText>
                    </View>
                  </View>
                  <View style={[styles.savedBarTrack, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                    <View
                      style={[
                        styles.savedBarFill,
                        {
                          backgroundColor: colors.success,
                          width: `${Math.max(8, Math.round((coin.userCount / topSavedMaxUsers) * 100))}%`,
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <ThemedText style={{ color: opsSubtext, marginTop: 12 }}>
              No saved-coin activity has been recorded yet.
            </ThemedText>
          )}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="subtitle" style={{ color: colors.text, fontSize: 18 }}>
            Data quality
          </ThemedText>

          <View style={styles.coverageList}>
            <CoverageRow label="Price coverage" value={priceCoveragePct} color={colors.success} colors={colors} />
            <CoverageRow label="1h change coverage" value={change1hCoveragePct} color="#38BDF8" colors={colors} />
            <CoverageRow label="24h change coverage" value={change24hCoveragePct} color="#A78BFA" colors={colors} />
          </View>

          <View style={styles.infoRows}>
            <InfoRow label="Missing prices" value={`${missingPrices}`} colors={colors} />
            <InfoRow label="Snapshots stored" value={formatCompactNumber(edgeStatus?.coinData.snapshotsCount ?? 0)} colors={colors} />
            <InfoRow label="Whale metric rows" value={`${edgeStatus?.coinData.whaleMetricsCount ?? 0}`} valueColor={(edgeStatus?.coinData.whaleMetricsCount ?? 0) > 0 ? colors.success : '#FFB020'} colors={colors} />
            <InfoRow label="Top trader rows" value={`${edgeStatus?.coinData.topTradersCount ?? 0}`} valueColor={(edgeStatus?.coinData.topTradersCount ?? 0) > 0 ? colors.success : '#FFB020'} colors={colors} />
            <InfoRow label="Top volume leader" value={topVolumeLeader ? `${topVolumeLeader.symbol} · ${formatCompactDollars(topVolumeLeader.volume_24h_usd)}` : '--'} colors={colors} />
            <InfoRow label="Viewer mode" value={mode === 'account' ? `Account · ${syncState}` : 'Local only'} colors={colors} />
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

        <View style={[styles.sectionCard, styles.opsSectionCard, { backgroundColor: opsPanel, borderColor: opsBorder }]}>
          <ThemedText type="subtitle" style={{ color: opsText, fontSize: 18 }}>
            Access & backend
          </ThemedText>

          <View style={styles.infoRows}>
            <InfoRow label="Admin email" value={user.email ?? '--'} colors={colors} dark />
            <InfoRow label="Client allowlist configured" value={clientAdminConfigured ? 'yes' : 'no'} colors={colors} dark />
            <InfoRow label="Client admin allowed" value={clientAdminAllowed ? 'yes' : 'no'} colors={colors} dark />
            <InfoRow label="Source" value={privilegedStatus === 'edge' ? 'admin-status function' : 'public fallback'} valueColor={privilegedStatus === 'edge' ? colors.success : '#FFB020'} colors={colors} dark />
            <InfoRow label="Backend allowlist source" value={edgeStatus ? edgeStatus.admin.allowlistSource : '--'} colors={colors} dark />
          </View>

          <View style={styles.statusList}>
            <StatusRow
              icon="checkmark.circle.fill"
              tone={colors.success}
              text="Protected admin access is enforced via email allowlist."
              colors={colors}
              dark
            />
            <StatusRow
              icon="clock.badge.exclamationmark"
              tone={colors.primary}
              text={privilegedStatus === 'edge'
                ? 'Privileged dashboard is active through the protected admin function.'
                : 'Current dashboard is still on public fallback data until the admin function is deployed.'}
              colors={colors}
              dark
            />
            <StatusRow
              icon="lock.shield.fill"
              tone={colors.text}
              text={edgeStatus
                ? `Backend admin access is currently resolved via ${edgeStatus.admin.allowlistSource}.`
                : 'Backend admin access can be resolved by either the admin_allowlist table or the ADMIN_EMAILS secret.'}
              colors={colors}
              dark
            />
            <StatusRow
              icon="bubble.left.and.bubble.right"
              tone={colors.text}
              text={edgeStatus?.moderation.reason ?? 'Community moderation queue is a placeholder until posts/comments ship.'}
              colors={colors}
              dark
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
  dark = false,
  panelColor,
  panelBorder,
  textColor,
  subtextColor,
}: {
  label: string;
  value: string;
  detail: string;
  colors: any;
  dark?: boolean;
  panelColor?: string;
  panelBorder?: string;
  textColor?: string;
  subtextColor?: string;
}) {
  return (
    <View style={[styles.statCard, dark ? styles.opsStatCard : null, { backgroundColor: panelColor ?? colors.surfaceElevated, borderColor: panelBorder ?? colors.border }]}>
      <ThemedText style={{ color: subtextColor ?? colors.textSecondary, fontSize: 12 }}>{label}</ThemedText>
      <ThemedText style={{ color: textColor ?? colors.text, fontSize: 22, fontWeight: '700', marginTop: 8 }}>
        {value}
      </ThemedText>
      <ThemedText style={{ color: subtextColor ?? colors.textTertiary, fontSize: 12, marginTop: 6 }}>
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
  dark = false,
}: {
  label: string;
  value: string;
  colors: any;
  valueColor?: string;
  dark?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <ThemedText style={{ color: dark ? '#94A3B8' : colors.textSecondary }}>{label}</ThemedText>
      <ThemedText style={{ color: valueColor ?? (dark ? '#F8FAFC' : colors.text), fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>
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
  dark = false,
}: {
  icon: any;
  text: string;
  tone: string;
  colors: any;
  dark?: boolean;
}) {
  return (
    <View style={styles.statusRow}>
      <IconSymbol name={icon} size={16} color={tone} />
      <ThemedText style={{ color: dark ? '#94A3B8' : colors.textSecondary, flex: 1, lineHeight: 20 }}>
        {text}
      </ThemedText>
    </View>
  );
}

function RunPulse({ runs, colors, dark = false }: { runs: AdminStatusPayload['ingest']['recentRuns']; colors: any; dark?: boolean }) {
  if (!runs?.length) {
    return (
      <View style={[styles.infoCardInline, { backgroundColor: dark ? '#111827' : colors.surfaceElevated, borderColor: dark ? '#233047' : colors.border }]}>
        <ThemedText style={{ color: dark ? '#94A3B8' : colors.textSecondary }}>No recent ingest runs recorded.</ThemedText>
      </View>
    );
  }

  const ordered = [...runs].reverse();
  return (
    <View style={styles.runPulseWrap}>
      {ordered.map((run) => {
        const success = run.status === 'success' || run.status === 'ok';
        const running = run.status === 'running';
        const barColor = running ? '#FFB020' : success ? colors.success : colors.danger;
        return (
          <View key={`${run.id}-${run.started_at}`} style={styles.runPulseItem}>
            <View style={[styles.runPulseBar, { backgroundColor: barColor, opacity: running ? 0.75 : 1 }]} />
            <ThemedText style={{ color: dark ? '#64748B' : colors.textTertiary, fontSize: 10 }}>{run.id}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

function LegendChip({ label, color, colors, dark = false }: { label: string; color: string; colors: any; dark?: boolean }) {
  return (
    <View style={[styles.legendChip, { backgroundColor: dark ? '#111827' : colors.surfaceElevated, borderColor: dark ? '#233047' : colors.border }]}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <ThemedText style={{ color: dark ? '#CBD5E1' : colors.textSecondary, fontSize: 12, fontWeight: '600' }}>{label}</ThemedText>
    </View>
  );
}

function CoverageRow({ label, value, color, colors }: { label: string; value: number; color: string; colors: any }) {
  return (
    <View style={styles.coverageRow}>
      <View style={styles.coverageHeader}>
        <ThemedText style={{ color: colors.textSecondary }}>{label}</ThemedText>
        <ThemedText style={{ color: colors.text, fontWeight: '700' }}>{value}%</ThemedText>
      </View>
      <View style={[styles.coverageTrack, { backgroundColor: colors.surfaceElevated }]}>
        <View style={[styles.coverageFill, { backgroundColor: color, width: `${Math.max(6, value)}%` }]} />
      </View>
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
  opsHeroCard: {
    shadowColor: '#020617',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  opsSectionCard: {
    shadowColor: '#020617',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  opsStatCard: {
    minHeight: 98,
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
  infoCardInline: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  breadthBar: {
    marginTop: 14,
    height: 14,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  breadthSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  legendChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  runPulseWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 14,
    paddingBottom: 4,
  },
  runPulseItem: {
    alignItems: 'center',
    gap: 6,
  },
  runPulseBar: {
    width: 12,
    height: 36,
    borderRadius: 6,
  },
  previewRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  topSavedList: {
    marginTop: 14,
    gap: 12,
  },
  coverageList: {
    marginTop: 14,
    gap: 12,
  },
  coverageRow: {
    gap: 6,
  },
  coverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  coverageTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  coverageFill: {
    height: '100%',
    borderRadius: 999,
  },
  savedRow: {
    gap: 8,
  },
  savedRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  savedBarTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  savedBarFill: {
    height: '100%',
    borderRadius: 999,
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
