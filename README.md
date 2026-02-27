<div align="center">

# SIGINT — On-chain Signals Intelligence

> The first sovereign AI that generates on-chain market signals, backs each call with its own trade, sells them, and earns its own survival — no human needed.

![Hackathon](https://img.shields.io/badge/Hackathon-2026-333333?style=flat-square)
![PinionOS](https://img.shields.io/badge/Built%20on-PinionOS-FF6B35?style=flat-square&logoColor=white)
![Base](https://img.shields.io/badge/Network-Base-0052FF?style=flat-square&logoColor=white)
![x402](https://img.shields.io/badge/Payments-x402-FF69B4?style=flat-square&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

</div>

## Overview

SIGINT is an autonomous AI that operates its own market signal business — built on PinionOS, live on Base.

It continuously reads on-chain market data (price, funding rate, liquidations, DEX/CEX volume), forms a directional conviction on ETH, and executes a real trade with its own money before selling the signal. Every response includes a `tradeHash` — verifiable proof the agent had skin in the game before you paid.

Agents and humans buy via x402 micropayments with USDC — no account, no signup, no API key.

It earns, spends on every cycle, and survives without human intervention — or it dies trying.

---

## Live Agent

**Agent wallet:** [`0xA44Fa8Ad3e905C8AB525cd0cb14319017F1e04e5`](https://basescan.org/address/0xA44Fa8Ad3e905C8AB525cd0cb14319017F1e04e5)

All activity is on-chain and verifiable — x402 signal sales (inbound USDC), PinionOS skill call payments ($0.01 USDC each), and 1inch trade execution.

**Buy a signal:**

```bash
# Any x402-compatible client — agent responds only after payment clears
curl https://YOUR_RAILWAY_URL/signal/eth
# → 402 Payment Required ($0.10 USDC on Base)
```

Or use the PinionOS MCP plugin in Claude Code:

```
Ask Claude: "Call the signal endpoint at https://YOUR_RAILWAY_URL/signal/eth"
```

**Signal response:**

```json
{
	"direction": "up",
	"confidence": 74,
	"currentPrice": 2847.5,
	"resolveAt": 1740603600000,
	"reasoning": "Funding rate negative at -0.03%, shorts crowded. Liquidation cluster above $2,900 suggests squeeze potential.",
	"tradeHash": "0x4f2a3b...",
	"onchainContext": {
		"fundingRate": -0.0312,
		"liquidationBias": "short-heavy",
		"dexCexVolumeRatio": 1.24
	},
	"trackRecord": { "correct": 8, "total": 13, "tradePnl": 0.18 }
}
```

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- A wallet with **USDC + ETH on Base mainnet** (USDC for skill calls & trades, ETH for gas)

### 1. Install

```bash
git clone https://github.com/samueldanso/sigint-agent
cd sigint-agent

# Backend deps
bun install

# Frontend deps
bun install
cd frontend && bun install && cd ..
```

### 2. Configure

```bash
cp .env.example .env
```

`.env`:

```bash
PINION_PRIVATE_KEY=0x<agent-wallet-private-key>
ADDRESS=0x<same-wallet-public-address>
PINION_NETWORK=base
```

`frontend/.env`:

```bash
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_AGENT_URL=http://localhost:4020
NEXT_PUBLIC_WC_PROJECT_ID=<walletconnect-project-id>
```

### 3. Fund the agent wallet

| Asset        | Minimum | Purpose                                          |
| ------------ | ------- | ------------------------------------------------ |
| USDC on Base | $5      | Skill calls ($0.01 each) + trades ($0.50/signal) |
| ETH on Base  | 0.001   | Gas for trade broadcasts                         |

Bridge USDC: [bridge.base.org](https://bridge.base.org)

### 4. Run

```bash
# Terminal 1 — backend (starts both servers)
bun run dev

# Terminal 2 — dashboard
cd frontend && bun run dev
```

- **Port 4020** — x402 skill server (`GET /signal/eth`, costs $0.10 USDC)
- **Port 3001** — SSE stream + REST API
- **Port 3000** — Dashboard UI

Expected boot output:

```
SIGINT agent booting — wallet: 0x...
Balance: 5.20 USDC, 0.0015 ETH
Boot complete. Starting hourly loop.
x402 skill server on port 4020
API/SSE server on port 3001
```

---

## How It Works

### Every hour, the agent:

1. Fetches ETH price via PinionOS Birdeye skill
2. Reads funding rates, liquidation data, DEX/CEX volume
3. Resolves any pending signals (correct if price moved in predicted direction)
4. Updates survival tier and adjusts signal price accordingly

### When a signal is purchased:

1. Agent reasons over latest onchain data via `skills.chat()` (Claude-powered)
2. Executes a real USDC → ETH trade on 1inch before responding
3. Returns signal JSON with `tradeHash` — buyer can verify the trade happened first

### Survival tiers (dynamic pricing):

| Tier                 | Earn/Spend Ratio | Signal Price             |
| -------------------- | ---------------- | ------------------------ |
| Starving             | < 0.5            | $0.05                    |
| Surviving            | 0.5–1.0          | $0.10                    |
| Thriving             | > 1.5            | $0.15                    |
| Flush ($100+ earned) | —                | $0.20 + free skill calls |

---

## Architecture

Two servers, one process:

```
Port 4020  createSkillServer (pinion-os/server)
           └── GET /signal/eth  ← x402 payment gate ($0.10 USDC)

Port 3001  Express
           ├── GET /events      ← SSE stream (all agent events)
           ├── GET /status      ← current snapshot
           └── GET /signals     ← signal + trade history
```

Stack: Bun · TypeScript · PinionOS · SQLite (`bun:sqlite`) · Express · Next.js · wagmi · viem

---

## API Reference

### `GET /status`

```json
{
	"accuracy": 61.5,
	"correct": 8,
	"total": 13,
	"totalEarned": 1.3,
	"tradePnl": 0.18,
	"ratio": 1.24,
	"tier": "Thriving",
	"signalPrice": 0.15
}
```

### `GET /events` (SSE)

Streams all agent activity in real time. Event types: `price_update`, `signal_sold`, `trade_executed`, `trade_verified`, `signal_resolved`, `balance_update`, `price_adjusted`, `milestone`, `monologue`, `unlimited_purchased`.

### `GET /signals`

Full signal and trade history from SQLite.

---

## Agent-to-Agent

Any agent with USDC on Base can call SIGINT with one line:

```typescript
import { PinionClient, payX402Service } from "pinion-os"

const pinion = new PinionClient({ privateKey: process.env.PINION_PRIVATE_KEY })
const signal = await payX402Service(pinion.signer, "https://<agent-url>/signal/eth")
```

No API key. No registration. USDC in, signal out.

---

## Deployment

**Backend → Railway:**

1. Push repo to GitHub → create Railway project → deploy from GitHub
2. Add env vars from `.env`
3. Add volume mounted at `/data` (SQLite persistence)
4. Start command: `bun run start`
5. Update `NEXT_PUBLIC_AGENT_URL` in Vercel with the Railway URL

**Frontend → Vercel:**

1. Import `frontend/` to Vercel
2. Set `BACKEND_URL` and `NEXT_PUBLIC_AGENT_URL` to Railway URL

---

## Troubleshooting

| Error                                          | Fix                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `Missing required env var: PINION_PRIVATE_KEY` | Set it in `.env`                                                                     |
| `Insufficient balance` on boot                 | Fund wallet with USDC on Base mainnet                                                |
| `402 Payment Required` on `/signal/eth`        | Use `payX402Service`, MCP plugin, or the dashboard — raw curl won't complete payment |
| Frontend shows "Reconnecting..."               | Backend not running — `bun run dev`                                                  |
| Trade failing                                  | Check ETH balance for gas (~0.001 ETH on Base)                                       |
| `Cannot find module 'pinion-os'`               | `bun install` in project root                                                        |
