import { ThemedText } from '@/components/themed-text';
import { CoinSparkline } from '@/components/ui/coin-sparkline';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  const [tab, setTab] = useState<'balanced' | 'fomo' | 'yoink'>('fomo');
  const [refreshing, setRefreshing] = useState(false);
  // Animated scroll value to coordinate header behaviors
  const scrollY = useRef(new Animated.Value(0)).current;

  type HighlightRow = {
    coinId?: string;
    symbol: string;
    name: string;
    price: string;
    change: string;
    changeValue: string;
    rank?: number | null;
  };

  const mockData = useMemo<{
    balanced: HighlightRow[];
    fomo: HighlightRow[];
    yoink: HighlightRow[];
  }>(() => (
    {
      // Majors: large-cap cryptocurrencies
      balanced: Array.from({ length: 13 }, (_, i) => ({
        coinId: undefined,
        symbol: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOGE', 'TON', 'LINK', 'TRX', 'UNI', 'LTC'][i],
        name: [
          'Bitcoin',
          'Ethereum',
          'Solana',
          'BNB',
          'XRP',
          'Cardano',
          'Avalanche',
          'Dogecoin',
          'Toncoin',
          'Chainlink',
          'TRON',
          'Uniswap',
          'Litecoin',
        ][i],
        price: (50 + Math.random() * 60000).toFixed(2),
        change: ((Math.random() - 0.3) * 5).toFixed(2),
        changeValue: ((Math.random() - 0.3) * 10).toFixed(2),
        rank: i + 1,
      })),
      // FOMO: higher-volatility meme / narrative coins
      fomo: Array.from({ length: 13 }, (_, i) => {
        const isLocked = i >= 3;
        const dramaticChange = isLocked ? ((Math.random() - 0.3) * 35) : ((Math.random() - 0.2) * 15);
        return {
          coinId: undefined,
          symbol: ['PEPE', 'WIF', 'BONK', 'FLOKI', 'SHIB', 'MEME', 'BOME', 'BRETT', 'PONKE', 'MOG', 'DEGEN', 'TURBO', 'DOGE2'][i],
          name: [
            'Pepe',
            'dogwifhat',
            'Bonk',
            'Floki',
            'Shiba Inu',
            'Memecoin',
            'Book of Meme',
            'Brett',
            'Ponke',
            'Mog Coin',
            'Degen',
            'Turbo',
            'Dogecoin 2.0',
          ][i],
          price: (0.000001 + Math.random() * 0.5).toFixed(6),
          change: dramaticChange.toFixed(2),
          changeValue: (dramaticChange * 0.3).toFixed(2),
          rank: i + 1,
        };

      }),
      // Yoink: degen L1/L2 and DeFi plays
      yoink: Array.from({ length: 13 }, (_, i) => ({
        coinId: undefined,
        symbol: ['APT', 'SUI', 'ARB', 'OP', 'PYTH', 'TIA', 'SEI', 'ENA', 'PENDLE', 'JUP', 'INJ', 'RON', 'W'][i],
        name: [
          'Aptos',
          'Sui',
          'Arbitrum',
          'Optimism',
          'Pyth Network',
          'Celestia',
          'Sei',
          'Ethena',
          'Pendle',
          'Jupiter',
          'Injective',
          'Ronin',
          'Wormhole',
        ][i],
        price: (0.1 + Math.random() * 50).toFixed(2),
        change: ((Math.random() - 0.1) * 20).toFixed(2),
        changeValue: ((Math.random() - 0.1) * 8).toFixed(2),
        rank: i + 1,
      })),
    }
  ), []);

  const [liveHighlights, setLiveHighlights] = useState<{
    balanced: HighlightRow[];
    fomo: HighlightRow[];
    yoink: HighlightRow[];
  } | null>(null);

  const buildHighlightRows = useCallback((rows: any[]): {
    balanced: HighlightRow[];
    fomo: HighlightRow[];
    yoink: HighlightRow[];
  } => {
    if (!rows?.length) {
      return mockData;
    }

    const withNums = rows.map((r) => ({
      ...r,
      price: r.price_usd != null ? Number(r.price_usd) : null,
      change24: r.change_24h_pct != null ? Number(r.change_24h_pct) : null,
      change1h: r.change_1h_pct != null ? Number(r.change_1h_pct) : null,
      rankNum: r.rank != null ? Number(r.rank) : Infinity,
      vol24: r.volume_24h_usd != null ? Number(r.volume_24h_usd) : 0,
    }));

    const formatPrice = (p: number | null) =>
      p == null ? '-' : p.toLocaleString(undefined, { maximumFractionDigits: p >= 1 ? 2 : 6 });
    const formatChange = (v: number | null) =>
      v == null ? '0.00' : v.toFixed(2);

    const mapRow = (r: any, use1h = false): HighlightRow => {
      const pct = use1h ? r.change1h : r.change24;
      const abs = r.price != null && pct != null ? (r.price * pct) / 100 : 0;
      return {
        coinId: r.coin_id ?? undefined,
        symbol: r.symbol?.toUpperCase?.() ?? '',
        name: r.name ?? r.symbol ?? '',
        price: formatPrice(r.price),
        change: formatChange(pct),
        changeValue: formatChange(abs),
        rank: Number.isFinite(r.rankNum) ? r.rankNum : null,
      };
    };

    const sortedByRank = [...withNums].sort((a, b) => a.rankNum - b.rankNum);
    const balanced = sortedByRank.slice(0, 13).map((r) => mapRow(r, false));

    const by24 = withNums
      .filter((r) => r.change24 != null)
      .sort((a, b) => (b.change24 ?? 0) - (a.change24 ?? 0));
    const fomo = by24.slice(0, 13).map((r) => mapRow(r, false));

    const by1h = withNums
      .filter((r) => r.change1h != null)
      .sort((a, b) => (b.change1h ?? 0) - (a.change1h ?? 0));
    const yoink = by1h.slice(0, 13).map((r) => mapRow(r, true));

    return {
      balanced: balanced.length ? balanced : mockData.balanced,
      fomo: fomo.length ? fomo : mockData.fomo,
      yoink: yoink.length ? yoink : mockData.yoink,
    };
  }, [mockData]);

  const loadHighlights = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('coin_latest_view')
        .select('coin_id, symbol, name, price_usd, change_24h_pct, change_1h_pct, volume_24h_usd, rank')
        .order('rank', { ascending: true })
        .limit(120);

      if (error) {
        console.warn('[highlights] Failed to load coins from Supabase', error.message);
        setLiveHighlights(null);
        return;
      }

      setLiveHighlights(buildHighlightRows(data ?? []));
    } catch (err: any) {
      console.warn('[highlights] Unexpected error loading coins', err?.message ?? err);
      setLiveHighlights(null);
    }
  }, [buildHighlightRows]);

  useEffect(() => {
    loadHighlights();
  }, [loadHighlights]);

  const baseData = liveHighlights ?? mockData;
  const current = baseData[tab];
  const onRefresh = () => {
    setRefreshing(true);
    loadHighlights().finally(() => setRefreshing(false));
  };

  const formatDollarMove = (value: string) => {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return '--';
    const abs = Math.abs(parsed).toLocaleString(undefined, { maximumFractionDigits: absFractionDigits(Math.abs(parsed)) });
    return `${parsed >= 0 ? '+' : '-'}$${abs}`;
  };

  const absFractionDigits = (value: number) => {
    if (value >= 1000) return 0;
    if (value >= 1) return 2;
    return 4;
  };

  return (
    <SafeAreaView edges={["top","left","right"]} style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Scrollable content with sticky Markets header */}
      <Animated.ScrollView
        contentContainerStyle={styles.listContainer}
        stickyHeaderIndices={[1, 7, 9]}
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
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* 1st header: AI Highlights (fade out early, small translate) */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: scrollY.interpolate({ inputRange: [0, 140], outputRange: [1, 0], extrapolate: 'clamp' }),
              transform: [
                { translateY: scrollY.interpolate({ inputRange: [0, 140], outputRange: [0, -12], extrapolate: 'clamp' }) }
              ]
            }
          ]}
        >
          <ThemedText type="title" style={{ color: colors.text, fontSize: 22 }}>{t('AIHighlights')}</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>{t('AISubtitle')}</ThemedText>
        </Animated.View>
        {/* 2nd header (STICKY): Segments + Stats */}
        <View style={[styles.stickyBlock, { backgroundColor: colors.background }]}> 
          {/* Segment buttons */}
          <View style={styles.segmentRow}>
            <SegmentButton label={t('FOMO')} active={tab === 'fomo'} onPress={() => setTab('fomo')} colors={colors} isFomo />
            <SegmentButton label={t('Balanced')} active={tab === 'balanced'} onPress={() => setTab('balanced')} colors={colors} isBalanced />
            <SegmentButton label={t('Yoink')} active={tab === 'yoink'} onPress={() => setTab('yoink')} colors={colors} isYoink />
          </View>

          {/* Stats row */}
          <View
            style={[
              styles.statsPreview,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
          {tab === 'fomo' && (() => {
            const faller = baseData.fomo.find(s => parseFloat(s.change) < 0);
            return (
              <View style={styles.statsContent}>
                <View style={styles.statItem}>
                  <ThemedText style={{ color: colors.textTertiary, fontSize: 10, textTransform: 'uppercase' }}>🔥 {t('Hottest')}</ThemedText>
                  <ThemedText style={{ color: colors.success, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
                    {baseData.fomo[0].symbol} +{baseData.fomo[0].change}%
                  </ThemedText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <ThemedText style={{ color: colors.textTertiary, fontSize: 10, textTransform: 'uppercase' }}>⚠️ {t('Risk')}</ThemedText>
                  <ThemedText style={{ color: '#FF5722', fontSize: 13, fontWeight: '700', marginTop: 2 }}>{t('HIGH')}</ThemedText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <ThemedText style={{ color: colors.textTertiary, fontSize: 10, textTransform: 'uppercase' }}>📉 {t('Falling')}</ThemedText>
                  <ThemedText style={{ color: colors.danger, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
                    {faller ? `${faller.symbol} ${faller.change}%` : t('None')}
                  </ThemedText>
                </View>
              </View>
            );
          })()}
          {tab === 'balanced' && (
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <ThemedText style={{ color: colors.textTertiary, fontSize: 10, textTransform: 'uppercase' }}>✨ {t('TopPick')}</ThemedText>
                <ThemedText style={{ color: colors.success, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
                  {baseData.balanced[0].symbol} +{baseData.balanced[0].change}%
                </ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <ThemedText style={{ color: colors.textTertiary, fontSize: 10, textTransform: 'uppercase' }}>🛡️ {t('Risk')}</ThemedText>
                <ThemedText style={{ color: '#4CAF50', fontSize: 13, fontWeight: '700', marginTop: 2 }}>{t('LOW')}</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <ThemedText style={{ color: colors.textTertiary, fontSize: 10, textTransform: 'uppercase' }}>📊 {t('Stable')}</ThemedText>
                <ThemedText style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 2 }}>{baseData.balanced.length} {t('Picks')}</ThemedText>
              </View>
            </View>
          )}
          {tab === 'yoink' && (() => {
            const topGainer = baseData.yoink.reduce((max, stock) => parseFloat(stock.change) > parseFloat(max.change) ? stock : max, baseData.yoink[0]);
            const topLoser = baseData.yoink.reduce((min, stock) => parseFloat(stock.change) < parseFloat(min.change) ? stock : min, baseData.yoink[0]);
            return (
              <View style={styles.statsContent}>
                <View style={styles.statItem}>
                  <ThemedText style={{ color: colors.textTertiary, fontSize: 10, textTransform: 'uppercase' }}>🚀 {t('Moonshot')}</ThemedText>
                  <ThemedText style={{ color: colors.success, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
                    {topGainer.symbol} +{topGainer.change}%
                  </ThemedText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <ThemedText style={{ color: colors.textTertiary, fontSize: 10, textTransform: 'uppercase' }}>⚡ {t('Risk')}</ThemedText>
                  <ThemedText style={{ color: '#F44336', fontSize: 13, fontWeight: '700', marginTop: 2 }}>{t('EXTREME')}</ThemedText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <ThemedText style={{ color: colors.textTertiary, fontSize: 10, textTransform: 'uppercase' }}>💥 {t('Crashing')}</ThemedText>
                  <ThemedText style={{ color: colors.danger, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
                    {topLoser.symbol} {topLoser.change}%
                  </ThemedText>
                </View>
              </View>
            );
          })()}
        </View>

        </View>

        {/* First 5 stocks as direct children (so sticky block releases after them) */}
        {current.slice(0, 5).map((stock, idx) => {
          return (
            <HomeHighlightRow
              key={`${tab}-${stock.symbol}-first`}
              index={idx + 1}
              stock={stock}
              visible
              chartRange={tab === 'yoink' ? '1H' : '24H'}
              onPress={() => router.push({ pathname: '/coin' as any, params: { symbol: stock.symbol } })}
              formatDollarMove={formatDollarMove}
              colors={colors}
            />
          );
        })}

        {/* Sticky spacer header to release the segments/stats after 5 rows */}
        <View style={styles.releaseStickyHeader} />

        {/* Remaining stocks and unlock overlay */}
        <View style={styles.stocksWrapper}>
          {current.slice(5).map((stock, idx) => {
            const originalIndex = 5 + idx;
            return (
              <HomeHighlightRow
                key={`${tab}-${stock.symbol}-rest`}
                index={originalIndex + 1}
                stock={stock}
                visible
                chartRange={tab === 'yoink' ? '1H' : '24H'}
                onPress={() => router.push({ pathname: '/coin' as any, params: { symbol: stock.symbol } })}
                formatDollarMove={formatDollarMove}
                colors={colors}
              />
            );
          })}
        </View>

        {/* Sticky Markets header (becomes header when reached) */}
        <View style={[marketStyles.stickyHeader, { backgroundColor: colors.background }]}> 
          <ThemedText type="title" style={{ color: colors.text, fontSize: 20 }}>{t('Markets')}</ThemedText>
        </View>
        {/* Markets content below sticky header */}
        <MarketsSection colors={colors} showHeader={false} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
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
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexWrap: 'nowrap',
  },
  statsPreview: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  listContainer: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  stocksWrapper: {
    position: 'relative',
  },
  watchlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  rowBadgeWrap: {
    width: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 8,
  },
  rowBadgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolSection: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTextStack: {
    minWidth: 0,
  },
  chartSection: {
    width: 84,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  priceSection: {
    alignItems: 'flex-end',
    minWidth: 82,
  },
  priceBox: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  changeInfoRow: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  stickyBlock: {
    paddingTop: 0,
    paddingBottom: 8,
  },
  releaseStickyHeader: {
    height: 1,
    opacity: 0,
  },
});

type SegmentProps = { label: string; active?: boolean; onPress?: () => void; colors: any; isYoink?: boolean; isFomo?: boolean; isBalanced?: boolean };

function HomeHighlightRow({
  stock,
  index,
  visible,
  chartRange,
  onPress,
  formatDollarMove,
  colors,
}: {
  stock: {
    coinId?: string;
    symbol: string;
    name: string;
    price: string;
    change: string;
    changeValue: string;
    rank?: number | null;
  };
  index: number;
  visible: boolean;
  chartRange: '1H' | '24H';
  onPress?: () => void;
  formatDollarMove: (value: string) => string;
  colors: any;
}) {
  const isPositive = parseFloat(stock.change) >= 0;
  const changeColor = isPositive ? colors.success : colors.danger;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={!visible}
      onPress={onPress}
      style={[
        styles.watchlistRow,
        { backgroundColor: colors.background, borderBottomColor: colors.border, opacity: visible ? 1 : 0.58 },
      ]}>
      <View style={styles.rowBadgeWrap}>
        <View style={[styles.rowBadgeCircle, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
            {String(index).padStart(2, '0')}
          </ThemedText>
        </View>
      </View>

      <View style={styles.symbolSection}>
        <View style={styles.rowTextStack}>
          <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
            {stock.symbol}
          </ThemedText>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }} numberOfLines={1}>
            {stock.name}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.chartSection, !visible && { opacity: 0.3 }]}>
        <CoinSparkline
          coinId={stock.coinId}
          symbol={stock.symbol}
          color={changeColor}
          width={84}
          height={28}
          range={chartRange}
          historyLimit={400}
        />
      </View>

      <View style={styles.priceSection}>
        <View style={[styles.priceBox, { backgroundColor: changeColor }]}>
          <ThemedText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
            ${stock.price}
          </ThemedText>
        </View>
        {visible ? (
          <View style={styles.changeInfoRow}>
            <ThemedText style={{ color: changeColor, fontWeight: '600', fontSize: 10 }}>
              {formatDollarMove(stock.changeValue)}
            </ThemedText>
            <ThemedText style={{ color: changeColor, fontWeight: '600', fontSize: 10 }}>
              {isPositive ? '+' : ''}
              {stock.change}%
            </ThemedText>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function SegmentButton({ label, active, onPress, colors, isYoink, isFomo, isBalanced }: SegmentProps) {
  // Special styling for each button type when not active
  const yoinkInactiveStyle = isYoink && !active ? {
    backgroundColor: 'rgba(244, 67, 54, 0.1)', // Red tint - bold and exciting
    borderColor: '#F44336',
    borderWidth: 2, // Thicker border
  } : {};

  const fomoInactiveStyle = isFomo && !active ? {
    backgroundColor: 'rgba(255, 87, 34, 0.08)', // Burning orange tint
    borderColor: '#FF5722',
    borderWidth: 1.5,
  } : {};

  const balancedInactiveStyle = isBalanced && !active ? {
    backgroundColor: 'rgba(76, 175, 80, 0.06)', // Calm green tint
    borderColor: '#4CAF50',
    borderWidth: 1.5,
  } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        segmentStyles.btn,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primary : colors.border,
        },
        yoinkInactiveStyle,
        fomoInactiveStyle,
        balancedInactiveStyle,
      ]}
    >
      
      
      {/* Emojis for visual vibe */}
      {isFomo && (
        <ThemedText style={{ fontSize: 16 }}>🔥</ThemedText>
      )}
      {isBalanced && (
        <ThemedText style={{ fontSize: 16 }}>✨</ThemedText>
      )}
      {isYoink && (
        <ThemedText style={{ fontSize: 16 }}>🚀</ThemedText>
      )}
      
      <ThemedText
        style={[
          segmentStyles.text,
          { color: active ? colors.primaryText : (isYoink && !active ? '#F44336' : (isFomo && !active ? '#FF5722' : (isBalanced && !active ? '#4CAF50' : colors.text))) },
          (isYoink || isFomo || isBalanced) && !active && { fontWeight: '700' },
          isYoink && !active && { fontSize: 15 }, // Slightly larger for emphasis
        ]}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

const segmentStyles = StyleSheet.create({
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    position: 'relative',
    // No glow/shadow in minimal design
  },
  text: { 
    fontWeight: '600',
    fontSize: 14,
  },
  badgeTopRight: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});

// Markets Section Component
function MarketsSection({ colors, showHeader = true }: { colors: any; showHeader?: boolean }) {
  const { t } = useSettings();
  const [coinsData, setCoinsData] = useState<any[]>([]);

  useEffect(() => {
    let active = true;

    const loadCoins = async () => {
      try {
        const { data, error } = await supabase
          .from('coin_latest_view')
          .select('symbol, name, price_usd, change_24h_pct, rank')
          .order('rank', { ascending: true })
          .limit(30);

        if (!active) return;

        if (error) {
          console.warn('[markets] Failed to load coins from Supabase', error.message);
          setCoinsData([]);
        } else {
          setCoinsData(data ?? []);
        }
      } catch (err: any) {
        if (!active) return;
        console.warn('[markets] Unexpected error loading coins', err?.message ?? err);
        setCoinsData([]);
      }
    };

    loadCoins();

    return () => {
      active = false;
    };
  }, []);

  const categories = [
    { id: 'coins', title: t('Coins'), icon: 'bitcoinsign.circle' },
  ];

  const marketData: Record<string, any[]> = {
    coins: [
      { name: 'Bitcoin', value: '42,450', change: '+2.4%', positive: true },
      { name: 'Ethereum', value: '2,245', change: '+1.8%', positive: true },
      { name: 'Solana', value: '102.50', change: '+5.2%', positive: true },
      { name: 'BNB', value: '315.40', change: '+3.1%', positive: true },
      { name: 'XRP', value: '0.625', change: '+1.5%', positive: true },
      { name: 'Cardano', value: '0.485', change: '-2.3%', positive: false },
      { name: 'Avalanche', value: '36.25', change: '+4.2%', positive: true },
      { name: 'Dogecoin', value: '0.142', change: '+3.8%', positive: true },
    ],
  };

  return (
    <View style={[marketStyles.container, { backgroundColor: colors.background }]}> 
      {showHeader && (
        <View style={marketStyles.header}>
          <ThemedText type="title" style={{ color: colors.text, fontSize: 20 }}>{t('Markets')}</ThemedText>
        </View>
      )}
      {categories.map((category) => {
        const baseItems = marketData[category.id];
        const items =
          category.id === 'coins' && coinsData.length > 0
            ? coinsData.map((row) => {
                const price = row.price_usd != null ? Number(row.price_usd) : null;
                const change = row.change_24h_pct != null ? Number(row.change_24h_pct) : null;
                const isPositive = change == null ? true : change >= 0;
                return {
                  symbol: row.symbol,
                  name: row.name ?? row.symbol,
                  value:
                    price != null
                      ? price.toLocaleString(undefined, { maximumFractionDigits: 6 })
                      : '-',
                  change:
                    change != null
                      ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
                      : '--',
                  positive: isPositive,
                };
              })
            : baseItems;

        return (
          <View key={category.id} style={marketStyles.categorySection}>
            <TouchableOpacity 
              style={marketStyles.categoryHeader}
              onPress={() => router.push({ pathname: '../markets/markets', params: { category: category.id } })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <IconSymbol name={category.icon as any} size={18} color={colors.primary} />
                <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 16 }}>
                  {category.title}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={marketStyles.itemsScroll}>
              {items.map((item, idx) => {
                const isPositive = item.positive;
                const changeColor = isPositive ? colors.success : colors.danger;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[marketStyles.marketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => item.symbol && router.push({ pathname: '/coin' as any, params: { symbol: item.symbol } })}
                  > 
                    <ThemedText style={{ color: colors.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                      {item.name}
                    </ThemedText>
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      {item.value}
                    </ThemedText>
                    <ThemedText style={{ color: changeColor, fontSize: 12, fontWeight: '600', marginTop: 4 }}>
                      {item.change}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        );
      })}
    </View>
  );
}

const marketStyles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingBottom: 20,
  },
  stickyHeader: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  itemsScroll: {
    paddingLeft: 20,
  },
  marketCard: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 10,
  },
  chartPlaceholder: {
    marginVertical: 8,
    alignItems: 'center',
  },
});
