import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SavedCoinsContent } from '@/components/saved-coins-content';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useWatchlist } from '@/contexts/watchlist-context';
import { supabase } from '@/utils/supabase';

type WatchlistCoinRow = {
  symbol: string;
  name: string;
  price_usd: number | null;
  change_24h_pct: number | null;
  rank: number | null;
};

export default function WatchlistsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    watchlists,
    loading,
    syncState,
    createWatchlist,
    renameWatchlist,
    deleteWatchlist,
    removeCoin,
    reload,
  } = useWatchlist();

  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);
  const [rows, setRows] = useState<WatchlistCoinRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [createName, setCreateName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!watchlists.length) {
      setSelectedWatchlistId(null);
      return;
    }

    if (!selectedWatchlistId || !watchlists.some((watchlist) => watchlist.id === selectedWatchlistId)) {
      setSelectedWatchlistId(watchlists[0].id);
    }
  }, [selectedWatchlistId, watchlists]);

  const selectedWatchlist = useMemo(
    () => watchlists.find((watchlist) => watchlist.id === selectedWatchlistId) ?? watchlists[0] ?? null,
    [selectedWatchlistId, watchlists]
  );

  const selectedSymbols = useMemo(() => selectedWatchlist?.symbols ?? [], [selectedWatchlist]);
  const syncStatusLabel = useMemo(() => {
    if (syncState === 'syncing') return 'Syncing account watchlists…';
    if (syncState === 'error') return 'Watchlist sync hit an error. Pull to retry.';
    return 'Changes sync to your account automatically.';
  }, [syncState]);

  const loadSelectedRows = useCallback(async () => {
    if (!selectedSymbols.length) {
      setRows([]);
      setRowsLoading(false);
      return;
    }

    try {
      setRowsLoading(true);
      const { data, error } = await supabase
        .from('coin_latest_view')
        .select('symbol, name, price_usd, change_24h_pct, rank')
        .in('symbol', selectedSymbols);

      if (error) {
        setRows([]);
        setScreenError(error.message);
        return;
      }

      const order = new Map(selectedSymbols.map((symbol, index) => [symbol, index]));
      const mapped = ((data ?? []) as WatchlistCoinRow[]).sort(
        (a, b) => (order.get(a.symbol) ?? 999) - (order.get(b.symbol) ?? 999)
      );
      setRows(mapped);
    } catch (err: any) {
      setRows([]);
      setScreenError(err?.message ?? 'Failed to load watchlist coins.');
    } finally {
      setRowsLoading(false);
    }
  }, [selectedSymbols]);

  useEffect(() => {
    setScreenError(null);
    void loadSelectedRows();
  }, [loadSelectedRows]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    reload()
      .then(() => loadSelectedRows())
      .finally(() => setRefreshing(false));
  }, [loadSelectedRows, reload]);

  const formatPrice = (value: number | null) =>
    value == null ? '-' : `$${value.toLocaleString(undefined, { maximumFractionDigits: value >= 1 ? 2 : 6 })}`;

  const formatChange = (value: number | null) =>
    value == null ? '--' : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  const handleCreateWatchlist = useCallback(async () => {
    const trimmed = createName.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setScreenError(null);
    try {
      const created = await createWatchlist(trimmed);
      setCreateName('');
      if (created?.id) {
        setSelectedWatchlistId(created.id);
      }
    } catch (err: any) {
      setScreenError(err?.message ?? 'Could not create watchlist.');
    } finally {
      setSubmitting(false);
    }
  }, [createName, createWatchlist]);

  const handleRenameWatchlist = useCallback(async (watchlistId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setScreenError(null);
    try {
      await renameWatchlist(watchlistId, trimmed);
      setEditingId(null);
      setEditingName('');
    } catch (err: any) {
      setScreenError(err?.message ?? 'Could not rename watchlist.');
    } finally {
      setSubmitting(false);
    }
  }, [editingName, renameWatchlist]);

  const confirmDeleteWatchlist = useCallback((watchlistId: string, name: string) => {
    const runDelete = async () => {
      setSubmitting(true);
      setScreenError(null);
      try {
        await deleteWatchlist(watchlistId);
      } catch (err: any) {
        setScreenError(err?.message ?? 'Could not delete watchlist.');
      } finally {
        setSubmitting(false);
      }
    };

    const message = `Delete \"${name}\" and all of its saved coins?`;

    if (Platform.OS === 'web' && typeof globalThis.confirm === 'function') {
      if (globalThis.confirm(message)) {
        void runDelete();
      }
      return;
    }

    Alert.alert('Delete watchlist', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void runDelete() },
    ]);
  }, [deleteWatchlist]);

  const handleRemoveFromSelected = useCallback(async (symbol: string) => {
    if (!selectedWatchlist?.id) return;

    setScreenError(null);
    try {
      await removeCoin(symbol, selectedWatchlist.id);
    } catch (err: any) {
      setScreenError(err?.message ?? 'Could not remove coin from watchlist.');
    }
  }, [removeCoin, selectedWatchlist]);

  if (!user) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <SavedCoinsContent
          showHeader
          title="Saved coins"
          subtitle="Sign in to create multiple synced watchlists and organize coins into named groups."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}>
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
        <View style={styles.header}>
          <ThemedText type="title" style={{ color: colors.text }}>Watchlists</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>Create named lists and decide where each saved coin belongs.</ThemedText>
        </View>

        <View style={[styles.createCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>Create watchlist</ThemedText>
          <View style={styles.createRow}>
            <TextInput
              value={createName}
              onChangeText={setCreateName}
              placeholder="New watchlist name"
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
              onPress={handleCreateWatchlist}
              disabled={submitting}
            >
              <ThemedText style={{ color: colors.primaryText, fontWeight: '700' }}>Create</ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
            {syncStatusLabel}
          </ThemedText>
        </View>

        {screenError ? (
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <ThemedText style={{ color: colors.danger, fontWeight: '700' }}>{screenError}</ThemedText>
          </View>
        ) : null}

        <View style={styles.section}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>Your watchlists</ThemedText>
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}

          {!loading && watchlists.map((watchlist) => {
            const selected = selectedWatchlist?.id === watchlist.id;
            const countLabel = `${watchlist.symbols.length} coin${watchlist.symbols.length === 1 ? '' : 's'}`;
            const preview = watchlist.symbols.slice(0, 4);

            return (
              <TouchableOpacity
                key={watchlist.id}
                style={[
                  styles.watchlistCard,
                  {
                    backgroundColor: selected ? colors.surfaceElevated : colors.surface,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedWatchlistId(watchlist.id)}
                activeOpacity={0.9}
              >
                <View style={styles.watchlistTop}>
                  <View style={{ flex: 1 }}>
                    {editingId === watchlist.id ? (
                      <View style={styles.renameRow}>
                        <TextInput
                          value={editingName}
                          onChangeText={setEditingName}
                          placeholder="Rename watchlist"
                          placeholderTextColor={colors.textTertiary}
                          style={[
                            styles.input,
                            styles.renameInput,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                              color: colors.text,
                            },
                          ]}
                        />
                        <TouchableOpacity style={[styles.inlineAction, { backgroundColor: colors.primary }]} onPress={() => handleRenameWatchlist(watchlist.id)}>
                          <ThemedText style={{ color: colors.primaryText, fontWeight: '700', fontSize: 12 }}>Save</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.inlineAction, { borderColor: colors.border, borderWidth: 1 }]} onPress={() => { setEditingId(null); setEditingName(''); }}>
                          <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>Cancel</ThemedText>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.nameRow}>
                        <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{watchlist.name}</ThemedText>
                        {watchlist.isDefault ? (
                          <View style={[styles.defaultBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                            <ThemedText style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Default</ThemedText>
                          </View>
                        ) : null}
                      </View>
                    )}
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>{countLabel}</ThemedText>
                    {preview.length ? (
                      <View style={styles.previewRow}>
                        {preview.map((symbol) => (
                          <View key={`${watchlist.id}-${symbol}`} style={[styles.previewChip, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                            <ThemedText style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>{symbol}</ThemedText>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <ThemedText style={{ color: colors.textTertiary, fontSize: 12, marginTop: 8 }}>No coins in this watchlist yet.</ThemedText>
                    )}
                  </View>
                </View>

                {editingId !== watchlist.id ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => { setEditingId(watchlist.id); setEditingName(watchlist.name); }}>
                      <IconSymbol name="pencil" size={14} color={colors.text} />
                      <ThemedText style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>Rename</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border, opacity: watchlists.length <= 1 ? 0.4 : 1 }]}
                      disabled={watchlists.length <= 1}
                      onPress={() => confirmDeleteWatchlist(watchlist.id, watchlist.name)}
                    >
                      <IconSymbol name="trash" size={14} color={colors.danger} />
                      <ThemedText style={{ color: colors.danger, fontSize: 12, fontWeight: '600' }}>Delete</ThemedText>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedWatchlist ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>{selectedWatchlist.name}</ThemedText>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{selectedSymbols.length} saved</ThemedText>
            </View>

            {rowsLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null}

            {!rowsLoading && !selectedSymbols.length ? (
              <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <ThemedText style={{ color: colors.textSecondary }}>Save coins from Explore, Home, or detail screens and choose this watchlist in the picker.</ThemedText>
              </View>
            ) : null}

            {!rowsLoading && rows.map((row) => {
              const changeColor = (row.change_24h_pct ?? 0) >= 0 ? colors.success : colors.danger;
              return (
                <TouchableOpacity
                  key={`${selectedWatchlist.id}-${row.symbol}`}
                  style={[styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: '/coin' as any, params: { symbol: row.symbol } })}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.rankBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
                      <ThemedText style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>#{row.rank ?? '--'}</ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>{row.symbol}</ThemedText>
                      <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{row.name}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.rowRight}>
                    <View>
                      <ThemedText style={{ color: colors.text, fontWeight: '700', textAlign: 'right' }}>{formatPrice(row.price_usd)}</ThemedText>
                      <ThemedText style={{ color: changeColor, fontSize: 12, fontWeight: '700', marginTop: 4, textAlign: 'right' }}>{formatChange(row.change_24h_pct)}</ThemedText>
                    </View>
                    <TouchableOpacity
                      accessibilityLabel={`Remove ${row.symbol} from ${selectedWatchlist.name}`}
                      onPress={() => handleRemoveFromSelected(row.symbol)}
                      style={styles.bookmarkButton}
                    >
                      <IconSymbol name="bookmark.fill" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  header: { gap: 4 },
  subtitle: { fontSize: 14 },
  createCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  createRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { marginBottom: 2 },
  centerState: { paddingVertical: 32, alignItems: 'center', justifyContent: 'center' },
  watchlistCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  watchlistTop: { flexDirection: 'row', gap: 12 },
  nameRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  previewRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 10 },
  previewChip: { paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderRadius: 999 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
  },
  renameRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  renameInput: { flex: 1, minWidth: 140 },
  inlineAction: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLeft: { flexDirection: 'row', gap: 12, flex: 1, alignItems: 'center' },
  rankBadge: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rowRight: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  bookmarkButton: { padding: 4 },
});
