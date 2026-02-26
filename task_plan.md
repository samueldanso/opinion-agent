# Task Plan: SIGINT v2 Implementation

## Goal
Rewrite the OPINION v1 agent into SIGINT v2 — folder-per-concern backend with full trade execution pipeline, onchain data sources, boot/milestone/unlimited sequences, and a frontend dashboard with wallet connect and live SSE.

## Spec
Source of truth: `docs/v2.md`

## v1 → v2 Delta Summary
- Flat `src/*.ts` → folder-per-concern `src/{db,events,config,data,signal,market,economics,resolution,agent,server}/`
- `predictions` table → `signals` + `trades` tables
- No trade execution → full `skills.trade()` + `skills.broadcast()` + `skills.tx()` pipeline
- No onchain data → Coinglass (funding, liquidations, OI) + DeFiLlama (DEX/CEX volume)
- No boot sequence → `skills.wallet()` + `skills.fund()` with halt on low balance
- No milestone/unlimited → auto-trigger on ratio 1.0 / earnings $100
- 6 SSE event types → 11 SSE event types
- `prediction_sold` → `signal_sold`, `trade_executed`, `trade_verified`
- Frontend: basic dashboard → wallet connect (wagmi+viem), zustand, framer-motion, sonner
- Endpoint: `/predict/eth` → `/signal/eth`

## Features / Steps

### Phase 1: Backend Foundation
- [x] F1: Config module (`src/config/index.ts`) — validated env vars, constants, derived values
- [x] F2: Database layer (`src/db/`) — schema with `price_log`, `signals`, `trades` tables + typed query functions
- [x] F3: Events system (`src/events/`) — SSE client registry + typed emit with all 11 event types
- [x] F4: Onchain data fetchers (`src/data/`) — price (skills.price), Coinglass (funding, liquidations, OI), DeFiLlama (DEX/CEX volume)

### Phase 2: Backend Agent Core
- [x] F5: Signal module (`src/signal/`) — compose prompt from onchain context + 24h history, parse chat response
- [x] F6: Market module (`src/market/`) — trade execution (skills.trade → broadcast → tx verify), trade resolution
- [x] F7: Economics module (`src/economics/`) — spend tracker (derived from DB), dynamic pricing by tier, reinvestment logic
- [x] F8: Resolution module (`src/resolution/`) — resolve pending signals, directional verdict, trade PnL calc

### Phase 3: Backend Integration
- [x] F9: Agent loop (`src/agent/`) — boot sequence (wallet + fund), hourly tick, monologue emitter
- [x] F10: Servers (`src/server/`) — x402 skill server (port 4020, `/signal/eth`), Express API (port 3001, `/events` + `/status` + `/signals`)
- [x] F11: Entry point (`src/index.ts`) — bootstrap config, init DB, start servers + loop
- [x] F12: Backend verification — typecheck, manual test, all SSE events flowing

### Phase 4: Frontend Foundation
- [x] F13: Frontend packages + providers — installed zustand, framer-motion, sonner
- [x] F14: Frontend types + hooks — updated SSEEvent types to v2 (11 events), SignalRow/TradeRow, Flush tier, useAgentStream handles all events
- [x] F15: API routes — added `/api/signals` proxy

### Phase 5: Frontend Dashboard
- [x] F16: Survival + Economics components — ratio, runway, tier, signal price, unlimited progress, earned/spent/margin, tradePnl
- [x] F17: Monologue + Signal History components — terminal-style log, signal feed with trade outcomes and PnL
- [x] F18: Dashboard layout + header — two-column grid, ETH price, connection status, SIGINT branding
- [ ] F19: Wallet connect + Buy Signal flow — wagmi config, connect button, EIP-3009 signing, signal purchase UX

### Phase 6: Ship
- [ ] F20: Integration files — `SKILL.md`, `openclaw.plugin.json`, `examples/call-signal.ts`, `.env.example`
- [ ] F21: Final verification — full loop test, SSE → dashboard, typecheck both packages

## Current
**Working on**: Phase 5 F19 (wallet connect), then Phase 6
**Status**: Phase 4+5 (F13-F18) complete, both backend & frontend typecheck clean

## Decisions
- Always USDC→ETH trade regardless of signal direction (capital commitment, not directional derivative)
- wagmi+viem for wallet connect (not Privy — crypto-native audience)
- SpendTracker derived from DB (survives restarts) instead of in-memory only
- Folder-per-concern with index.ts as public interface per module
- Keep Express for API server (createSkillServer doesn't expose its app)
- Removed old v1 flat files (db.ts, loop.ts, predict.ts, resolve.ts, server.ts, spend.ts, sse.ts, stats.ts) — replaced by folder modules
- pinion trade result uses `.swap` not `.tx` for unsigned tx object
- economics/tracker uses module-level accumulator for spend (simple, no class needed)

## Errors
(none yet)
