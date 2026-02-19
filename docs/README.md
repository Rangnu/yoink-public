# Yoink — Project Overview

Last updated: December 11, 2025 00:45

## Vision
- **Catch the most important crypto moves** with simple "scouters" over the **top ~30 coins by market cap**, focusing on price/volume shifts and whale / smart-trader activity.
- **Immediate dopamine UI**: on load, show extreme movers and notable whale flows for the tracked coins.
- **Global reach**: English-first with a clear path to multi-language support.

## Core Value Proposition (MVP)
- **Top-30 crypto dashboard** powered by CoinGecko + Supabase snapshots (no direct provider calls from the app).
- **Preset scouters** that rank coins using basic rules over price changes, volume, and whale/smart-trader aggregates (no full rule builder yet).
- **API-budget-aware design**: a single 4.5-minute backend worker that respects the free CoinGecko tier and feeds read-only data to the app.

## Platforms
- **Mobile app first**: React Native / Expo (current focus).
- **Web app** (Next.js) remains a later-phase goal, reusing the same Supabase backend.

## Tech Stack (current plan)
- **Frontend (mobile)**: Expo + React Native + TypeScript.
- **Backend**: Supabase (Postgres, RLS), Edge Functions or lightweight worker endpoints.
- **Ingestion**: GCP cron/worker calling CoinGecko every ~4.5 minutes and writing into Supabase.
- **Analytics**: PostHog or similar (later phase).

## Docs
- `docs/PLAN.md` — roadmap & milestones
- `docs/DESIGN.md` — architecture & data flows
- `docs/MONETIZATION.md` — business model & in-app economy
- `docs/DATA_SOURCES.md` — market/social data providers & rates
- `docs/COMPLIANCE.md` — disclaimers, policy, and regional notes
- `docs/I18N.md` — languages & localization strategy
- `docs/NAMING.md` — brand/app name candidates
- `docs/PRODUCT_REQUIREMENTS.md` — PRD & MVP scope
- `docs/GROWTH.md` — growth & distribution

## Next Steps
- Define MVP scouters and data cadence.
- Choose primary data providers and implement caching DB schema.
- Ship dopamine-first landing and basic saved lists.
