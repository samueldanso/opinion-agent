<div align="center">

<img src="assets/sigint-logo.svg" alt="SIGINT" width="100" />

# SIGINT

**On-chain Signals Intelligence**

> A sovereign AI that generates ETH price direction signals, backs every call with its own on-chain trade, sells them via x402 micropayments, and survives or dies on its track record — no human needed.

![Hackathon](https://img.shields.io/badge/Hackathon-PinionOS%202026-333333?style=flat-square)
![PinionOS](https://img.shields.io/badge/Built%20on-PinionOS-DA1C1C?style=flat-square&logoColor=white)
![Base](https://img.shields.io/badge/Network-Base-0052FF?style=flat-square&logoColor=white)
![x402](https://img.shields.io/badge/Payments-x402-FF69B4?style=flat-square&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

</div>

---

## Overview

SIGINT is an autonomous AI agent that operates its own market signal business on Base. It reads on-chain market data every hour (ETH price, funding rates, liquidation levels, DEX/CEX volume), forms a directional conviction, executes a real USDC trade with its own capital before selling the signal, then returns a verifiable response with a `tradeHash`.

Buyers — agents or humans — pay $0.05–$0.20 USDC via x402. No account, no API key, no signup. The agent earns to survive, spends on every cycle, and its track record is public and permanent.

---

## Live Agent

| | |
|---|---|
| **Wallet** | [`0x9fe05351902e13c341e54f681e9541790efbe9b9`](https://basescan.org/address/0x9fe05351902e13c341e54f681e9541790efbe9b9) |
| **Token txns** | [USDC inflows + skill call payments](https://basescan.org/address/0x9fe05351902e13c341e54f681e9541790efbe9b9#tokentxns) |
| **Internal txns** | [1inch trade execution](https://basescan.org/address/0x9fe05351902e13c341e54f681e9541790efbe9b9#internaltx) |
| **Dashboard** | [sigint-agent.vercel.app](https://sigint-agent.vercel.app) |
| **Signal endpoint** | [`sigint-agent-production.up.railway.app/signal/eth`](https://sigint-agent-production.up.railway.app/signal/eth) |
| **x402scan** | [`x402scan.com/server/effc53a3-3235-48d5-a054-81c80b01bad2`](https://www.x402scan.com/server/effc53a3-3235-48d5-a054-81c80b01bad2) |

---

## How It Works

```
BOOT (once)
  └─ Load or generate agent wallet
  └─ Check USDC + ETH balance via skills.balance()
  └─ Set initial signal price based on earn/spend tier
        │
        ▼
OBSERVE (every hour)
  └─ skills.price("ETH")                → live price + 24h change
  └─ Coinglass API (free)               → funding rates + liquidation levels
  └─ DeFiLlama API (free)               → DEX/CEX volume ratio
        │
        ▼
RESOLVE (every hour)
  └─ Find signals where resolveAt ≤ now
  └─ skills.price("ETH")                → compare direction vs actual move
  └─ Mark ✓ or ✗, record trade PnL
        │
        ▼
ADAPT (every hour)
  └─ Recalculate earn/spend ratio
  └─ Adjust signal price if tier changed
  └─ Send $0.01 USDC milestone tx if ratio just crossed 1.0
  └─ Purchase unlimited key if lifetime earnings cross $100
        │
        ▼
ON SIGNAL PURCHASE (on demand, x402 payment required)
  └─ skills.price() + Coinglass + DeFiLlama  → onchain context
  └─ skills.chat()                            → direction + confidence + reasoning
  └─ skills.trade() + skills.broadcast()      → commit $0.50 USDC first
  └─ skills.tx()                              → verify trade landed on Base
  └─ Return signal + tradeHash to buyer
        │
        ▼
SURVIVE OR DIE
  └─ Wallet hits zero → agent halts permanently
  └─ Track record is public and permanent
```

---

## Survival Tiers

Signal price adjusts automatically every hour based on the agent's earn/spend ratio:

| Tier | Earn/Spend Ratio | Signal Price | Description |
|---|---|---|---|
| **Starving** | < 0.5 | $0.05 | Spending 2× what it earns — survival mode |
| **Surviving** | 0.5–1.0 | $0.10 | Approaching breakeven |
| **Breaking Even** | 1.0–1.5 | $0.10 | Thesis being proven |
| **Thriving** | ≥ 1.5 | $0.15 | Consistently profitable |
| **Flush** | earned ≥ $50 | $0.20 | Abundant capital, near-unlimited tier |

At **$100 lifetime earnings**, `skills.unlimited()` is auto-triggered — all future PinionOS skill calls become free.

---

## Signal Response

```json
{
  "direction": "down",
  "confidence": 72,
  "currentPrice": 1947.31,
  "resolveAt": 1740621600000,
  "reasoning": "Funding rate positive at 0.02%, longs crowded. Price sitting at resistance near $2,040 trend line with bearish technicals.",
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

`tradeHash` is proof the agent executed a real USDC → ETH trade on Base **before** this response was returned. Verifiable on [Basescan](https://basescan.org).

---

## Buy a Signal

### With PinionOS SDK (agent-to-agent)

```typescript
import { PinionClient, payX402Service } from "pinion-os"

const pinion = new PinionClient({ privateKey: process.env.PINION_PRIVATE_KEY })
const signal = await payX402Service(
  pinion.signer,
  "https://sigint-agent-production.up.railway.app/signal/eth"
)
// $0.10 USDC paid automatically — signal returned
```

### With PinionOS MCP plugin in Claude Code

```
Ask Claude: "Call the signal endpoint at https://sigint-agent-production.up.railway.app/signal/eth"
```

The MCP plugin handles x402 payment automatically.

### With any x402-compatible HTTP client

```bash
# Raw curl — returns 402 with payment instructions
curl https://sigint-agent-production.up.railway.app/signal/eth

# x402-aware client required to complete payment and receive signal
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  DASHBOARD  Next.js · Vercel                        │
│  Monologue · Survival · Economics · Signal Log      │
│  ◄── SSE stream  ──  GET /status  ──  GET /signals  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / SSE
┌──────────────────────▼──────────────────────────────┐
│  BACKEND  Bun / TypeScript · Railway                │
│                                                     │
│  Port 3001 — Express                                │
│  ├── GET /events          SSE stream                │
│  ├── GET /status          snapshot                  │
│  ├── GET /signals         history                   │
│  ├── GET /.well-known/x402  discovery               │
│  └── ALL /signal/*        proxy → port 4020         │
│                                                     │
│  Port 4020 — createSkillServer (pinion-os/server)   │
│  └── GET /signal/eth      x402 gate ($0.10 USDC)    │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  PinionOS SDK  (paid $0.01/call via x402)    │   │
│  │  price · balance · chat · trade · broadcast  │   │
│  │  wallet · send · tx · unlimited              │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  Free APIs                                   │   │
│  │  Coinglass · DeFiLlama                       │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  SQLite (bun:sqlite) — ./data/agent.db              │
│  price_log · signals · trades · spend_log           │
└──────────────────────┬──────────────────────────────┘
                       │ x402 · USDC · trades
┌──────────────────────▼──────────────────────────────┐
│  Base L2 Mainnet                                    │
│  USDC payments · 1inch swaps · ETH gas              │
└─────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- A funded wallet: **USDC on Base** (skill calls + trades) + **ETH on Base** (gas)

### 1. Clone and install

```bash
git clone https://github.com/samueldanso/sigint-agent
cd sigint-agent
bun install
cd frontend && bun install && cd ..
```

### 2. Configure

```bash
cp .env.example .env
```

**`.env` (backend):**

```bash
# Creator wallet — used once on first boot to spawn and fund the agent
PINION_PRIVATE_KEY=0x<your-funded-wallet-private-key>

# Network
PINION_NETWORK=base          # base-sepolia for development

# Genesis funding (optional, defaults shown)
SEED_USDC=5                  # $5 USDC sent to agent wallet on genesis
SEED_ETH=0.001               # 0.001 ETH sent to agent wallet for gas
```

**`frontend/.env.local`:**

```bash
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_AGENT_URL=http://localhost:3001
```

> On Railway: set `AGENT_PRIVATE_KEY=0x<agent-key>` to restore an existing wallet without re-running genesis.

### 3. Fund the creator wallet

| Asset | Minimum | Purpose |
|---|---|---|
| USDC on Base | $6 | Agent seed ($5) + genesis skill calls ($0.05) |
| ETH on Base | 0.002 | Gas for genesis funding tx + agent operations |

Bridge USDC: [bridge.base.org](https://bridge.base.org) · Get Base ETH: [faucet.base.org](https://faucet.base.org) (Sepolia)

### 4. Run

```bash
# Terminal 1 — agent backend
bun run dev

# Terminal 2 — dashboard
cd frontend && bun run dev
```

| Port | Service |
|---|---|
| `4020` | x402 skill server — `GET /signal/eth` |
| `3001` | API + SSE server |
| `3000` | Next.js dashboard |

**First boot output:**

```
[SIGINT] GENESIS — No agent wallet found. Spawning sovereign identity...
[SIGINT] Agent wallet created: 0x...
[SIGINT] Funded agent with $5.00 USDC + 0.001 ETH
[SIGINT] Wallet saved to data/wallet.json
[SIGINT] Balance: 4.97 USDC | 0.001 ETH
[SIGINT] Tier: Starving | Signal price: $0.05
[SIGINT] x402 skill server on port 4020
[SIGINT] API/SSE server on port 3001
[SIGINT] Agent online. Starting hourly loop.
```

---

## API Reference

### `GET /status`

Current agent snapshot.

```typescript
{
  address: string          // agent wallet address
  accuracy: number         // % correct (resolved signals only)
  correct: number          // count of correct signals
  total: number            // count of resolved signals
  totalEarned: number      // lifetime USDC revenue
  totalSpent: number       // lifetime USDC spent on skill calls
  tradePnl: number         // cumulative PnL from agent's own trades
  ratio: number            // totalEarned / totalSpent
  tier: string             // "Starving" | "Surviving" | "Breaking Even" | "Thriving" | "Flush"
  signalPrice: number      // current price in USDC
  unlimitedProgress: number // 0–100, % toward $100 unlimited key
  clients: number          // connected SSE clients
  monologueHistory: string[] // last 100 agent log lines
}
```

### `GET /signals`

```typescript
{
  signals: SignalRow[]   // last 100 signals, newest first
  trades: TradeRow[]     // last 100 trades, newest first
}
```

### `GET /events` — SSE

Streams all agent activity in real time. Connect with `EventSource`.

| Event type | Payload |
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

### `GET /signal/eth` — x402 (port 4020, proxied via 3001)

Requires x402 USDC payment. Returns signal JSON (see [Signal Response](#signal-response) above).

### `GET /.well-known/x402`

x402 discovery document. Used by x402scan and x402-compatible clients for automatic resource discovery.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun + TypeScript |
| Agent framework | PinionOS SDK (`pinion-os`) |
| Skill server | `createSkillServer` + `skill()` from `pinion-os/server` |
| Payments | x402 on Base — USDC, machine-to-machine native |
| Onchain data | PinionOS Birdeye (price), Coinglass (funding + liquidations), DeFiLlama (volume) |
| Trade routing | 1inch via `skills.trade()` + `skills.broadcast()` |
| LLM reasoning | Claude via `skills.chat()` — no direct API key needed |
| Storage | SQLite via `bun:sqlite` |
| Frontend | Next.js 15 + shadcn/ui + Tailwind CSS v4 |
| Real-time | Server-Sent Events (SSE) |
| Blockchain | Base L2 (wagmi + viem) |
| Deploy | Railway (backend + SQLite volume) · Vercel (frontend) |

---

## Project Structure

```
sigint-agent/
├── src/
│   ├── index.ts              Entry point — boot sequence
│   ├── config/               Env vars, thresholds, port config
│   ├── agent/                Boot, hourly loop, genesis, monologue, identity
│   ├── signal/               Signal generation, prompt building, response parsing
│   ├── server/
│   │   ├── skill.ts          x402 skill server (port 4020)
│   │   └── api.ts            API + SSE server (port 3001)
│   ├── resolution/           Signal resolution logic, PnL calculation
│   ├── market/               Trade execution via 1inch
│   ├── data/                 Onchain context (price, funding, liquidations, volume)
│   ├── economics/            Spend tracking, tier derivation, dynamic pricing
│   ├── events/               SSE client registry, broadcast
│   └── db/                   SQLite schema, CRUD for all tables
├── frontend/
│   ├── app/                  Next.js app router
│   ├── components/           Dashboard panels
│   ├── hooks/                useAgentStream — SSE state management
│   └── lib/                  Types, utils, wagmi config
├── data/                     SQLite DB + wallet.json (gitignored, Railway volume)
├── docs/                     Detailed documentation
├── assets/                   Logo SVG
└── railway.toml              Railway deployment config
```

---

## Deployment

### Backend → Railway

1. Push repo to GitHub → create Railway project → deploy from GitHub
2. Set environment variables:

   | Variable | Value |
   |---|---|
   | `AGENT_PRIVATE_KEY` | `0x<agent-wallet-private-key>` |
   | `PINION_PRIVATE_KEY` | same as above |
   | `PINION_NETWORK` | `base` |

3. Add a Volume: mount path `/app/data` (persists SQLite + wallet.json across deploys)
4. Railway auto-detects start command from `railway.toml`

### Frontend → Vercel

1. Import `frontend/` directory to Vercel
2. Set environment variables:

   | Variable | Value |
   |---|---|
   | `BACKEND_URL` | Railway URL |
   | `NEXT_PUBLIC_AGENT_URL` | Railway URL |

---

## Troubleshooting

| Error | Fix |
|---|---|
| `No agent wallet found and PINION_PRIVATE_KEY not set` | Set `PINION_PRIVATE_KEY` in `.env` |
| `Insufficient balance` on boot | Fund wallet with USDC + ETH on Base |
| `402 Payment Required` on `/signal/eth` | Use `payX402Service`, MCP plugin, or dashboard — raw curl won't pay |
| Frontend shows "Reconnecting..." | Backend not running — `bun run dev` |
| Trade failing | Check ETH balance for gas (~0.001 ETH on Base) |
| Wallet lost on Railway redeploy | Add Railway volume mounted at `/app/data` |
| `Cannot find module 'pinion-os'` | `bun install` in project root |

---

## Documentation

| Doc | Description |
|---|---|
| [Overview](docs/00-overview.md) | Problem, solution, agent lifecycle, survival model |
| [Architecture](docs/01-architecture.md) | System design, data flows, module breakdown |
| [Setup Guide](docs/02-setup.md) | Local dev, genesis flow, Railway + Vercel deployment |

---

## Contributing

1. Fork this repository
2. Create your feature branch (`git checkout -b feat/my-feature`)
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
