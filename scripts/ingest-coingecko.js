#!/usr/bin/env node

// Simple CoinGecko → Supabase worker for Yoink MVP.
// - Uses .env values: supabase_yoink_url, supabase_yoink_anon_key, COIN_GECKO_API_KEY
// - Every 5 minutes: fetches top 30 coins by market cap and writes snapshots into Supabase.

const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root when run via `npm run ingest`
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.supabase_yoink_url;
const SUPABASE_ANON_KEY = process.env.supabase_yoink_anon_key;
// Prefer a service-role key when available so ingest is not constrained by RLS.
// EXPO_PUBLIC_SUPABASE_ROLE_KEY is used here only in this Node script and must
// never be referenced from the client app code.
const SUPABASE_SERVICE_ROLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const COIN_GECKO_API_KEY = process.env.COIN_GECKO_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[ingest] Missing supabase_yoink_url or Supabase key in .env');
  process.exit(1);
}

if (!COIN_GECKO_API_KEY) {
  console.error('[ingest] Missing COIN_GECKO_API_KEY in .env');
  process.exit(1);
}
let supabase;
async function getSupabase() {
  if (!supabase) {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });
  }
  return supabase;
}

// Prefer global fetch (Node 18+). Fallback to node-fetch via dynamic import.
const fetchFn = globalThis.fetch
  ? globalThis.fetch.bind(globalThis)
  : (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Number of top coins to fetch per run. One API call per 5 minutes.
// We can safely increase this (CoinGecko allows up to ~250 per_page) without
// affecting our monthly call budget, since calls_per_run stays at 1.
const TOP_N = 120;
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchTopMarkets() {
  const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
  url.searchParams.set('vs_currency', 'usd');
  url.searchParams.set('order', 'market_cap_desc');
  url.searchParams.set('per_page', String(TOP_N));
  url.searchParams.set('page', '1');
  url.searchParams.set('sparkline', 'false');
  url.searchParams.set('price_change_percentage', '1h,24h,7d');

  const res = await fetchFn(url.toString(), {
    headers: {
      'x-cg-demo-api-key': COIN_GECKO_API_KEY,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CoinGecko error ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error('Unexpected CoinGecko response format');
  }

  return data;
}

async function upsertCoins(markets) {
  const supabase = await getSupabase();
  const rows = markets.map((m) => ({
    coingecko_id: m.id,
    symbol: (m.symbol || '').toUpperCase(),
    name: m.name,
    rank: m.market_cap_rank ?? null,
    is_tracked: true,
  }));

  const { error } = await supabase
    .from('coins')
    .upsert(rows, { onConflict: 'coingecko_id' });

  if (error) {
    throw new Error(`[Supabase] upsert coins failed: ${error.message}`);
  }
}

async function insertSnapshots(markets, tsIso) {
  const supabase = await getSupabase();
  const ids = markets.map((m) => m.id);

  const { data: coinsRows, error: coinsErr } = await supabase
    .from('coins')
    .select('id, coingecko_id')
    .in('coingecko_id', ids);

  if (coinsErr) {
    throw new Error(`[Supabase] select coins failed: ${coinsErr.message}`);
  }

  const idByCgId = new Map(coinsRows.map((row) => [row.coingecko_id, row.id]));

  const snapshots = markets
    .map((m) => {
      const coinId = idByCgId.get(m.id);
      if (!coinId) return null;

      return {
        coin_id: coinId,
        ts: tsIso,
        price_usd: m.current_price ?? null,
        market_cap_usd: m.market_cap ?? null,
        volume_24h_usd: m.total_volume ?? null,
        change_1h_pct: m.price_change_percentage_1h_in_currency ?? null,
        change_24h_pct: m.price_change_percentage_24h_in_currency ?? null,
        change_7d_pct: m.price_change_percentage_7d_in_currency ?? null,
        raw: m,
      };
    })
    .filter(Boolean);

  if (!snapshots.length) {
    console.log('[ingest] No snapshots to insert');
    return;
  }

  const { error } = await supabase
    .from('coin_snapshots')
    .insert(snapshots);

  if (error) {
    throw new Error(`[Supabase] insert coin_snapshots failed: ${error.message}`);
  }

  console.log(`[ingest] Inserted ${snapshots.length} coin_snapshots rows`);
}

async function recordRun(status, startedAt, finishedAt, errorText) {
  try {
    const supabase = await getSupabase();
    await supabase.from('ingest_runs').insert({
      status,
      started_at: startedAt,
      finished_at: finishedAt,
      error: errorText ?? null,
    });
  } catch (err) {
    console.warn('[ingest] Failed to write ingest_runs row:', err.message);
  }
}

async function runOnce() {
  const started = new Date();
  const startedIso = started.toISOString();
  console.log(`\n[ingest] Run started at ${startedIso}`);

  try {
    const markets = await fetchTopMarkets();
    console.log(`[ingest] Fetched ${markets.length} markets from CoinGecko`);

    await upsertCoins(markets);
    await insertSnapshots(markets, startedIso);

    const finishedIso = new Date().toISOString();
    await recordRun('ok', startedIso, finishedIso, null);
    console.log(`[ingest] Run completed at ${finishedIso}`);
  } catch (err) {
    const finishedIso = new Date().toISOString();
    await recordRun('error', startedIso, finishedIso, String(err));
    console.error('[ingest] Error during run:', err);
  }
}

(async () => {
  await runOnce();
  console.log(`[ingest] Scheduling subsequent runs every ${INTERVAL_MS / 60000} minutes`);
  setInterval(runOnce, INTERVAL_MS);
})();

process.on('SIGINT', () => {
  console.log('\n[ingest] Caught SIGINT, exiting.');
  process.exit(0);
});
