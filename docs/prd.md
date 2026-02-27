# SIGINT

## Product Requirements Document

### A Self-Funding Survival Agent

**v2.0 · PinionOS Hackathon · Feb 22 – Mar 1, 2026**

---

> A sovereign AI agent that forms onchain signals about ETH, backs each one with its own USDC, sells those signals via x402, and lives or dies publicly on whether it's right.

## Overview

This is not a tool you call. It is an operator with a wallet, a service, and a public economic life. The agent reads onchain data, forms a directional signal on ETH, executes a small trade with its own USDC before selling the signal, then publishes it as a paid x402 endpoint. Every signal sold earns revenue. Every wrong call costs it. The earn/spend ratio is the scoreboard — cross 1.0 and the agent has proven it can exist without a human top-up.

No user deposits. No custody. Every accountability claim is about the agent's own skin, not someone else's money.

---

## The Problem

Crypto markets reward research. Almost no one has the time, tools, or discipline to do it consistently.

The edge comes from understanding onchain positioning, funding rates, liquidation pressure, and market structure. Professional traders read these signals before forming a view. For everyone else:

- **Time** — thorough onchain research takes hours per cycle
- **Consistency** — humans cut corners, miss signals, make assumptions
- **No skin in the game** — anyone can publish a take; nobody is accountable for being wrong

The result: unverifiable opinions with no consequence. The agent changes that. Every call is backed with its own money before it reaches the buyer.

---

## How It Works

```
0. BOOT (once)
   skills.wallet()              → generate sovereign identity (address + key)
   skills.fund(agentAddress)    → check balance + get funding instructions
   If balance < $0.10: log funding steps to monologue, halt
        │
        ▼
1. OBSERVE
   Agent reads onchain data each cycle
   skills.price("ETH")          → price + 24h change + liquidity (Birdeye)
   Coinglass API                → funding rates + liquidation levels
   DeFiLlama API                → DEX/CEX volume ratio
        │
        ▼
2. REASON
   Agent synthesises onchain context into one directional signal
   Last 24h price_log + onchain data → serialised JSON → skills.chat()
   skills.chat(onchainContextPrompt) → direction, confidence, reasoning
   "ETH direction: DOWN — confidence: 74" — resolved in 1 hour
        │
        ▼
3. COMMIT
   Agent backs its own call before selling it
   skills.trade("USDC", "ETH", $0.50) → $0.01 (unsigned swap tx via 1inch)
   skills.broadcast(tx)               → $0.01 + $0.50 USDC executed on Base
   skills.tx(txHash)                  → $0.01 (verify trade landed — not hallucinated)
   Signal cannot be sold until trade is confirmed on Base
        │
        ▼
4. PUBLISH
   Signal exposed as a live x402 endpoint — dynamic price by survival tier
   createSkillServer + skill("signal", { price: "$0.10" })
   Buyer calls: payX402Service(wallet, signalUrl) → USDC in, signal + tradeHash out
   Machine-to-machine native: no API key, no account, no human required
        │
        ▼
5. EARN
   USDC settled autonomously on Base via x402 protocol
   Revenue flows directly into agent wallet
        │
        ▼
6. VERIFY
   At T+1h: skills.price("ETH") → compare direction, mark ✅ or ❌
   Trade PnL recorded — correct call ≈ +$0.50, wrong call = -$0.50
        │
        ▼
7. ADAPT
   skills.balance(agentAddress) → wallet health check
   Survival tier re-evaluated → signal price adjusted if tier changed
   If ratio > 1.0: reinvest — buy more onchain data context per cycle
   If ratio < 0.5: conserve — price fetch only
   Compute is not a fixed cost — it's a variable investment
        │
        ▼
8. MILESTONE (once — when ratio crosses 1.0)
   skills.send(milestoneAddr, 0.01, "USDC") → construct proof-of-survival tx
   skills.broadcast(tx)                     → execute onchain
   Agent declares survival onchain — txHash visible on dashboard
        │
        ▼
9. UNLIMITED (once — when lifetime earnings cross $100)
   skills.unlimited()           → purchase unlimited key ($100 USDC)
   skills.unlimitedVerify(key)  → confirm key valid
   pinion.setApiKey(key)        → all future skill calls are free
        │
        ▼
10. SURVIVE OR DIE
    Cycle repeats indefinitely — wallet hits zero → agent halts permanently
    Track record is public and permanent
```

