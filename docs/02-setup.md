# SIGINT — Setup Guide

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- A funded Ethereum wallet with **USDC + ETH on Base mainnet**
- Git

---

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/samueldanso/sigint-agent
cd sigint-agent

# Install backend deps
bun install

# Install frontend deps
cd frontend && bun install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
```

**`.env` (backend root):**

```bash
# Creator wallet — used once to spawn the agent on first boot
# Must have USDC + ETH on Base mainnet (or Base Sepolia for dev)
PINION_PRIVATE_KEY=0x<your-funded-wallet-private-key>

# Network — use base-sepolia during development to avoid spending real USDC
PINION_NETWORK=base-sepolia

# Genesis funding (optional — these are the defaults)
SEED_USDC=5       # $5 USDC sent to agent on genesis
SEED_ETH=0.001    # 0.001 ETH sent to agent for gas
```

**`frontend/.env.local`:**

```bash
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_AGENT_URL=http://localhost:3001
```

### 3. Fund the creator wallet

The creator wallet (`PINION_PRIVATE_KEY`) runs genesis once — it generates the agent wallet and seeds it with USDC + ETH.

| Asset | Minimum | Where it goes |
|---|---|---|
| USDC on Base | $6 | $5 to agent wallet + ~$0.05 genesis skill calls |
| ETH on Base | 0.002 | Gas for genesis funding tx + first agent operations |

**Get Base ETH:**
- Mainnet: buy ETH and bridge at [bridge.base.org](https://bridge.base.org)
- Sepolia (dev): [faucet.base.org](https://faucet.base.org)

**Get Base USDC:**
- Mainnet: [bridge.base.org](https://bridge.base.org) (bridge from Ethereum)
- Sepolia (dev): [faucet.circle.com](https://faucet.circle.com)

### 4. Start the backend

```bash
bun run dev
```

**First boot (genesis)** — runs when no `data/wallet.json` exists:

```
[SIGINT] GENESIS — No agent wallet found. Spawning sovereign identity...
[SIGINT] Generating agent wallet via skills.wallet()...
[SIGINT] Agent wallet created: 0x<agent-address>
[SIGINT] Funding agent with $5.00 USDC + 0.001 ETH...
[SIGINT] Funded. Wallet saved to data/wallet.json
[SIGINT] Balance: 4.97 USDC | 0.001 ETH
[SIGINT] Tier: Starving | Signal price: $0.05
[SIGINT] x402 skill server on port 4020
[SIGINT] API/SSE server on port 3001
[SIGINT] Agent online. Starting hourly loop.
```

**Subsequent boots** — wallet already exists:

```
[SIGINT] Wallet loaded: 0x<agent-address>
[SIGINT] Balance: 3.42 USDC | 0.0008 ETH
[SIGINT] Tier: Starving | Signal price: $0.05
[SIGINT] x402 skill server on port 4020
[SIGINT] API/SSE server on port 3001
[SIGINT] Agent online. Starting hourly loop.
```

### 5. Start the dashboard

```bash
cd frontend && bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Port summary

| Port | Service |
|---|---|
| `3000` | Next.js dashboard |
| `3001` | Express API + SSE (`/status`, `/signals`, `/events`) |
| `4020` | x402 skill server (`/signal/eth`) |

---

## Buying a Signal (Local Testing)

### With PinionOS MCP plugin in Claude Code

The easiest way to test x402 payments:

```
Ask Claude: "Call the signal endpoint at http://localhost:3001/signal/eth"
```

The MCP plugin handles the x402 handshake automatically using your configured `PINION_PRIVATE_KEY`.

### With PinionOS SDK

```typescript
import { PinionClient, payX402Service } from "pinion-os"

const pinion = new PinionClient({ privateKey: process.env.PINION_PRIVATE_KEY })
const signal = await payX402Service(
  pinion.signer,
  "http://localhost:3001/signal/eth"
)
console.log(signal)
```

### With the dashboard

Connect a MetaMask wallet (Base network), click "Buy Signal" — the dashboard handles the x402 payment via wagmi.

---

## Development vs Production

| Setting | Development | Production |
|---|---|---|
| `PINION_NETWORK` | `base-sepolia` | `base` |
| USDC cost | Sepolia test USDC | Real USDC |
| Trade execution | Simulated (may fail — Sepolia DEX liquidity limited) | Live 1inch swaps on Base |
| Agent wallet | Funded via faucet | Funded via bridge |

> Always use `base-sepolia` during development to avoid burning real USDC on every test cycle.

---

## Production Deployment

### Backend → Railway

Railway runs the Bun backend as a persistent process with a mounted volume for SQLite + wallet persistence.

#### Step 1: Create Railway project

1. Push repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the `sigint-agent` repository (root directory, not `frontend/`)

#### Step 2: Set environment variables

In Railway → Settings → Variables:

| Variable | Value | Notes |
|---|---|---|
| `AGENT_PRIVATE_KEY` | `0x<agent-private-key>` | Hex key — no JSON, no line breaks |
| `PINION_PRIVATE_KEY` | same as above | Required by PinionOS SDK |
| `PINION_NETWORK` | `base` | Mainnet |

