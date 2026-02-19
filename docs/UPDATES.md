# UPDATES (Changelog)

Last updated: December 12, 2025 00:32

- October 18, 2025 17:25 — Initialized docs scaffold (README, PLAN, DESIGN, UPDATES, MONETIZATION, DATA_SOURCES, COMPLIANCE, I18N, NAMING, PRODUCT_REQUIREMENTS, GROWTH).
- October 18, 2025 17:34 — Added User Favorites to `docs/NAMING.md` (FomoFuel, StonkFlow, Stonket, Stonks!?) and refreshed timestamp.
- October 18, 2025 17:53 — Set chosen name and marketing: `Stonket! — Find the FOMO before it finds you.` with compliance-safe alt `Hype-aware. Signal-first.`
- October 18, 2025 17:59 — Added TradingView pricing summary and implications to `docs/MONETIZATION.md`.
- October 18, 2025 18:08 — Switched Free tier to rewarded-ads-only and added Rewards UX & controls in `docs/MONETIZATION.md`.
- October 18, 2025 18:58 — Added AI Highlights tab UX (preview 3, blur rest, 13 items/section, 24h unlock) and Daily Free Coins section to `docs/MONETIZATION.md`.
- October 18, 2025 19:01 — Set daily free coin claim to +4 Coins in `docs/MONETIZATION.md`.
- October 18, 2025 19:03 — Added AI Highlights module design, wallet schema, unlock model, and API endpoints to `docs/DESIGN.md`.
- October 19, 2025 14:39 — Updated navigation to 5 tabs (Home, Scouters, Explore, Saved, Menu) in `docs/DESIGN.md`.
- October 19, 2025 14:49 — Added Community & Feeds design with post schema, actions, moderation, and endpoints to `docs/DESIGN.md`.
- October 19, 2025 17:16 — Added Realtime Quotes design (hot set 50–200, coalescing, cache, fan-out) to `docs/DESIGN.md`.
- October 19, 2025 19:10 — Implemented dark/light mode with theme context, refactored all screens to follow Mobile UI/UX Guidelines, removed default React designs, added theme toggle in Menu tab.
- October 19, 2025 19:22 — Applied 2025 dark luxury + tech minimalism aesthetic with neon accents (#00FF84 green, #00C2FF cyan), glowing shadows, and decorated all tabs (Scouters, Saved, Explore) with content cards and community feed UI.
- October 19, 2025 19:42 — Redesigned AI Highlights with Webull/TradingView watchlist style: dense rows (10px padding), inline unlock buttons on locked stocks, mock SVG chart placeholders, company names, and improved UX by removing bottom unlock section.
- December 11, 2025 00:45 — Narrowed MVP scope to top-30 cryptocurrencies + basic whale/smart-trader tracking using a 4.5-minute CoinGecko worker writing into Supabase; updated `docs/PLAN.md`, `docs/DESIGN.md`, `docs/DATA_SOURCES.md`, and `docs/README.md` to reflect the API-limited architecture and app reading only from Supabase + local storage.
- December 11, 2025 23:56 — Implemented Node-based CoinGecko→Supabase ingest worker fetching top ~120 coins every 5 minutes (single `coins/markets` call per run), added `coin_latest_view` for latest-per-coin snapshots, wired Home AI Highlights and Explore Live Coins lists to read from Supabase instead of mocks, and introduced SVG `CoinSparkline` graphs that render 5-minute price history from `coin_snapshots`.
 - December 12, 2025 00:32 — Enabled Row Level Security on `coins`, `coin_snapshots`, and internal ingest/whale tables; updated the ingest worker to use a service-role key (`EXPO_PUBLIC_SUPABASE_ROLE_KEY`/`SUPABASE_SERVICE_ROLE_KEY`) so writes bypass RLS, and locked the client anon key (`EXPO_PUBLIC_SUPABASE_ANON_KEY`) down to read-only access for market data.
