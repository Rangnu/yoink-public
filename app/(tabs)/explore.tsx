import { ThemedText } from '@/components/themed-text';
import { BitcoinIcon } from '@/components/ui/bitcoin-icon';
import { CoinSparkline } from '@/components/ui/coin-sparkline';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';
import { useWatchlist } from '@/contexts/watchlist-context';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ExploreListRow = {
  coinId?: string;
  s: string;
  name: string;
  p: string;
  c: string;
  changeValue?: string;
  rank: number | null;
  metricLabel?: string;
  metricValue?: string;
};

export default function ExploreScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  const { isSaved, toggleSaved } = useWatchlist();
  const [refreshing, setRefreshing] = useState(false);
  const [stocksTab, setStocksTab] = useState<'volume' | 'trades' | 'gainers' | 'losers' | 'popular'>('volume');
  const [coinsData, setCoinsData] = useState<any[]>([]);

  const loadCoins = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('coin_latest_view')
        .select('coin_id, symbol, name, price_usd, change_24h_pct, volume_24h_usd, rank')
        .order('rank', { ascending: true })
        .limit(120);

      if (error) {
        console.warn('[explore] Failed to load coins from Supabase', error.message);
        setCoinsData([]);
      } else {
        setCoinsData(data ?? []);
      }
    } catch (err: any) {
      console.warn('[explore] Unexpected error loading coins', err?.message ?? err);
      setCoinsData([]);
    }
  }, []);

  useEffect(() => {
    loadCoins();
  }, [loadCoins]);

  const formatPrice = (p: number | null) =>
    p == null ? '-' : p.toLocaleString(undefined, { maximumFractionDigits: p >= 1 ? 2 : 6 });
  const formatChange = (v: number | null) =>
    v == null ? '0.0%' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
  const formatCompactDollars = (value: number | null) => {
    if (value == null) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };
  const formatDollarDelta = (value: number | null) => {
    if (value == null || !Number.isFinite(value)) return '--';
    const abs = Math.abs(value);
    const digits = abs >= 1000 ? 0 : abs >= 1 ? 2 : abs >= 0.01 ? 3 : 5;
    return `${value >= 0 ? '+' : '-'}$${abs.toLocaleString(undefined, { maximumFractionDigits: digits })}`;
  };

  const tickerItems = useMemo(() => {
    if (!coinsData.length) {
      return [
        { label: 'BTC', price: '$64,320', change: '+2.1%' },
        { label: 'ETH', price: '$2,430', change: '+1.4%' },
        { label: 'SOL', price: '$102.50', change: '+5.2%' },
        { label: 'BNB', price: '$315.40', change: '+3.1%' },
        { label: 'XRP', price: '$0.62', change: '+1.5%' },
        { label: 'DOGE', price: '$0.14', change: '+3.8%' },
        { label: 'PEPE', price: '$0.000012', change: '+16.4%' },
      ];
    }
    const withRank = coinsData.map((r) => ({
      ...r,
      rankNum: r.rank != null ? Number(r.rank) : Infinity,
      priceNum: r.price_usd != null ? Number(r.price_usd) : null,
      changeNum: r.change_24h_pct != null ? Number(r.change_24h_pct) : null,
    }));
    const top = [...withRank].sort((a, b) => a.rankNum - b.rankNum).slice(0, 7);
    return top.map((r) => ({
      label: r.symbol?.toUpperCase?.() ?? '',
      price: formatPrice(r.priceNum),
      change: formatChange(r.changeNum),
    }));
  }, [coinsData]);

  // ticker animation handled in <Ticker />

  const stockLists = useMemo<Record<'volume' | 'trades' | 'gainers' | 'losers' | 'popular', ExploreListRow[]>>(() => {
    if (!coinsData.length) {
      return {
        volume: [
          { s: 'BTC', name: 'Bitcoin', p: '$64,320', c: '+2.1%', rank: 1, metricLabel: '24H vol', metricValue: '$48B' },
          { s: 'ETH', name: 'Ethereum', p: '$2,430', c: '+1.4%', rank: 2, metricLabel: '24H vol', metricValue: '$22B' },
          { s: 'USDT', name: 'Tether', p: '$1.00', c: '+0.0%', rank: 3, metricLabel: '24H vol', metricValue: '$71B' },
          { s: 'SOL', name: 'Solana', p: '$102.50', c: '+5.2%', rank: 4, metricLabel: '24H vol', metricValue: '$5.8B' },
          { s: 'BNB', name: 'BNB', p: '$315.40', c: '+3.1%', rank: 5, metricLabel: '24H vol', metricValue: '$2.9B' },
          { s: 'XRP', name: 'XRP', p: '$0.62', c: '+1.5%', rank: 6, metricLabel: '24H vol', metricValue: '$1.4B' },
          { s: 'DOGE', name: 'Dogecoin', p: '$0.14', c: '+3.8%', rank: 7, metricLabel: '24H vol', metricValue: '$1.1B' },
          { s: 'TON', name: 'Toncoin', p: '$7.24', c: '+2.9%', rank: 8, metricLabel: '24H vol', metricValue: '$812M' },
          { s: 'LINK', name: 'Chainlink', p: '$18.42', c: '+1.3%', rank: 9, metricLabel: '24H vol', metricValue: '$642M' },
          { s: 'PEPE', name: 'Pepe', p: '$0.000012', c: '+16.4%', rank: 10, metricLabel: '24H vol', metricValue: '$1.7B' },
        ],
        trades: [],
        gainers: [],
        losers: [],
        popular: [],
      } as const;
    }

    const rows = coinsData.map((r) => ({
      ...r,
      coinId: r.coin_id ?? undefined,
      priceNum: r.price_usd != null ? Number(r.price_usd) : null,
      changeNum: r.change_24h_pct != null ? Number(r.change_24h_pct) : null,
      vol24: r.volume_24h_usd != null ? Number(r.volume_24h_usd) : 0,
      rankNum: r.rank != null ? Number(r.rank) : Infinity,
    }));

    const mapRow = (r: any, metricLabel?: string, metricValue?: string) => ({
      coinId: r.coinId,
      s: r.symbol?.toUpperCase?.() ?? '',
      name: r.name ?? r.symbol ?? '',
      p: formatPrice(r.priceNum),
      c: formatChange(r.changeNum),
      changeValue:
        r.priceNum != null && r.changeNum != null
          ? formatDollarDelta((r.priceNum * r.changeNum) / 100)
          : '--',
      rank: Number.isFinite(r.rankNum) ? r.rankNum : null,
      metricLabel,
      metricValue,
    });

    const volume = [...rows]
      .sort((a, b) => (b.vol24 ?? 0) - (a.vol24 ?? 0))
      .slice(0, 10)
      .map((row) => mapRow(row, t('Vol24Label'), formatCompactDollars(row.vol24)));

    const gainers = [...rows]
      .filter((r) => (r.changeNum ?? 0) > 0)
      .sort((a, b) => (b.changeNum ?? 0) - (a.changeNum ?? 0))
      .slice(0, 10)
      .map((row) => mapRow(row, t('Vol24Label'), formatCompactDollars(row.vol24)));

    const losers = [...rows]
      .filter((r) => (r.changeNum ?? 0) < 0)
      .sort((a, b) => (a.changeNum ?? 0) - (b.changeNum ?? 0))
      .slice(0, 10)
      .map((row) => mapRow(row, t('Vol24Label'), formatCompactDollars(row.vol24)));

    const popular = [...rows]
      .sort((a, b) => a.rankNum - b.rankNum)
      .slice(0, 10)
      .map((row) => mapRow(row, t('MarketRankLabel'), `#${row.rankNum}`));

    // For now, use volume as a proxy for trades list.
    const trades = [...rows]
      .sort((a, b) => (b.vol24 ?? 0) - (a.vol24 ?? 0))
      .slice(0, 10)
      .map((row) => mapRow(row, t('VolProxy'), formatCompactDollars(row.vol24)));

    return { volume, trades, gainers, losers, popular };
  }, [coinsData, t]);

  return (
    <SafeAreaView edges={["top","left","right"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <ThemedText type="title" style={{ color: colors.text, fontSize: 22 }}>{t('ExploreHeader')}</ThemedText>
        <View style={styles.tickerInline}>
          <Ticker colors={colors} items={tickerItems} intervalMs={2600} durationMs={420} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        contentInsetAdjustmentBehavior="never"
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadCoins().finally(() => setRefreshing(false));
            }}
            tintColor={colors.primary}
            title={t('RefreshTitle')}
            titleColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        )}
      >
        <View style={styles.section}>
          <View style={styles.categoriesRow}>
            <CategoryButton
              colors={colors}
              label={t('Coins')}
              renderIcon={() => (<BitcoinIcon size={24} color="#F5C518" />)}
            />
          </View>
        </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>{t('LiveStocks')}</ThemedText>
        </View>
          <View style={styles.inlineTabsRow}>
            {([
              { key: 'volume', label: t('Volume') },
              { key: 'trades', label: t('TradesCount') },
              { key: 'gainers', label: t('Gainers') },
              { key: 'losers', label: t('Losers') },
              { key: 'popular', label: t('Popular') },
            ] as const).map(t => (
              <TouchableOpacity key={t.key} onPress={() => setStocksTab(t.key)} style={styles.inlineTabItem}>
                <ThemedText style={{ color: stocksTab===t.key ? colors.text : colors.textSecondary, fontWeight: stocksTab===t.key ? '700' as const : '600' as const }}>{t.label}</ThemedText>
                <View style={[styles.inlineTabUnderline, { backgroundColor: stocksTab===t.key ? colors.primary : 'transparent' }]} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.liveBoardCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.liveBoardHeader}>
              <View>
                <ThemedText style={{ color: colors.text, fontWeight: '700' }}>
                  {t('LiveMarketBoardTitle')}
                </ThemedText>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {t('TapAnyCoinDetails')}
                </ThemedText>
              </View>
              <View style={[styles.liveBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <ThemedText style={{ color: colors.success, fontSize: 11, fontWeight: '700' }}>
                  {t('LiveBadge')}
                </ThemedText>
              </View>
            </View>

          {stockLists[stocksTab].map((row, i) => {
            const saved = isSaved(row.s);
            return (
              <ExploreMarketRow
                key={row.s}
                index={i + 1}
                coinId={row.coinId}
                symbol={row.s}
                name={row.name}
                priceLabel={row.p.startsWith('$') ? row.p : `$${row.p}`}
                changeLabel={row.c}
                changeValue={row.changeValue}
                metricLabel={row.metricLabel}
                metricValue={row.metricValue}
                saved={saved}
                onPress={() => router.push({ pathname: '/coin' as any, params: { symbol: row.s } })}
                onToggleSaved={() => toggleSaved(row.s)}
                colors={colors}
              />
            )})}
          </View>

          <TouchableOpacity 
            onPress={() => router.push({ pathname: '/explore/top100' as any, params: { tab: stocksTab } })}
            style={[styles.moreBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          > 
            <IconSymbol name="chevron.down" size={16} color={colors.textSecondary} />
            <ThemedText style={{ color: colors.textSecondary, fontWeight: '700' }}>{t('More')}</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
            Explore is live-data first now
          </ThemedText>
          <ThemedText style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
            Tap a coin row to open details. Bookmark icons save coins locally on this device while shared watchlists and alerts are still being built.
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryButton({ colors, emoji, icon, label, renderIcon }: { colors: any; emoji?: string; icon?: any; label: string; renderIcon?: () => React.ReactNode }) {
  return (
    <TouchableOpacity style={[styles.categoryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      {renderIcon ? (
        renderIcon()
      ) : emoji ? (
        <ThemedText style={{ fontSize: 20 }}>{emoji}</ThemedText>
      ) : (
        <IconSymbol name={icon as any} size={20} color={colors.text} />
      )}
      <ThemedText style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

function ExploreMarketRow({
  index,
  coinId,
  symbol,
  name,
  priceLabel,
  changeLabel,
  changeValue,
  metricLabel,
  metricValue,
  saved,
  onPress,
  onToggleSaved,
  colors,
}: {
  index: number;
  coinId?: string;
  symbol: string;
  name: string;
  priceLabel: string;
  changeLabel: string;
  changeValue?: string;
  metricLabel?: string;
  metricValue?: string;
  saved: boolean;
  onPress?: () => void;
  onToggleSaved?: () => void;
  colors: any;
}) {
  const isPositive = !changeLabel.trim().startsWith('-');
  const changeColor = isPositive ? colors.success : colors.danger;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.marketRow, { borderBottomColor: colors.border }]}
    >
      <View style={styles.marketRowBadgeWrap}>
        <View style={[styles.marketRowBadgeCircle, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
            {String(index).padStart(2, '0')}
          </ThemedText>
        </View>
      </View>

      <View style={styles.marketRowMain}>
        <View style={styles.marketRowTextStack}>
          <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
            {symbol}
          </ThemedText>
          <View style={styles.marketRowDetailLine}>
            <ThemedText style={{ color: colors.textSecondary, fontSize: 11 }} numberOfLines={1}>
              {name}
            </ThemedText>
            {metricLabel && metricValue ? (
              <ThemedText style={{ color: colors.textTertiary, fontSize: 10, fontWeight: '600' }} numberOfLines={1}>
                {metricLabel.toUpperCase()} {metricValue}
              </ThemedText>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.marketRowChart}>
        <CoinSparkline
          coinId={coinId}
          symbol={symbol}
          color={changeColor}
          width={70}
          height={24}
          range="24H"
          historyLimit={400}
        />
      </View>

      <View style={styles.marketRowPriceSection}>
        <View style={[styles.marketPricePill, { backgroundColor: changeColor }]}>
          <ThemedText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
            {priceLabel}
          </ThemedText>
        </View>
        <View style={styles.marketRowChangeLine}>
          {changeValue ? (
            <ThemedText style={{ color: changeColor, fontSize: 10, fontWeight: '600' }}>
              {changeValue}
            </ThemedText>
          ) : null}
          <ThemedText style={{ color: changeColor, fontSize: 10, fontWeight: '600' }}>
            {changeLabel}
          </ThemedText>
        </View>
      </View>

      <TouchableOpacity
        accessibilityLabel={saved ? `Remove ${symbol} from saved` : `Save ${symbol}`}
        onPress={onToggleSaved}
        style={[styles.marketSaveButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
      >
        <IconSymbol name={saved ? 'bookmark.fill' : 'bookmark'} size={16} color={saved ? colors.primary : colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function Ticker({ colors, items, intervalMs = 2600, durationMs = 420 }: { colors: any; items: { label: string; price: string; change: string }[]; intervalMs?: number; durationMs?: number }) {
  const [index, setIndex] = useState(0);
  const height = 18;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(translateY, { toValue: -height, duration: durationMs, useNativeDriver: true }).start(() => {
        translateY.setValue(0);
        setIndex((i) => (i + 1) % items.length);
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [durationMs, height, intervalMs, items.length, translateY]);

  const curr = items[index];
  const next = items[(index + 1) % items.length];

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {[curr, next].map((it, idx) => (
          <View key={idx} style={[styles.tickerRow, { height }]}> 
            <IconSymbol name="chart.line.uptrend.xyaxis" size={14} color={colors.textSecondary} />
            <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{it.label}</ThemedText>
            <ThemedText style={{ color: it.change.startsWith('-') ? colors.danger : colors.success, fontSize: 12, fontWeight: '700' }}>{it.price}</ThemedText>
            <ThemedText style={{ color: it.change.startsWith('-') ? colors.danger : colors.success, fontSize: 12, fontWeight: '700' }}>{it.change}</ThemedText>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tickerPill: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  tickerInline: { paddingVertical: 2 },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    marginBottom: 0,
  },
  tickerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
  },
  categoriesRow: { flexDirection: 'row', gap: 10 },
  categoryBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', gap: 8 },
  tabsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  miniTab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  inlineTabsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, paddingTop: 6, paddingBottom: 6 },
  inlineTabItem: { alignItems: 'center' },
  inlineTabUnderline: { height: 2, borderRadius: 1, alignSelf: 'stretch', marginTop: 4 },
  liveBoardCard: { borderWidth: 0, borderRadius: 0, padding: 0, backgroundColor: 'transparent' },
  liveBoardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 10, paddingHorizontal: 2 },
  liveBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, alignSelf: 'flex-start' },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  marketRowBadgeWrap: {
    width: 34,
    marginRight: 8,
    alignItems: 'flex-start',
  },
  marketRowBadgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketRowMain: {
    flex: 1,
    minWidth: 0,
  },
  marketRowTextStack: {
    minWidth: 0,
  },
  marketRowDetailLine: {
    marginTop: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  marketRowChart: {
    width: 70,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketRowPriceSection: {
    alignItems: 'flex-end',
    minWidth: 78,
  },
  marketPricePill: {
    minWidth: 68,
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  marketRowChangeLine: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 6,
  },
  marketSaveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 12, alignSelf: 'center' },
  infoCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  tickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
