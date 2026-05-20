import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { CoinSparkline } from '@/components/ui/coin-sparkline';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';
import { useWatchlist } from '@/contexts/watchlist-context';
import { CoinMarketRow, MarketChangeRange, fetchCoinMarketRows, formatCoinPercent, formatCoinPrice, getChangeForRange, getLatestTimestamp, sortCoinRows } from '@/utils/coin-market';

type TopSortMode = 'volume' | 'popular' | 'gainers' | 'losers';

export default function Top100Screen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  const { isSaved, toggleSaved } = useWatchlist();
  const params = useLocalSearchParams<{ tab?: string }>();

  const [range, setRange] = useState<MarketChangeRange>('1d');
  const [sortMode, setSortMode] = useState<TopSortMode>(
    params.tab === 'popular'
      ? 'popular'
      : params.tab === 'gainers'
        ? 'gainers'
        : params.tab === 'losers'
          ? 'losers'
          : 'volume'
  );
  const [rows, setRows] = useState<CoinMarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchCoinMarketRows(120);
      setRows(data);
    } catch (err: any) {
      setRows([]);
      setError(err?.message ?? 'Failed to load market rankings.');
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

  const sortedRows = useMemo(() => sortCoinRows(rows, sortMode, range).slice(0, 100), [range, rows, sortMode]);
  const lastUpdated = useMemo(() => getLatestTimestamp(rows), [rows]);

  const titleText = (() => {
    switch (sortMode) {
      case 'popular':
        return t('PopularLower');
      case 'gainers':
        return t('Rising');
      case 'losers':
        return t('Falling');
      case 'volume':
      default:
        return t('TradingVolume');
    }
  })();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <IconSymbol name="chevron.left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.headerBtn} onPress={() => setSelectorOpen(true)}>
          <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>{t('Info')}</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
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
        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.titleBtn} onPress={() => setSelectorOpen(true)}>
            <ThemedText type="title" style={{ color: colors.text, fontSize: 20 }}>
              Top 100 · {titleText}
            </ThemedText>
            <IconSymbol name="chevron.down" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ThemedText style={{ color: colors.textTertiary, fontSize: 12, marginTop: 6 }}>
          {t('AsOf')} {lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        </ThemedText>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingRight: 8 }}>
          <InlineTab label={t('Realtime')} active={range === 'realtime'} onPress={() => setRange('realtime')} colors={colors} />
          <InlineTab label={t('OneDay')} active={range === '1d'} onPress={() => setRange('1d')} colors={colors} />
          <InlineTab label={t('OneWeek')} active={range === '1w'} onPress={() => setRange('1w')} colors={colors} />
        </ScrollView>

        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <ThemedText style={{ color: colors.text, fontWeight: '700' }}>Live crypto rankings only</ThemedText>
          <ThemedText style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
            This screen is now backed by Supabase snapshots. {t('Realtime')} uses 1h momentum, {t('OneDay')} uses 24h change, and {t('OneWeek')} uses 7d change where available.
          </ThemedText>
        </View>

        <View style={{ height: 1, backgroundColor: colors.border, marginTop: 12 }} />

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.primary} />
            <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>Loading rankings…</ThemedText>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 }]}> 
            <ThemedText style={{ color: colors.danger, fontWeight: '700' }}>Could not load rankings</ThemedText>
            <ThemedText style={{ color: colors.textSecondary, marginTop: 6 }}>{error}</ThemedText>
          </View>
        ) : null}

        {!loading && !error && (
          <View style={{ marginTop: 4 }}>
            {sortedRows.map((row, index) => {
              const saved = isSaved(row.symbol);
              const change = getChangeForRange(row, range);
              const changeColor = (change ?? 0) >= 0 ? colors.success : colors.danger;
              return (
                <TouchableOpacity
                  key={row.symbol}
                  style={[styles.row, { borderBottomColor: colors.border }]}
                  onPress={() => router.push({ pathname: '/coin' as any, params: { symbol: row.symbol } })}
                >
                  <ThemedText style={{ color: colors.textSecondary, width: 28, textAlign: 'right', marginRight: 6 }}>
                    {index + 1}
                  </ThemedText>
                  <View style={[styles.rankBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <ThemedText style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>{row.symbol}</ThemedText>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <ThemedText style={{ color: colors.text, fontWeight: '700' }} numberOfLines={1}>{row.name}</ThemedText>
                    <View style={{ marginTop: 6 }}>
                      <CoinSparkline symbol={row.symbol} color={changeColor} width={88} height={28} />
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', width: 112 }}>
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{formatCoinPrice(row.price_usd)}</ThemedText>
                    <ThemedText style={{ color: changeColor, fontWeight: '700', marginTop: 4 }}>{formatCoinPercent(change)}</ThemedText>
                  </View>
                  <TouchableOpacity style={{ padding: 6, marginLeft: 8 }} onPress={() => toggleSaved(row.symbol)}>
                    <IconSymbol name={saved ? 'bookmark.fill' : 'bookmark'} size={18} color={saved ? colors.primary : colors.textTertiary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal animationType="slide" transparent visible={selectorOpen} onRequestClose={() => setSelectorOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSelectorOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}> 
          <View style={styles.sheetHandle} />
          <ThemedText type="defaultSemiBold" style={{ color: colors.text, marginBottom: 8 }}>Sort Top 100</ThemedText>
          {[
            { key: 'volume' as const, label: t('TradingVolume') },
            { key: 'popular' as const, label: t('PopularLower') },
            { key: 'gainers' as const, label: t('Rising') },
            { key: 'losers' as const, label: t('Falling') },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={styles.optionRow}
              onPress={() => {
                setSortMode(opt.key);
                setSelectorOpen(false);
              }}
            >
              <ThemedText style={{ color: sortMode === opt.key ? colors.primary : colors.textTertiary, fontSize: 15 }}>
                {opt.label}
              </ThemedText>
              {sortMode === opt.key ? <IconSymbol name="checkmark.seal.fill" size={16} color={colors.primary} /> : null}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
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
  inlineTab: { alignItems: 'center', marginRight: 14 },
  infoCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 12 },
  centerState: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 6 },
  rankBadge: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 10 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
});
