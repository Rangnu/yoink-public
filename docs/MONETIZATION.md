# MONETIZATION

Last updated: October 18, 2025 19:01

## Strategy Overview
- **Ad-supported** with optional soft currency ("Coins") and rewarded views.
- **Gated premium insights**: viewing certain AI highlights or historical windows consumes Coins (see costs below). Earn via rewarded ads, referrals, or IAP (subject to compliance).
- **Referrals**: inviter and invitee earn e.g., `700 Chips` each (tunable).

## Soft Currency Economy (Coins)
- Starting balance: `25 Coins` for new users.
- Rewarded ads: `+3 Coins` per completed ad.
- Daily ad cap: `5 ads/day` (15 Coins/day max from ads).
- Actions and baseline costs:
  - View today’s AI highlights (per market): coin cost by level (see AI highlight levels).
  - Unlock advanced scouter preset (temporary): `2–3 Coins` (tunable, duration-based).
  - Extend category history window (session): `1–2 Coins`.
  - Extra saved lists beyond free tier: `1 Coin` per add (tunable).
  - Refresh scouter early (cooldown bypass): `1 Coin`.
 - Earning (non-ad): daily free claim `+4 Coins`; optional streak bonus (tbd); referrals (`+N Coins` both sides, tbd).

## Monetization Options
- Rewarded video ads + interstitials on specific transitions.
- Subscriptions: Pro tier (higher limits, faster refresh, more presets, alert quotas).
- One-off packs: Chip bundles and Reward bundles with regional pricing.

## Notes from Market Anecdote
- Server-side ingestion; users read from DB to control API costs.
- Intraday polling can be aggressive for filtered sets; avoid calling all symbols every 50ms.

## Compliance Guardrails
- Financial disclaimers; not investment advice.
- If enabling IAP for finance insights, check local regulations (e.g., investment advisory). Consider ad-only regions where needed.

## Competitor Pricing — TradingView (2025)
- **Free tier**: basic charting/analysis; limited indicators and alerts; strong upgrade funnel.
- **Essential** (~€12.95/mo; ~€155.40/yr): 2 charts/layout; 5 indicators/chart; 20 alerts; basic support.
- **Plus** (~€24.95/mo; ~€299.40/yr): 4 charts/layout; 10 indicators/chart; 100 alerts; custom intervals; intraday renko/kagi/line break.
- **Premium** (~€49.95/mo; ~€599.40/yr): 8 charts/layout; 25 indicators/chart; 400 alerts; fastest refresh; second-based intervals; priority support.
- **Ultimate/Enterprise** (~€99.95/mo or custom): adds unlimited alerts; API/data access; team tools; real-time global data.

### Monetization Methods Observed
- Tiered subscriptions (monthly/yearly) with meaningful feature unlocks.
- Free-plan funnel with dopamine features to encourage upgrades.
- Localization + regional pricing; add-on upsells for certain market data feeds.
- Retention via visuals (heatmaps), community/social sharing, cross-device sync.

## Implications for Stonket
- **Positioning**: Stonket is a live-catching scanner; differentiate on real-time “scouters” and meme/penny/sector surfacing rather than heavy charting.
- **Free tier**: keep dopamine modules (Extreme Movers, Meme Movers, Reddit Top 10) free with coin gates for deeper history and AI highlights.
- **Pro tier (target ~$6–$12/mo)**: more scouters, higher alert quotas, faster refresh windows, extended historical windows (e.g., 30–90 days for categories), priority on signal latency.
- **Plus tier (optional ~$15–$20/mo)**: adds advanced rule builder, multi-scouter concurrent runs, sector heatmaps, export/API-lite.
- **Add-ons**: certain premium data (e.g., specific exchanges’ real-time feeds) can be pass-through add-ons.
- **Soft currency**: keep Chips/Reward loop to monetize free users without paywalls; bundle Chips with subscriptions for perceived value.

## Proposed Next Steps
- Define exact Pro/Plus limits: scouters saved, concurrent runs, alert quotas, refresh intervals, history windows.
- Map features to tiers and to Chips/Reward costs to avoid double-pay (subscribers should get generous allowances).
- Regionalize pricing later; start with USD baseline and price testing.

## Stonket Tiers (Proposed) — Ads Policy Included

### Free
- Ads: Rewarded ads only (no banners/interstitials).
- Chips economy: Enabled (160 Chips = 1 Reward; tunable).
- Features:
  - Extreme Movers, Meme Movers, Coin Stocks, Reddit Top 10 (with some limits).
  - 2 preset scouters (bullish/bearish), limited runs.
  - 5 alerts total.
  - History preview: up to 7 days for categories; deeper history via Rewards.

