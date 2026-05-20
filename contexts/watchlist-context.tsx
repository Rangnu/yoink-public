import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useActivity } from '@/contexts/activity-context';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { supabase } from '@/utils/supabase';

export type WatchlistMode = 'guest' | 'account';
export type WatchlistSyncState = 'idle' | 'syncing' | 'error';
export type WatchlistSummary = {
  id: string;
  name: string;
  isDefault: boolean;
  symbols: string[];
  createdAt?: string;
  updatedAt?: string;
  local?: boolean;
};

type WatchlistContextValue = {
  symbols: string[];
  loading: boolean;
  mode: WatchlistMode;
  syncState: WatchlistSyncState;
  watchlists: WatchlistSummary[];
  defaultWatchlistId: string | null;
  isSaved: (symbol: string, watchlistId?: string) => boolean;
  getWatchlistsForSymbol: (symbol: string) => WatchlistSummary[];
  saveCoin: (symbol: string, watchlistId?: string) => Promise<void>;
  removeCoin: (symbol: string, watchlistId?: string) => Promise<void>;
  toggleSaved: (symbol: string) => Promise<void>;
  reload: () => Promise<void>;
  createWatchlist: (name: string) => Promise<WatchlistSummary | null>;
  renameWatchlist: (watchlistId: string, name: string) => Promise<void>;
  deleteWatchlist: (watchlistId: string) => Promise<void>;
  openSavePicker: (symbol: string) => void;
  closeSavePicker: () => void;
};

type WatchlistRow = {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

const STORAGE_KEY = 'saved_coin_symbols_v1';
const DEFAULT_WATCHLIST_NAME = 'Saved';
const LOCAL_WATCHLIST_ID = 'local-saved-watchlist';

const WatchlistContext = createContext<WatchlistContextValue | undefined>(undefined);

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function uniq(values: string[]) {
  return Array.from(new Set(values.map((value) => normalizeSymbol(value)).filter(Boolean)));
}

function buildLocalWatchlists(symbols: string[]): WatchlistSummary[] {
  return [
    {
      id: LOCAL_WATCHLIST_ID,
      name: DEFAULT_WATCHLIST_NAME,
      isDefault: true,
      symbols: uniq(symbols),
      local: true,
    },
  ];
}

function sortWatchlists(rows: WatchlistSummary[]) {
  return [...rows].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.name.localeCompare(b.name);
  });
}

function unionSymbolsFromWatchlists(rows: WatchlistSummary[]) {
  return uniq(rows.flatMap((row) => row.symbols));
}

async function readLocalSymbols() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? uniq(parsed.map((value) => String(value))) : [];
  } catch {
    return [];
  }
}