---

## Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         AGENT                                    │
│                                                                  │
│  skills.price("ETH")  ──┐                                        │
│  Coinglass (funding)  ──┼──► skills.chat() ──► SIGNAL FORMED     │
│  DeFiLlama (volume)   ──┘         │                              │
│                                   │                              │
│                          skills.trade() + broadcast()            │
│                          [$0.50 USDC committed on Base]          │
│                                   │                              │
│                          createSkillServer                        │
│                          x402 ENDPOINT (dynamic price)           │
│                                   │                              │
│                          buyers (agents or humans)               │
│                          USDC EARNED                             │
│                                   │                              │
│                          skills.price("ETH") at T+1h             │
│                          ✅ correct / ❌ incorrect                 │
│                          trade PnL recorded                      │
│                          survival tier evaluated                 │
│                          signal price adjusted if changed        │
│                                   │                              │
│                          ─────────► next cycle                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND  Next.js + shadcn/ui · Vercel                         │
│  Monologue · Survival · Economics · Signal Log · Wallet         │
│  ◄── SSE stream (real-time agent events)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP / SSE
┌────────────────────────▼────────────────────────────────────────┐
│  BACKEND  Bun / TypeScript · Railway                            │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌───────────────────┐  │
│  │  agent/  │  │  data/   │  │market/ │  │    economics/     │  │
│  │  loop.ts │  │  price   │  │trade   │  │ tracker · pricing │  │
│  │  mono-   │  │  funding │  │        │  │ reinvestment      │  │
│  │  logue   │  │  liquid. │  │        │  │                   │  │
│  └────┬─────┘  └────┬─────┘  └───┬────┘  └─────────┬─────────┘  │
│       │              │            │                  │            │
│  ┌────▼──────────────▼────────────▼──────────────────▼────────┐  │
│  │              PinionOS SDK                                  │  │
│  │  skills.price · skills.chat · skills.balance               │  │
│  │  skills.trade · skills.broadcast · skills.unlimited        │  │
│  │  createSkillServer + skill() → x402 signal endpoint        │  │
│  └─────────────────────────┬──────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │  SQLite (bun:sqlite) — price_log · signals · trades     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                               │
               ┌───────────────▼──────────────────┐
               │  Base L2 — USDC · x402 protocol  │
               │  Sepolia (dev) · Mainnet (demo)  │
               └──────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun / TypeScript |
| Agent loop | Hourly background poll + on-request signal generation |
| PinionOS client | `PinionClient` — `skills.price`, `skills.balance`, `skills.chat`, `skills.trade`, `skills.broadcast`, `skills.unlimited` |
| Onchain data | Birdeye (price, liquidity via `BIRDEYE_API_KEY`), Coinglass (funding, liquidations), DeFiLlama (DEX/CEX volume) |
| Trade routing | 1inch via `skills.trade()` (`ONEINCH_API_KEY`) |
| Skill server | `createSkillServer` + `skill()` from `pinion-os/server` |
| Budget management | `economics/` — spend tracker, dynamic pricing, reinvestment logic |
| Payments | x402 on Base — USDC settlement, machine-to-machine native |
| Frontend | Next.js + shadcn/ui |
| Realtime | SSE — agent monologue + all economic events |
| Storage | SQLite via `bun:sqlite` — `price_log`, `signals`, `trades` |
| Deploy | Railway (backend, persistent process + SQLite volume) · Vercel (Next.js) |

---

## PinionOS Primitive Map

Every SDK method has a justified role. All 9 paid server-side skills used.

