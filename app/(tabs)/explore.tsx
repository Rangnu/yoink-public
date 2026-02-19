import { ThemedText } from '@/components/themed-text';
import { BitcoinIcon } from '@/components/ui/bitcoin-icon';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  const [refreshing, setRefreshing] = useState(false);
  const [stocksTab, setStocksTab] = useState<'volume' | 'trades' | 'gainers' | 'losers' | 'popular'>('volume');
  const [coinsData, setCoinsData] = useState<any[]>([]);

  const loadCoins = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('coin_latest_view')
        .select('symbol, name, price_usd, change_24h_pct, volume_24h_usd, rank')
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

  const posts = [
    { id: 1, user: 'OnchainHunter', time: '2h ago', title: 'SOL breakout on heavy volume 🚀', content: 'Solana just broke key resistance with huge on-chain volume. Funding flipping positive across majors.', likes: 124, comments: 32, ticker: 'SOL', verified: true },
    { id: 2, user: 'DeFiNerd', time: '4h ago', title: 'DeFi rotation into ETH L2s', content: 'Seeing TVL and volume rotate from mainnet into ARB/OP. Watch bridging flows and new farm launches.', likes: 89, comments: 18, ticker: 'ARB', verified: true },
    { id: 3, user: 'MemeKing', time: '6h ago', title: 'PEPE volume spike incoming', content: 'On-chain DEX volume up 300% in the last hour. Meme season might not be over yet.', likes: 256, comments: 67, ticker: 'PEPE', verified: false },
    { id: 4, user: 'DiamondHands', time: '8h ago', title: 'Why I\'m still stacking BTC', content: 'ETF inflows + halving narrative still strong. I\'m DCA-ing every dip into BTC + a few blue-chip alts.', likes: 178, comments: 45, ticker: 'BTC', verified: false },
    { id: 5, user: 'CryptoWhale', time: '10h ago', title: 'Altcoin rotation watchlist', content: 'Meme and AI coins rotating fast. Keep an eye on WIF, FLOKI, and PYTH for continuation setups.', likes: 142, comments: 28, ticker: 'WIF', verified: true },
  ];

  const stockLists = useMemo(() => {
    if (!coinsData.length) {
      return {
        volume: [
          { s: 'BTC', p: '$64,320', c: '+2.1%' },
          { s: 'ETH', p: '$2,430', c: '+1.4%' },
          { s: 'USDT', p: '$1.00', c: '+0.0%' },
          { s: 'SOL', p: '$102.50', c: '+5.2%' },
          { s: 'BNB', p: '$315.40', c: '+3.1%' },
          { s: 'XRP', p: '$0.62', c: '+1.5%' },
          { s: 'DOGE', p: '$0.14', c: '+3.8%' },
          { s: 'TON', p: '$7.24', c: '+2.9%' },
          { s: 'LINK', p: '$18.42', c: '+1.3%' },
          { s: 'PEPE', p: '$0.000012', c: '+16.4%' },
        ],
        trades: [],
        gainers: [],
        losers: [],
        popular: [],
      } as const;
    }

    const rows = coinsData.map((r) => ({
      ...r,
      priceNum: r.price_usd != null ? Number(r.price_usd) : null,
      changeNum: r.change_24h_pct != null ? Number(r.change_24h_pct) : null,
      vol24: r.volume_24h_usd != null ? Number(r.volume_24h_usd) : 0,
      rankNum: r.rank != null ? Number(r.rank) : Infinity,
    }));

    const mapRow = (r: any) => ({
      s: r.symbol?.toUpperCase?.() ?? '',
      p: formatPrice(r.priceNum),
      c: formatChange(r.changeNum),
    });

    const volume = [...rows]
      .sort((a, b) => (b.vol24 ?? 0) - (a.vol24 ?? 0))
      .slice(0, 10)
      .map(mapRow);

    const gainers = [...rows]
      .filter((r) => (r.changeNum ?? 0) > 0)
      .sort((a, b) => (b.changeNum ?? 0) - (a.changeNum ?? 0))
      .slice(0, 10)
      .map(mapRow);

    const losers = [...rows]
      .filter((r) => (r.changeNum ?? 0) < 0)
      .sort((a, b) => (a.changeNum ?? 0) - (b.changeNum ?? 0))
      .slice(0, 10)
      .map(mapRow);

    const popular = [...rows]
      .sort((a, b) => a.rankNum - b.rankNum)
      .slice(0, 10)
      .map(mapRow);

    // For now, use volume as a proxy for trades list.
    const trades = volume;

    return { volume, trades, gainers, losers, popular };
  }, [coinsData]);

  const upcomingReports = [
    { s: 'BTC', when: 'Next halving window' },
    { s: 'ETH', when: 'Protocol upgrade this week' },
    { s: 'SOL', when: 'Major network event soon' },
  ];

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
              setTimeout(() => setRefreshing(false), 900);
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
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border }} />
          {stockLists[stocksTab].map((row, i) => (
            <View key={row.s} style={[styles.plainRow, { borderBottomColor: colors.border, borderBottomWidth: i===stockLists[stocksTab].length-1 ? 0 : 1 }]}> 
              <ThemedText style={{ color: colors.text, width: 22, textAlign: 'right', marginRight: 6 }}>{i+1}</ThemedText>
              <ThemedText style={{ color: colors.text, width: 72 }}>{row.s}</ThemedText>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Sparkline colors={colors} negative={row.c.startsWith('-')} />
              </View>
              <ThemedText style={{ color: colors.textSecondary, width: 80, textAlign: 'right', marginRight: 10 }}>{row.p}</ThemedText>
              <ThemedText style={{ color: row.c.startsWith('-') ? colors.danger : colors.success, fontWeight: '700', width: 70, textAlign: 'right' }}>{row.c}</ThemedText>
              <TouchableOpacity accessibilityLabel="Save" style={{ padding: 6, marginLeft: 8 }}>
                <IconSymbol name="bookmark.fill" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity 
            onPress={() => router.push({ pathname: '/explore/top100' as any, params: { tab: stocksTab } })}
            style={[styles.moreBtn, { borderColor: colors.border }]}
          > 
            <IconSymbol name="chevron.down" size={16} color={colors.textSecondary} />
            <ThemedText style={{ color: colors.textSecondary, fontWeight: '700' }}>{t('More')}</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>{t('UpcomingReports')}</ThemedText>
          </View>
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {upcomingReports.map((r, i) => (
              <View key={r.s} style={[styles.listRow, { borderBottomColor: colors.border, borderBottomWidth: i===upcomingReports.length-1 ? 0 : 1 }]}> 
                <ThemedText style={{ color: colors.text, flex: 1 }}>{r.s}</ThemedText>
                <ThemedText style={{ color: colors.textSecondary }}>{r.when}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>{t('HotCommunityPosts')}</ThemedText>
          </View>
          {posts.map((post) => (
            <View
              key={post.id}
              style={[
                styles.postCard,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  shadowColor: '#000',
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 2,
                },
              ]}
            > 
              <View style={styles.postHeader}>
                <View style={styles.postUser}>
                  <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]}> 
                    <IconSymbol name="person.fill" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>{post.user}</ThemedText>
                      {post.verified && (
                        <IconSymbol name="checkmark.seal.fill" size={14} color={colors.primary} />
                      )}
                    </View>
                    <ThemedText style={{ color: colors.textTertiary, fontSize: 12 }}>{post.time}</ThemedText>
                  </View>
                </View>
                <TouchableOpacity style={{ padding: 6 }}>
                  <IconSymbol name="ellipsis" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <ThemedText type="defaultSemiBold" style={{ color: colors.text, marginTop: 12, fontSize: 16 }}>{post.title}</ThemedText>
              {post.ticker && (
                <View style={[styles.tickerBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
                  <ThemedText style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>${post.ticker}</ThemedText>
                </View>
              )}
              <ThemedText style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 20 }} numberOfLines={3}>{post.content}</ThemedText>

              <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionItem}>
                  <IconSymbol name="heart" size={18} color={colors.textTertiary} />
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>{post.likes}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem}>
                  <IconSymbol name="bubble.left" size={18} color={colors.textTertiary} />
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>{post.comments}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem}>
                  <IconSymbol name="arrow.2.squarepath" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem}>
                  <IconSymbol name="square.and.arrow.up" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
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

function MiniTab({ colors, label, active, onPress }: { colors: any; label: string; active?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.miniTab, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}> 
      <ThemedText style={{ color: active ? colors.primaryText : colors.text, fontSize: 12, fontWeight: '700' }}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

function Sparkline({ colors, negative }: { colors: any; negative?: boolean }) {
  // Simple fixed mock data for sparkline visual
  const data = [8, 12, 6, 14, 10, 16, 9, 13, 7, 15];
  const barColor = negative ? colors.danger : colors.success;
  return (
    <View style={styles.sparkContainer}>
      {data.map((h, i) => (
        <View key={i} style={[styles.sparkBar, { height: 6 + h, backgroundColor: barColor }]} />
      ))}
    </View>
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
  listCard: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 12 },
  plainRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  moreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 12, alignSelf: 'center' },
  postCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postActions: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sparkContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 24 },
  sparkBar: { width: 3, borderRadius: 2 },
});
