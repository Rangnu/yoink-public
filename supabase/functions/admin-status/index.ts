// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2';

type IngestRunRow = {
  id: number;
  status: string;
  started_at: string;
  finished_at: string | null;
  error: string | null;
};

type AllowlistResolution =
  | { allowed: true; source: 'table' | 'secret' }
  | { allowed: false; source: 'table' | 'secret' | 'missing'; code: string; error: string };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ADMIN_EMAILS = (Deno.env.get('ADMIN_EMAILS') ?? Deno.env.get('EXPO_PUBLIC_ADMIN_EMAILS') ?? '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isAllowedAdmin(email?: string | null) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

async function resolveAdminAccess(adminClient, email) {
  const normalizedEmail = (email ?? '').trim().toLowerCase();

  const { data: allowlistRow, error: allowlistError } = await adminClient
    .from('admin_allowlist')
    .select('email, active')
    .eq('email', normalizedEmail)
    .eq('active', true)
    .maybeSingle();

  if (!allowlistError) {
    if (allowlistRow?.email) {
      return { allowed: true, source: 'table' };
    }

    return {
      allowed: false,
      source: 'table',
      code: 'admin_access_denied',
      error: 'Admin access denied.',
    };
  }

  if (allowlistError.code !== 'PGRST205' && allowlistError.code !== '42P01') {
    return {
      allowed: false,
      source: 'missing',
      code: 'admin_query_failed',
      error: allowlistError.message,
    };
  }

  if (ADMIN_EMAILS.length === 0) {
    return {
      allowed: false,
      source: 'missing',
      code: 'admin_allowlist_missing',
      error: 'Admin allowlist is not configured on the backend.',
    };
  }

  if (isAllowedAdmin(normalizedEmail)) {
    return { allowed: true, source: 'secret' };
  }

  return {
    allowed: false,
    source: 'secret',
    code: 'admin_access_denied',
    error: 'Admin access denied.',
  };
}

async function countUsers(adminClient) {
  const perPage = 1000;
  let page = 1;
  let total = 0;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users ?? [];
    total += users.length;
    if (users.length < perPage) break;
    page += 1;
    if (page > 1000) break;
  }

  return total;
}

function buildTopSavedCoins(watchlistsRows, itemRows) {
  const userIdByWatchlistId = new Map((watchlistsRows ?? []).map((row) => [row.id, row.user_id]));
  const savesByCoinId = new Map();

  for (const item of itemRows ?? []) {
    const userId = userIdByWatchlistId.get(item.watchlist_id);
    const entry = savesByCoinId.get(item.coin_id) ?? {
      coinId: item.coin_id,
      saveCount: 0,
      users: new Set(),
    };
    entry.saveCount += 1;
    if (userId) entry.users.add(userId);
    savesByCoinId.set(item.coin_id, entry);
  }

  return [...savesByCoinId.values()]
    .map((entry) => ({
      coinId: entry.coinId,
      saveCount: entry.saveCount,
      userCount: entry.users.size,
    }))
    .sort((a, b) => {
      if (b.userCount !== a.userCount) return b.userCount - a.userCount;
      return b.saveCount - a.saveCount;
    })
    .slice(0, 8);
}

