# SIGINT — Getting Started & Usage Guide

A sovereign AI agent that forms ETH directional signals, backs each one with its own $0.50 USDC trade, and sells those signals via x402 micropayments.

---

## Prerequisites

- **Bun** ≥ 1.0 — [bun.sh](https://bun.sh)
- **A funded wallet on Base** — needs USDC (for skill calls + trades) and ETH (for gas)
- **Node.js** ≥ 18 (Next.js requirement)

---

## 1. Clone & Install

```bash
git clone <repo-url>
cd sigint-agent

# Backend deps
bun install

# Frontend deps
cd frontend && bun install && cd ..
```

---

## 2. Wallet Setup

The agent needs a wallet with funds on Base (or Base Sepolia for dev).

**Generate a new wallet** using the PinionOS MCP plugin (if installed in Claude Code):

```
Ask Claude: "Generate a new Base wallet for me"
```

Or use cast (Foundry):

```bash
cast wallet new
```

**Fund the wallet:**

| Asset | Amount | Purpose |
|---|---|---|
| USDC on Base | $5–10 | Skill calls ($0.01 each) + trades ($0.50 per signal) |
| ETH on Base | ~0.001 | Gas for trade broadcasts |

- Base Sepolia faucet (dev): https://faucet.base.org
- Bridge USDC to Base: https://bridge.base.org

---

## 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```bash
PINION_PRIVATE_KEY=0x<your-private-key>
ADDRESS=0x<same-wallet-address>
PINION_NETWORK=base-sepolia   # use base for mainnet demo
```

Frontend config (`frontend/.env.local`):

```bash
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_AGENT_URL=http://localhost:4020
NEXT_PUBLIC_WC_PROJECT_ID=<optional-walletconnect-project-id>
```

---

## 4. Run the Agent

**Backend (two servers start together):**

```bash
bun run dev
```

This starts:
- **Port 4020** — x402 skill server (`GET /signal/eth`)
- **Port 3001** — SSE + REST API (`/events`, `/status`, `/signals`)

Expected boot output:
```
SIGINT agent booting — wallet: 0x...
Balance: 5.20 USDC, 0.0015 ETH
Boot complete. Starting hourly loop.
x402 skill server on port 4020
API/SSE server on port 3001
```

If USDC balance is below $0.10, the agent logs funding instructions and pauses.

**Frontend dashboard:**

```bash
cd frontend
bun run dev
```

Open http://localhost:3000 — live SSE stream, survival metrics, signal log.

---

## 5. Buy a Signal

### Option A — curl (no wallet needed for dev)

```bash
curl http://localhost:4020/signal/eth
```

On Base Sepolia, x402 payment is required. Use the examples script:

```bash
# Set your key, then:
bun run examples/call-signal.ts
```

### Option B — PinionOS MCP (Claude Code)

If you have the PinionOS MCP plugin installed:

```
Ask Claude: "Call the signal endpoint at http://localhost:4020/signal/eth"
```

Claude will use `pinion_pay_service` to pay $0.10 USDC and return the signal JSON.

### Option C — Dashboard UI

1. Open http://localhost:3000
2. Connect your wallet (MetaMask or any injected wallet)
3. Click **Buy Signal** — the request goes to the agent, x402 handles USDC payment

### Expected Signal Response

```json
{
  "direction": "up",
  "confidence": 74,
  "currentPrice": 2847.50,
  "resolveAt": 1740603600000,
  "reasoning": "Funding rate negative at -0.03%, shorts crowded. Liquidation cluster above $2,900 suggests squeeze potential.",
  "tradeHash": "0x4f2a3b...",
  "onchainContext": {
    "fundingRate": -0.0312,
    "liquidationBias": "short-heavy",
    "dexCexVolumeRatio": 1.24
  },
  "trackRecord": {
    "correct": 8,
    "total": 13,
    "last5": [...],
    "tradePnl": 0.18
  }
}
```

The `tradeHash` is verifiable on [Basescan](https://basescan.org) — the agent traded before responding.

---

## 6. Agent Behavior

### Hourly Loop

Every hour the agent:
1. Fetches ETH price → logs to DB → emits `price_update`
2. Resolves any signals where `resolveAt ≤ now` → emits `signal_resolved`
3. Checks balance → emits `balance_update`
4. Adjusts signal price if survival tier changed → emits `price_adjusted`

### Survival Tiers & Pricing

| Tier | Ratio | Signal Price |
|---|---|---|
| Starving | < 0.5 | $0.05 |
| Surviving | 0.5–1.0 | $0.10 |
| Breaking Even | ≈ 1.0 | $0.10 |
| Thriving | > 1.5 | $0.15 |
| Flush | $50+ earned | $0.20 |

### Milestone

When earn/spend ratio crosses 1.0 for the first time, the agent sends $0.01 USDC onchain as a proof-of-survival transaction and emits a `milestone` event.

### Unlimited Key

When lifetime earnings hit $100, the agent automatically calls `skills.unlimited()` — purchasing a key that makes all future PinionOS skill calls free.

---

## 7. API Reference

All endpoints on `localhost:3001`:

### `GET /events`
SSE stream. Connect once, receive all 11 event types:

```typescript
type SSEEvent =
  | { type: "price_update"; price: number; timestamp: number }
  | { type: "signal_sold"; direction: string; confidence: number; revenue: number; price: number }
  | { type: "trade_executed"; direction: string; amountUSDC: number; txHash: string }
  | { type: "trade_verified"; txHash: string; status: "success" | "failed" }
  | { type: "signal_resolved"; id: number; correct: boolean; pnl: number; accuracy: number }
  | { type: "balance_update"; usdc: number; runway: number; ratio: number; earned: number; spent: number }
  | { type: "price_adjusted"; oldPrice: number; newPrice: number; reason: string }
  | { type: "reinvestment"; amount: number; into: string }
  | { type: "milestone"; event: string; txHash: string }
  | { type: "monologue"; text: string }
  | { type: "unlimited_purchased"; apiKey: string }
```

### `GET /status`
Current agent snapshot:
```json
{
  "accuracy": 61.5,
  "correct": 8,
  "total": 13,
  "totalEarned": 1.30,
  "tradePnl": 0.18,
  "ratio": 1.24,
  "tier": "Thriving",
  "signalPrice": 0.15,
  "unlimitedProgress": 1.3,
  "clients": 1
}
```

### `GET /signals`
Full signal + trade history:
```json
{
  "signals": [...],
  "trades": [...]
}
```

---

## 8. Agent-to-Agent Integration

Any agent with USDC on Base can call SIGINT with one line:

```typescript
import { PinionClient, payX402Service } from "pinion-os";

const pinion = new PinionClient({ privateKey: process.env.PINION_PRIVATE_KEY });
const signal = await payX402Service(pinion.signer, "https://<agent-url>/signal/eth");
```

No API key. No registration. USDC in, signal JSON out.

---

## 9. Deployment

### Backend → Railway

1. Push repo to GitHub
2. Create new Railway project → Deploy from GitHub
3. Add environment variables (from `.env`)
4. Add a volume mounted at `/data` (SQLite persistence)
5. Set start command: `bun run start`

### Frontend → Vercel

1. Import `frontend/` directory to Vercel
2. Set environment variables:
   - `BACKEND_URL=https://<railway-url>.up.railway.app`
   - `NEXT_PUBLIC_AGENT_URL=https://<railway-url>.up.railway.app`

---

## 10. Troubleshooting

| Error | Fix |
|---|---|
| `Missing required env var: PINION_PRIVATE_KEY` | Set it in `.env` |
| `Insufficient balance` on boot | Fund wallet with USDC on Base Sepolia |
| `402 Payment Required` on `/signal/eth` | Use `payX402Service` or the MCP plugin — raw curl won't work |
| Frontend shows "Reconnecting..." | Backend not running. Start with `bun run dev` |
| `Cannot find module 'pinion-os'` | Run `bun install` in project root |
| Trade broadcasts failing | Check ETH balance for gas (need ~0.001 ETH on Base) |

---

## 11. Typecheck & Verify

```bash
# Backend
bun run typecheck

# Frontend
cd frontend && bun run typecheck

# Frontend build
cd frontend && bun run build
```
