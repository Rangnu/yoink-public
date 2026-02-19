# Project Proposal — Stonks
Last updated: November 13, 2025 20:51

---

## 1   Project title

**Yoink** — a cryptocurrency app that tracks big market makers (“whales”), delivering live prices and AI-driven recommendations.

## 2   Proposed tools

### Current mobile stack

| Tool | Version | WWW address |
| --- | --- | --- |
| Expo | 54.0.13 | https://expo.dev/ |
| React Native | 0.81.4 | https://reactnative.dev/ |
| React | 19.1.0 | https://react.dev/ |
| Expo Router | 6.0.11 | https://expo.dev/router |
| React Navigation (Bottom Tabs) | 7.4.0 | https://reactnavigation.org/ |
| React Navigation (Core) | 7.1.8 | https://reactnavigation.org/ |
| React Native Reanimated | 4.1.1 | https://docs.swmansion.com/react-native-reanimated/ |
| TypeScript | 5.9.2 | https://www.typescriptlang.org/ |
| ESLint | 9.25.0 | https://eslint.org/ |

### Planned web & backend additions

| Tool | Target Version | WWW address |
| --- | --- | --- |
| Next.js (App Router) | 14.x | https://nextjs.org/ |
| Tailwind CSS | 3.4.x | https://tailwindcss.com/ |
| shadcn/ui | latest | https://ui.shadcn.com/ |
| Supabase (Postgres + Auth + Edge Functions) | Platform 2.x | https://supabase.com/ |
| Redis (hot cache) | 7.x | https://redis.io/ |
| PostHog Analytics | Cloud 1.x | https://posthog.com/ |

## 3   Application

Yoink tracks large wallet movements (“whales”) alongside social sentiment to surface cryptocurrency opportunities in real time. The app blends on-chain signals, exchange pricing, and AI-ranked hype indicators so users can act on what high-impact traders and communities are doing right now. AI is applied to classify and prioritize community-driven coins; it does **not** attempt LLM-based price prediction.

### 3.1   User description of the application

- **Primary audience:** crypto traders and community watchers who rely on whale flows and social buzz to spot momentum before it hits mainstream feeds.
- **Core needs addressed:**
  1. Real-time visibility into whale transactions and wallet clustering to understand where major capital is moving.
  2. AI-curated coin recommendations sourced from Reddit, X, and similar communities—ranking hype without letting LLMs hallucinate price forecasts.
  3. Unified alerts, watchlists, and insights tying together on-chain data, exchange liquidity, and social chatter.
- **Usage scenarios:**
  - Morning briefing to review overnight whale inflows/outflows and trending community picks.
  - Intraday monitoring with push alerts when tracked wallets move or community sentiment spikes for saved coins.
  - Evening debrief to refine watchlists, review AI-ranked hype leaders, and schedule next-day alerts.
- **Differentiators:** two-sided intelligence (whale tracking + social AI), mobile-first delivery, and a clear stance against unreliable LLM price predictions in favor of verifiable data signals.
