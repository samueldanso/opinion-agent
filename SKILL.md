---
name: sigint
description: Sovereign AI agent that sells ETH direction signals backed by its own onchain trades. $0.05–$0.20 USDC via x402 on Base.
---

# SIGINT — ETH Signal Agent

SIGINT reads live onchain data (funding rates, liquidations, DEX/CEX volume), forms a directional conviction on ETH, executes a real USDC trade with its own money, then returns a signal with a `tradeHash` — verifiable proof it had skin in the game before you paid.

**Server:** https://sigint-agent-production.up.railway.app
**Price:** $0.05–$0.20 USDC per signal (x402 on Base, dynamic by agent tier)
**Dashboard:** https://sigint-agent.vercel.app

## Skill

| Skill | Endpoint | Method | Price | Description |
|-------|----------|--------|-------|-------------|
| signal-eth | `/signal/eth` | GET | $0.05–$0.20 | ETH direction signal with onchain context and proof-of-trade hash |

## Endpoint

```
GET https://sigint-agent-production.up.railway.app/signal/eth
```

No parameters required.

## Example Request

```bash
curl https://sigint-agent-production.up.railway.app/signal/eth
```

The first request returns HTTP 402 with payment requirements. Sign a USDC `TransferWithAuthorization` (EIP-3009) and retry with the `X-PAYMENT` header — or use `sigint-os` / `pinion-os` which handles this automatically.

## Example Response

```json
{
  "direction": "up",
  "confidence": 74,
  "currentPrice": 2847.50,
  "resolveAt": 1740704400000,
  "reasoning": "Funding rate negative at -0.03%, shorts crowded. Liquidation cluster above $2,900 suggests squeeze potential. DEX volume elevated vs CEX — retail accumulation pattern.",
  "tradeHash": "0x4f2a8c3e1b7d9f6a2e5c8b1d4f7a0c3e6b9d2f5a8c1e4b7d0f3a6c9e2b5d8f1a",
  "onchainContext": {
    "fundingRate": -0.0312,
    "liquidationBias": "short-heavy",
    "dexCexVolumeRatio": 1.24
  },
  "trackRecord": {
    "correct": 8,
    "total": 13,
    "tradePnl": 0.18
  }
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `direction` | `"up" \| "down"` | ETH price direction prediction for the next hour |
| `confidence` | `number` | Agent's conviction score, 0–100 |
| `currentPrice` | `number` | ETH price in USD at signal formation |
| `resolveAt` | `number` | UNIX timestamp (ms) when prediction resolves (T+1h) |
| `reasoning` | `string` | Agent's onchain analysis in plain English |
| `tradeHash` | `string \| null` | Agent's own USDC→ETH swap hash on Base (verify on Basescan) |
| `onchainContext.fundingRate` | `number` | 8h perpetual funding rate (%) |
| `onchainContext.liquidationBias` | `string` | `"long-heavy"`, `"short-heavy"`, or `"balanced"` |
| `onchainContext.dexCexVolumeRatio` | `number` | DEX volume / CEX volume ratio |
| `trackRecord.correct` | `number` | Count of correct resolved signals |
| `trackRecord.total` | `number` | Count of all resolved signals |
| `trackRecord.tradePnl` | `number` | Agent's cumulative trade PnL in USDC |

## Signal Resolution

- **Window:** 1 hour after signal formation
- **Verdict:** Directional only — any price movement in the predicted direction = correct
- **Trade PnL:** Mark-to-market at T+1h based on agent's executed trade

## How x402 Works

1. Client calls `GET /signal/eth`
2. Server responds with HTTP 402 and payment requirements (amount, USDC, Base)
3. Client signs a USDC `TransferWithAuthorization` (EIP-3009) using their wallet
4. Client retries the request with the `X-PAYMENT` header containing the signed payment
5. Server verifies the payment via the x402 facilitator, executes its own onchain trade, then returns the signal

Every call = 1 real USDC transaction on Base.

## Install as OpenClaw Plugin

```bash
git clone https://github.com/samueldanso/sigint-agent.git
cp -r sigint-agent/sigint-openclaw ~/.openclaw/workspace/skills/sigint
```

OpenClaw loads skills from `workspace/skills/` on the next session.

## Use with sigint-os SDK

```bash
npm install sigint-os pinion-os
# or
bun add sigint-os pinion-os
```

```typescript
import { getEthSignal } from "sigint-os"

const signal = await getEthSignal({ privateKey: process.env.WALLET_KEY })

console.log(signal.direction)   // "up" | "down"
console.log(signal.confidence)  // 74
console.log(signal.reasoning)   // "Funding rate negative..."
console.log(signal.tradeHash)   // "0x4f2a..." — verify on Basescan
```

Wallet must have USDC on Base for the x402 payment.

## Use with PinionOS SDK directly

```typescript
import { PinionClient, payX402Service } from "pinion-os"

const pinion = new PinionClient({ privateKey: process.env.WALLET_KEY })
const signal = await payX402Service(
  pinion.signer,
  "https://sigint-agent-production.up.railway.app/signal/eth"
)
```

## Onchain Data Sources

| Input | Source |
|-------|--------|
| ETH price + 24h change | Birdeye via `skills.price("ETH")` |
| Funding rates | Coinglass public API |
| Liquidation levels | Coinglass public API |
| DEX/CEX volume ratio | DeFiLlama public API |

## License

MIT
