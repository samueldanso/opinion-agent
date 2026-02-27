<div align="center">

<img src="assets/sigint-logo.svg" alt="SIGINT" width="100" />

# SIGINT

**On-chain Signals Intelligence**

> A sovereign AI that generates ETH price direction signals, backs every call with its own on-chain trade, sells them via x402 micropayments, and survives or dies on its track record — no human needed.

![Hackathon](https://img.shields.io/badge/Hackathon-PinionOS%202026-333333?style=flat-square)
![PinionOS](https://img.shields.io/badge/Built%20on-PinionOS-DA1C1C?style=flat-square&logoColor=white)
![Base](https://img.shields.io/badge/Network-Base-0052FF?style=flat-square&logoColor=white)
![x402](https://img.shields.io/badge/Payments-x402-FF69B4?style=flat-square&logoColor=white)
![npm](https://img.shields.io/badge/npm-sigint--os-CB3837?style=flat-square&logo=npm)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

</div>

---

## Overview

SIGINT is an autonomous AI agent that operates its own market signal business on Base. It reads on-chain market data every hour — ETH price, funding rates, liquidation levels, DEX/CEX volume — forms a directional conviction, executes a real USDC trade with its own capital before selling the signal, then returns a verifiable response with a `tradeHash`.

Buyers — agents or humans — pay $0.05–$0.20 USDC via x402. No account, no API key, no signup. The agent earns to survive, spends on every cycle, and its track record is public and permanent.

---

## Live Agent

| | |
|---|---|
| **Wallet** | [`0x9fe05351902e13c341e54f681e9541790efbe9b9`](https://basescan.org/address/0x9fe05351902e13c341e54f681e9541790efbe9b9) |
| **Token txns** | [USDC inflows + skill call payments](https://basescan.org/address/0x9fe05351902e13c341e54f681e9541790efbe9b9#tokentxns) |
| **Internal txns** | [1inch trade execution](https://basescan.org/address/0x9fe05351902e13c341e54f681e9541790efbe9b9#internaltx) |
| **Dashboard** | [sigint-agent.vercel.app](https://sigint-agent.vercel.app) |
| **Signal endpoint** | [`sigint-agent-production.up.railway.app/signal/eth`](https://sigint-agent-production.up.railway.app/signal/eth) — x402, $0.10 USDC |
| **x402scan** | [Listed on x402scan](https://www.x402scan.com/server/effc53a3-3235-48d5-a054-81c80b01bad2) |

---

## Buy a Signal

### Option 1 — npm package (simplest)

```bash
npm install sigint-os pinion-os
```

```typescript
import { getEthSignal } from "sigint-os"

const signal = await getEthSignal({
  privateKey: process.env.WALLET_KEY  // wallet with USDC on Base
})

console.log(signal.direction)   // "up" | "down"
console.log(signal.confidence)  // 72
console.log(signal.tradeHash)   // agent's own trade — verified on Basescan
```

→ Full SDK docs: [`packages/sigint-os/`](packages/sigint-os/README.md)

### Option 2 — PinionOS SDK directly

```typescript
import { PinionClient, payX402Service } from "pinion-os"

const pinion = new PinionClient({ privateKey: process.env.PINION_PRIVATE_KEY })
const signal = await payX402Service(
  pinion.signer,
  "https://sigint-agent-production.up.railway.app/signal/eth"
)
```

### Option 3 — PinionOS MCP plugin in Claude Code

```
Ask Claude: "Call the signal endpoint at https://sigint-agent-production.up.railway.app/signal/eth"
```

The MCP plugin handles the x402 handshake automatically.

### Option 4 — Any x402-compatible client

```bash
# Returns 402 with payment instructions
curl https://sigint-agent-production.up.railway.app/signal/eth
```

---

## Signal Response

```json
{
  "direction": "down",
  "confidence": 72,
  "currentPrice": 1947.31,
  "resolveAt": 1740621600000,
  "reasoning": "Funding rate positive at 0.02%, longs crowded. Price at resistance near $2,040 with bearish technicals.",
  "tradeHash": "0xb910...9d5d2",
  "onchainContext": {
    "fundingRate": 0.0201,
    "liquidationBias": "long-heavy",
    "dexCexVolumeRatio": 1.18
  },
  "trackRecord": {
    "correct": 3,
    "total": 5,
    "tradePnl": -0.12
  }
}
```

`tradeHash` — the agent executed a real USDC → ETH swap on Base **before** this response was sent. Verify at [basescan.org](https://basescan.org).

---

## How It Works

```
BOOT (once)
  └─ hasWallet() → load data/wallet.json OR restore from AGENT_PRIVATE_KEY
  └─ If no wallet: runGenesis() — skills.wallet() → skills.send() → skills.broadcast()
  └─ skills.balance() → check USDC/ETH, set initial signal price
        │
        ▼
OBSERVE (every hour)
  └─ skills.price("ETH")            $0.01   live price + 24h change
  └─ Coinglass funding API          free    8h funding rate + open interest
  └─ Coinglass liquidations API     free    24h long/short liquidation volumes
  └─ DeFiLlama volume API           free    DEX/CEX volume ratio
        │
        ▼
RESOLVE (every hour)
  └─ skills.price("ETH")            $0.01   resolve price
  └─ direction == "up"  → correct if price rose
  └─ direction == "down" → correct if price fell
  └─ Mark ✓ or ✗, record trade PnL
        │
        ▼
ADAPT (every hour)
  └─ Recalculate earn/spend ratio → adjust signal price if tier changed
  └─ If ratio ≥ 1.0 (first time): skills.send() + skills.broadcast() milestone tx
  └─ If earned ≥ $100: skills.unlimited() → free skill calls forever
        │
        ▼
ON SIGNAL PURCHASE (on demand — x402 payment required)
  └─ skills.price()                 $0.01   fresh price
  └─ Coinglass + DeFiLlama          free    onchain context
  └─ skills.chat(signalPrompt)      $0.01   direction + confidence + reasoning
  └─ skills.trade("USDC","ETH","0.5") $0.01 construct 1inch swap
  └─ skills.broadcast(tx)           $0.01   execute on Base
  └─ skills.tx(txHash)              $0.01   verify trade landed
  └─ Return signal + tradeHash to buyer
        │
        ▼
SURVIVE OR DIE
  └─ Wallet hits zero → agent halts permanently
  └─ Track record is public and permanent
```

---

## Survival Tiers

Signal price adjusts automatically every hour based on earn/spend ratio:

| Tier | Earn/Spend Ratio | Signal Price | Description |
|---|---|---|---|
| **Starving** | < 0.5 | $0.05 | Spending 2× earned — survival mode |
| **Surviving** | 0.5–1.0 | $0.10 | Approaching breakeven |
| **Breaking Even** | 1.0–1.5 | $0.10 | Thesis proven |
| **Thriving** | ≥ 1.5 | $0.15 | Consistently profitable |
| **Flush** | earned ≥ $50 | $0.20 | Abundant capital |

At **$100 lifetime earnings** → `skills.unlimited()` auto-triggered → all future PinionOS calls are free.

---

## PinionOS SDK Usage

All 9 paid PinionOS skills used. Every call is justified — no gratuitous usage:

| Skill | Cost | File | What It Does |
|---|---|---|---|
| `skills.wallet()` | $0.01 | [`src/agent/genesis.ts`](src/agent/genesis.ts) | Generate sovereign identity at first boot |
| `skills.fund()` | $0.01 | [`src/agent/genesis.ts`](src/agent/genesis.ts) | Boot balance check + funding instructions |
| `skills.price("ETH")` | $0.01 | [`src/data/price.ts`](src/data/price.ts) | Price at hourly poll, signal formation, resolution |
| `skills.balance(addr)` | $0.01 | [`src/agent/loop.ts`](src/agent/loop.ts) | Wallet health check after each signal |
| `skills.chat(prompt)` | $0.01 | [`src/signal/index.ts`](src/signal/index.ts) | Onchain context → directional signal JSON |
| `skills.trade(src,dst,amt)` | $0.01 | [`src/market/trade.ts`](src/market/trade.ts) | Construct $0.50 USDC → ETH swap via 1inch |
| `skills.broadcast(tx)` | $0.01 | [`src/market/trade.ts`](src/market/trade.ts) | Execute trade + milestone proof tx on Base |
| `skills.tx(hash)` | $0.01 | [`src/market/trade.ts`](src/market/trade.ts) | Verify trade landed (not hallucinated) |
| `skills.send(to,amt,token)` | $0.01 | [`src/agent/loop.ts`](src/agent/loop.ts) | Construct proof-of-survival tx when ratio ≥ 1.0 |
| `skills.unlimited()` | $100 | [`src/agent/loop.ts`](src/agent/loop.ts) | Auto-purchase unlimited key at $100 earned |

**Server-side:**

| API | File | What It Does |
|---|---|---|
| `createSkillServer` + `skill()` | [`src/server/skill.ts`](src/server/skill.ts) | x402 revenue endpoint — earns USDC per signal |
| `payX402Service` | [`packages/sigint-os/`](packages/sigint-os/src/index.ts) | Buyer integration pattern — any agent calls with one line |

→ Full cost breakdown and lifecycle: [`docs/00-overview.md`](docs/00-overview.md)

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  DASHBOARD  Next.js 15 · Vercel                      │
│  Monologue · Survival · Economics · Signal Log        │
│  ◄── SSE stream  ──  /status  ──  /signals           │
└─────────────────────┬────────────────────────────────┘
                      │ HTTP / SSE
┌─────────────────────▼────────────────────────────────┐
│  BACKEND  Bun / TypeScript · Railway                 │
│                                                      │
│  Port 3001 — Express                                 │
│  ├─ GET /events           SSE stream                 │
│  ├─ GET /status           snapshot                   │
│  ├─ GET /signals          history                    │
│  ├─ GET /.well-known/x402 discovery                  │
│  └─ ALL /signal/*         proxy → port 4020          │
│                                                      │
│  Port 4020 — createSkillServer                       │
│  └─ GET /signal/eth       x402 gate ($0.10 USDC)     │
│                                                      │
│  PinionOS SDK · Coinglass · DeFiLlama                │
│  SQLite (bun:sqlite) — ./data/agent.db               │
└─────────────────────┬────────────────────────────────┘
                      │ x402 · USDC · 1inch swaps
┌─────────────────────▼────────────────────────────────┐
│  Base L2 Mainnet                                     │
└──────────────────────────────────────────────────────┘
```

Two servers, one process. One Railway domain — the proxy routes `/signal/*` to port 4020 internally.

→ Full architecture with data flow diagrams: [`docs/01-architecture.md`](docs/01-architecture.md)

---

## Project Structure

```
sigint-agent/
├── src/
│   ├── index.ts                  Boot sequence
│   ├── config/index.ts           Env vars, thresholds, ports
│   ├── agent/
│   │   ├── loop.ts               Hourly tick, balance checks, milestone, unlimited
│   │   ├── genesis.ts            skills.wallet() + skills.send() + skills.broadcast()
│   │   ├── monologue.ts          Agent reasoning log → DB + SSE
│   │   └── identity.ts           SIGINT PERSONA for skills.chat()
│   ├── signal/
│   │   ├── index.ts              generateSignal() — main orchestrator
│   │   ├── compose.ts            Prompt assembly with onchain context
│   │   └── parse.ts              JSON extraction from skills.chat() response
│   ├── server/
│   │   ├── skill.ts              createSkillServer — x402 /signal/eth endpoint
│   │   └── api.ts                Express — SSE, status, signals, x402 proxy
│   ├── market/
│   │   └── trade.ts              skills.trade() + skills.broadcast() + skills.tx()
│   ├── data/
│   │   ├── index.ts              fetchOnchainContext() — aggregates all sources
│   │   ├── price.ts              skills.price("ETH")
│   │   ├── funding.ts            Coinglass funding rates
│   │   ├── liquidations.ts       Coinglass liquidation levels
│   │   └── volume.ts             DeFiLlama DEX/CEX volume
│   ├── resolution/
│   │   └── index.ts              resolvePendingSignals() — hourly verdict
│   ├── economics/
│   │   ├── tracker.ts            Earn/spend ratio, tier derivation, runway
│   │   └── pricing.ts            Dynamic signal price by tier
│   ├── events/index.ts           SSE client registry + broadcast
│   └── db/                       SQLite CRUD (signals, trades, prices, spend, monologue)
├── frontend/
│   ├── app/                      Next.js app router + API proxy routes
│   ├── components/               Dashboard panels (Monologue, Feed, Survival, Economics, Wallet)
│   ├── hooks/use-agent-stream.ts SSE state management
│   └── lib/types.ts              TypeScript types
├── packages/
│   └── sigint-os/                npm client SDK — any agent can install and call
├── data/                         SQLite DB + wallet.json (Railway volume, gitignored)
├── docs/
│   ├── 00-overview.md            Problem, solution, agent lifecycle, PinionOS coverage
│   ├── 01-architecture.md        System design, data flows, DB schema, module breakdown
│   └── 02-setup.md               Local dev, genesis flow, Railway + Vercel deployment
└── assets/sigint-logo.svg
```

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- A wallet with **USDC + ETH on Base** (USDC for skill calls + trades, ETH for gas)

### 1. Clone and install

```bash
git clone https://github.com/samueldanso/sigint-agent
cd sigint-agent
bun install
cd frontend && bun install && cd ..
```

### 2. Configure

**`.env` (backend):**

```bash
# Creator wallet — funds the agent on first boot
PINION_PRIVATE_KEY=0x<your-funded-wallet-private-key>
PINION_NETWORK=base-sepolia    # use base-sepolia during dev
```

**`frontend/.env.local`:**

```bash
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_AGENT_URL=http://localhost:3001
```

### 3. Run

```bash
bun run dev                    # backend (both servers)
cd frontend && bun run dev     # dashboard
```

First boot runs genesis: generates the agent wallet, funds it with USDC + ETH, saves it to `data/wallet.json`. Subsequent boots skip genesis and load the existing wallet.

→ Full setup guide, Railway deployment, wallet management: [`docs/02-setup.md`](docs/02-setup.md)

---

## API Reference

### `GET /status`

```typescript
{
  address: string,           // agent wallet address
  accuracy: number,          // % correct signals
  correct: number,           // count of correct
  total: number,             // count of resolved
  totalEarned: number,       // lifetime USDC revenue
  totalSpent: number,        // lifetime USDC spend (skill calls)
  tradePnl: number,          // agent's cumulative trade PnL
  ratio: number,             // earned / spent
  tier: string,              // "Starving" | "Surviving" | "Breaking Even" | "Thriving" | "Flush"
  signalPrice: number,       // current price in USDC
  unlimitedProgress: number, // 0–100, % toward $100 unlimited key
  monologueHistory: string[] // last 100 agent log lines
}
```

### `GET /signals`

```typescript
{
  signals: SignalRow[],   // last 100 signals, newest first
  trades: TradeRow[]      // last 100 trades, newest first
}
```

### `GET /events` — SSE

Real-time agent event stream. Connect with `EventSource("/api/stream")` from the frontend (proxied through Next.js).

| Event | Payload |
|---|---|
| `price_update` | `{ price, timestamp }` |
| `signal_sold` | `{ direction, confidence, revenue, price }` |
| `trade_executed` | `{ direction, amountUSDC, txHash }` |
| `trade_verified` | `{ txHash, status }` |
| `signal_resolved` | `{ id, correct, pnl, accuracy, deltaFormatted }` |
| `balance_update` | `{ usdc, runway, ratio, earned, spent }` |
| `price_adjusted` | `{ oldPrice, newPrice, reason }` |
| `milestone` | `{ event, txHash }` |
| `monologue` | `{ text }` |
| `unlimited_purchased` | `{ apiKey }` |

### `GET /.well-known/x402`

x402 discovery document. Used by [x402scan](https://x402scan.com) and any x402-compatible client for automatic resource discovery. Includes ownership proof (origin URL signed with agent's private key).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun + TypeScript |
| Agent framework | PinionOS SDK (`pinion-os`) |
| Skill server | `createSkillServer` + `skill()` from `pinion-os/server` |
| Payments | x402 on Base — USDC, machine-to-machine native |
| On-chain data | PinionOS Birdeye (price), Coinglass (funding + liquidations), DeFiLlama (volume) |
| Trade routing | 1inch via `skills.trade()` + `skills.broadcast()` |
| LLM reasoning | Claude via `skills.chat()` — no direct API key needed |
| Storage | SQLite via `bun:sqlite` |
| Frontend | Next.js 15 + shadcn/ui + Tailwind CSS v4 |
| Real-time | Server-Sent Events (SSE) |
| Blockchain | Base L2 (wagmi + viem) |
| Client SDK | `packages/sigint-os/` — npm-publishable integration package |
| Deploy | Railway (backend + SQLite volume) · Vercel (frontend) |

---

## Deployment

### Backend → Railway

1. Push to GitHub → Railway → New Project → Deploy from GitHub
2. Set env vars: `AGENT_PRIVATE_KEY`, `PINION_PRIVATE_KEY`, `PINION_NETWORK=base`
3. Add Volume: mount path `/app/data` (persists wallet + DB across deploys)
4. Generate domain (port 8080 or 3001)

### Frontend → Vercel

1. Import `frontend/` to Vercel
2. Set `BACKEND_URL` and `NEXT_PUBLIC_AGENT_URL` to Railway URL

→ Step-by-step: [`docs/02-setup.md`](docs/02-setup.md)

---

## Troubleshooting

| Error | Fix |
|---|---|
| `No agent wallet found and PINION_PRIVATE_KEY not set` | Set `PINION_PRIVATE_KEY=0x...` in `.env` |
| `Insufficient balance` | Fund wallet with USDC + ETH on Base |
| `402 Payment Required` (raw curl) | Use `payX402Service`, MCP plugin, or dashboard |
| Frontend "Reconnecting..." | Backend not running — `bun run dev` |
| Trade failing | Check ETH balance (~0.001 ETH for gas) |
| Wallet wiped on Railway redeploy | Add volume at `/app/data` |
| Genesis runs again on Railway | Set `AGENT_PRIVATE_KEY` in Railway env vars |

---

## Documentation

| Doc | Description |
|---|---|
| [`docs/00-overview.md`](docs/00-overview.md) | Problem, solution, agent lifecycle, PinionOS SDK coverage, cost breakdown |
| [`docs/01-architecture.md`](docs/01-architecture.md) | System design, data flow diagrams, DB schema, module reference |
| [`docs/02-setup.md`](docs/02-setup.md) | Local dev, genesis flow, Railway + Vercel deployment, wallet management |
| [`packages/sigint-os/`](packages/sigint-os/README.md) | npm client SDK — buy signals from any agent or app |

---

## Contributing

1. Fork this repository
2. Create your feature branch
3. Commit your changes
4. Open a Pull Request

---

## License

MIT

---

## Acknowledgements

- [PinionOS](https://pinionos.com) — the SDK and x402 infrastructure that makes this possible
- [x402 Protocol](https://www.x402.org) — machine-native micropayments
- [Base](https://base.org) — L2 where the agent lives and trades
- [1inch](https://1inch.io) — DEX aggregator powering agent trades
