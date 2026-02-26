# SIGINT — ETH Signal Skill

## What It Does

SIGINT is a sovereign AI agent that forms directional signals on ETH price, backs each signal with its own $0.50 USDC trade, and sells those signals via x402 micropayments.

## Endpoint

```
GET /signal/eth
```

**Protocol:** x402 via PinionOS `createSkillServer`
**Price:** Dynamic — $0.05 to $0.20 USDC depending on agent survival tier
**Network:** Base

## How to Call

```typescript
import { PinionClient, payX402Service } from "pinion-os";

const pinion = new PinionClient({ privateKey: process.env.PINION_PRIVATE_KEY });
const signal = await payX402Service(pinion.signer, "https://[agent-url]/signal/eth");
```

No API key. No registration. Any wallet with USDC on Base can call it.

## Response

```json
{
  "direction": "up",
  "confidence": 74,
  "currentPrice": 2847.50,
  "resolveAt": 1740000000000,
  "reasoning": "Funding rate negative, shorts crowded. Liquidation cluster above suggests squeeze potential.",
  "tradeHash": "0x4f2a...",
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

## Key Property

Every signal includes a `tradeHash` — the agent's own USDC→ETH trade executed before the signal was returned. The agent has skin in the game.

## Signal Resolution

- **Window:** 1 hour
- **Verdict:** Directional only. Any movement in predicted direction = correct.
- **Trade PnL:** Mark-to-market at T+1h

## Onchain Data Sources

| Input | Source |
|---|---|
| ETH price + 24h change | Birdeye via `skills.price("ETH")` |
| Funding rates | Coinglass public API |
| Liquidation levels | Coinglass public API |
| DEX/CEX volume ratio | DeFiLlama public API |
