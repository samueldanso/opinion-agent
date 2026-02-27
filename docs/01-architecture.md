# SIGINT — Architecture

## System Overview

SIGINT runs as a single Bun process with two co-located servers, a SQLite database, and a Next.js dashboard deployed separately on Vercel.

```
┌──────────────────────────────────────────────────────────────────┐
│  DASHBOARD  Next.js 15 + shadcn/ui · Vercel                     │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Monologue  │  │   Survival   │  │Economics │  │ Feed     │  │
│  │  SSE stream │  │ ratio/runway │  │earn/spend│  │ signals  │  │
│  └─────────────┘  └──────────────┘  └──────────┘  └──────────┘  │
│                                                                  │
│  useAgentStream hook — EventSource("/api/stream")                │
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTP + SSE
              ┌────────────────▼───────────────────┐
              │  Next.js API routes (proxy layer)   │
              │  /api/stream  → BACKEND_URL/events  │
              │  /api/status  → BACKEND_URL/status  │
              │  /api/signals → BACKEND_URL/signals │
              └────────────────┬───────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│  BACKEND  Bun / TypeScript · Railway                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Port 3001 — Express API/SSE server                        │ │
│  │                                                             │ │
│  │  GET /events          SSE stream (all agent events)        │ │
│  │  GET /status          current agent snapshot               │ │
│  │  GET /signals         signal + trade history               │ │
│  │  GET /.well-known/x402  x402 discovery document            │ │
│  │  ALL /signal/*        proxy → port 4020                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Port 4020 — createSkillServer (pinion-os/server)          │ │
│  │                                                             │ │
│  │  GET /signal/eth      x402 payment gate ($0.05–$0.20 USDC) │ │
│  │  ← x402 middleware validates USDC payment before handler   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Agent Core                                                 │ │
│  │                                                             │ │
│  │  agent/loop.ts         hourly tick, boot, milestone logic  │ │
│  │  agent/genesis.ts      wallet creation + funding           │ │
│  │  agent/monologue.ts    logging → DB + SSE broadcast        │ │
│  │  agent/identity.ts     SIGINT PERSONA system prompt        │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │  PinionOS SDK  (pinion-os)                                  │ │
│  │                                                             │ │
│  │  price · balance · chat · trade · broadcast                 │ │
│  │  wallet · send · tx · unlimited · unlimitedVerify           │ │
│  │  Each call: $0.01 USDC via x402 (free after $100 earned)   │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │  Free APIs                                                  │ │
│  │                                                             │ │
│  │  Coinglass     funding rates + liquidation levels          │ │
│  │  DeFiLlama     DEX/CEX volume ratio                        │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │  SQLite — bun:sqlite — ./data/agent.db                      │ │
│  │                                                             │ │
│  │  price_log   · signals  · trades                            │ │
│  │  spend_log   · monologue_log                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬───────────────────────────────────┘
                               │ x402 payments · USDC · swaps
┌──────────────────────────────▼───────────────────────────────────┐
│  Base L2 Mainnet                                                 │
│                                                                  │
│  USDC token · 1inch DEX aggregator · ETH gas                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Two-Server Design

The two-server design exists because `createSkillServer` (from `pinion-os/server`) does not expose its underlying Express app. x402 middleware runs internally at port 4020. All other endpoints (SSE, status, signals) run on a second Express server at port 3001.

On Railway, only one public domain is needed. The API server at port 3001 proxies all `/signal/*` requests to port 4020 via an internal `fetch()`.

```
Buyer → BACKEND_URL/signal/eth
  └─ Express (3001) /signal/* handler
       └─ fetch("http://localhost:4020/signal/eth", { headers })
            └─ x402 middleware validates payment
                 └─ skill handler runs → returns signal
```

The `x-payment` header is forwarded, allowing the full x402 handshake to work through the proxy.

---

## Data Flow: Signal Purchase

```
Buyer                    API Server (3001)     Skill Server (4020)   PinionOS SDK    Base
  │                           │                       │                   │            │
  ├─── GET /signal/eth ───────►│                       │                   │            │
  │                           ├─── proxy ─────────────►│                   │            │
  │                           │                       ├─── 402 response ──►│            │
  │                           │◄──── 402 ─────────────┤                   │            │
  │◄──── 402 ─────────────────┤                       │                   │            │
  │                           │                       │                   │            │
  ├─── GET /signal/eth ───────►│                       │                   │            │
  │    x-payment: <signature> │                       │                   │            │
  │                           ├─── proxy + header ────►│                   │            │
  │                           │                       ├─── verify payment ─►           │
  │                           │                       │                   │            │
  │                           │                       ├─── skills.price() ─►           │
  │                           │                       │◄── priceUSD ───────┤            │
  │                           │                       ├─── Coinglass ──────────────────►│
  │                           │                       │◄── funding/liquidations ───────┤
  │                           │                       ├─── DeFiLlama ──────────────────►│
  │                           │                       │◄── DEX/CEX volume ─────────────┤
  │                           │                       ├─── skills.chat() ──►           │
  │                           │                       │◄── direction JSON ─┤            │
  │                           │                       ├─── skills.trade() ─►           │
  │                           │                       │◄── unsigned tx ────┤            │
  │                           │                       ├─── skills.broadcast() ─────────►│
  │                           │                       │◄── txHash ─────────────────────┤
  │                           │                       ├─── skills.tx() ────►           │
  │                           │                       │◄── tx verified ────┤            │
  │                           │                       │                   │            │
  │                           │                       ├── insertSignal() ──►            │
  │                           │                       ├── insertTrade() ───►            │
  │                           │                       ├── emit SSE ────────►            │
  │                           │                       │                   │            │
  │◄──── signal JSON ─────────┤◄──── signal JSON ─────┤                   │            │
```

---

## Data Flow: Hourly Loop

```
Every 3,600,000 ms (1 hour):

tick()
  ├─ skills.price("ETH")          $0.01  → insert price_log
  ├─ emit price_update SSE
  │
  ├─ resolvePendingSignals()
  │   ├─ skills.price("ETH")      $0.01  → resolve price
  │   ├─ For each pending signal:
  │   │   ├─ isCorrect(direction, entryPrice, resolvePrice)
  │   │   ├─ updateSignal(db, id, resolvedPrice, correct)
  │   │   ├─ updateTrade(db, signalId, pnl)
  │   │   └─ emit signal_resolved SSE
  │
  ├─ skills.balance(agentAddr)    $0.01  → current USDC/ETH
  ├─ getEconomicState()           → ratio, tier, runway
  ├─ emit balance_update SSE
  │
  ├─ if tier changed:
  │   ├─ update _currentSignalPrice
  │   └─ emit price_adjusted SSE
  │
  ├─ if ratio >= 1.0 AND !milestoneSent:
  │   ├─ skills.send()            $0.01  → unsigned proof tx
  │   ├─ skills.broadcast()       $0.01  → execute on Base
  │   └─ emit milestone SSE
  │
  └─ if totalEarned >= 100 AND !unlocked:
      ├─ skills.unlimited()       $100   → purchase unlimited key
      ├─ pinion.setApiKey(key)           → free calls from here
      └─ emit unlimited_purchased SSE
```

---

## Database Schema

```sql
-- ETH price history (hourly + on each signal)
CREATE TABLE price_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  priceUSD  REAL    NOT NULL,
  change24h REAL
);

-- Generated and resolved signals
CREATE TABLE signals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  formedAt      INTEGER NOT NULL,
  resolveAt     INTEGER NOT NULL,         -- formedAt + 3,600,000 ms
  resolvedAt    INTEGER,                  -- null until resolved
  direction     TEXT    NOT NULL,         -- "up" | "down"
  confidence    INTEGER NOT NULL,         -- 0–100
  reasoning     TEXT    NOT NULL,
  currentPrice  REAL    NOT NULL,         -- ETH price at signal formation
  resolvedPrice REAL,                     -- ETH price at resolution
  correct       INTEGER,                  -- null | 0 | 1
  priceCharged  REAL    NOT NULL,         -- USDC charged to buyer
  revenue       REAL                      -- null until sold
);

-- Agent's own trades backing each signal
CREATE TABLE trades (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  signalId    INTEGER REFERENCES signals(id),
  executedAt  INTEGER NOT NULL,
  direction   TEXT    NOT NULL,           -- mirrors signal direction
  amountUSDC  REAL    NOT NULL,           -- 0.5 USDC default
  txHash      TEXT    NOT NULL,           -- Base transaction hash
  resolvedPnl REAL                        -- null until resolved
);

-- PinionOS skill call cost tracking
CREATE TABLE spend_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  amount    REAL    NOT NULL              -- $0.01 per skill call
);

-- Agent reasoning and action log
CREATE TABLE monologue_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  text      TEXT    NOT NULL
);
```

---

## SSE Event Contract

All events are broadcast to connected SSE clients and persisted via `monologue_log` (for monologue events) or accessible via `/status` and `/signals` endpoints.

```typescript
type SSEEvent =
  | { type: "price_update"; price: number; timestamp: number }
  | { type: "signal_sold"; direction: string; confidence: number; revenue: number; price: number }
  | { type: "trade_executed"; direction: string; amountUSDC: number; txHash: string }
  | { type: "trade_verified"; txHash: string; status: "success" | "failed" }
  | { type: "signal_resolved"; id: number; correct: boolean; pnl: number; accuracy: number; deltaFormatted: string }
  | { type: "balance_update"; usdc: number; runway: number; ratio: number; earned: number; spent: number }
  | { type: "price_adjusted"; oldPrice: number; newPrice: number; reason: string }
  | { type: "reinvestment"; amount: number; into: string }
  | { type: "milestone"; event: string; txHash: string }
  | { type: "monologue"; text: string }
  | { type: "unlimited_purchased"; apiKey: string }
```

---

## Module Breakdown

```
src/
├── index.ts                 Entry — boot sequence, server startup
├── config/
│   └── index.ts             All env vars, port numbers, thresholds
├── agent/
│   ├── index.ts             Re-exports: boot, startLoop, say, getCurrentSignalPrice
│   ├── loop.ts              hourly tick(), boot()
│   ├── genesis.ts           hasWallet(), loadWallet(), runGenesis()
│   ├── monologue.ts         say(), getMonologueHistory() — ring buffer + DB
│   └── identity.ts          PERSONA system prompt for skills.chat()
├── signal/
│   ├── index.ts             generateSignal() — main orchestrator
│   ├── compose.ts           buildSignalPrompt() — prompt assembly
│   └── parse.ts             parseSignalResponse() — JSON extraction from LLM
├── server/
│   ├── index.ts             Re-exports both servers
│   ├── skill.ts             x402 skill server, signal handler
│   └── api.ts               Express: SSE, status, signals, proxy, discovery
├── resolution/
│   ├── index.ts             resolvePendingSignals()
│   └── verdict.ts           isCorrect(), calculatePnl()
├── market/
│   └── trade.ts             executeTrade() → skills.trade() + broadcast()
├── data/
│   ├── index.ts             fetchOnchainContext() — aggregates all sources
│   ├── price.ts             fetchPrice() → skills.price()
│   ├── funding.ts           fetchFundingRate() → Coinglass
│   ├── liquidations.ts      fetchLiquidations() → Coinglass
│   └── volume.ts            fetchDexCexVolume() → DeFiLlama
├── economics/
│   ├── index.ts             Re-exports
│   ├── tracker.ts           getEconomicState(), recordSpend(), deriveTier()
│   └── pricing.ts           getSignalPrice(), TIER_PRICES map
├── events/
│   ├── index.ts             emit(), addClient(), getClientCount()
│   └── registry.ts          SSE client registry, keepalive, history buffer
└── db/
    ├── index.ts             getDb(), schema init, re-exports
    ├── schema.ts            CREATE TABLE statements
    ├── signals.ts           insertSignal, getAllSignals, getPendingSignals, resolveSignal
    ├── trades.ts            insertTrade, getAllTrades, getTradeBySignalId, resolveTrade
    ├── prices.ts            insertPrice, getRecentPrices
    ├── spend.ts             insertSpend, getTotalSpend
    └── monologue.ts         insertMonologue, getRecentMonologue
```

---

## Configuration Reference

All configuration lives in `src/config/index.ts`. Values can be overridden via environment variables:

| Config | Env Var | Default | Description |
|---|---|---|---|
| Network | `PINION_NETWORK` | `base` | `base` or `base-sepolia` |
| Creator key | `PINION_PRIVATE_KEY` | — | Creator wallet for genesis |
| Agent key | `AGENT_PRIVATE_KEY` | — | Restores agent wallet on Railway |
| Seed USDC | `SEED_USDC` | `5` | USDC sent to agent on genesis |
| Seed ETH | `SEED_ETH` | `0.001` | ETH sent to agent for gas |
| API port | `PORT` | `3001` | Express server port |
| Skill port | — | `4020` | x402 skill server (hardcoded) |
| Poll interval | — | `3600000` | 1 hour in ms |
| Resolution window | — | `3600000` | 1 hour from signal formation |
| Trade amount | — | `0.5` | USDC per signal-backing trade |
| Flush threshold | — | `50` | Earned USDC to reach Flush tier |
| Unlimited threshold | — | `100` | Earned USDC to auto-purchase unlimited key |
