import { supabase } from '@/utils/supabase';

export type MarketSortMode = 'popular' | 'volume' | 'gainers' | 'losers';
export type MarketChangeRange = 'realtime' | '1d' | '1w';

export type CoinMarketRow = {
  coin_id?: string;
  symbol: string;
  name: string;
  rank: number | null;
  price_usd: number | null;
  market_cap_usd: number | null;
  volume_24h_usd: number | null;
  change_1h_pct: number | null;
  change_24h_pct: number | null;
  change_7d_pct: number | null;
  ts: string;
};

export async function fetchCoinMarketRows(limit = 120) {
  const { data, error } = await supabase
    .from('coin_latest_view')
    .select('coin_id, symbol, name, rank, price_usd, market_cap_usd, volume_24h_usd, change_1h_pct, change_24h_pct, change_7d_pct, ts')
    .order('rank', { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as CoinMarketRow[]).map((row) => ({
    ...row,
    symbol: row.symbol?.toUpperCase?.() ?? '',
  }));
}

export function getChangeForRange(row: CoinMarketRow, range: MarketChangeRange) {
  if (range === 'realtime') return row.change_1h_pct;
  if (range === '1w') return row.change_7d_pct;
  return row.change_24h_pct;
}

export function sortCoinRows(
  rows: CoinMarketRow[],
  mode: MarketSortMode,
  range: MarketChangeRange = '1d'
) {
  const copy = [...rows];

  switch (mode) {
    case 'volume':
      return copy.sort((a, b) => (b.volume_24h_usd ?? 0) - (a.volume_24h_usd ?? 0));
    case 'gainers':
      return copy.sort((a, b) => (getChangeForRange(b, range) ?? -Infinity) - (getChangeForRange(a, range) ?? -Infinity));
    case 'losers':
      return copy.sort((a, b) => (getChangeForRange(a, range) ?? Infinity) - (getChangeForRange(b, range) ?? Infinity));
    case 'popular':
    default:
      return copy.sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER));
  }
}

export function formatCoinPrice(value: number | null) {
  return value == null
    ? '-'
    : `$${value.toLocaleString(undefined, {
        maximumFractionDigits: value >= 1 ? 2 : 6,
      })}`;
}

export function formatCoinPercent(value: number | null) {
  return value == null ? '--' : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function getLatestTimestamp(rows: CoinMarketRow[]) {
  if (!rows.length) return null;

  return rows.reduce<string | null>((latest, row) => {
    if (!row.ts) return latest;
    if (!latest) return row.ts;
    return new Date(row.ts).getTime() > new Date(latest).getTime() ? row.ts : latest;
  }, null);
}
