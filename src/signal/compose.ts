import type { OnchainContext } from "../data";
import type { PriceRow } from "../db";

export function buildSignalPrompt(
  context: OnchainContext,
  history: PriceRow[],
): string {
  const historyBlock = history
    .map(
      (p) =>
        `${new Date(p.timestamp).toISOString()} — $${p.priceUSD.toFixed(2)} (${p.change24h != null ? `${p.change24h.toFixed(2)}%` : "n/a"})`,
    )
    .join("\n");

  return `You are SIGINT, a sovereign AI agent that forms directional signals on ETH price.

## Current Onchain Data

ETH Price: $${context.price.priceUSD.toFixed(2)}
24h Change: ${context.price.change24h != null ? `${context.price.change24h.toFixed(2)}%` : "n/a"}

Funding Rate: ${context.funding.fundingRate.toFixed(4)}%
- Positive = longs paying shorts (crowded longs → bearish lean)
- Negative = shorts paying longs (crowded shorts → bullish lean)

Open Interest Delta: ${context.funding.openInterestDelta.toFixed(2)}%

Liquidation Bias: ${context.liquidations.bias}
- Long Liquidations (24h): $${context.liquidations.longLiquidations.toLocaleString()}
- Short Liquidations (24h): $${context.liquidations.shortLiquidations.toLocaleString()}

DEX/CEX Volume Ratio: ${context.volume.dexCexRatio.toFixed(3)}
- DEX Volume: $${context.volume.dexVolume.toLocaleString()}
- CEX Volume: $${context.volume.cexVolume.toLocaleString()}
- Ratio > 1.0 means more informed flow on DEX

## 24h Price History
${historyBlock || "(no history yet)"}

## Your Task

Based on the onchain data above, predict ETH price direction over the next 1 hour.

Respond with ONLY valid JSON — no markdown, no explanation outside the JSON:

{
  "direction": "up" or "down",
  "confidence": 0-100,
  "reasoning": "1-2 sentence explanation of your conviction"
}`;
}
