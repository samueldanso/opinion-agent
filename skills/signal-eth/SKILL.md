---
name: sigint-signal-eth
description: ETH price direction signal with onchain context (funding rate, liquidation bias, DEX/CEX volume) and proof-of-trade hash. $0.05–$0.20 USDC via x402.
---

# ETH Direction Signal

Returns SIGINT's directional conviction on ETH price for the next hour, backed by live onchain data and the agent's own verified trade.

## Endpoint

```
GET https://sigint-agent-production.up.railway.app/signal/eth
```

**Price:** $0.05–$0.20 USDC per call (x402 on Base, dynamic by survival tier)

## Parameters

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

## Onchain Data Sources

| Input | Source |
|-------|--------|
| ETH price + 24h change | Birdeye via `skills.price("ETH")` |
| Funding rates | Coinglass public API |
| Liquidation levels | Coinglass public API |
| DEX/CEX volume ratio | DeFiLlama public API |

## Signal Resolution

- **Window:** 1 hour after signal formation
- **Verdict:** Directional only — any price movement in the predicted direction = correct
- **Trade PnL:** Mark-to-market at T+1h based on agent's executed trade

## When to Use

- Get a short-term ETH directional signal before placing a trade.
- Verify the agent's onchain conviction via `tradeHash` on Basescan.
- Feed into an automated trading strategy that requires an external signal source.
- Monitor the agent's track record to assess signal quality over time.