Deno.serve(async (req: Request) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: 'Missing Supabase environment variables.', code: 'admin_env_missing' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing Authorization header.', code: 'admin_auth_missing' }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(token);

    if (userError || !user) {
      return json({ error: userError?.message ?? 'Unable to resolve user.', code: 'admin_auth_invalid' }, 401);
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const allowlist = await resolveAdminAccess(adminClient, user.email);

    if (!allowlist.allowed) {
      return json({ error: allowlist.error, code: allowlist.code }, allowlist.code === 'admin_allowlist_missing' ? 503 : allowlist.code === 'admin_query_failed' ? 500 : 403);
    }

    const [
      usersCountResult,
      { count: coinsCount, error: coinsError },
      { count: snapshotsCount, error: snapshotsError },
      { count: whaleMetricsCount, error: whaleMetricsError },
      { count: topTradersCount, error: topTradersError },
      { count: activityEventsCount, error: activityEventsError },
      { data: latestSnapshot, error: latestSnapshotError },
      { data: ingestRuns, error: ingestRunsError },
      { data: watchlistsRows, error: watchlistsError },
      { data: watchlistItemsRows, error: watchlistItemsError },
    ] = await Promise.all([
      countUsers(adminClient).then((count) => ({ count })).catch((error) => ({ count: null, error })),
      adminClient.from('coins').select('id', { count: 'planned', head: true }),
      adminClient.from('coin_snapshots').select('id', { count: 'planned', head: true }),
      adminClient.from('coin_whale_metrics').select('id', { count: 'planned', head: true }),
      adminClient.from('coin_top_traders').select('id', { count: 'planned', head: true }),
      adminClient.from('activity_events').select('id', { count: 'planned', head: true }),
      adminClient
        .from('coin_snapshots')
        .select('ts')
        .order('ts', { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminClient
        .from('ingest_runs')
        .select('id, status, started_at, finished_at, error')
        .order('started_at', { ascending: false })
        .limit(30),
      adminClient.from('watchlists').select('id, user_id, name, is_default, updated_at').order('updated_at', { ascending: false }),
      adminClient.from('watchlist_items').select('watchlist_id, coin_id, created_at'),
    ]);

    const firstError = [
      usersCountResult.error,
      coinsError,
      snapshotsError,
      whaleMetricsError,
      topTradersError,
      activityEventsError,
      latestSnapshotError,
      ingestRunsError,
      watchlistsError,
      watchlistItemsError,
    ].find(Boolean);

    if (firstError) {
      return json({ error: firstError.message, code: 'admin_query_failed' }, 500);
    }

    const runs = (ingestRuns ?? []) as IngestRunRow[];
    const lastRun = runs[0] ?? null;
    const isSuccessStatus = (status) => status === 'success' || status === 'ok';
    const lastSuccess = runs.find((run) => isSuccessStatus(run.status)) ?? null;
    const lastFailure = runs.find((run) => !isSuccessStatus(run.status) && run.status !== 'running') ?? null;
    const failedRuns24h = runs.filter((run) => {
      if (isSuccessStatus(run.status) || run.status === 'running') return false;
      const startedAt = new Date(run.started_at).getTime();
      return Date.now() - startedAt <= 24 * 60 * 60 * 1000;
    }).length;

    const watchlists = watchlistsRows ?? [];
    const watchlistItems = watchlistItemsRows ?? [];
    const watchlistUsersCount = new Set(watchlists.map((row) => row.user_id).filter(Boolean)).size;
    const topSavedBase = buildTopSavedCoins(watchlists, watchlistItems);
    const topSavedCoinIds = topSavedBase.map((row) => row.coinId).filter(Boolean);
    const coinMetaById = new Map();

    if (topSavedCoinIds.length) {
      const { data: topCoins, error: topCoinsError } = await adminClient
        .from('coins')
        .select('id, symbol, name')
        .in('id', topSavedCoinIds);

      if (topCoinsError) {
        return json({ error: topCoinsError.message, code: 'admin_query_failed' }, 500);
      }

      for (const coin of topCoins ?? []) {
        coinMetaById.set(coin.id, coin);
      }
    }

    const topSavedCoins = topSavedBase.map((row) => {
      const coin = coinMetaById.get(row.coinId);
      return {
        coinId: row.coinId,
        symbol: coin?.symbol ?? '--',
        name: coin?.name ?? 'Unknown coin',
        saveCount: row.saveCount,
        userCount: row.userCount,
      };
    });

    const watchlistsCount = watchlists.length;
    const watchlistItemsCount = watchlistItems.length;
    const avgWatchlistsPerUser = watchlistUsersCount > 0 ? watchlistsCount / watchlistUsersCount : 0;
    const avgItemsPerWatchlist = watchlistsCount > 0 ? watchlistItemsCount / watchlistsCount : 0;

    return json({
      actor: {
        email: user.email ?? null,
      },
      source: 'edge-function',
      admin: {
        allowlistConfigured: allowlist.source !== 'missing',
        allowlistSource: allowlist.source,
      },
      ingest: {
        runCount: runs.length,
        recentRuns: runs.slice(0, 12),
        lastRun,
        lastSuccess,
        lastFailure,
        failedRuns24h,
      },
      coinData: {
        coinsCount: coinsCount ?? 0,
        snapshotsCount: snapshotsCount ?? 0,
        whaleMetricsCount: whaleMetricsCount ?? 0,
        topTradersCount: topTradersCount ?? 0,
        latestSnapshotTs: latestSnapshot?.ts ?? null,
      },
      ops: {
        usersCount: usersCountResult.count,
        watchlistUsersCount,
        watchlistsCount,
        watchlistItemsCount,
        activityEventsCount: activityEventsCount ?? 0,
        avgWatchlistsPerUser,
        avgItemsPerWatchlist,
        topSavedCoins,
      },
      moderation: {
        available: false,
        reason: 'Community moderation tables are not present yet in the current schema.',
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error), code: 'admin_unhandled_error' }, 500);
  }
});