async function resolveCoinIdBySymbol(symbol: string) {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('coins')
    .select('id')
    .eq('symbol', normalized)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { recordEvent } = useActivity();
  const { colors } = useTheme();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [watchlists, setWatchlists] = useState<WatchlistSummary[]>(buildLocalWatchlists([]));
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<WatchlistMode>('guest');
  const [syncState, setSyncState] = useState<WatchlistSyncState>('idle');
  const [bootstrapped, setBootstrapped] = useState(false);
  const [defaultWatchlistId, setDefaultWatchlistId] = useState<string | null>(LOCAL_WATCHLIST_ID);
  const [pickerSymbol, setPickerSymbol] = useState<string | null>(null);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [pickerDraftName, setPickerDraftName] = useState('');
  const [pickerCreateMode, setPickerCreateMode] = useState(false);
  const symbolsRef = useRef<string[]>([]);
  const watchlistsRef = useRef<WatchlistSummary[]>(buildLocalWatchlists([]));

  const persistLocalUnion = useCallback(async (nextSymbols: string[]) => {
    const uniqueSymbols = uniq(nextSymbols);
    symbolsRef.current = uniqueSymbols;
    setSymbols(uniqueSymbols);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueSymbols)).catch(() => {
      // keep UI usable even if local persistence fails
    });
  }, []);

  const setLocalGuestState = useCallback((nextSymbols: string[]) => {
    const uniqueSymbols = uniq(nextSymbols);
    const localWatchlists = buildLocalWatchlists(uniqueSymbols);
    symbolsRef.current = uniqueSymbols;
    watchlistsRef.current = localWatchlists;
    setSymbols(uniqueSymbols);
    setWatchlists(localWatchlists);
    setDefaultWatchlistId(LOCAL_WATCHLIST_ID);
  }, []);

  const applyRemoteWatchlists = useCallback(async (nextWatchlists: WatchlistSummary[]) => {
    const sorted = sortWatchlists(nextWatchlists);
    watchlistsRef.current = sorted;
    setWatchlists(sorted);
    setDefaultWatchlistId(sorted.find((watchlist) => watchlist.isDefault)?.id ?? null);
    await persistLocalUnion(unionSymbolsFromWatchlists(sorted));
  }, [persistLocalUnion]);

  const loadRemoteWatchlists = useCallback(async (userId: string) => {
    const { data: watchlistRows, error: watchlistsError } = await supabase
      .from('watchlists')
      .select('id, name, is_default, created_at, updated_at')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false });

    if (watchlistsError) throw watchlistsError;

    const rows = ((watchlistRows ?? []) as WatchlistRow[]);
    if (!rows.length) return [];

    const watchlistIds = rows.map((row) => row.id);
    const { data: itemRows, error: itemError } = await supabase
      .from('watchlist_items')
      .select('watchlist_id, coin_id, created_at')
      .in('watchlist_id', watchlistIds)
      .order('created_at', { ascending: false });

    if (itemError) throw itemError;

    const coinIds = Array.from(new Set(((itemRows ?? []) as Array<{ watchlist_id: string; coin_id: string }>).map((row) => row.coin_id).filter(Boolean)));
    let symbolByCoinId = new Map<string, string>();

    if (coinIds.length) {
      const { data: coinRows, error: coinError } = await supabase
        .from('coins')
        .select('id, symbol')
        .in('id', coinIds);

      if (coinError) throw coinError;
      symbolByCoinId = new Map((coinRows ?? []).map((row: any) => [row.id as string, normalizeSymbol(String(row.symbol ?? ''))]));
    }

    const symbolsByWatchlistId = new Map<string, string[]>();
    for (const row of (itemRows ?? []) as Array<{ watchlist_id: string; coin_id: string }>) {
      const symbol = symbolByCoinId.get(row.coin_id);
      if (!symbol) continue;
      const current = symbolsByWatchlistId.get(row.watchlist_id) ?? [];
      if (!current.includes(symbol)) current.push(symbol);
      symbolsByWatchlistId.set(row.watchlist_id, current);
    }

    return rows.map<WatchlistSummary>((row) => ({
      id: row.id,
      name: row.name,
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      symbols: symbolsByWatchlistId.get(row.id) ?? [],
    }));
  }, []);

  const ensureDefaultWatchlist = useCallback(async (userId: string, options?: { allowCreate?: boolean }) => {
    const allowCreate = options?.allowCreate ?? true;
    const { data: existingRows, error } = await supabase
      .from('watchlists')
      .select('id, is_default, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const existing = (existingRows ?? []) as Array<{ id: string; is_default: boolean; created_at: string }>;
    const currentDefault = existing.find((row) => row.is_default);
    if (currentDefault?.id) {
      setDefaultWatchlistId(currentDefault.id);
      return currentDefault.id;
    }

    if (existing[0]?.id) {
      const promotedAt = new Date().toISOString();
      const { error: promoteError } = await supabase
        .from('watchlists')
        .update({ is_default: true, updated_at: promotedAt })
        .eq('id', existing[0].id);

      if (promoteError) throw promoteError;
      setDefaultWatchlistId(existing[0].id);
      return existing[0].id;
    }

    if (!allowCreate) {
      setDefaultWatchlistId(null);
      return null;
    }

    const { data: inserted, error: insertError } = await supabase
      .from('watchlists')
      .insert({
        user_id: userId,
        name: DEFAULT_WATCHLIST_NAME,
        is_default: true,
      })
      .select('id')
      .single();

    if (insertError) throw insertError;
    setDefaultWatchlistId(inserted.id);
    return inserted.id as string;
  }, []);

  const syncWithAccount = useCallback(async (userId: string, localSymbols: string[]) => {
    let remoteWatchlists = await loadRemoteWatchlists(userId);
    const defaultId = await ensureDefaultWatchlist(userId, { allowCreate: localSymbols.length > 0 });
    const remoteSymbols = unionSymbolsFromWatchlists(remoteWatchlists);
    const missingRemoteSymbols = uniq(localSymbols).filter((symbol) => !remoteSymbols.includes(symbol));

    if (defaultId && missingRemoteSymbols.length) {
      for (const symbol of missingRemoteSymbols) {
        const coinId = await resolveCoinIdBySymbol(symbol);
        if (!coinId) continue;
        const { error } = await supabase
          .from('watchlist_items')
          .upsert({ watchlist_id: defaultId, coin_id: coinId }, { onConflict: 'watchlist_id,coin_id' });

        if (error) throw error;
      }

      await supabase
        .from('watchlists')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', defaultId);

      remoteWatchlists = await loadRemoteWatchlists(userId);
    }

    return remoteWatchlists;
  }, [ensureDefaultWatchlist, loadRemoteWatchlists]);

  useEffect(() => {
    let active = true;

    readLocalSymbols()
      .then((localSymbols) => {
        if (!active) return;
        setLocalGuestState(localSymbols);
      })
      .finally(() => {
        if (active) {
          setBootstrapped(true);
        }
      });

    return () => {
      active = false;
    };
  }, [setLocalGuestState]);

  useEffect(() => {
    if (!bootstrapped || authLoading) return;

    let active = true;

    const sync = async () => {
      if (!user) {
        setMode('guest');
        setSyncState('idle');
        setLocalGuestState(symbolsRef.current);
        setLoading(false);
        return;
      }

      setMode('account');
      setSyncState('syncing');

      try {
        const syncedWatchlists = await syncWithAccount(user.id, symbolsRef.current);
        if (!active) return;
        await applyRemoteWatchlists(syncedWatchlists);
        setSyncState('idle');
      } catch {
        if (!active) return;
        setSyncState('error');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    sync();

    return () => {
      active = false;
    };
  }, [applyRemoteWatchlists, authLoading, bootstrapped, setLocalGuestState, syncWithAccount, user]);

  useEffect(() => {
    if (user) return;
    setPickerSymbol(null);
    setPickerError(null);
    setPickerDraftName('');
    setPickerBusy(false);
    setPickerCreateMode(false);
  }, [user]);

  const setDefaultWatchlist = useCallback(async (watchlistId: string) => {
    if (!user) return;

    const current = watchlistsRef.current;
    const existingDefault = current.find((watchlist) => watchlist.isDefault);
    if (existingDefault?.id === watchlistId) return;

    if (existingDefault?.id) {
      const { error: clearError } = await supabase
        .from('watchlists')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('id', existingDefault.id);

      if (clearError) throw clearError;
    }

    const updatedAt = new Date().toISOString();
    const { error: setError } = await supabase
      .from('watchlists')
      .update({ is_default: true, updated_at: updatedAt })
      .eq('id', watchlistId);

    if (setError) throw setError;

    const next = current.map((watchlist) => ({
      ...watchlist,
      isDefault: watchlist.id === watchlistId,
      updatedAt: watchlist.id === watchlistId ? updatedAt : watchlist.updatedAt,
    }));
    await applyRemoteWatchlists(next);
  }, [applyRemoteWatchlists, user]);

  const createWatchlist = useCallback(async (name: string) => {
    if (!user) return null;

    const trimmed = name.trim();
    if (!trimmed) return null;

    const isDefault = watchlistsRef.current.length === 0;
    const { data, error } = await supabase
      .from('watchlists')
      .insert({
        user_id: user.id,
        name: trimmed,
        is_default: isDefault,
      })
      .select('id, name, is_default, created_at, updated_at')
      .single();

    if (error) throw error;

    const nextWatchlist: WatchlistSummary = {
      id: data.id,
      name: data.name,
      isDefault: data.is_default,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      symbols: [],
    };

    await applyRemoteWatchlists([...watchlistsRef.current, nextWatchlist]);
    return nextWatchlist;
  }, [applyRemoteWatchlists, user]);

  const renameWatchlist = useCallback(async (watchlistId: string, name: string) => {
    if (!user) return;

    const trimmed = name.trim();
    if (!trimmed) return;

    const updatedAt = new Date().toISOString();
    const { error } = await supabase
      .from('watchlists')
      .update({ name: trimmed, updated_at: updatedAt })
      .eq('id', watchlistId);

    if (error) throw error;

    const next = watchlistsRef.current.map((watchlist) =>
      watchlist.id === watchlistId ? { ...watchlist, name: trimmed, updatedAt } : watchlist
    );
    await applyRemoteWatchlists(next);
  }, [applyRemoteWatchlists, user]);

  const saveCoin = useCallback(async (symbol: string, watchlistId?: string) => {
    const normalized = normalizeSymbol(symbol);
    if (!normalized) return;

    if (!user) {
      const nextSymbols = symbolsRef.current.includes(normalized)
        ? symbolsRef.current
        : [normalized, ...symbolsRef.current];
      await persistLocalUnion(nextSymbols);
      setLocalGuestState(nextSymbols);
      await recordEvent({
        eventType: 'save_coin',
        entityType: 'watchlist',
        entityId: normalized,
        title: `Saved ${normalized}`,
        subtitle: 'Added to your local watchlist',
        meta: { symbol: normalized, mode: 'guest' },
      });
      return;
    }

    const targetWatchlistId = watchlistId ?? defaultWatchlistId ?? null;
    if (!targetWatchlistId) {
      throw new Error('Create a watchlist before saving this coin.');
    }
    const coinId = await resolveCoinIdBySymbol(normalized);
    if (!coinId) return;

    const { error } = await supabase
      .from('watchlist_items')
      .upsert({ watchlist_id: targetWatchlistId, coin_id: coinId }, { onConflict: 'watchlist_id,coin_id' });

    if (error) throw error;

    const updatedAt = new Date().toISOString();
    await supabase.from('watchlists').update({ updated_at: updatedAt }).eq('id', targetWatchlistId);

    const existing = watchlistsRef.current;
    const next = existing.map((watchlist) =>
      watchlist.id === targetWatchlistId
        ? { ...watchlist, updatedAt, symbols: uniq([normalized, ...watchlist.symbols]) }
        : watchlist
    );

    if (next.some((watchlist) => watchlist.id === targetWatchlistId)) {
      await applyRemoteWatchlists(next);
    } else {
      const refreshed = await loadRemoteWatchlists(user.id);
      await applyRemoteWatchlists(refreshed);
    }

    await recordEvent({
      eventType: 'save_coin',
      entityType: 'watchlist',
      entityId: normalized,
      title: `Saved ${normalized}`,
      subtitle: 'Added to your synced watchlist',
      meta: { symbol: normalized, mode: 'account', watchlistId: targetWatchlistId },
    });
  }, [applyRemoteWatchlists, defaultWatchlistId, ensureDefaultWatchlist, loadRemoteWatchlists, persistLocalUnion, recordEvent, setLocalGuestState, user]);

  const removeCoin = useCallback(async (symbol: string, watchlistId?: string) => {
    const normalized = normalizeSymbol(symbol);
    if (!normalized) return;

    if (!user) {
      const nextSymbols = symbolsRef.current.filter((item) => item !== normalized);
      await persistLocalUnion(nextSymbols);
      setLocalGuestState(nextSymbols);
      await recordEvent({
        eventType: 'unsave_coin',
        entityType: 'watchlist',
        entityId: normalized,
        title: `Removed ${normalized}`,
        subtitle: 'Removed from your local watchlist',
        meta: { symbol: normalized, mode: 'guest' },
      });
      return;
    }

    const coinId = await resolveCoinIdBySymbol(normalized);
    if (!coinId) return;

    const targetIds = watchlistId
      ? [watchlistId]
      : watchlistsRef.current.filter((watchlist) => watchlist.symbols.includes(normalized)).map((watchlist) => watchlist.id);

    for (const targetId of targetIds) {
      const { error } = await supabase
        .from('watchlist_items')
        .delete()
        .eq('watchlist_id', targetId)
        .eq('coin_id', coinId);

      if (error) throw error;

      await supabase.from('watchlists').update({ updated_at: new Date().toISOString() }).eq('id', targetId);
    }

    const next = watchlistsRef.current.map((watchlist) =>
      targetIds.includes(watchlist.id)
        ? { ...watchlist, updatedAt: new Date().toISOString(), symbols: watchlist.symbols.filter((item) => item !== normalized) }
        : watchlist
    );
    await applyRemoteWatchlists(next);

    await recordEvent({
      eventType: 'unsave_coin',
      entityType: 'watchlist',
      entityId: normalized,
      title: `Removed ${normalized}`,
      subtitle: 'Removed from your synced watchlist',
      meta: { symbol: normalized, mode: 'account', watchlistIds: targetIds },
    });
  }, [applyRemoteWatchlists, persistLocalUnion, recordEvent, setLocalGuestState, user]);

  const deleteWatchlist = useCallback(async (watchlistId: string) => {
    if (!user) return;

    const current = watchlistsRef.current;
    const target = current.find((watchlist) => watchlist.id === watchlistId);
    if (!target) return;
    if (current.length <= 1) {
      throw new Error('Keep at least one watchlist.');
    }

    if (target.isDefault) {
      const replacement = current.find((watchlist) => watchlist.id !== watchlistId);
      if (replacement?.id) {
        await setDefaultWatchlist(replacement.id);
      }
    }

    const { error: itemsError } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('watchlist_id', watchlistId);

    if (itemsError) throw itemsError;

    const { error } = await supabase
      .from('watchlists')
      .delete()
      .eq('id', watchlistId);

    if (error) throw error;

    const next = watchlistsRef.current.filter((watchlist) => watchlist.id !== watchlistId);
    await applyRemoteWatchlists(next);
  }, [applyRemoteWatchlists, setDefaultWatchlist, user]);

  const getWatchlistsForSymbol = useCallback((symbol: string) => {
    const normalized = normalizeSymbol(symbol);
    if (!normalized) return [];
    return watchlists.filter((watchlist) => watchlist.symbols.includes(normalized));
  }, [watchlists]);

  const isSaved = useCallback((symbol: string, watchlistId?: string) => {
    const normalized = normalizeSymbol(symbol);
    if (!normalized) return false;

    if (watchlistId) {
      return watchlists.some((watchlist) => watchlist.id === watchlistId && watchlist.symbols.includes(normalized));
    }

    return symbols.includes(normalized);
  }, [symbols, watchlists]);

  const openSavePicker = useCallback((symbol: string) => {
    const normalized = normalizeSymbol(symbol);
    if (!normalized || !user) return;
    setPickerSymbol(normalized);
    setPickerError(null);
    setPickerDraftName('');
    setPickerCreateMode(false);
  }, [user]);

  const closeSavePicker = useCallback(() => {
    setPickerSymbol(null);
    setPickerBusy(false);
    setPickerError(null);
    setPickerDraftName('');
    setPickerCreateMode(false);
  }, []);

  const toggleSaved = useCallback(async (symbol: string) => {
    const normalized = normalizeSymbol(symbol);
    if (!normalized) return;

    if (!user) {
      if (symbolsRef.current.includes(normalized)) {
        await removeCoin(normalized);
      } else {
        await saveCoin(normalized);
      }
      return;
    }

    openSavePicker(normalized);
  }, [openSavePicker, removeCoin, saveCoin, user]);

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const localSymbols = await readLocalSymbols();
      if (!user) {
        setMode('guest');
        setSyncState('idle');
        setLocalGuestState(localSymbols);
        return;
      }

      setMode('account');
      setSyncState('syncing');
      const syncedWatchlists = await syncWithAccount(user.id, localSymbols);
      await applyRemoteWatchlists(syncedWatchlists);
      setSyncState('idle');
    } catch {
      setSyncState('error');
    } finally {
      setLoading(false);
    }
  }, [applyRemoteWatchlists, setLocalGuestState, syncWithAccount, user]);

  const handlePickerToggleWatchlist = useCallback(async (watchlistId: string) => {
    if (!pickerSymbol || pickerBusy) return;

    setPickerBusy(true);
    setPickerError(null);

    try {
      if (isSaved(pickerSymbol, watchlistId)) {
        await removeCoin(pickerSymbol, watchlistId);
      } else {
        await saveCoin(pickerSymbol, watchlistId);
      }
    } catch (err: any) {
      setPickerError(err?.message ?? 'Could not update watchlists.');
    } finally {
      setPickerBusy(false);
    }
  }, [isSaved, pickerBusy, pickerSymbol, removeCoin, saveCoin]);

  const handlePickerCreateWatchlist = useCallback(async () => {
    if (!pickerSymbol || pickerBusy) return;
    const trimmed = pickerDraftName.trim();
    if (!trimmed) return;

    setPickerBusy(true);
    setPickerError(null);

    try {
      const created = await createWatchlist(trimmed);
      if (created?.id) {
        await saveCoin(pickerSymbol, created.id);
        closeSavePicker();
      }
      setPickerDraftName('');
    } catch (err: any) {
      setPickerError(err?.message ?? 'Could not create watchlist.');
    } finally {
      setPickerBusy(false);
    }
  }, [closeSavePicker, createWatchlist, pickerBusy, pickerDraftName, pickerSymbol, saveCoin]);

  const handlePickerCreateDefaultWatchlist = useCallback(async () => {
    if (!pickerSymbol || pickerBusy) return;

    setPickerBusy(true);
    setPickerError(null);

    try {
      const created = await createWatchlist(DEFAULT_WATCHLIST_NAME);
      if (created?.id) {
        await saveCoin(pickerSymbol, created.id);
        closeSavePicker();
      }
    } catch (err: any) {
      setPickerError(err?.message ?? 'Could not create watchlist.');
    } finally {
      setPickerBusy(false);
    }
  }, [closeSavePicker, createWatchlist, pickerBusy, pickerSymbol, saveCoin]);

  const value = useMemo<WatchlistContextValue>(() => ({
    symbols,
    loading,
    mode,
    syncState,
    watchlists,
    defaultWatchlistId,
    isSaved,
    getWatchlistsForSymbol,
    saveCoin,
    removeCoin,
    toggleSaved,
    reload,
    createWatchlist,
    renameWatchlist,
    deleteWatchlist,
    openSavePicker,
    closeSavePicker,
  }), [
    closeSavePicker,
    createWatchlist,
    defaultWatchlistId,
    deleteWatchlist,
    getWatchlistsForSymbol,
    isSaved,
    loading,
    mode,
    openSavePicker,
    reload,
    removeCoin,
    renameWatchlist,
    saveCoin,
    symbols,
    syncState,
    toggleSaved,
    watchlists,
  ]);

  return (
    <>
      <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>

      <Modal animationType="slide" transparent visible={Boolean(pickerSymbol && user)} onRequestClose={closeSavePicker}>
        <Pressable style={styles.backdrop} onPress={closeSavePicker} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}> 
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 18 }}>
            Save to...
          </ThemedText>

          {watchlists.length ? (
            <View style={styles.sheetList}>
              {watchlists.map((watchlist) => {
                const selected = pickerSymbol ? isSaved(pickerSymbol, watchlist.id) : false;
                const initials = watchlist.name.slice(0, 2).toUpperCase();
                const subtitle = watchlist.isDefault
                  ? 'Private · Default'
                  : `Private · ${watchlist.symbols.length} coin${watchlist.symbols.length === 1 ? '' : 's'}`;
                return (
                  <TouchableOpacity
                    key={watchlist.id}
                    style={[styles.sheetRow, { borderColor: colors.border }]}
                    onPress={() => handlePickerToggleWatchlist(watchlist.id)}
                    disabled={pickerBusy}
                  >
                    <View style={[styles.sheetThumb, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                      <ThemedText style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>
                        {initials}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>
                        {watchlist.name}
                      </ThemedText>
                      <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>
                        {subtitle}
                      </ThemedText>
                    </View>
                    <IconSymbol
                      name={selected ? 'bookmark.fill' : 'bookmark'}
                      size={22}
                      color={selected ? colors.primary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyCreateCard, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
              <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>
                No watchlists yet
              </ThemedText>
              <ThemedText style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
                Create a basic watchlist now, or name your first watchlist before saving this coin.
              </ThemedText>
              <View style={styles.createActionsRow}>
                <TouchableOpacity
                  style={[styles.secondaryActionButton, { borderColor: colors.border }]}
                  disabled={pickerBusy}
                  onPress={handlePickerCreateDefaultWatchlist}
                >
                  <ThemedText style={{ color: colors.text, fontWeight: '700' }}>Create basic</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.createButton, { backgroundColor: colors.primary, opacity: pickerBusy ? 0.7 : 1 }]}
                  disabled={pickerBusy}
                  onPress={() => {
                    setPickerCreateMode(true);
                    setPickerError(null);
                  }}
                >
                  <ThemedText style={{ color: colors.primaryText, fontWeight: '700' }}>Name your own</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {pickerCreateMode ? (
            <View style={[styles.createCard, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}> 
              <TextInput
                value={pickerDraftName}
                onChangeText={setPickerDraftName}
                placeholder="New watchlist name"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
              <View style={styles.createActionsRow}>
                <TouchableOpacity
                  style={[styles.secondaryActionButton, { borderColor: colors.border }]}
                  disabled={pickerBusy}
                  onPress={() => {
                    setPickerCreateMode(false);
                    setPickerDraftName('');
                    setPickerError(null);
                  }}
                >
                  <ThemedText style={{ color: colors.text, fontWeight: '700' }}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.createButton, { backgroundColor: colors.primary, opacity: pickerBusy ? 0.7 : 1 }]}
                  disabled={pickerBusy}
                  onPress={handlePickerCreateWatchlist}
                >
                  <ThemedText style={{ color: colors.primaryText, fontWeight: '700' }}>Create</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : watchlists.length ? (
            <TouchableOpacity
              style={[styles.newWatchlistButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              disabled={pickerBusy}
              onPress={() => {
                setPickerCreateMode(true);
                setPickerError(null);
              }}
            >
              <IconSymbol name="plus.circle.fill" size={20} color={colors.text} />
              <ThemedText style={{ color: colors.text, fontWeight: '700' }}>New watchlist</ThemedText>
            </TouchableOpacity>
          ) : null}

          {pickerError ? (
            <ThemedText style={{ color: colors.danger, marginTop: 10 }}>{pickerError}</ThemedText>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    gap: 12,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetList: {
    gap: 6,
    marginTop: 2,
  },
  sheetRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  createCard: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  emptyCreateCard: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  createButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    flex: 1,
  },
  createActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionButton: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    flex: 1,
  },
  newWatchlistButton: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 10,
  },
});
