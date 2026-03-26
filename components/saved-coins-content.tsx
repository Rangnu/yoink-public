import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-context';
import { useWatchlist } from '@/contexts/watchlist-context';
import { supabase } from '@/utils/supabase';

type SavedCoinRow = {
  symbol: string;
  name: string;
  price_usd: number | null;
  change_24h_pct: number | null;
  rank: number | null;
};

export function SavedCoinsContent({
  showHeader = true,
  title = 'Saved coins',
  subtitle = 'Your watchlist is stored on this device for now.',
}: {
  showHeader?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const { colors } = useTheme();
  const { symbols, loading: watchlistLoading, mode, syncState, toggleSaved, reload } = useWatchlist();
  const [rows, setRows] = useState<SavedCoinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderedSymbols = useMemo(() => symbols.map((symbol) => symbol.toUpperCase()), [symbols]);

  const loadCoins = useCallback(async () => {
    if (!orderedSymbols.length) {
      setRows([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('coin_latest_view')
        .select('symbol, name, price_usd, change_24h_pct, rank')
        .in('symbol', orderedSymbols);

      if (queryError) {
        setRows([]);
        setError(queryError.message);
        return;
      }

      const order = new Map(orderedSymbols.map((symbol, index) => [symbol, index]));
      const mapped = ((data ?? []) as SavedCoinRow[]).sort(
        (a, b) => (order.get(a.symbol) ?? 999) - (order.get(b.symbol) ?? 999)
      );

      setRows(mapped);
    } catch (err: any) {
      setRows([]);
      setError(err?.message ?? 'Failed to load saved coins.');
    } finally {
      setLoading(false);
    }
  }, [orderedSymbols]);

  useEffect(() => {
    if (watchlistLoading) return;
    loadCoins();
  }, [loadCoins, watchlistLoading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    reload()
      .then(() => loadCoins())
      .finally(() => setRefreshing(false));
  }, [loadCoins, reload]);

  const formatPrice = (value: number | null) =>
    value == null ? '-' : `$${value.toLocaleString(undefined, { maximumFractionDigits: value >= 1 ? 2 : 6 })}`;

  const formatChange = (value: number | null) =>
    value == null ? '--' : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  const empty = !watchlistLoading && !orderedSymbols.length;
  const resolvedSubtitle =
    mode === 'account'
      ? syncState === 'error'
        ? 'Saved coins are cached locally and will retry syncing to your account.'
        : 'Saved coins are synced to your account and cached on this device.'
      : subtitle;

  return (
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
      {showHeader && (
        <View style={styles.header}>
          <ThemedText type="title" style={{ color: colors.text }}>
            {title}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            {resolvedSubtitle}
          </ThemedText>
        </View>
      )}

      <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>Tracked now</ThemedText>
          <ThemedText style={{ color: colors.text, fontSize: 28, fontWeight: '700', marginTop: 4 }}>
            {orderedSymbols.length}
          </ThemedText>
        </View>
        <View style={styles.summaryRight}>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>Next step</ThemedText>
          <ThemedText style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 4 }}>
            Tap any coin for details
          </ThemedText>
        </View>
      </View>

      {empty ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="bookmark" size={28} color={colors.textTertiary} />
          <ThemedText type="subtitle" style={{ color: colors.text, fontSize: 18 }}>
            No saved coins yet
          </ThemedText>
          <ThemedText style={[styles.emptyBody, { color: colors.textSecondary }]}>
            Save coins from Explore or the coin detail screen and they will appear here.
          </ThemedText>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/explore')}
          >
            <ThemedText style={{ color: colors.primaryText, fontWeight: '700' }}>
              Go to Explore
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText style={{ color: colors.danger, fontWeight: '600' }}>
            Failed to load live prices
          </ThemedText>
          <ThemedText style={{ color: colors.textSecondary, marginTop: 4 }}>{error}</ThemedText>
        </View>
      ) : null}

      {!empty && rows.map((row) => {
        const changeColor = (row.change_24h_pct ?? 0) >= 0 ? colors.success : colors.danger;
        return (
          <TouchableOpacity
            key={row.symbol}
            style={[styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/coin/[symbol]' as any, params: { symbol: row.symbol } })}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rankBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                  #{row.rank ?? '--'}
                </ThemedText>
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
                  {row.symbol}
                </ThemedText>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                  {row.name}
                </ThemedText>
              </View>
            </View>

            <View style={styles.rowRight}>
              <View>
                <ThemedText style={{ color: colors.text, fontWeight: '700', textAlign: 'right' }}>
                  {formatPrice(row.price_usd)}
                </ThemedText>
                <ThemedText style={{ color: changeColor, fontSize: 12, fontWeight: '700', marginTop: 4, textAlign: 'right' }}>
                  {formatChange(row.change_24h_pct)}
                </ThemedText>
              </View>
              <TouchableOpacity
                accessibilityLabel={`Remove ${row.symbol} from saved`}
                onPress={() => toggleSaved(row.symbol)}
                style={styles.bookmarkButton}
              >
                <IconSymbol name="bookmark.fill" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}

      {!empty && !rows.length && !loading && !error ? (
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText style={{ color: colors.text, fontWeight: '600' }}>
            Saved symbols are ready
          </ThemedText>
          <ThemedText style={{ color: colors.textSecondary, marginTop: 4 }}>
            Live market rows will appear here after the next ingest run populates Supabase data.
          </ThemedText>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    flexGrow: 1,
  },
  header: {
    gap: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    alignItems: 'flex-start',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  rowCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    minWidth: 42,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  bookmarkButton: {
    padding: 6,
  },
});
