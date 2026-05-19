// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2';

type IngestRunRow = {
  id: number;
  status: string;
  started_at: string;
  finished_at: string | null;
  error: string | null;
};

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

    if (ADMIN_EMAILS.length === 0) {
      return json({ error: 'Admin allowlist is not configured on the backend.', code: 'admin_allowlist_missing' }, 503);
    }

    if (!isAllowedAdmin(user.email)) {
      return json({ error: 'Admin access denied.', code: 'admin_access_denied' }, 403);
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [
      { count: coinsCount, error: coinsError },
      { count: snapshotsCount, error: snapshotsError },
      { count: whaleMetricsCount, error: whaleMetricsError },
      { count: topTradersCount, error: topTradersError },
      { count: watchlistsCount, error: watchlistsError },
      { count: watchlistItemsCount, error: watchlistItemsError },
      { count: activityEventsCount, error: activityEventsError },
      { data: latestSnapshot, error: latestSnapshotError },
      { data: ingestRuns, error: ingestRunsError },
    ] = await Promise.all([
      adminClient.from('coins').select('id', { count: 'exact', head: true }),
      adminClient.from('coin_snapshots').select('id', { count: 'exact', head: true }),
      adminClient.from('coin_whale_metrics').select('id', { count: 'exact', head: true }),
      adminClient.from('coin_top_traders').select('id', { count: 'exact', head: true }),
      adminClient.from('watchlists').select('id', { count: 'exact', head: true }),
      adminClient.from('watchlist_items').select('id', { count: 'exact', head: true }),
      adminClient.from('activity_events').select('id', { count: 'exact', head: true }),
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
    ]);

    const firstError = [
      coinsError,
      snapshotsError,
      whaleMetricsError,
      topTradersError,
      watchlistsError,
      watchlistItemsError,
      activityEventsError,
      latestSnapshotError,
      ingestRunsError,
    ].find(Boolean);

    if (firstError) {
      return json({ error: firstError.message, code: 'admin_query_failed' }, 500);
    }

    const runs = (ingestRuns ?? []) as IngestRunRow[];
    const lastRun = runs[0] ?? null;
    const lastSuccess = runs.find((run) => run.status === 'success') ?? null;
    const lastFailure = runs.find((run) => run.status !== 'success' && run.status !== 'running') ?? null;
    const failedRuns24h = runs.filter((run) => {
      if (run.status === 'success' || run.status === 'running') return false;
      const startedAt = new Date(run.started_at).getTime();
      return Date.now() - startedAt <= 24 * 60 * 60 * 1000;
    }).length;

    return json({
      actor: {
        email: user.email ?? null,
      },
      source: 'edge-function',
      admin: {
        allowlistConfigured: ADMIN_EMAILS.length > 0,
      },
      ingest: {
        runCount: runs.length,
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
        watchlistsCount: watchlistsCount ?? 0,
        watchlistItemsCount: watchlistItemsCount ?? 0,
        activityEventsCount: activityEventsCount ?? 0,
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
