# PLAN

Last updated: December 11, 2025 00:45

## Goals
- Ship a **minimal MVP** focused on:
  - Top 30 cryptocurrencies by market cap.
  - Basic whale / smart-trader tracking per coin.
- Strictly respect the free CoinGecko API tier (10k calls/month, 30 RPM) by centralizing all calls into a backend worker.
- Persist all market + whale snapshots into Supabase and serve read-only data to the mobile app, with light local storage caching on device.

## Scope  MVP v1 (CoinGecko-limited)
- **Data universe**
  - Single provider: CoinGecko (market + on-chain/top-trader endpoints).
  - Up to 30 tracked coins at any time (configurable list stored in DB).
- **Backend worker (GCP)**
  - One cron-triggered job running approximately every **4.5 minutes**.
  - Each run performs **batched CoinGecko requests** for the tracked coins and writes rows into Supabase:
    - Latest price + market cap + 24h volume + % changes.
    - Aggregated whale/smart-trader metrics where available.
  - All API calls originate from the backend; the mobile app never calls CoinGecko directly.
- **Mobile app**
  - `Home`: shows top movers among the 30 coins using Supabase snapshots only.
  - `Scouters`: uses simple, preset rules over price changes and whale metrics (no user-authored rule builder yet).
  - `Saved`: watchlists restricted to the tracked top-30 coins.
- **Out of scope for MVP v1** (kept for later phases):
  - Reddit/social ingestion, rich community feeds, complex alerts, or wider symbol universes.

## Phases
- **Phase 0  Foundations (short)**
  - Finalize CoinGecko endpoints, rate-limit plan, and DB schema for coins + whale metrics.
  - Set up Supabase project and tables for `coins`, `coin_snapshots`, and `coin_whale_metrics`.
- **Phase 1  MVP v1 (current focus)**
  - Implement the 4.5-minute GCP worker that ingests top-30 coin data into Supabase.
  - Wire `Home`, `Scouters`, and `Saved` tabs to read exclusively from Supabase.
  - Add local storage caching for last-viewed lists and settings.
- **Phase 2  Post-MVP**
  - Gradually expand beyond the top-30 coins once API budget and infra allow.
  - Introduce more advanced scouter rules and optional alerts.
  - Layer in social signals and community features from the original design.

## Milestones
- M1: CoinGecko worker + Supabase schema live, writing snapshots for the top-30 coins.
- M2: `Home` + `Scouters` + `Saved` tabs rendering from Supabase-only data.
- M3: First basic whale dashboard (per-coin top trader summary) integrated into the app.

## Immediate Tasks
- Lock in the initial top-30 coin list and mapping to CoinGecko IDs.
- Design and create Supabase tables for `coins`, `coin_snapshots`, and `coin_whale_metrics`.
- Implement the 4.5-minute GCP worker (CoinGecko  Supabase).
- Switch the app to read from Supabase (no direct CoinGecko calls from the client).
