import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';

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
const LOCAL_WATCHLISTS_KEY = 'saved_watchlists_v2';
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
  const uniqueSymbols = uniq(symbols);
  return [
    {
      id: LOCAL_WATCHLIST_ID,
      name: DEFAULT_WATCHLIST_NAME,
      isDefault: true,
      symbols: uniqueSymbols,
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

async function readLocalWatchlists() {
  const stored = await AsyncStorage.getItem(LOCAL_WATCHLISTS_KEY);
  if (!stored) {
    const legacySymbols = await readLocalSymbols();
    return buildLocalWatchlists(legacySymbols);
  }

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return sortWatchlists(parsed.map((value: any) => ({
      id: typeof value?.id === 'string' ? value.id : `local-${Date.now()}`,
      name: typeof value?.name === 'string' && value.name.trim() ? value.name.trim() : DEFAULT_WATCHLIST_NAME,
      isDefault: Boolean(value?.isDefault),
      createdAt: typeof value?.createdAt === 'string' ? value.createdAt : undefined,
      updatedAt: typeof value?.updatedAt === 'string' ? value.updatedAt : undefined,
      local: true,
      symbols: Array.isArray(value?.symbols) ? uniq(value.symbols.map((item: any) => String(item))) : [],
    })));
  } catch {
    const legacySymbols = await readLocalSymbols();
    return buildLocalWatchlists(legacySymbols);
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
  const { width: viewportWidth } = useWindowDimensions();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [watchlists, setWatchlists] = useState<WatchlistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<WatchlistMode>('guest');
  const [syncState, setSyncState] = useState<WatchlistSyncState>('idle');
  const [bootstrapped, setBootstrapped] = useState(false);
  const [defaultWatchlistId, setDefaultWatchlistId] = useState<string | null>(null);
  const [pickerSymbol, setPickerSymbol] = useState<string | null>(null);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [pickerDraftName, setPickerDraftName] = useState('');
  const [pickerCreateMode, setPickerCreateMode] = useState(false);
  const symbolsRef = useRef<string[]>([]);
  const watchlistsRef = useRef<WatchlistSummary[]>([]);

  const persistLocalUnion = useCallback(async (nextSymbols: string[]) => {
    const uniqueSymbols = uniq(nextSymbols);
    symbolsRef.current = uniqueSymbols;
    setSymbols(uniqueSymbols);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueSymbols)).catch(() => {
      // keep UI usable even if local persistence fails
    });
  }, []);

  const persistLocalGuestWatchlists = useCallback(async (nextWatchlists: WatchlistSummary[]) => {
    const normalizedBase = nextWatchlists.map((watchlist) => ({
      ...watchlist,
      local: true,
      symbols: uniq(watchlist.symbols),
    }));
    const normalized = sortWatchlists(
      normalizedBase.length
        ? normalizedBase
        : buildLocalWatchlists([])
    );
    const union = unionSymbolsFromWatchlists(normalized);
    symbolsRef.current = union;
    watchlistsRef.current = normalized;
    setSymbols(union);
    setWatchlists(normalized);
    setDefaultWatchlistId(normalized.find((watchlist) => watchlist.isDefault)?.id ?? normalized[0]?.id ?? null);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(union)),
      AsyncStorage.setItem(LOCAL_WATCHLISTS_KEY, JSON.stringify(normalized)),
    ]).catch(() => {
      // keep UI usable even if local persistence fails
    });
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
    const defaultId = await ensureDefaultWatchlist(userId, { allowCreate: true });
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

    readLocalWatchlists()
      .then((localWatchlists) => {
        if (!active) return;
        void persistLocalGuestWatchlists(localWatchlists);
      })
      .finally(() => {
        if (active) {
          setBootstrapped(true);
        }
      });

    return () => {
      active = false;
    };
  }, [persistLocalGuestWatchlists]);

  useEffect(() => {
    if (!bootstrapped || authLoading) return;

    let active = true;

    const sync = async () => {
      if (!user) {
        setMode('guest');
        setSyncState('idle');
        const localWatchlists = await readLocalWatchlists();
        await persistLocalGuestWatchlists(localWatchlists);
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
  }, [applyRemoteWatchlists, authLoading, bootstrapped, persistLocalGuestWatchlists, syncWithAccount, user]);

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
    const trimmed = name.trim();
    if (!trimmed) return null;

    if (!user) {
      const current = watchlistsRef.current;
      const nextWatchlist: WatchlistSummary = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: trimmed,
        isDefault: current.length === 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        symbols: [],
        local: true,
      };
      await persistLocalGuestWatchlists([...current, nextWatchlist]);
      return nextWatchlist;
    }

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
  }, [applyRemoteWatchlists, persistLocalGuestWatchlists, user]);

  const renameWatchlist = useCallback(async (watchlistId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!user) {
      const next = watchlistsRef.current.map((watchlist) =>
        watchlist.id === watchlistId
          ? { ...watchlist, name: trimmed, updatedAt: new Date().toISOString(), local: true }
          : watchlist
      );
      await persistLocalGuestWatchlists(next);
      return;
    }

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
  }, [applyRemoteWatchlists, persistLocalGuestWatchlists, user]);

  const saveCoin = useCallback(async (symbol: string, watchlistId?: string) => {
    const normalized = normalizeSymbol(symbol);
    if (!normalized) return;

    if (!user) {
      const targetWatchlistId = watchlistId ?? defaultWatchlistId ?? null;
      if (!targetWatchlistId) {
        throw new Error('Create a watchlist before saving this coin.');
      }

      const next = watchlistsRef.current.map((watchlist) =>
        watchlist.id === targetWatchlistId
          ? { ...watchlist, updatedAt: new Date().toISOString(), symbols: uniq([normalized, ...watchlist.symbols]), local: true }
          : watchlist
      );
      await persistLocalGuestWatchlists(next);
      await recordEvent({
        eventType: 'save_coin',
        entityType: 'watchlist',
        entityId: normalized,
        title: `Saved ${normalized}`,
        subtitle: 'Added to your local watchlist',
        meta: { symbol: normalized, mode: 'guest', watchlistId: targetWatchlistId },
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
  }, [applyRemoteWatchlists, defaultWatchlistId, ensureDefaultWatchlist, loadRemoteWatchlists, persistLocalGuestWatchlists, recordEvent, user]);

  const removeCoin = useCallback(async (symbol: string, watchlistId?: string) => {
    const normalized = normalizeSymbol(symbol);
    if (!normalized) return;

    if (!user) {
      const targetIds = watchlistId
        ? [watchlistId]
        : watchlistsRef.current.filter((watchlist) => watchlist.symbols.includes(normalized)).map((watchlist) => watchlist.id);
      const next = watchlistsRef.current.map((watchlist) =>
        targetIds.includes(watchlist.id)
          ? { ...watchlist, updatedAt: new Date().toISOString(), symbols: watchlist.symbols.filter((item) => item !== normalized), local: true }
          : watchlist
      );
      await persistLocalGuestWatchlists(next);
      await recordEvent({
        eventType: 'unsave_coin',
        entityType: 'watchlist',
        entityId: normalized,
        title: `Removed ${normalized}`,
        subtitle: 'Removed from your local watchlist',
        meta: { symbol: normalized, mode: 'guest', watchlistIds: targetIds },
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
  }, [applyRemoteWatchlists, persistLocalGuestWatchlists, recordEvent, user]);

  const deleteWatchlist = useCallback(async (watchlistId: string) => {
    const current = watchlistsRef.current;
    const target = current.find((watchlist) => watchlist.id === watchlistId);
    if (!target) return;
    if (current.length <= 1) {
      throw new Error('Keep at least one watchlist.');
    }

    if (!user) {
      let next = current.filter((watchlist) => watchlist.id !== watchlistId);
      if (target.isDefault) {
        next = next.map((watchlist, index) => ({ ...watchlist, isDefault: index === 0 ? true : watchlist.isDefault, local: true }));
      }
      await persistLocalGuestWatchlists(next);
      return;
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
  }, [applyRemoteWatchlists, persistLocalGuestWatchlists, setDefaultWatchlist, user]);

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
    if (!normalized) return;
    setPickerSymbol(normalized);
    setPickerError(null);
    setPickerDraftName('');
    setPickerCreateMode(false);
  }, []);

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
      openSavePicker(normalized);
      return;
    }

    openSavePicker(normalized);
  }, [openSavePicker, user]);

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const localWatchlists = await readLocalWatchlists();
      if (!user) {
        setMode('guest');
        setSyncState('idle');
        await persistLocalGuestWatchlists(localWatchlists);
        return;
      }

      setMode('account');
      setSyncState('syncing');
      const syncedWatchlists = await syncWithAccount(user.id, unionSymbolsFromWatchlists(localWatchlists));
      await applyRemoteWatchlists(syncedWatchlists);
      setSyncState('idle');
    } catch {
      setSyncState('error');
    } finally {
      setLoading(false);
    }
  }, [applyRemoteWatchlists, persistLocalGuestWatchlists, syncWithAccount, user]);

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

  const sheetResponsiveStyle = useMemo(() => {
    if (Platform.OS !== 'web') return null;

    const sheetWidth = Math.max(320, Math.min(430, viewportWidth - 24));
    return {
      left: (viewportWidth - sheetWidth) / 2,
      bottom: 16,
      width: sheetWidth,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    };
  }, [colors.border, viewportWidth]);

  return (
    <>
      <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>

      <Modal animationType="slide" transparent visible={Boolean(pickerSymbol)} onRequestClose={closeSavePicker}>
        <Pressable style={styles.backdrop} onPress={closeSavePicker} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }, sheetResponsiveStyle]}> 
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 18 }}>
            Save to...
          </ThemedText>

          <View style={styles.sheetList}>
            {watchlists.map((watchlist) => {
              const selected = pickerSymbol ? isSaved(pickerSymbol, watchlist.id) : false;
              const initials = watchlist.name.slice(0, 2).toUpperCase();
              const subtitle = watchlist.isDefault
                ? 'Default watchlist'
                : `${watchlist.symbols.length} coin${watchlist.symbols.length === 1 ? '' : 's'}`;
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
          ) : (
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
          )}

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