| SDK Call | Cost | What It Returns | Role |
|---|---|---|---|
| `skills.wallet()` | $0.01 | `{ address, privateKey }` | Agent generates sovereign identity at first boot |
| `skills.fund(address)` | $0.01 | `{ balances, funding: { steps } }` | Boot check — balance + funding instructions if wallet is low |
| `skills.price("ETH")` | $0.01 | `{ priceUSD, change24h, liquidity }` | Hourly poll, fresh fetch on every signal, resolution verification |
| `skills.balance(address)` | $0.01 | `{ balances: { ETH, USDC } }` | Per-signal wallet health check after trade |
| `skills.chat(message)` | $0.01 | `{ response }` | Synthesises onchain context into directional signal JSON |
| `skills.trade(src, dst, amt)` | $0.01 | `{ tx, approveTx? }` | Agent constructs its own $0.50 USDC swap before every signal sale |
| `skills.broadcast(tx)` | $0.01 | `{ txHash, explorer }` | Executes the trade + executes milestone proof-of-survival tx |
| `skills.tx(hash)` | $0.01 | `{ status, from, to, value }` | Verifies trade actually landed on Base after broadcast — not hallucinated |
| `skills.send(to, amt, token)` | $0.01 | `{ tx (unsigned) }` | Constructs proof-of-survival milestone tx when ratio crosses 1.0 |
| `skills.unlimited()` | $100.00 | `{ apiKey }` | Auto-triggered at $100 lifetime earnings — near-zero cost tier |
| `skills.unlimitedVerify(key)` | $0.01 | `{ valid, address }` | Confirms unlimited key is valid before switching modes |
| `createSkillServer + skill()` | — | x402 Express server | Agent's signal endpoint — earns USDC per call |
| `payX402Service(wallet, url)` | — | `{ data, paidAmount }` | How buyers (agents or humans) call our signal endpoint |

---

## Core Features

**Signal Formation**

- Background hourly poll: `skills.price("ETH")` → stored in `price_log`
- On signal request: fresh price fetch + Coinglass funding rates + liquidation levels + DeFiLlama DEX volume
- All onchain context serialised as JSON → `skills.chat()` → direction, confidence, reasoning
- Signal stored in `signals` table with `resolveAt = now + 1hr`

**Skin in the Game**

- Before returning a signal to the buyer, agent executes `skills.trade()` + `skills.broadcast()` in the same direction
- Fixed $0.50 USDC per trade — bounded, no risk management needed
- `tradeHash` included in signal response — buyer can verify agent committed first
- Trade resolves at same T+1h window, PnL tracked separately

**Signal Payload** (what callers receive)

```typescript
{
  direction: 'up' | 'down',
  confidence: number,          // 0–100
  currentPrice: number,
  resolveAt: number,           // UNIX timestamp
  reasoning: string,
  tradeHash: string,           // agent's own trade, executed before this response
  onchainContext: {
    fundingRate: number,
    liquidationBias: 'long-heavy' | 'short-heavy' | 'balanced',
    dexCexVolumeRatio: number,
  },
  trackRecord: {
    correct: number,
    total: number,
    tradePnl: number,          // cumulative USDC from agent's own trades
    last5: [{ direction, correct, timestamp }]
  }
}
```

**Survival State Model**

| Metric | Derivation |
|---|---|
| **Earn/Spend Ratio** | lifetime USDC earned ÷ lifetime USDC spent. Crosses 1.0 = thesis proven. |
| **Balance Runway** | current balance ÷ $0.24 daily burn. "X days remaining." |
| **Status Label** | Starving → Surviving → Breaking Even → Thriving |
| **Signal Price** | Dynamic — adjusts autonomously per status label |
| **Unlimited Progress** | lifetime earnings as % of $100. At $100: `skills.unlimited()` auto-triggered. |

**Dynamic Pricing**

| Status | Ratio | Signal Price |
|---|---|---|
| Starving | < 0.5 | $0.05 |
| Surviving | 0.5–1.0 | $0.10 |
| Breaking Even | ≈ 1.0 | $0.10 |
| Thriving | > 1.5 | $0.15 |
| Flush | earned $50+ | $0.20 |

