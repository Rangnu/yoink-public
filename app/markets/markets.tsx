import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mini Chart Component
function MiniChart({ isPositive, color }: { isPositive: boolean; color: string }) {
  return (
    <View style={{ width: 50, height: 24 }}>
      <View style={{ 
        width: '100%', 
        height: '100%', 
        borderBottomWidth: 2, 
        borderBottomColor: color,
        borderRightWidth: 2,
        borderRightColor: color,
        opacity: 0.6,
        transform: isPositive ? [{ scaleY: -1 }] : []
      }} />
    </View>
  );
}

type CategoryType = 'indices' | 'commodities' | 'futures' | 'currencies' | 'coins' | 'bonds';

export default function MarketsScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  const params = useLocalSearchParams<{ category?: string }>();
  const [activeCategory, setActiveCategory] = useState<CategoryType>((params.category as CategoryType) || 'indices');
  const scrollViewRef = useRef<ScrollView>(null);

  const categories = [
    { id: 'indices' as CategoryType, title: t('Indices') },
    { id: 'commodities' as CategoryType, title: t('Commodities') },
    { id: 'futures' as CategoryType, title: t('Futures') },
    { id: 'currencies' as CategoryType, title: t('Currencies') },
    { id: 'coins' as CategoryType, title: t('Coins') },
    { id: 'bonds' as CategoryType, title: t('Bonds') },
  ];

  const marketData: Record<CategoryType, any[]> = {
    indices: [
      { name: 'S&P 500', value: '4,783.45', change: '+1.2%', positive: true },
      { name: 'Dow Jones', value: '37,545.33', change: '+0.8%', positive: true },
      { name: 'NASDAQ', value: '14,843.77', change: '-0.3%', positive: false },
      { name: 'Russell 2000', value: '2,043.12', change: '+0.5%', positive: true },
      { name: 'FTSE 100', value: '7,512.45', change: '+0.2%', positive: true },
      { name: 'DAX', value: '16,754.32', change: '+0.6%', positive: true },
      { name: 'Nikkei 225', value: '33,464.17', change: '+1.1%', positive: true },
      { name: 'Hang Seng', value: '16,334.87', change: '-0.4%', positive: false },
    ],
    commodities: [
      { name: 'Gold', value: '2,043.50', change: '+0.5%', positive: true },
      { name: 'Silver', value: '23.14', change: '-0.2%', positive: false },
      { name: 'Crude Oil', value: '73.25', change: '+1.8%', positive: true },
      { name: 'Natural Gas', value: '2.54', change: '-1.2%', positive: false },
      { name: 'Copper', value: '3.85', change: '+0.3%', positive: true },
      { name: 'Platinum', value: '915.40', change: '+0.7%', positive: true },
    ],
    futures: [
      { name: 'E-mini S&P', value: '4,785.00', change: '+0.9%', positive: true },
      { name: 'E-mini Nasdaq', value: '16,432.50', change: '+1.1%', positive: true },
      { name: 'Crude Oil', value: '73.50', change: '+0.4%', positive: true },
      { name: 'Gold', value: '2,045.20', change: '+0.6%', positive: true },
      { name: 'Corn', value: '475.25', change: '-0.8%', positive: false },
      { name: 'Soybeans', value: '1,245.50', change: '+0.2%', positive: true },
    ],
    currencies: [
      { name: 'EUR/USD', value: '1.0845', change: '-0.1%', positive: false },
      { name: 'GBP/USD', value: '1.2654', change: '+0.3%', positive: true },
      { name: 'USD/JPY', value: '148.25', change: '+0.6%', positive: true },
      { name: 'AUD/USD', value: '0.6543', change: '+0.2%', positive: true },
      { name: 'USD/CAD', value: '1.3654', change: '-0.1%', positive: false },
      { name: 'USD/CHF', value: '0.8754', change: '+0.4%', positive: true },
    ],
    coins: [
      { name: 'Bitcoin', value: '42,450', change: '+2.4%', positive: true },
      { name: 'Ethereum', value: '2,245', change: '+1.8%', positive: true },
      { name: 'Solana', value: '102.50', change: '+5.2%', positive: true },
      { name: 'BNB', value: '315.40', change: '+3.1%', positive: true },
      { name: 'XRP', value: '0.625', change: '+1.5%', positive: true },
      { name: 'Cardano', value: '0.485', change: '-2.3%', positive: false },
      { name: 'Avalanche', value: '36.25', change: '+4.2%', positive: true },
      { name: 'Polygon', value: '0.825', change: '+2.8%', positive: true },
    ],
    bonds: [
      { name: 'US 10Y', value: '4.125%', change: '+0.02%', positive: true },
      { name: 'US 30Y', value: '4.325%', change: '+0.01%', positive: true },
      { name: 'US 2Y', value: '4.485%', change: '-0.03%', positive: false },
      { name: 'US 5Y', value: '4.245%', change: '+0.01%', positive: true },
      { name: 'Germany 10Y', value: '2.185%', change: '+0.02%', positive: true },
      { name: 'UK 10Y', value: '3.925%', change: '-0.01%', positive: false },
    ],
  };

  const currentData = marketData[activeCategory];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={{ color: colors.text }}>{t('Markets')}</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {/* Horizontal Scrollable Segment */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.segmentScroll}
        contentContainerStyle={styles.segmentContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => setActiveCategory(category.id)}
            style={[
              styles.segmentBtn,
              {
                backgroundColor: activeCategory === category.id ? colors.primary : colors.surface,
                borderColor: activeCategory === category.id ? colors.primary : colors.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.segmentText,
                { color: activeCategory === category.id ? colors.primaryText : colors.text },
              ]}
            >
              {category.title}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Market Items List */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {currentData.map((item, idx) => {
          const isPositive = item.positive;
          const changeColor = isPositive ? colors.success : colors.danger;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.marketRow,
                { backgroundColor: colors.background, borderBottomColor: colors.border },
              ]}
            >
              {/* Left: Name */}
              <View style={styles.nameSection}>
                <ThemedText style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>
                  {item.name}
                </ThemedText>
              </View>

              {/* Center: Mini Chart */}
              <View style={styles.chartSection}>
                <MiniChart isPositive={isPositive} color={changeColor} />
              </View>

              {/* Right: Value & Change */}
              <View style={styles.valueSection}>
                <ThemedText style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>
                  {item.value}
                </ThemedText>
                <ThemedText style={{ color: changeColor, fontWeight: '700', fontSize: 13, marginTop: 2 }}>
                  {item.change}
                </ThemedText>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  segmentScroll: {
    maxHeight: 56,
    marginBottom: 12,
  },
  segmentContent: {
    paddingHorizontal: 20,
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
  segmentText: {
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  nameSection: {
    flex: 1,
    justifyContent: 'center',
  },
  chartSection: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  valueSection: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
});
