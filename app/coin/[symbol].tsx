import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { CoinSparkline } from '@/components/ui/coin-sparkline';
import type { CoinChartRange } from '@/components/ui/coin-sparkline';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useActivity } from '@/contexts/activity-context';
import { useTheme } from '@/contexts/theme-context';
import { useWatchlist } from '@/contexts/watchlist-context';
import { supabase } from '@/utils/supabase';

type CoinDetailRow = {
  coin_id: string;
  symbol: string;
  name: string;
  rank: number | null;
  price_usd: number | null;
  market_cap_usd: number | null;
  volume_24h_usd: number | null;
  change_1h_pct: number | null;
  change_24h_pct: number | null;
  change_7d_pct: number | null;
  ts: string;
};

type WhaleMetricsRow = {
  top_traders_count: number | null;
  whale_buy_usd: number | null;
  whale_sell_usd: number | null;
  whale_net_flow_usd: number | null;
  avg_realized_pnl_usd: number | null;
  ts: string;
};

type TraderRow = {
  trader_address: string;
  label: string | null;
  name: string | null;
  realized_pnl_usd: number | null;
  total_buy_usd: number | null;
  total_sell_usd: number | null;
};

export default function CoinDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ symbol?: string }>();
  const { recordEvent } = useActivity();
  const { isSaved, toggleSaved } = useWatchlist();

  const symbol = useMemo(() => String(params.symbol ?? '').toUpperCase(), [params.symbol]);
  const [coin, setCoin] = useState<CoinDetailRow | null>(null);
  const [whaleMetrics, setWhaleMetrics] = useState<WhaleMetricsRow | null>(null);
  const [topTraders, setTopTraders] = useState<TraderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [chartRange, setChartRange] = useState<CoinChartRange>('24H');
  const [chartVariant, setChartVariant] = useState<'line' | 'bar'>('line');
  const [chartWidth, setChartWidth] = useState(320);

  const loadCoin = useCallback(async () => {
    if (!symbol) {
      setCoin(null);
      setError('Missing coin symbol.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: coinError } = await supabase
        .from('coin_latest_view')
        .select('coin_id, symbol, name, rank, price_usd, market_cap_usd, volume_24h_usd, change_1h_pct, change_24h_pct, change_7d_pct, ts')
        .eq('symbol', symbol)
        .limit(1)
        .maybeSingle();

      if (coinError) {
        setCoin(null);
        setError(coinError.message);
        return;
      }

      if (!data) {
        setCoin(null);
        setError('No live market data is available for this coin yet.');
        return;
      }

      setCoin(data as CoinDetailRow);

      const coinId = (data as CoinDetailRow).coin_id;

      const [{ data: metricsData }, { data: tradersData }] = await Promise.all([
        supabase
          .from('coin_whale_metrics')
          .select('top_traders_count, whale_buy_usd, whale_sell_usd, whale_net_flow_usd, avg_realized_pnl_usd, ts')
          .eq('coin_id', coinId)
          .order('ts', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('coin_top_traders')
          .select('trader_address, label, name, realized_pnl_usd, total_buy_usd, total_sell_usd')
          .eq('coin_id', coinId)
          .order('realized_pnl_usd', { ascending: false })
          .limit(5),
      ]);

      setWhaleMetrics((metricsData as WhaleMetricsRow | null) ?? null);
      setTopTraders((tradersData as TraderRow[]) ?? []);
    } catch (err: any) {
      setCoin(null);
      setWhaleMetrics(null);
      setTopTraders([]);
      setError(err?.message ?? 'Failed to load coin details.');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    loadCoin();
  }, [loadCoin]);

  useEffect(() => {
    if (!coin || viewRecorded) return;

    void recordEvent({
      eventType: 'view_coin',
      entityType: 'coin',
      entityId: coin.symbol,
      title: coin.symbol,
      subtitle: coin.name,
      meta: {
        rank: coin.rank,
        price_usd: coin.price_usd,
      },
    });
    setViewRecorded(true);
  }, [coin, recordEvent, viewRecorded]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCoin().finally(() => setRefreshing(false));
  }, [loadCoin]);

  const formatMoney = (value: number | null) =>
    value == null
      ? '--'
      : `$${value.toLocaleString(undefined, { maximumFractionDigits: value >= 1 ? 2 : 6 })}`;

  const formatPercent = (value: number | null) =>
    value == null ? '--' : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  const formatCompactDollars = (value: number | null) => {
    if (value == null) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const saved = isSaved(symbol);
  const primaryChangeColor = (coin?.change_24h_pct ?? 0) >= 0 ? colors.success : colors.danger;
  const chartRangeChange = chartRange === '1H'
    ? coin?.change_1h_pct ?? null
    : chartRange === '7D'
      ? coin?.change_7d_pct ?? null
      : coin?.change_24h_pct ?? null;
  const chartRangeChangeColor = (chartRangeChange ?? 0) >= 0 ? colors.success : colors.danger;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.surfaceElevated }]}>
          <IconSymbol name="chevron.left" size={18} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
            {symbol || 'Coin'}
          </ThemedText>
        </View>

        <TouchableOpacity
          onPress={() => toggleSaved(symbol)}
          style={[styles.iconButton, { backgroundColor: colors.surfaceElevated }]}
          disabled={!symbol}
        >
          <IconSymbol name={saved ? 'bookmark.fill' : 'bookmark'} size={18} color={saved ? colors.primary : colors.text} />
        </TouchableOpacity>
      </View>

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
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.primary} />
            <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>Loading coin details…</ThemedText>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={{ color: colors.danger, fontWeight: '700' }}>Could not load this coin</ThemedText>
            <ThemedText style={{ color: colors.textSecondary, marginTop: 6 }}>{error}</ThemedText>
          </View>
        ) : null}

        {!loading && coin ? (
          <>
            <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="title" style={{ color: colors.text, fontSize: 28 }}>
                    {coin.symbol}
                  </ThemedText>
                  <ThemedText style={{ color: colors.textSecondary, marginTop: 4 }}>
                    {coin.name}
                  </ThemedText>
                </View>

                <View style={[styles.rankPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                    #{coin.rank ?? '--'}
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={{ color: colors.text, fontSize: 34, fontWeight: '700', marginTop: 20 }}>
                {formatMoney(coin.price_usd)}
              </ThemedText>
              <ThemedText style={{ color: primaryChangeColor, fontSize: 16, fontWeight: '700', marginTop: 8 }}>
                {formatPercent(coin.change_24h_pct)} in 24h
              </ThemedText>

              <View
                style={[styles.sparklineCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                onLayout={(event) => {
                  const nextWidth = Math.max(240, Math.floor(event.nativeEvent.layout.width) - 24);
                  setChartWidth((current) => (Math.abs(current - nextWidth) > 4 ? nextWidth : current));
                }}
              >
                <View style={styles.chartHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>
                      {chartRange} price action
                    </ThemedText>
                    <ThemedText style={{ color: colors.textSecondary, marginTop: 4, fontSize: 12 }}>
                      {chartVariant === 'line'
                        ? 'Hover or drag to inspect each snapshot and the 24h volume trend.'
                        : 'Switch between line and price bars while keeping the volume bars below.'}
                    </ThemedText>
                  </View>

                  <View
                    style={[
                      styles.chartChangePill,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ThemedText style={{ color: chartRangeChangeColor, fontWeight: '700', fontSize: 12 }}>
                      {formatPercent(chartRangeChange)}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.chartControlsRow}>
                  <View style={styles.chartRangeRow}>
                    {(['1H', '24H', '7D'] as const).map((range) => {
                      const active = chartRange === range;
                      return (
                        <TouchableOpacity
                          key={range}
                          onPress={() => setChartRange(range)}
                          style={[
                            styles.chartRangeButton,
                            {
                              backgroundColor: active ? colors.primary : colors.surface,
                              borderColor: active ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <ThemedText
                            style={{
                              color: active ? colors.primaryText : colors.text,
                              fontSize: 12,
                              fontWeight: '700',
                            }}
                          >
                            {range}
                          </ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.chartToggleRow}>
                    {(['line', 'bar'] as const).map((variant) => {
                      const active = chartVariant === variant;
                      return (
                        <TouchableOpacity
                          key={variant}
                          onPress={() => setChartVariant(variant)}
                          style={[
                            styles.chartToggleButton,
                            {
                              backgroundColor: active ? colors.primary : colors.surface,
                              borderColor: active ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <ThemedText
                            style={{
                              color: active ? colors.primaryText : colors.text,
                              fontSize: 12,
                              fontWeight: '700',
                            }}
                          >
                            {variant === 'line' ? 'Line' : 'Bars'}
                          </ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.chartCanvas}>
                  <CoinSparkline
                    coinId={coin.coin_id}
                    symbol={coin.symbol}
                    color={chartRangeChangeColor}
                    width={chartWidth}
                    height={184}
                    range={chartRange}
                    variant={chartVariant}
                    interactive
                    showArea={chartVariant === 'line'}
                    showGrid
                    showVolumeBars
                    tooltipBackgroundColor={colors.surface}
                    tooltipTextColor={colors.text}
                  />
                </View>

                <View style={styles.chartMetaRow}>
                  {[
                    `${chartRange} view`,
                    `24h vol ${formatCompactDollars(coin.volume_24h_usd)}`,
                    chartVariant === 'line' ? 'Line price' : 'Bar price',
                    'Hover details',
                  ].map((item) => (
                    <View
                      key={item}
                      style={[styles.chartMetaPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <ThemedText style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                        {item}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={() => toggleSaved(coin.symbol)}
                >
                  <IconSymbol name={saved ? 'bookmark.fill' : 'bookmark'} size={16} color={colors.primaryText} />
                  <ThemedText style={{ color: colors.primaryText, fontWeight: '700' }}>
                    {saved ? 'Saved' : 'Save coin'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.statsGrid}>
              {[
                { label: '1h', value: formatPercent(coin.change_1h_pct) },
                { label: '24h', value: formatPercent(coin.change_24h_pct) },
                { label: '7d', value: formatPercent(coin.change_7d_pct) },
                { label: 'Volume', value: formatMoney(coin.volume_24h_usd) },
                { label: 'Market cap', value: formatMoney(coin.market_cap_usd) },
                { label: 'Updated', value: new Date(coin.ts).toLocaleString() },
              ].map((item) => (
                <View
                  key={item.label}
                  style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{item.label}</ThemedText>
                  <ThemedText style={{ color: colors.text, fontWeight: '700', marginTop: 8 }} numberOfLines={2}>
                    {item.value}
                  </ThemedText>
                </View>
              ))}
            </View>

            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText type="subtitle" style={{ color: colors.text, fontSize: 18 }}>
                Whale snapshot
              </ThemedText>

              {whaleMetrics ? (
                <View style={styles.metricsList}>
                  {[
                    ['Top traders', whaleMetrics.top_traders_count?.toString() ?? '--'],
                    ['Whale buys', formatMoney(whaleMetrics.whale_buy_usd)],
                    ['Whale sells', formatMoney(whaleMetrics.whale_sell_usd)],
                    ['Net flow', formatMoney(whaleMetrics.whale_net_flow_usd)],
                    ['Avg realized PnL', formatMoney(whaleMetrics.avg_realized_pnl_usd)],
                  ].map(([label, value]) => (
                    <View key={label} style={styles.metricRow}>
                      <ThemedText style={{ color: colors.textSecondary }}>{label}</ThemedText>
                      <ThemedText style={{ color: colors.text, fontWeight: '700' }}>{value}</ThemedText>
                    </View>
                  ))}
                </View>
              ) : (
                <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>
                  Whale metrics are not available yet for this coin in the public app feed.
                </ThemedText>
              )}
            </View>

            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText type="subtitle" style={{ color: colors.text, fontSize: 18 }}>
                Top traders
              </ThemedText>

              {topTraders.length ? (
                <View style={styles.tradersList}>
                  {topTraders.map((trader) => (
                    <View key={trader.trader_address} style={[styles.traderRow, { borderBottomColor: colors.border }]}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={{ color: colors.text, fontWeight: '700' }}>
                          {trader.label || trader.name || trader.trader_address.slice(0, 10)}
                        </ThemedText>
                        <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                          {trader.trader_address}
                        </ThemedText>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <ThemedText style={{ color: colors.text, fontWeight: '700' }}>
                          {formatMoney(trader.realized_pnl_usd)}
                        </ThemedText>
                        <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                          Buy {formatMoney(trader.total_buy_usd)}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>
                  Trader-level data is not surfaced yet for this coin.
                </ThemedText>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
  },
  centerState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rankPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  sparklineCard: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chartChangePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chartControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  chartRangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chartRangeButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chartToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chartToggleButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chartCanvas: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chartMetaPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    minHeight: 92,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  metricsList: {
    marginTop: 12,
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  tradersList: {
    marginTop: 12,
  },
  traderRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
