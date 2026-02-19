# DATA_SOURCES

Last updated: December 11, 2025 23:56

## Chosen Provider for MVP (Crypto + Whales)
- **CoinGecko API** — primary and only external data source for the MVP.
  - Scope: top ~120 cryptocurrencies by market cap (stored in Supabase) + basic whale / top-trader stats per coin (where available).
  - Plan: free tier with **10k calls/month** and **30 requests/minute**.
  - Strategy:
    - All requests are made from a **backend worker** (Node script) running every ~5 minutes.
    - Each run performs **one batched request** to the `coins/markets` endpoint for the top N coins (`per_page=120`).
    - Results are written into Supabase tables (e.g., `coin_snapshots`, `coin_whale_metrics`) and served read-only to the app.
    - The mobile app never calls CoinGecko directly; it reads from Supabase and uses local storage for lightweight caching.

## Market Data Candidates (Later Phases)
- Polygon.io — equities/forex/crypto; paid tiers, some free; websockets.
- IEX Cloud — US equities; reasonable free tier historically.
- Finnhub — equities and crypto; free dev tier with limits.
- Alpha Vantage — free API with throttling; good for daily/aggregates.
- Yahoo Finance (unofficial) — terms-sensitive; cache aggressively if used.
- Exchange-provided or broker APIs (region-specific; check terms).

## Social Signals
- Reddit API (subreddits: r/stocks, r/wallstreetbets); Pushshift mirror for historical, mind rate limits.
- News RSS aggregators; simple keyword scoring.

## Strategy
- Ingest to DB; serve via public read views and cached materialized views.
- Intraday: poll only filtered universe that matches preliminary thresholds (e.g., change%, rel_vol); backoff when calm.
- Daily: full refresh pre-market; keep compact OHLC and basic stats.

## Rate Limit & Cost Controls
- Queue-based polling with concurrency caps.
- Store last value per symbol; write only on meaningful deltas.
- Batch API calls where supported; exponential backoff.
