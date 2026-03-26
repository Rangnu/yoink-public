import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/utils/supabase';

type ActivityEventType =
  | 'view_coin'
  | 'save_coin'
  | 'unsave_coin'
  | 'signed_in'
  | 'signed_out';

export type ActivityEvent = {
  id: string;
  eventType: ActivityEventType;
  entityType: 'coin' | 'watchlist' | 'auth';
  entityId: string;
  title?: string | null;
  subtitle?: string | null;
  meta?: Record<string, any>;
  createdAt: string;
  synced?: boolean;
};

type RecordActivityInput = {
  eventType: ActivityEventType;
  entityType: ActivityEvent['entityType'];
  entityId: string;
  title?: string | null;
  subtitle?: string | null;
  meta?: Record<string, any>;
  createdAt?: string;
};

type ActivityContextValue = {
  events: ActivityEvent[];
  loading: boolean;
  recordEvent: (input: RecordActivityInput) => Promise<void>;
  reload: () => Promise<void>;
};

const STORAGE_KEY = 'activity_events_v1';
const MAX_LOCAL_EVENTS = 200;

const ActivityContext = createContext<ActivityContextValue | undefined>(undefined);

function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = Math.random() * 16 | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

function sortByCreatedDesc(events: ActivityEvent[]) {
  return [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function mergeEvents(...collections: ActivityEvent[][]) {
  const merged = new Map<string, ActivityEvent>();
  for (const event of collections.flat()) {
    const existing = merged.get(event.id);
    if (!existing || new Date(event.createdAt).getTime() >= new Date(existing.createdAt).getTime()) {
      merged.set(event.id, event);
    }
  }
  return sortByCreatedDesc(Array.from(merged.values())).slice(0, MAX_LOCAL_EVENTS);
}

async function readLocalEvents() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return sortByCreatedDesc(
      parsed
        .filter(Boolean)
        .map((event) => ({
          ...event,
          createdAt: String(event.createdAt),
        })) as ActivityEvent[]
    ).slice(0, MAX_LOCAL_EVENTS);
  } catch {
    return [];
  }
}

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const localEventsRef = useRef<ActivityEvent[]>([]);
  const prevUserIdRef = useRef<string | null>(null);

  const persistLocalEvents = useCallback(async (nextEvents: ActivityEvent[]) => {
    const capped = sortByCreatedDesc(nextEvents).slice(0, MAX_LOCAL_EVENTS);
    localEventsRef.current = capped;
    setEvents((current) => mergeEvents(capped, current));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(capped)).catch(() => {
      // keep UI usable if persistence fails
    });
  }, []);

  const pushRemote = useCallback(
    async (event: ActivityEvent, userId: string) => {
      const { error } = await supabase.from('activity_events').upsert(
        {
          id: event.id,
          user_id: userId,
          event_type: event.eventType,
          entity_type: event.entityType,
          entity_id: event.entityId,
          title: event.title ?? null,
          subtitle: event.subtitle ?? null,
          meta: event.meta ?? {},
          created_at: event.createdAt,
        },
        { onConflict: 'id' }
      );

      if (error) throw error;
    },
    []
  );

  const loadRemote = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('activity_events')
      .select('id, event_type, entity_type, entity_id, title, subtitle, meta, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_LOCAL_EVENTS);

    if (error) throw error;

    return ((data ?? []) as any[]).map<ActivityEvent>((row) => ({
      id: row.id,
      eventType: row.event_type,
      entityType: row.entity_type,
      entityId: row.entity_id,
      title: row.title,
      subtitle: row.subtitle,
      meta: row.meta ?? {},
      createdAt: row.created_at,
      synced: true,
    }));
  }, []);

  const syncLocalToRemote = useCallback(
    async (userId: string, localEvents: ActivityEvent[]) => {
      const unsynced = localEvents.filter((event) => !event.synced);
      if (!unsynced.length) return localEvents;

      for (const event of unsynced) {
        await pushRemote(event, userId);
      }

      return localEvents.map((event) => ({ ...event, synced: true }));
    },
    [pushRemote]
  );

  useEffect(() => {
    let active = true;

    readLocalEvents()
      .then((localEvents) => {
        if (!active) return;
        localEventsRef.current = localEvents;
        setEvents(localEvents);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const localEvents = await readLocalEvents();

      if (!user) {
        localEventsRef.current = localEvents;
        setEvents(localEvents);
        return;
      }

      const syncedLocal = await syncLocalToRemote(user.id, localEvents);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(syncedLocal)).catch(() => {});
      const remoteEvents = await loadRemote(user.id);
      const merged = mergeEvents(syncedLocal, remoteEvents);
      localEventsRef.current = syncedLocal;
      setEvents(merged);
    } finally {
      setLoading(false);
    }
  }, [loadRemote, syncLocalToRemote, user]);

  useEffect(() => {
    if (authLoading) return;
    reload();
  }, [authLoading, reload]);

  const recordEvent = useCallback(
    async ({ createdAt, ...input }: RecordActivityInput) => {
      const nextEvent: ActivityEvent = {
        id: generateUuid(),
        createdAt: createdAt ?? new Date().toISOString(),
        synced: false,
        ...input,
      };

      const nextLocalEvents = [nextEvent, ...localEventsRef.current];
      await persistLocalEvents(nextLocalEvents);

      if (user) {
        try {
          await pushRemote(nextEvent, user.id);
          const updatedLocalEvents = localEventsRef.current.map((event) =>
            event.id === nextEvent.id ? { ...event, synced: true } : event
          );
          await persistLocalEvents(updatedLocalEvents);
          const remoteEvents = await loadRemote(user.id);
          setEvents(mergeEvents(updatedLocalEvents, remoteEvents));
        } catch {
          // keep local event when remote sync fails
        }
      }
    },
    [loadRemote, persistLocalEvents, pushRemote, user]
  );

  useEffect(() => {
    if (authLoading) return;

    const previousUserId = prevUserIdRef.current;
    const currentUserId = user?.id ?? null;

    if (!previousUserId && currentUserId) {
      void recordEvent({
        eventType: 'signed_in',
        entityType: 'auth',
        entityId: currentUserId,
        title: 'Signed in',
        subtitle: user?.email ?? 'Authenticated session started',
      });
    } else if (previousUserId && !currentUserId) {
      void recordEvent({
        eventType: 'signed_out',
        entityType: 'auth',
        entityId: previousUserId,
        title: 'Signed out',
        subtitle: 'Session ended on this device',
      });
    }

    prevUserIdRef.current = currentUserId;
  }, [authLoading, recordEvent, user]);

  const value = useMemo<ActivityContextValue>(
    () => ({
      events,
      loading,
      recordEvent,
      reload,
    }),
    [events, loading, recordEvent, reload]
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}
