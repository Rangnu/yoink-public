import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useActivity } from '@/contexts/activity-context';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/utils/supabase';

type WatchlistMode = 'guest' | 'account';
type WatchlistSyncState = 'idle' | 'syncing' | 'error';

type WatchlistContextValue = {
  symbols: string[];
  loading: boolean;
  mode: WatchlistMode;
  syncState: WatchlistSyncState;
  isSaved: (symbol: string) => boolean;
  saveCoin: (symbol: string) => Promise<void>;
  removeCoin: (symbol: string) => Promise<void>;
  toggleSaved: (symbol: string) => Promise<void>;
  reload: () => Promise<void>;
};

const STORAGE_KEY = 'saved_coin_symbols_v1';
const DEFAULT_WATCHLIST_NAME = 'Saved';

const WatchlistContext = createContext<WatchlistContextValue | undefined>(undefined);

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function uniq(values: string[]) {
  return Array.from(new Set(values.map((value) => normalizeSymbol(value)).filter(Boolean)));
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
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<WatchlistMode>('guest');
  const [syncState, setSyncState] = useState<WatchlistSyncState>('idle');
  const [bootstrapped, setBootstrapped] = useState(false);
  const [defaultWatchlistId, setDefaultWatchlistId] = useState<string | null>(null);
  const symbolsRef = useRef<string[]>([]);

  const persistLocalSymbols = useCallback(async (nextSymbols: string[]) => {
    const uniqueSymbols = uniq(nextSymbols);
    symbolsRef.current = uniqueSymbols;
    setSymbols(uniqueSymbols);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueSymbols)).catch(() => {
      // keep UI usable even if local persistence fails
    });
  }, []);

  const ensureDefaultWatchlist = useCallback(
    async (userId: string) => {
      if (defaultWatchlistId) return defaultWatchlistId;

      const { data: existing, error: existingError } = await supabase
        .from('watchlists')
        .select('id')
        .eq('user_id', userId)
        .eq('is_default', true)
        .limit(1)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing?.id) {
        setDefaultWatchlistId(existing.id);
        return existing.id;
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

      if (insertError) {
        const { data: retryExisting, error: retryError } = await supabase
          .from('watchlists')
          .select('id')
          .eq('user_id', userId)
          .eq('is_default', true)
          .limit(1)
          .maybeSingle();

        if (retryError) throw retryError;
        if (!retryExisting?.id) throw insertError;
        setDefaultWatchlistId(retryExisting.id);
        return retryExisting.id;
      }

      setDefaultWatchlistId(inserted.id);
      return inserted.id;
    },
    [defaultWatchlistId]
  );

  const loadRemoteSymbols = useCallback(async (watchlistId: string) => {
    const { data: itemRows, error: itemError } = await supabase
      .from('watchlist_items')
      .select('coin_id, created_at')
      .eq('watchlist_id', watchlistId)
      .order('created_at', { ascending: false });

    if (itemError) throw itemError;
    if (!itemRows?.length) return [];

    const orderedCoinIds = itemRows.map((row) => row.coin_id);

    const { data: coinRows, error: coinError } = await supabase
      .from('coins')
      .select('id, symbol')
      .in('id', orderedCoinIds);

    if (coinError) throw coinError;

    const symbolByCoinId = new Map((coinRows ?? []).map((row) => [row.id, normalizeSymbol(row.symbol)]));
    return uniq(orderedCoinIds.map((coinId) => symbolByCoinId.get(coinId) ?? '').filter(Boolean));
  }, []);

  const addRemoteSymbol = useCallback(
    async (watchlistId: string, symbol: string) => {
      const coinId = await resolveCoinIdBySymbol(symbol);
      if (!coinId) return;

      const { error } = await supabase
        .from('watchlist_items')
        .upsert(
          {
            watchlist_id: watchlistId,
            coin_id: coinId,
          },
          { onConflict: 'watchlist_id,coin_id' }
        );

      if (error) throw error;
    },
    []
  );

  const removeRemoteSymbol = useCallback(async (watchlistId: string, symbol: string) => {
    const coinId = await resolveCoinIdBySymbol(symbol);
    if (!coinId) return;

    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('watchlist_id', watchlistId)
      .eq('coin_id', coinId);

    if (error) throw error;
  }, []);

  const syncWithAccount = useCallback(
    async (userId: string, localSymbols: string[]) => {
      const watchlistId = await ensureDefaultWatchlist(userId);
      const remoteSymbols = await loadRemoteSymbols(watchlistId);
      const mergedSymbols = uniq([...localSymbols, ...remoteSymbols]);
      const missingRemoteSymbols = mergedSymbols.filter((symbol) => !remoteSymbols.includes(symbol));

      for (const symbol of missingRemoteSymbols) {
        await addRemoteSymbol(watchlistId, symbol);
      }

      return mergedSymbols;
    },
    [addRemoteSymbol, ensureDefaultWatchlist, loadRemoteSymbols]
  );

  useEffect(() => {
    let active = true;

    readLocalSymbols()
      .then((localSymbols) => {
        if (!active) return;
        symbolsRef.current = localSymbols;
        setSymbols(localSymbols);
      })
      .finally(() => {
        if (active) {
          setBootstrapped(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!bootstrapped || authLoading) return;

    let active = true;

    const sync = async () => {
      if (!user) {
        setMode('guest');
        setDefaultWatchlistId(null);
        setSyncState('idle');
        setLoading(false);
        return;
      }

      setMode('account');
      setSyncState('syncing');

      try {
        const syncedSymbols = await syncWithAccount(user.id, symbolsRef.current);
        if (!active) return;
        await persistLocalSymbols(syncedSymbols);
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
  }, [authLoading, bootstrapped, persistLocalSymbols, syncWithAccount, user]);

  const syncRemoteMutation = useCallback(
    async (symbol: string, action: 'add' | 'remove') => {
      if (!user) return;

      setMode('account');
      setSyncState('syncing');

      try {
        const watchlistId = await ensureDefaultWatchlist(user.id);
        if (action === 'add') {
          await addRemoteSymbol(watchlistId, symbol);
        } else {
          await removeRemoteSymbol(watchlistId, symbol);
        }
        setSyncState('idle');
      } catch {
        setSyncState('error');
      }
    },
    [addRemoteSymbol, ensureDefaultWatchlist, removeRemoteSymbol, user]
  );

  const saveCoin = useCallback(
    async (symbol: string) => {
      const normalized = normalizeSymbol(symbol);
      if (!normalized) return;
      const nextSymbols = symbolsRef.current.includes(normalized)
        ? symbolsRef.current
        : [normalized, ...symbolsRef.current];
      await persistLocalSymbols(nextSymbols);
      await syncRemoteMutation(normalized, 'add');
      await recordEvent({
        eventType: 'save_coin',
        entityType: 'watchlist',
        entityId: normalized,
        title: `Saved ${normalized}`,
        subtitle: user ? 'Added to your synced watchlist' : 'Added to your local watchlist',
        meta: { symbol: normalized, mode: user ? 'account' : 'guest' },
      });
    },
    [persistLocalSymbols, recordEvent, syncRemoteMutation, user]
  );

  const removeCoin = useCallback(
    async (symbol: string) => {
      const normalized = normalizeSymbol(symbol);
      if (!normalized) return;
      const nextSymbols = symbolsRef.current.filter((item) => item !== normalized);
      await persistLocalSymbols(nextSymbols);
      await syncRemoteMutation(normalized, 'remove');
      await recordEvent({
        eventType: 'unsave_coin',
        entityType: 'watchlist',
        entityId: normalized,
        title: `Removed ${normalized}`,
        subtitle: user ? 'Removed from your synced watchlist' : 'Removed from your local watchlist',
        meta: { symbol: normalized, mode: user ? 'account' : 'guest' },
      });
    },
    [persistLocalSymbols, recordEvent, syncRemoteMutation, user]
  );

  const toggleSaved = useCallback(
    async (symbol: string) => {
      const normalized = normalizeSymbol(symbol);
      if (!normalized) return;
      if (symbolsRef.current.includes(normalized)) {
        await removeCoin(normalized);
      } else {
        await saveCoin(normalized);
      }
    },
    [removeCoin, saveCoin]
  );

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const localSymbols = await readLocalSymbols();
      if (!user) {
        setMode('guest');
        setSyncState('idle');
        await persistLocalSymbols(localSymbols);
        return;
      }

      setMode('account');
      setSyncState('syncing');
      const syncedSymbols = await syncWithAccount(user.id, localSymbols);
      await persistLocalSymbols(syncedSymbols);
      setSyncState('idle');
    } catch {
      setSyncState('error');
    } finally {
      setLoading(false);
    }
  }, [persistLocalSymbols, syncWithAccount, user]);

  const value = useMemo<WatchlistContextValue>(() => {
    const isSaved = (symbol: string) => symbols.includes(normalizeSymbol(symbol));

    return {
      symbols,
      loading,
      mode,
      syncState,
      isSaved,
      saveCoin,
      removeCoin,
      toggleSaved,
      reload,
    };
  }, [loading, mode, reload, removeCoin, saveCoin, symbols, syncState, toggleSaved]);

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
