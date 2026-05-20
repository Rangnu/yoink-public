import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';
import { useWatchlist } from '@/contexts/watchlist-context';
import { fetchCoinMarketRows, getLatestTimestamp } from '@/utils/coin-market';

export default function MenuScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useSettings();
  const { user, signOut } = useAuth();
  const { symbols, mode, syncState } = useWatchlist();

  const [refreshing, setRefreshing] = useState(false);
  const [marketCount, setMarketCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [feedStatus, setFeedStatus] = useState<'live' | 'empty' | 'error'>('empty');

  const loadStatus = useCallback(async () => {
    try {
      const rows = await fetchCoinMarketRows(120);
      setMarketCount(rows.length);
      setLastUpdated(getLatestTimestamp(rows));
      setFeedStatus(rows.length ? 'live' : 'empty');
    } catch {
      setMarketCount(0);
      setLastUpdated(null);
      setFeedStatus('error');
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStatus().finally(() => setRefreshing(false));
  }, [loadStatus]);

  const accountSubtitle = user?.email || t('SignInSyncLater');
  const pushLogin = (redirectTo: string) =>
    router.push({ pathname: '/auth/login', params: { redirectTo } } as any);
  const showAdminPanel = Boolean(user);
  const feedStatusLabel = useMemo(() => {
    if (feedStatus === 'live') return t('LiveStatus');
    if (feedStatus === 'error') return t('OfflineStatus');
    return t('WaitingForIngest');
  }, [feedStatus, t]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="never"
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            title={t('RefreshTitle')}
            titleColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        )}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={{ color: colors.text }}>{t('Menu')}</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>{t('MenuSubtitle')}</ThemedText>
        </View>

        <View style={[styles.accountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <TouchableOpacity
            style={styles.accountRow}
            onPress={() => {
              if (!user) {
                pushLogin('/menu');
              }
            }}
          >
            <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]}> 
              <IconSymbol name="person.fill" size={28} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.accountTitleRow}>
                <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 18 }}>
                  {user?.email || t('GuestUser')}
                </ThemedText>
                <View style={[styles.pill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                    {user ? t('SignedIn') : t('Guest')}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                {accountSubtitle}
              </ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          {!user ? (
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => pushLogin('/menu')}>
              <IconSymbol name="person.crop.circle.badge.plus" size={16} color={colors.primaryText} />
              <ThemedText style={{ color: colors.primaryText, fontWeight: '700' }}>{t('SignInRegister')}</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={signOut}>
              <IconSymbol name="rectangle.portrait.and.arrow.right" size={16} color={colors.textSecondary} />
              <ThemedText style={{ color: colors.textSecondary, fontWeight: '600' }}>{t('Logout')}</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label={mode === 'account' ? t('SavedSyncLabel') : t('SavedLocalLabel')}
            value={`${symbols.length}`}
            detail={
              mode === 'account'
                ? syncState === 'error'
                  ? t('NeedsRetry')
                  : t('AccountWatchlist')
                : t('GuestDeviceList')
            }
            colors={colors}
          />
          <StatCard label={t('MarketFeed')} value={`${marketCount}`} detail={t('TrackedCoinsCount')} colors={colors} />
          <StatCard label={t('StatusLabel')} value={feedStatusLabel} detail={lastUpdated ? formatRelativeTime(lastUpdated) : t('NoTimestamp')} colors={colors} />
          <StatCard label={t('SyncLabel')} value={user ? t('AccountMode') : t('LocalMode')} detail={user ? t('AuthSessionReady') : t('DeviceOnlyMode')} colors={colors} />
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <ThemedText style={{ color: colors.text, fontWeight: '700' }}>{t('ProductStatus')}</ThemedText>
          <View style={styles.statusList}>
            <StatusRow icon="checkmark.circle.fill" text={t('AuthFlowLive')} tone={colors.success} colors={colors} />
            <StatusRow icon="checkmark.circle.fill" text={t('MarketFeedPowered')} tone={colors.success} colors={colors} />
            <StatusRow icon="bookmark.fill" text={t('SavedCoinsLocalOnly')} tone={colors.primary} colors={colors} />
            <StatusRow icon="scope" text={t('ScoutersPresetsLive')} tone={colors.text} colors={colors} />
          </View>
        </View>

        <Section title={t('Settings')} icon="gearshape.fill" colors={colors}>
          <MenuRow icon="paintbrush.fill" label={t('Appearance')} onPress={() => router.push('/settings/appearance')} colors={colors} />
          <MenuRow icon="globe" label={t('Language')} onPress={() => router.push('/settings/language')} colors={colors} divider colorsObj={colors} />
          <MenuRow icon="dollarsign.circle" label={t('Currency')} onPress={() => router.push('/settings/currency')} colors={colors} divider colorsObj={colors} />
          <MenuRow icon="bell.fill" label={t('Notifications')} onPress={() => router.push('/settings/notifications')} colors={colors} divider colorsObj={colors} />
          <MenuRow
            icon="creditcard"
            label={t('Subscription')}
            onPress={() => {
              if (!user) {
                pushLogin('/settings/subscription');
              } else {
                router.push('/settings/subscription');
              }
            }}
            colors={colors}
          />
        </Section>

        <Section title={t('ExploreTrack')} icon="chart.line.uptrend.xyaxis" colors={colors}>
          <MenuRow icon="saturn" label={t('ExploreLiveMarketBoard')} onPress={() => router.push('/explore')} colors={colors} divider colorsObj={colors} />
          <MenuRow icon="bookmark.fill" label={t('Saved')} onPress={() => router.push('/activity/saved')} colors={colors} divider colorsObj={colors} />
          <MenuRow icon="list.bullet.rectangle" label={t('Watchlists')} onPress={() => router.push('/watchlists')} colors={colors} divider colorsObj={colors} />
          <MenuRow icon="scope" label={t('Scouters')} onPress={() => router.push('/scouters')} colors={colors} divider colorsObj={colors} />
          <MenuRow icon="list.number" label={t('Top100Rankings')} onPress={() => router.push('/explore/top100')} colors={colors} />
        </Section>

        {showAdminPanel ? (
          <Section title={t('Admin')} icon="lock.shield.fill" colors={colors}>
            <MenuRow
              icon="waveform.path.ecg.rectangle"
              label={t('AdminPanel')}
              onPress={() => router.push('/admin' as any)}
              colors={colors}
            />
          </Section>
        ) : null}

        <Section title={t('Activity')} icon="person.crop.circle" colors={colors}>
          <MenuRow
            icon="bookmark.fill"
            label={t('Saved')}
            onPress={() => {
              if (!user) {
                pushLogin('/activity/saved');
              } else {
                router.push('/activity/saved');
              }
            }}
            colors={colors}
            divider
            colorsObj={colors}
          />
          <MenuRow
            icon="clock.fill"
            label={t('YourActivity')}
            onPress={() => {
              if (!user) {
                pushLogin('/activity/your-activity');
              } else {
                router.push('/activity/your-activity');
              }
            }}
            colors={colors}
          />
        </Section>

        <Section title={t('Support')} icon="info.circle.fill" colors={colors}>
          <MenuRow icon="exclamationmark.bubble" label={t('ReportProblem')} onPress={() => router.push('/support/report-problem')} colors={colors} divider colorsObj={colors} />
          <MenuRow icon="lock.fill" label={t('PrivacySecurityHelp')} onPress={() => router.push('/support/privacy-security')} colors={colors} divider colorsObj={colors} />
          <MenuRow icon="questionmark.circle" label={t('HelpCenter')} onPress={() => router.push('/support/help-center')} colors={colors} />
        </Section>

        <Section title={t('About')} icon="info.circle" colors={colors}>
          <MenuRow icon="lock" label={t('PrivacyPolicy')} onPress={() => router.push('/about/privacy-policy')} colors={colors} divider colorsObj={colors} />
          <MenuRow icon="doc.text" label={t('TermsOfUse')} onPress={() => router.push('/about/terms-of-use')} colors={colors} />
        </Section>

        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <ThemedText style={{ color: colors.textTertiary, fontSize: 12 }}>yoink v1.0.0</ThemedText>
          <ThemedText style={{ color: colors.textTertiary, fontSize: 11, marginTop: 4 }}>{t('AppTagline')}</ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  icon,
  colors,
  children,
}: {
  title: string;
  icon: any;
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconSymbol name={icon} size={18} color={colors.text} />
        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </ThemedText>
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  colors,
  divider = false,
  colorsObj,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  colors: any;
  divider?: boolean;
  colorsObj?: any;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.settingRow, divider ? { borderBottomWidth: 0.5, borderBottomColor: colorsObj.border } : null]}>
      <View style={styles.rowLeft}>
        <IconSymbol name={icon} size={20} color={colors.text} />
        <ThemedText style={{ color: colors.text }}>{label}</ThemedText>
      </View>
      <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

function StatCard({ label, value, detail, colors }: { label: string; value: string; detail: string; colors: any }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</ThemedText>
      <ThemedText style={{ color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 8 }}>{value}</ThemedText>
      <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{detail}</ThemedText>
    </View>
  );
}

function StatusRow({ icon, text, tone, colors }: { icon: any; text: string; tone: string; colors: any }) {
  return (
    <View style={styles.statusRow}>
      <IconSymbol name={icon} size={16} color={tone} />
      <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>{text}</ThemedText>
    </View>
  );
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  accountCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  statusList: {
    gap: 10,
    marginTop: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
});