> **`AGENT_PRIVATE_KEY` vs `PINION_PRIVATE_KEY`:** Both must be set. `AGENT_PRIVATE_KEY` restores the agent wallet (skips genesis). `PINION_PRIVATE_KEY` is used by the PinionOS SDK for all skill calls.

> **Security:** Set these via Railway's UI, never commit them. The agent key controls real USDC — treat it like a production secret.

#### Step 3: Add a volume

In Railway → your service → Volumes:

| Setting | Value |
|---|---|
| Mount path | `/app/data` |
| Size | 1 GB |

This persists `data/wallet.json` and `data/agent.db` across redeploys. Without it, every deploy loses the wallet (and its USDC) and all signal history.

#### Step 4: Generate a public domain

In Railway → Settings → Networking → Generate Domain.

Select port **8080** (Railway's assigned `PORT`) or enter `3001` if 8080 is not listed.

Both `BACKEND_URL` and `NEXT_PUBLIC_AGENT_URL` will point to this domain — the proxy routes `/signal/*` internally to port 4020.

#### Step 5: Deploy

Railway auto-deploys on push. Watch the deploy logs for:

```
[SIGINT] Wallet loaded: 0x<agent-address>
[SIGINT] x402 skill server on port 4020
[SIGINT] API/SSE server on port 8080
[SIGINT] Agent online. Starting hourly loop.
```

If you see genesis running unexpectedly, check that the volume is mounted and `AGENT_PRIVATE_KEY` is set correctly.

---

### Frontend → Vercel

#### Step 1: Import to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import the `sigint-agent` GitHub repo
3. Set **Root Directory** to `frontend`
4. Framework: Next.js (auto-detected)

#### Step 2: Set environment variables

| Variable | Value |
|---|---|
| `BACKEND_URL` | `https://<your-railway-domain>` |
| `NEXT_PUBLIC_AGENT_URL` | `https://<your-railway-domain>` |

Both point to the same Railway URL — the proxy handles routing internally.

#### Step 3: Deploy

Vercel auto-deploys on push. The dashboard connects to Railway via the Next.js API proxy routes (`/api/stream`, `/api/status`, `/api/signals`).

---

## Wallet Management

### Existing wallet

The agent wallet is saved to `data/wallet.json` after genesis. To use an existing wallet on a new deployment:

1. Set `AGENT_PRIVATE_KEY=0x<private-key>` in Railway
2. On boot, the backend reads this env var, reconstructs `wallet.json`, and skips genesis
3. The existing USDC balance is preserved

### Checking the agent wallet

```typescript
// With PinionOS MCP plugin in Claude Code:
// Ask Claude: "Check balance for 0x9fe05351902e13c341e54f681e9541790efbe9b9"
```

Or view directly on Basescan:
- [Token transactions](https://basescan.org/address/0x9fe05351902e13c341e54f681e9541790efbe9b9#tokentxns)
- [Internal transactions](https://basescan.org/address/0x9fe05351902e13c341e54f681e9541790efbe9b9#internaltx)

### Minimum operating balance

| Asset | Minimum | If below |
|---|---|---|
| USDC | $0.10 | Agent pauses and waits for funding |
| ETH | ~0.0005 | Trades fail (gas) |

---

## Commands Reference

### Backend (project root)

```bash
bun run dev        # Run with file watching (development)
bun run start      # Run without watching (production)
bun run typecheck  # tsc --noEmit
bun run lint       # biome lint
bun run format     # biome format --write
bun run check      # biome check --write
```

### Frontend (`frontend/` directory)

```bash
bun run dev        # Next.js dev server (port 3000)
bun run build      # Production build
bun run typecheck  # tsc --noEmit
bun run lint       # biome lint
bun run format     # biome format --write
```

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `No agent wallet found and PINION_PRIVATE_KEY not set` | Genesis attempted without creator key | Set `PINION_PRIVATE_KEY=0x...` in `.env` |
| `Insufficient balance` | Agent wallet too low to operate | Fund with USDC + ETH on Base |
| `402 Payment Required` (raw curl) | x402 requires a signing client | Use `payX402Service`, MCP plugin, or dashboard |
| Frontend shows "Reconnecting..." | Backend not reachable | Check backend is running; verify `BACKEND_URL` |
| Trade failing / broadcast error | Low ETH for gas | Top up agent wallet with ~0.001 ETH |
| Wallet wiped after Railway redeploy | Volume not mounted | Add volume at `/app/data` in Railway |
| Genesis ran again on Railway | `AGENT_PRIVATE_KEY` missing | Set it in Railway environment variables |
| `Cannot find module 'pinion-os'` | Missing dependency | `bun install` in project root |
| Signal price stuck at $0.05 | No signals sold yet (ratio = 0) | Normal — tier is Starving until first signal sale |
| `JSON Parse error: Unexpected identifier` | LLM returned text before JSON | Already handled by `parseSignalResponse()` regex fallback |
