import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SavedScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  const [isEditMode, setIsEditMode] = useState(false);
  const [watchlistOrder, setWatchlistOrder] = useState([1, 2, 3, 4, 5]); // TODO: Load from server user settings
  
  const watchlists = [
    { 
      id: 1, 
      name: 'Blue-Chip Crypto', 
      count: 8, 
      change: '+12.4%', 
      positive: true, 
      lastUpdated: '5m ago',
      stocks: [
        { symbol: 'BTC', change: '+2.1%', positive: true },
        { symbol: 'ETH', change: '+1.8%', positive: true },
        { symbol: 'SOL', change: '+5.2%', positive: true },
        { symbol: 'BNB', change: '+3.1%', positive: true },
        { symbol: 'XRP', change: '+1.5%', positive: true },
        { symbol: 'ADA', change: '+2.3%', positive: true },
        { symbol: 'AVAX', change: '+4.1%', positive: true },
        { symbol: 'DOGE', change: '+3.8%', positive: true },
      ]
    },
    { 
      id: 2, 
      name: 'Meme Coins', 
      count: 15, 
      change: '+18.2%', 
      positive: true, 
      lastUpdated: '1h ago',
      stocks: [
        { symbol: 'PEPE', change: '+24.4%', positive: true },
        { symbol: 'WIF', change: '+18.7%', positive: true },
        { symbol: 'BONK', change: '+15.2%', positive: true },
        { symbol: 'FLOKI', change: '+16.3%', positive: true },
        { symbol: 'SHIB', change: '+9.1%', positive: true },
        { symbol: 'MOG', change: '+7.8%', positive: true },
        { symbol: 'DEGEN', change: '+14.5%', positive: true },
        { symbol: 'TURBO', change: '+11.2%', positive: true },
        { symbol: 'DOG', change: '+8.9%', positive: true },
        { symbol: 'PONKE', change: '+6.7%', positive: true },
        { symbol: 'BOME', change: '+5.6%', positive: true },
        { symbol: 'BRETT', change: '+4.8%', positive: true },
        { symbol: 'MILO', change: '+6.3%', positive: true },
        { symbol: 'AIDOGE', change: '+8.3%', positive: true },
        { symbol: 'DOGE2', change: '-3.4%', positive: false },
      ]
    },
    { 
      id: 3, 
      name: 'DeFi Blue Chips', 
      count: 6, 
      change: '+9.1%', 
      positive: true, 
      lastUpdated: '30m ago',
      stocks: [
        { symbol: 'AAVE', change: '+5.4%', positive: true },
        { symbol: 'UNI', change: '+4.2%', positive: true },
        { symbol: 'CRV', change: '-1.3%', positive: false },
        { symbol: 'LDO', change: '+3.6%', positive: true },
        { symbol: 'PENDLE', change: '+8.1%', positive: true },
        { symbol: 'SNX', change: '+2.8%', positive: true },
      ]
    },
    { 
      id: 4, 
      name: 'AI & Infra', 
      count: 12, 
      change: '+15.7%', 
      positive: true, 
      lastUpdated: '2h ago',
      stocks: [
        { symbol: 'PYTH', change: '+18.7%', positive: true },
        { symbol: 'RNDR', change: '+12.4%', positive: true },
        { symbol: 'GRT', change: '+21.3%', positive: true },
        { symbol: 'LINK', change: '+8.9%', positive: true },
        { symbol: 'TIA', change: '+11.2%', positive: true },
        { symbol: 'SEI', change: '+14.5%', positive: true },
        { symbol: 'APT', change: '+9.8%', positive: true },
        { symbol: 'SUI', change: '+6.3%', positive: true },
        { symbol: 'ARB', change: '+7.1%', positive: true },
        { symbol: 'OP', change: '+10.4%', positive: true },
        { symbol: 'INJ', change: '+15.6%', positive: true },
        { symbol: 'JUP', change: '+13.2%', positive: true },
      ]
    },
    { 
      id: 5, 
      name: 'Stablecoins & Yield', 
      count: 6, 
      change: '+2.1%', 
      positive: true, 
      lastUpdated: '1d ago',
      stocks: [
        { symbol: 'USDT', change: '+0.0%', positive: true },
        { symbol: 'USDC', change: '+0.0%', positive: true },
        { symbol: 'DAI', change: '+0.0%', positive: true },
        { symbol: 'FRAX', change: '+0.1%', positive: true },
        { symbol: 'LUSD', change: '+0.0%', positive: true },
        { symbol: 'USDY', change: '+0.2%', positive: true },
      ]
    },
  ];
  
  const recentCoins = [
    { symbol: 'BTC', name: 'Bitcoin', change: '+3.2%', positive: true, price: '$64,320' },
    { symbol: 'ETH', name: 'Ethereum', change: '+1.7%', positive: true, price: '$2,430' },
    { symbol: 'SOL', name: 'Solana', change: '+6.5%', positive: true, price: '$102.50' },
    { symbol: 'PEPE', name: 'Pepe', change: '+18.4%', positive: true, price: '$0.000012' },
    { symbol: 'DOGE', name: 'Dogecoin', change: '-2.3%', positive: false, price: '$0.14' },
  ];

  const savedPosts = [
    { id: 1, title: t('SavedPost1'), author: 'TechTrader', time: '2h ago' },
    { id: 2, title: t('SavedPost2'), author: 'StockGuru', time: '1d ago' },
    { id: 3, title: t('SavedPost3'), author: 'CryptoWhale', time: '3d ago' },
  ];
  
  return (
    <SafeAreaView edges={["top","left","right"]} style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.header}>
        <ThemedText type="title" style={{ color: colors.text }}>{t('SavedHeader')}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}> 
          {t('SavedSubtitle')}
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="never">
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{t('Watchlists')}</ThemedText>
            <ThemedText style={{ color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 4 }}>{watchlists.length}</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{t('Stocks')}</ThemedText>
            <ThemedText style={{ color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 4 }}>
              {watchlists.reduce((sum, list) => sum + list.count, 0)}
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{t('Posts')}</ThemedText>
            <ThemedText style={{ color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 4 }}>{savedPosts.length}</ThemedText>
          </View>
        </View>

        {/* Watchlists */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}> 
              📊 {t('Watchlists')}
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)}>
                <ThemedText style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                  {isEditMode ? t('Done') : t('Edit')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity>
                <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          {/* TODO: Users can choose order, easily control and move. Will be saved to server user settings */}
          {watchlistOrder.map((orderId) => {
            const list = watchlists.find(w => w.id === orderId);
            if (!list) return null;
            return (
            <View key={list.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity>
                <View style={styles.cardRow}>
                  {isEditMode && (
                    <TouchableOpacity 
                      style={styles.dragHandle}
                      onPress={() => {
                        // TODO: Implement drag-and-drop or up/down arrows for reordering
                        // When implemented, save new order to server: POST /api/user/settings/watchlist-order
                      }}
                    >
                      <IconSymbol name="line.3.horizontal" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                  )}
                  <View style={styles.cardLeft}>
                    <IconSymbol name="list.bullet.rectangle" size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="defaultSemiBold" style={{ color: colors.text }} numberOfLines={1} ellipsizeMode="tail">
                        {list.name}
                      </ThemedText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1} ellipsizeMode="tail">
                          {list.count} {t('Stocks')}
                        </ThemedText>
                        <ThemedText style={{ color: colors.textTertiary, fontSize: 11 }} numberOfLines={1} ellipsizeMode="tail">
                          • {list.lastUpdated}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <ThemedText style={{ color: list.positive ? colors.success : colors.danger, fontWeight: '700', fontSize: 16 }} numberOfLines={1} ellipsizeMode="tail">
                      {list.change}
                    </ThemedText>
                    <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
                  </View>
                </View>
              </TouchableOpacity>
              
              {/* Stocks in this watchlist - Infinite swiping right to left until last content */}
              <View style={[styles.stocksContainer, { borderTopColor: colors.border }]}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={71}
                  snapToAlignment="start"
                  contentContainerStyle={{ paddingRight: 20 }}
                >
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {list.stocks.map((stock, idx) => (
                      <TouchableOpacity key={idx} style={[styles.miniStockCard, { backgroundColor: colors.surfaceElevated }]}>
                        <ThemedText style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>
                          {stock.symbol}
                        </ThemedText>
                        <ThemedText style={{ color: stock.positive ? colors.success : colors.danger, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                          {stock.change}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )})}
        </View>

        {/* Saved Posts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}> 
              🔖 {t('SavedPosts')}
            </ThemedText>
          </View>
          {savedPosts.map((post) => (
            <TouchableOpacity key={post.id} style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <ThemedText style={{ color: colors.text, fontSize: 15, fontWeight: '600' }} numberOfLines={1} ellipsizeMode="tail">
                  {post.title}
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1} ellipsizeMode="tail">
                    {post.author}
                  </ThemedText>
                  <ThemedText style={{ color: colors.textTertiary, fontSize: 11 }} numberOfLines={1} ellipsizeMode="tail">
                    • {post.time}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Stocks */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}> 
            ⏱️ {t('RecentlyViewed')}
          </ThemedText>
          {recentCoins.map((stock) => (
            <TouchableOpacity key={stock.symbol} style={[styles.stockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.stockLeft}>
                <View style={[styles.symbolBadge, { backgroundColor: colors.surfaceElevated }]}>
                  <ThemedText style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
                    {stock.symbol}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultSemiBold" style={{ color: colors.text }} numberOfLines={1} ellipsizeMode="tail">
                    {stock.symbol}
                  </ThemedText>
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1} ellipsizeMode="tail">
                    {stock.name}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.recentRight}>
                <ThemedText style={{ color: colors.text, fontWeight: '600', fontSize: 15 }} numberOfLines={1} ellipsizeMode="tail">
                  {stock.price}
                </ThemedText>
                <ThemedText style={{ color: stock.positive ? colors.success : colors.danger, fontWeight: '700', fontSize: 13, marginTop: 2 }} numberOfLines={1} ellipsizeMode="tail">
                  {stock.change}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  content: {
    padding: 20,
    gap: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    marginBottom: 0,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stocksContainer: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  miniStockCard: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 65,
  },
  dragHandle: {
    paddingRight: 8,
    justifyContent: 'center',
  },
  stockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  postCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  recentRight: {
    alignItems: 'flex-end',
    maxWidth: 100,
    flexShrink: 0,
  },
  stockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  symbolBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