### Pro (removes ads)
- Ads: Removed for subscribers.
- Monthly bundle: e.g., 3 Rewards + 800 Chips.
- Quotas:
  - 6 scouters saved; 2 concurrent scouter runs.
  - 50 alerts total.
  - Faster refresh on tracked set (e.g., 1–2 min).
  - 30-day history for categories and AI highlights.
  - Unlimited saved lists.

### Plus
- Ads: Removed.
- Monthly bundle: e.g., 10 Rewards + 3000 Chips.
- Quotas:
  - 15 scouters saved; 4 concurrent runs.
  - 200 alerts total.
  - Priority signal latency (e.g., 30–60s on tracked set).
  - 90-day history for categories and AI highlights.
- Features: Advanced rule builder (social + price + volume + sector), sector heatmaps, export watchlists (CSV).

### Ultimate (optional; can be deferred)
- Ads: Removed.
- For power users/teams.
- Adds: Highest alert quotas, longest history (e.g., 180–365 days categories), API-lite access for exports, team sharing.
- May require add-on real-time data feeds depending on region/exchange.

### Rewarded Ads Policy
- Free users can exchange ad views for Coins to unlock:
  - AI highlights (cost by level),
  - Extended windows,
  - Advanced presets temporarily,
  - Extra saved lists beyond free tier.
- Subscribers retain access without ads; optional monthly Coin bundles may be included in paid tiers (tbd).

## AI Highlight Levels (Show-only, not recommendations)
- Levels signal risk/momentum flavor; they do not recommend buying or selling.
- Proposed levels and coin costs (per highlight view):
  - **Balanced** — `1 Coin`
  - **FOMO** — `2 Coins`
  - **Stonky!** — `3 Coins`
  - Optional context labels (free): `Super Dangerous`, `Super Stonky`, `Cowards` as UI badges that pair with one of the paid levels above.


## Recommendation Policy (Show-Only)
- Stonket does not provide investment advice or personalized recommendations.
- We display market data, social buzz, and computed signals ("highlights") based on user-defined scouters and public metrics.
- All modules are informational. Users make their own decisions.

## Terminology
- “AI highlights”: system-surfaced items matching rules and signals; not buy/sell advice.
- “Scouter”: a saved filter/rule set for finding movers.
- “Rewards/Chips”: soft-currency mechanics to unlock views or history.

## Tier Feature Matrix (v1)

### Free
- Scouters saved: 2
- Concurrent runs: 0–1 (limited)
- Alerts: 5 total (price/technical/social combined)
- Watchlist alerts: 0
- History windows: 7-day preview per category
- Tracked symbols (hot set): up to ~50
- Refresh cadence (hot set): ~3–5 minutes
- Exports: none
- Ads: Rewarded ads only (3 Coins/ad, 5 ads/day)

### Pro
- Scouters saved: 6
- Concurrent runs: 2
- Alerts: 50 total
- Watchlist alerts: 1
- History windows: 30 days (categories, AI highlights)
- Tracked symbols: up to ~200
- Refresh cadence: ~1–2 minutes
- Exports: watchlists (CSV)
- Ads: removed; optional monthly Coin bundle (tbd)
- Support: standard

### Plus
- Scouters saved: 15
- Concurrent runs: 4
- Alerts: 200 total
- Watchlist alerts: 5
- History windows: 90 days (categories, AI highlights)
- Tracked symbols: up to ~800
- Refresh cadence: ~30–60 seconds
- Features: advanced rule builder, sector heatmaps, exports
- Ads: removed; optional larger Coin bundle (tbd)
- Support: priority

### Ultimate (optional)
- Scouters saved: 30
- Concurrent runs: 8
- Alerts: 1000 total
- Watchlist alerts: 15
- History windows: 365 days (categories, AI highlights)
- Tracked symbols: up to ~2000
- Refresh cadence: ~5–15 seconds (subject to provider limits and add-ons)
- Features: team sharing, API-lite/export, longest history
- Ads: removed; largest Coin bundle (tbd)
- Support: first priority

## Rewarded Ads-First Strategy (UX & Controls)
- Value mapping: 1 rewarded view = `+3 Coins`. High-value actions (AI highlights at higher tiers) should feel worth it.
- Placements: gate-view for AI highlights, extend history windows, unlock advanced preset for N minutes, refresh scouter early.
- Frequency caps: `max 5 per day per device`; add a short cooldown (e.g., 5 minutes) between views.
- Anti-abuse: server-side receipt/verification; device-throttling; block parallel playback; fraud monitoring.
- UX: explicit opt-in, clear reward preview, skippable if ad not available; prefetch on Wi‑Fi; never interrupt core flows.
- Mediation: start with Google AdMob; later test Unity LevelPlay/ironSource; region-based waterfalls.

### Notes
- Pricing to test (USD baseline): Pro $6.99–$9.99/mo; Plus $12.99–$19.99/mo; Ultimate $24.99–$39.99/mo.
- Regional pricing and data add-ons handled separately.
