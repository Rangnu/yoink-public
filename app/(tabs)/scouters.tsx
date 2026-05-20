import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { CoinSparkline } from '@/components/ui/coin-sparkline';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';
import { useWatchlist } from '@/contexts/watchlist-context';
import { supabase } from '@/utils/supabase';
import { CoinMarketRow, fetchCoinMarketRows, formatCoinPercent, formatCoinPrice, getLatestTimestamp } from '@/utils/coin-market';

type WhaleMetricRow = {
  coin_id: string;
  whale_net_flow_usd: number | null;
  top_traders_count: number | null;
  ts: string;
};

type LiveScouterMatch = {
  symbol: string;
  name: string;
  coinId?: string;
  price: string;
  primaryMetric: string;
  secondaryMetric: string;
  changePct: number | null;
  score: number;
};

type LiveScouter = {
  id: string;
  name: string;
  criteria: string;
  note: string;
  matches: LiveScouterMatch[];
  available: boolean;
};

export default function ScoutersScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  const { isSaved, toggleSaved } = useWatchlist();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketRows, setMarketRows] = useState<CoinMarketRow[]>([]);
  const [whaleRows, setWhaleRows] = useState<WhaleMetricRow[]>([]);
  const [selectedScouterId, setSelectedScouterId] = useState<string>('momentum');
  const scrollRef = useRef<ScrollView>(null);
  const matchesSectionRef = useRef<View | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [markets, whaleResponse] = await Promise.all([
        fetchCoinMarketRows(120),
        supabase
          .from('coin_whale_metrics')
          .select('coin_id, whale_net_flow_usd, top_traders_count, ts')
          .order('ts', { ascending: false })
          .limit(200),
      ]);

      setMarketRows(markets);

      if (whaleResponse.error) {
        setWhaleRows([]);
      } else {
        const latestByCoin = new Map<string, WhaleMetricRow>();
        for (const row of (whaleResponse.data ?? []) as WhaleMetricRow[]) {
          if (!row.coin_id) continue;
          if (!latestByCoin.has(row.coin_id)) {
            latestByCoin.set(row.coin_id, row);
          }
        }
        setWhaleRows(Array.from(latestByCoin.values()));
      }
    } catch (err: any) {
      setMarketRows([]);
      setWhaleRows([]);
      setError(err?.message ?? 'Failed to load live scouters.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const scouters = useMemo<LiveScouter[]>(() => {
    const rows = marketRows;
    const whaleByCoinId = new Map(whaleRows.map((row) => [row.coin_id, row]));

    const momentumMatches = rows
      .filter((row) => (row.change_1h_pct ?? -999) >= 1.2 && (row.change_24h_pct ?? -999) >= 4)
      .sort((a, b) => ((b.change_1h_pct ?? 0) + (b.change_24h_pct ?? 0)) - ((a.change_1h_pct ?? 0) + (a.change_24h_pct ?? 0)))
      .slice(0, 8)
      .map<LiveScouterMatch>((row) => ({
        symbol: row.symbol,
        name: row.name,
        coinId: row.coin_id,
        price: formatCoinPrice(row.price_usd),
        primaryMetric: `1h ${formatCoinPercent(row.change_1h_pct)}`,
        secondaryMetric: `24h ${formatCoinPercent(row.change_24h_pct)}`,
        changePct: row.change_24h_pct,
        score: (row.change_1h_pct ?? 0) + (row.change_24h_pct ?? 0),
      }));

    const volumeMatches = rows
      .filter((row) => (row.volume_24h_usd ?? 0) > 0 && (row.change_24h_pct ?? -999) >= 0.5)
      .sort((a, b) => (b.volume_24h_usd ?? 0) - (a.volume_24h_usd ?? 0))
      .slice(0, 8)
      .map<LiveScouterMatch>((row) => ({
        symbol: row.symbol,
        name: row.name,
        coinId: row.coin_id,
        price: formatCoinPrice(row.price_usd),
        primaryMetric: `Vol ${formatCompactDollars(row.volume_24h_usd)}`,
        secondaryMetric: `24h ${formatCoinPercent(row.change_24h_pct)}`,
        changePct: row.change_24h_pct,
        score: row.volume_24h_usd ?? 0,
      }));

    const breakoutMatches = rows
      .filter((row) => (row.rank ?? 999) >= 15 && (row.rank ?? 999) <= 100 && (row.change_24h_pct ?? -999) >= 7)
      .sort((a, b) => (b.change_24h_pct ?? 0) - (a.change_24h_pct ?? 0))
      .slice(0, 8)
      .map<LiveScouterMatch>((row) => ({
        symbol: row.symbol,
        name: row.name,
        coinId: row.coin_id,
        price: formatCoinPrice(row.price_usd),
        primaryMetric: `24h ${formatCoinPercent(row.change_24h_pct)}`,
        secondaryMetric: `Rank #${row.rank ?? '--'}`,
        changePct: row.change_24h_pct,
        score: row.change_24h_pct ?? 0,
      }));

    const whaleMatches: LiveScouterMatch[] = rows.reduce<LiveScouterMatch[]>((acc, row) => {
      const whale = row.coin_id ? whaleByCoinId.get(row.coin_id) : undefined;
      if (!whale) return acc;
      if ((whale.whale_net_flow_usd ?? 0) <= 0) return acc;

      acc.push({
        symbol: row.symbol,
        name: row.name,
        coinId: row.coin_id,
        price: formatCoinPrice(row.price_usd),
        primaryMetric: `Net ${formatCompactDollars(whale.whale_net_flow_usd)}`,
        secondaryMetric: `${whale.top_traders_count ?? 0} top traders`,
        changePct: row.change_24h_pct,
        score: whale.whale_net_flow_usd ?? 0,
      });

      return acc;
    }, [])
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    return [
      {
        id: 'momentum',
        name: 'Momentum Pulse',
        criteria: '+1.2% in 1h and +4% in 24h',
        note: 'Fast movers that are still holding their daily trend.',
        matches: momentumMatches,
        available: rows.length > 0,
      },
      {
        id: 'volume',
        name: 'Volume Spike',
        criteria: 'High 24h volume with positive daily trend',
        note: 'The highest-liquidity names that are already moving.',
        matches: volumeMatches,
        available: rows.length > 0,
      },
      {
        id: 'breakout',
        name: 'Breakout Watch',
        criteria: 'Ranks 15-100 with +7% or more in 24h',
        note: 'Coins outside the mega-caps that may be rotating into focus.',
        matches: breakoutMatches,
        available: rows.length > 0,
      },
      {
        id: 'whale',
        name: 'Whale Flow',
        criteria: 'Positive whale net flow from the latest whale snapshot',
        note: whaleMatches.length
          ? 'Tracks coins where whale inflows are showing up in the latest dataset.'
          : 'Needs whale and trader datasets before it can surface useful signals.',
        matches: whaleMatches,
        available: whaleRows.length > 0,
      },
    ];
  }, [marketRows, whaleRows]);

  const availableScouters = useMemo(
    () => scouters.filter((scouter) => scouter.available),
    [scouters]
  );
  const upcomingScouters = useMemo(
    () => scouters.filter((scouter) => !scouter.available),
    [scouters]
  );

  useEffect(() => {
    if (!availableScouters.find((scouter) => scouter.id === selectedScouterId)) {
      setSelectedScouterId(availableScouters[0]?.id ?? 'momentum');
    }
  }, [availableScouters, selectedScouterId]);

  const selectedScouter = availableScouters.find((scouter) => scouter.id === selectedScouterId) ?? availableScouters[0];
  const recentMatches = useMemo(() => {
    return availableScouters
      .flatMap((scouter) =>
        scouter.matches.slice(0, 2).map((match) => ({
          ...match,
          scouterName: scouter.name,
          scouterId: scouter.id,
        }))
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [availableScouters]);
  const lastUpdated = useMemo(() => getLatestTimestamp(marketRows), [marketRows]);
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

  const handleViewScouter = useCallback((scouterId: string) => {
    setSelectedScouterId(scouterId);
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (Platform.OS === 'web') {
          const node = matchesSectionRef.current as any;
          if (node?.scrollIntoView) {
            node.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
        }
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 80);
    });
  }, []);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={{ color: colors.text }}>{t('ScoutersHeader')}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('ScoutersSubtitle')}
        </ThemedText>
      </View>

      <ScrollView
        ref={scrollRef}
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
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <ThemedText style={{ color: colors.text, fontWeight: '700' }}>{t('LivePresetsTitle')}</ThemedText>
          <ThemedText style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
            {t('LivePresetsBody')}
          </ThemedText>
          <ThemedText style={{ color: colors.textTertiary, marginTop: 10, fontSize: 12 }}>
            {t('LastMarketUpdate')}: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          </ThemedText>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.primary} />
            <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>{t('LoadingLiveScouters')}</ThemedText>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <ThemedText style={{ color: colors.danger, fontWeight: '700' }}>{t('CouldNotLoadScouters')}</ThemedText>
            <ThemedText style={{ color: colors.textSecondary, marginTop: 6 }}>{error}</ThemedText>
          </View>
        ) : null}

        {!loading && !error && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('RecentMatches')}
                </ThemedText>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matchesScroll}>
                {recentMatches.length ? recentMatches.map((match) => (
                  <TouchableOpacity
                    key={`${match.scouterId}-${match.symbol}`}
                    style={[styles.matchCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => router.push({ pathname: '/coin' as any, params: { symbol: match.symbol } })}
                  >
                    <ThemedText style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>
                      {match.symbol}
                    </ThemedText>
                    <ThemedText style={{ color: (match.changePct ?? 0) >= 0 ? colors.success : colors.danger, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
                      {formatCoinPercent(match.changePct)}
                    </ThemedText>
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 11, marginTop: 6 }} numberOfLines={1}>
                      {match.scouterName}
                    </ThemedText>
                    <ThemedText style={{ color: colors.textTertiary, fontSize: 10, marginTop: 4 }} numberOfLines={1}>
                      {match.primaryMetric}
                    </ThemedText>
                  </TouchableOpacity>
                )) : (
                  <View style={[styles.emptyInlineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                    <ThemedText style={{ color: colors.textSecondary }}>{t('NoLiveMatchesYet')}</ThemedText>
                  </View>
                )}
              </ScrollView>
            </View>

            <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={onRefresh}>
              <IconSymbol name="arrow.clockwise" size={20} color={colors.primaryText} />
              <ThemedText style={[styles.createButtonText, { color: colors.primaryText }]}>{t('RefreshLiveScanners')}</ThemedText>
            </TouchableOpacity>

            <View style={styles.section}>
              <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
                {t('SignalPresetsSection')}
              </ThemedText>
              {availableScouters.map((scouter) => {
                const selected = selectedScouter?.id === scouter.id;
                return (
                  <View key={scouter.id} style={[styles.card, { backgroundColor: selected ? colors.surfaceElevated : colors.surface, borderColor: selected ? colors.primary : colors.border }]}> 
                    <View style={styles.cardHeader}>
                      <View style={styles.cardLeft}>
                        <IconSymbol name="scope" size={20} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                          <ThemedText type="defaultSemiBold" style={{ color: colors.text }} numberOfLines={1}>
                            {scouter.name}
                          </ThemedText>
                          <ThemedText style={{ color: colors.textTertiary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                            {t('LastRun')}: {lastUpdated ? formatRelativeTime(lastUpdated) : '--'}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: colors.success }]}> 
                        <ThemedText style={[styles.statusText, { color: colors.primaryText }]}>
                          {t('Active')}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={[styles.criteriaBox, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                      <ThemedText style={{ color: colors.textSecondary, fontSize: 11 }}>{scouter.criteria}</ThemedText>
                      <ThemedText style={{ color: colors.textTertiary, fontSize: 11, marginTop: 6 }}>{scouter.note}</ThemedText>
                    </View>
                    <View style={styles.cardStats}>
                      <View style={styles.stat}>
                        <IconSymbol name="chart.line.uptrend.xyaxis" size={15} color={colors.primary} />
                        <ThemedText style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>
                          {scouter.matches.length} {t('SignalMatchesCount')}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]} onPress={onRefresh}>
                        <IconSymbol name="play.fill" size={13} color={colors.primary} />
                        <ThemedText style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>{t('RefreshData')}</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]} onPress={() => handleViewScouter(scouter.id)}>
                        <IconSymbol name="eye.fill" size={13} color={colors.text} />
                        <ThemedText style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{t('ViewMatches')}</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            {upcomingScouters.length ? (
              <View style={styles.section}>
                <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('ComingSoonSignals')}
                </ThemedText>
                <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <ThemedText style={{ color: colors.textSecondary, lineHeight: 20 }}>
                    {t('ComingSoonSignalsBody')}
                  </ThemedText>
                </View>
                {upcomingScouters.map((scouter) => (
                  <View key={scouter.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardLeft}>
                        <IconSymbol name="scope" size={20} color={colors.textTertiary} />
                        <View style={{ flex: 1 }}>
                          <ThemedText type="defaultSemiBold" style={{ color: colors.text }} numberOfLines={1}>
                            {scouter.name}
                          </ThemedText>
                          <ThemedText style={{ color: colors.textTertiary, fontSize: 11, marginTop: 2 }} numberOfLines={2}>
                            {scouter.criteria}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: colors.border }]}>
                        <ThemedText style={[styles.statusText, { color: colors.textTertiary }]}>
                          {t('ComingSoon')}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={[styles.criteriaBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <ThemedText style={{ color: colors.textSecondary, fontSize: 11 }}>{scouter.note}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {selectedScouter ? (
              <View ref={matchesSectionRef as any} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}> 
                    {t('LiveMatchesFor').replace('{name}', selectedScouter.name)}
                  </ThemedText>
                </View>
                {selectedScouter.matches.length ? selectedScouter.matches.map((match) => {
                  const saved = isSaved(match.symbol);
                  const changeColor = (match.changePct ?? 0) >= 0 ? colors.success : colors.danger;
                  return (
                    <TouchableOpacity
                      key={`${selectedScouter.id}-${match.symbol}`}
                      style={[styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => router.push({ pathname: '/coin' as any, params: { symbol: match.symbol } })}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={styles.rowTop}>
                          <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>{match.symbol}</ThemedText>
                          <ThemedText style={{ color: changeColor, fontWeight: '700' }}>{formatCoinPercent(match.changePct)}</ThemedText>
                        </View>
                        <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }} numberOfLines={1}>{match.name}</ThemedText>
                        <View style={{ marginTop: 10 }}>
                          <CoinSparkline symbol={match.symbol} color={changeColor} width={128} height={34} />
                        </View>
                        <View style={styles.metricRow}>
                          <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{match.primaryMetric}</ThemedText>
                          <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{match.secondaryMetric}</ThemedText>
                        </View>
                      </View>
                      <View style={styles.rowRight}>
                        <ThemedText style={{ color: colors.text, fontWeight: '700' }}>{match.price}</ThemedText>
                        <TouchableOpacity style={{ marginTop: 12 }} onPress={() => toggleSaved(match.symbol)}>
                          <IconSymbol name={saved ? 'bookmark.fill' : 'bookmark'} size={18} color={saved ? colors.primary : colors.textTertiary} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                }) : (
                  <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                    <ThemedText style={{ color: colors.textSecondary }}>
                      {t('NoScouterMatchesBody')}
                    </ThemedText>
                  </View>
                )}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  centerState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginBottom: 4,
  },
  matchesScroll: {
    marginLeft: -20,
    paddingLeft: 20,
  },
  matchCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 10,
    minWidth: 120,
  },
  emptyInlineCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 10,
    width: 240,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  createButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  criteriaBox: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardStats: {
    gap: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rowCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  },
  rowRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 88,
  },
});
