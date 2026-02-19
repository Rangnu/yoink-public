import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-context';
import { useSettings } from '@/contexts/settings-context';

export default function Top100Screen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  const params = useLocalSearchParams<{ tab?: string }>();

  const [category, setCategory] = useState<'all' | 'domestic' | 'overseas'>('all');
  const [range, setRange] = useState<'realtime' | '1d' | '1w' | '1m' | '3m' | '6m'>('realtime');
  const [titleFilter, setTitleFilter] = useState<'trading-volume' | 'trading-value' | 'popular' | 'rapid-increase' | 'falling-down'>(
    (params.tab === 'trades' ? 'trading-volume' :
     params.tab === 'popular' ? 'popular' :
     params.tab === 'gainers' ? 'rapid-increase' :
     params.tab === 'losers' ? 'falling-down' : 'trading-volume') as any
  );
  const [timestamp, setTimestamp] = useState(new Date());
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTimestamp(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const stocks = useMemo(() => (
    Array.from({ length: 20 }).map((_, i) => ({
      rank: i + 1,
      name: i % 3 === 0 ? 'Beyond Meat' : i % 3 === 1 ? 'RGTZ' : 'MARA',
      flag: '🇺🇸',
      price: `$${(Math.random() * 500 + 5).toFixed(2)}`,
      pct: (Math.random() * 12 * (Math.random() > 0.5 ? 1 : -1)),
    }))
  ), [category, range, titleFilter]);

  const titleText = (() => {
    switch (titleFilter) {
      case 'trading-volume': return t('Top100ByTradingVolume');
      case 'trading-value': return t('Top100ByTradingValue');
      case 'popular': return t('Top100ByPopular');
      case 'rapid-increase': return t('Top100RapidIncreasing');
      case 'falling-down': return t('Top100FallingDown');
    }
  })();

  return (
    <SafeAreaView edges={["top","left","right"]} style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <IconSymbol name="chevron.left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.headerBtn}>
          <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>{t('Info')}</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 }]}> 
        {/* Title + selector */}
        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.titleBtn} onPress={() => setSelectorOpen(true)}>
            <ThemedText type="title" style={{ color: colors.text, fontSize: 20 }}>{titleText}</ThemedText>
            <IconSymbol name="chevron.down" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Timestamp */}
        <ThemedText style={{ color: colors.textTertiary, fontSize: 12, marginTop: 6 }}>{t('AsOf')} {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ThemedText>

        {/* Filters: Category */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingRight: 8 }}>
          <InlineTab label={t('All')} active={category==='all'} onPress={() => setCategory('all')} colors={colors} />
          <InlineTab label={t('Domestic')} active={category==='domestic'} onPress={() => setCategory('domestic')} colors={colors} />
          <InlineTab label={t('Overseas')} active={category==='overseas'} onPress={() => setCategory('overseas')} colors={colors} />
        </ScrollView>

        {/* Filters: Range */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ paddingRight: 8 }}>
          <InlineTab label={t('Realtime')} active={range==='realtime'} onPress={() => setRange('realtime')} colors={colors} />
          <InlineTab label={t('OneDay')} active={range==='1d'} onPress={() => setRange('1d')} colors={colors} />
          <InlineTab label={t('OneWeek')} active={range==='1w'} onPress={() => setRange('1w')} colors={colors} />
          <InlineTab label={t('OneMonth')} active={range==='1m'} onPress={() => setRange('1m')} colors={colors} />
          <InlineTab label={t('ThreeMonths')} active={range==='3m'} onPress={() => setRange('3m')} colors={colors} />
          <InlineTab label={t('SixMonths')} active={range==='6m'} onPress={() => setRange('6m')} colors={colors} />
        </ScrollView>

        {/* List header divider */}
        <View style={{ height: 1, backgroundColor: colors.border, marginTop: 12 }} />

        {/* Stock list */}
        <View style={{ marginTop: 4 }}>
          {stocks.map((s, i) => (
            <View key={i} style={[styles.row, { borderBottomColor: colors.border }]}> 
              <ThemedText style={{ color: colors.textSecondary, width: 28, textAlign: 'right', marginRight: 6 }}>{s.rank}</ThemedText>
              <View style={[styles.circle, { backgroundColor: '#1f2a37' }]} />
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 }}>
                <ThemedText style={{ color: colors.text, fontWeight: '700' }} numberOfLines={1}>{s.name}</ThemedText>
                <ThemedText style={{ color: colors.textTertiary, fontSize: 12 }}>{s.flag}</ThemedText>
              </View>
              <View style={{ alignItems: 'flex-end', width: 110 }}>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{s.price}</ThemedText>
                <ThemedText style={{ color: s.pct >= 0 ? colors.success : colors.danger, fontWeight: '700' }}>{`${s.pct>=0?'+':''}${s.pct.toFixed(1)}%`}</ThemedText>
              </View>
              <TouchableOpacity style={{ padding: 6, marginLeft: 8 }}>
                <IconSymbol name="bookmark.fill" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Sheet Selector */}
      <Modal animationType="slide" transparent visible={selectorOpen} onRequestClose={() => setSelectorOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSelectorOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}> 
          <View style={styles.sheetHandle} />
          <ThemedText type="defaultSemiBold" style={{ color: colors.text, marginBottom: 8 }}>{t('RealTimeTop10')}</ThemedText>
          {[
            { key: 'trading-volume', label: t('TradingVolume') },
            { key: 'trading-value', label: t('TradingValue') },
            { key: 'popular', label: t('PopularLower') },
            { key: 'rapid-increase', label: t('Rising') },
            { key: 'falling-down', label: t('Falling') },
          ].map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={styles.optionRow}
              onPress={() => {
                setTitleFilter(opt.key as any);
                setSelectorOpen(false);
              }}
            >
              <ThemedText style={{ color: (titleFilter === opt.key) ? colors.primary : colors.textTertiary, fontSize: 15 }}>
                {opt.label}
              </ThemedText>
              {(titleFilter === opt.key) && (
                <IconSymbol name="checkmark.seal.fill" size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress, colors }: { label: string; active?: boolean; onPress?: () => void; colors: any }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, { backgroundColor: active ? colors.primary : 'transparent', borderColor: active ? colors.primary : colors.border }]}> 
      <ThemedText style={{ color: active ? colors.primaryText : colors.text }}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

function InlineTab({ label, active, onPress, colors }: { label: string; active?: boolean; onPress?: () => void; colors: any }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.inlineTab}> 
      <ThemedText style={{ color: active ? colors.text : colors.textTertiary, fontWeight: active ? '700' : '600' }}>{label}</ThemedText>
      <View style={{ height: 3, marginTop: 6, backgroundColor: active ? colors.primary : 'transparent', borderRadius: 999, alignSelf: 'stretch' }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  headerBtn: { padding: 6 },
  content: { paddingHorizontal: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  titleBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectorRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  chip: { borderWidth: 1, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  inlineTab: { alignItems: 'center', marginRight: 14 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 6 },
  circle: { width: 18, height: 18, borderRadius: 9, marginRight: 8 },
  // bottom sheet
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 10 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
});