**Reinvestment Logic**

When `ratio > 1.0` and `balance > $5`: fetches deeper onchain context per cycle. Compute budget scales with performance.

When `ratio < 0.5`: reduces to minimum (price fetch only). Flywheel runs in reverse — bad calls shrink the compute budget automatically.

**Live Dashboard**

- Monologue — SSE stream of agent reasoning, trade confirmations, pricing decisions in real time
- Survival panel — ratio, runway, tier, current signal price, unlimited progress bar
- Economics panel — earned, spent, margin, trade PnL (separate line item)
- Signal log — direction, verdict, price at signal vs resolution, trade outcome per row
- Wallet — live USDC balance

---

## In Scope

- Single agent, single wallet, one signal per cycle
- ETH price direction (UP / DOWN, 1-hour resolution)
- Onchain data: price (Birdeye), funding rates + liquidation levels (Coinglass), DEX/CEX volume (DeFiLlama)
- Agent executes its own $0.50 USDC trade before every signal sale
- x402 signal endpoint via `createSkillServer` — dynamic price by survival tier
- Outcome resolution: directional only at T+1h, no external oracle
- Dynamic pricing and reinvestment logic
- Live dashboard with SSE monologue, economics, signal log
- Base Sepolia for development, Base Mainnet for demo

---

## Out of Scope

- Multiple assets — ETH only
- User fund custody or position taking on behalf of users
- Multi-agent orchestration
- External oracles beyond PinionOS SDK + free public APIs
- User accounts, auth, subscriptions
- Mobile UI
- Prediction market mechanics — no pools, no peer-to-peer betting
- Dynamic trade sizing or stop losses — fixed $0.50 only

---

## Track Alignment

**Judging criteria:** Creativity · Functionality · Completeness · Code Quality

| Criterion | How we deliver |
|---|---|
| **Creativity** | Sovereign agent that backs every signal with its own USDC before selling it. Agent-to-agent commerce via x402 is the most native use case in the hack. Dynamic pricing and reinvestment are autonomous business decisions made live. |
| **Functionality** | Full autonomous loop — observe onchain data, reason, commit capital, sell signal, resolve, adapt. Every PinionOS SDK method justified. Earn/spend ratio crosses 1.0 live. |
| **Completeness** | Agent loop + x402 skill server + trade execution + outcome resolution + spend tier logic + live dashboard deployed end to end. No mock data. |
| **Code Quality** | TypeScript throughout, `bun:sqlite`, folder-per-concern architecture. Clean separation of agent, data, market, economics, resolution, events. |

**PinionOS SDK coverage — all 9 paid skills used:**

| Method | Used | Role |
|---|---|---|
| `skills.wallet()` | ✅ | Agent generates sovereign identity at boot |
| `skills.fund()` | ✅ | Boot wallet check + funding instructions |
| `skills.price()` | ✅ | Signal input + resolution verification |
| `skills.balance()` | ✅ | Per-signal wallet health + tier decision |
| `skills.chat()` | ✅ | Onchain context → signal reasoning |
| `skills.trade()` | ✅ | Agent commits $0.50 USDC before every signal sale |
| `skills.broadcast()` | ✅ | Execute trade + milestone proof tx |
| `skills.tx()` | ✅ | Verify trade landed after broadcast |
| `skills.send()` | ✅ | Construct proof-of-survival milestone tx |
| `skills.unlimited()` | ✅ | Auto-triggered at $100 lifetime earnings |
| `skills.unlimitedVerify()` | ✅ | Confirm key valid before switching modes |
| `createSkillServer + skill()` | ✅ | Agent's x402 signal endpoint |
| `payX402Service` | ✅ | Buyer's call pattern — any agent pays and receives signal |

---

*PRD v2.0 · Built on PinionOS · Feb 2026*
*Technical spec: docs/v2.md*
