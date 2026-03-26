import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { CoinSparkline } from '@/components/ui/coin-sparkline';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';
import { useWatchlist } from '@/contexts/watchlist-context';
import { CoinMarketRow, MarketSortMode, fetchCoinMarketRows, formatCoinPercent, formatCoinPrice, getChangeForRange, getLatestTimestamp, sortCoinRows } from '@/utils/coin-market';

export default function MarketsScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  const { isSaved, toggleSaved } = useWatchlist();
  const params = useLocalSearchParams<{ category?: string }>();

  const [sortMode, setSortMode] = useState<MarketSortMode>(params.category === 'coins' ? 'popular' : 'popular');
  const [rows, setRows] = useState<CoinMarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCoinMarketRows(120);
      setRows(data);
    } catch (err: any) {
      setRows([]);
      setError(err?.message ?? 'Failed to load markets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRows().finally(() => setRefreshing(false));
  }, [loadRows]);

  const displayedRows = useMemo(() => sortCoinRows(rows, sortMode, '1d').slice(0, 50), [rows, sortMode]);
  const leaders = useMemo(() => ({
    marketLeader: sortCoinRows(rows, 'popular', '1d')[0] ?? null,
    topGainer: sortCoinRows(rows, 'gainers', '1d')[0] ?? null,
    topLoser: sortCoinRows(rows, 'losers', '1d')[0] ?? null,
  }), [rows]);
  const lastUpdated = useMemo(() => getLatestTimestamp(rows), [rows]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={{ color: colors.text }}>{t('Markets')}</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
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
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <ThemedText style={{ color: colors.text, fontWeight: '700' }}>Crypto-only market board</ThemedText>
          <ThemedText style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
            Yoink is focusing this screen on live crypto data from Supabase instead of mixed stocks, bonds, and commodities. Last update: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}.
          </ThemedText>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard
            label="Leader"
            value={leaders.marketLeader?.symbol ?? '--'}
            detail={leaders.marketLeader ? `#${leaders.marketLeader.rank ?? '--'} · ${formatCoinPrice(leaders.marketLeader.price_usd)}` : '--'}
            colors={colors}
          />
          <SummaryCard
            label={t('Gainers')}
            value={leaders.topGainer?.symbol ?? '--'}
            detail={leaders.topGainer ? formatCoinPercent(getChangeForRange(leaders.topGainer, '1d')) : '--'}
            colors={colors}
          />
          <SummaryCard
            label={t('Losers')}
            value={leaders.topLoser?.symbol ?? '--'}
            detail={leaders.topLoser ? formatCoinPercent(getChangeForRange(leaders.topLoser, '1d')) : '--'}
            colors={colors}
          />
          <SummaryCard
            label="Tracked"
            value={`${rows.length}`}
            detail="coins"
            colors={colors}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segmentScroll} contentContainerStyle={styles.segmentContent}>
          {[
            { key: 'popular' as const, title: t('Popular') },
            { key: 'volume' as const, title: t('Volume') },
            { key: 'gainers' as const, title: t('Gainers') },
            { key: 'losers' as const, title: t('Losers') },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              onPress={() => setSortMode(option.key)}
              style={[
                styles.segmentBtn,
                {
                  backgroundColor: sortMode === option.key ? colors.primary : colors.surface,
                  borderColor: sortMode === option.key ? colors.primary : colors.border,
                },
              ]}
            >
              <ThemedText style={{ fontWeight: '600', fontSize: 14, color: sortMode === option.key ? colors.primaryText : colors.text }}>
                {option.title}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.primary} />
            <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>Loading markets…</ThemedText>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <ThemedText style={{ color: colors.danger, fontWeight: '700' }}>Could not load markets</ThemedText>
            <ThemedText style={{ color: colors.textSecondary, marginTop: 6 }}>{error}</ThemedText>
          </View>
        ) : null}

        {!loading && !error && displayedRows.map((item, idx) => {
          const change = getChangeForRange(item, '1d');
          const changeColor = (change ?? 0) >= 0 ? colors.success : colors.danger;
          const saved = isSaved(item.symbol);
          return (
            <TouchableOpacity
              key={item.symbol}
              style={[styles.marketRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
              onPress={() => router.push({ pathname: '/coin/[symbol]' as any, params: { symbol: item.symbol } })}
            >
              <ThemedText style={{ color: colors.textSecondary, width: 24, textAlign: 'right' }}>{idx + 1}</ThemedText>
              <View style={styles.nameSection}>
                <ThemedText style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>{item.symbol}</ThemedText>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{item.name}</ThemedText>
              </View>
              <View style={styles.chartSection}>
                <CoinSparkline symbol={item.symbol} color={changeColor} width={72} height={28} />
              </View>
              <View style={styles.valueSection}>
                <ThemedText style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>{formatCoinPrice(item.price_usd)}</ThemedText>
                <ThemedText style={{ color: changeColor, fontWeight: '700', fontSize: 13, marginTop: 2 }}>{formatCoinPercent(change)}</ThemedText>
              </View>
              <TouchableOpacity style={{ padding: 6, marginLeft: 8 }} onPress={() => toggleSaved(item.symbol)}>
                <IconSymbol name={saved ? 'bookmark.fill' : 'bookmark'} size={18} color={saved ? colors.primary : colors.textTertiary} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, detail, colors }: { label: string; value: string; detail: string; colors: any }) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</ThemedText>
      <ThemedText style={{ color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 8 }}>{value}</ThemedText>
      <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }} numberOfLines={2}>{detail}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 14,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  segmentScroll: {
    maxHeight: 56,
    marginBottom: 12,
  },
  segmentContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
  },
  segmentBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 8,
  },
  nameSection: {
    flex: 1,
    justifyContent: 'center',
  },
  chartSection: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueSection: {
    alignItems: 'flex-end',
    minWidth: 92,
  },
});
