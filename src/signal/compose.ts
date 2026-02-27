import { PERSONA } from "../agent/identity";
import type { OnchainContext } from "../data";
import type { PriceRow, SignalRow } from "../db";

interface TrackRecordEntry {
  direction: "up" | "down";
  correct: number | null;
  currentPrice: number;
  resolvedPrice: number | null;
  confidence: number;
}

function formatTrackRecord(signals: TrackRecordEntry[]): string {
  if (signals.length === 0) return "(no resolved signals yet)";

  const lines = signals.map((s) => {
    const dir = s.direction.toUpperCase();

    if (s.correct === null || s.resolvedPrice === null)
      return `- ${dir} (confidence: ${s.confidence}) — pending`;

    const isCorrect = s.correct === 1;
    const mark = isCorrect ? "✓" : "✗";
    const delta = ((s.resolvedPrice - s.currentPrice) / s.currentPrice) * 100;
    const sign = delta >= 0 ? "+" : "";
    return `- ${dir} ${mark} ${sign}${delta.toFixed(1)}% (confidence: ${s.confidence})`;
  });

  const resolved = signals.filter((s) => s.correct !== null);
  const correctCount = resolved.filter((s) => s.correct === 1).length;
  const accuracy =
    resolved.length > 0
      ? `${((correctCount / resolved.length) * 100).toFixed(0)}% (${correctCount}/${resolved.length} recent)`
      : "n/a";

  return `${lines.join("\n")}\nAccuracy: ${accuracy}`;
}

export function buildSignalPrompt(
  context: OnchainContext,
  history: PriceRow[],
  recentSignals?: SignalRow[],
): string {
  const historyBlock = history
    .map(
      (p) =>
        `${new Date(p.timestamp).toISOString()} — $${p.priceUSD.toFixed(2)} (${p.change24h != null ? `${p.change24h.toFixed(2)}%` : "n/a"})`,
    )
    .join("\n");

  const trackRecordBlock = recentSignals
    ? formatTrackRecord(recentSignals)
    : "(no history)";

  return `${PERSONA}

## Recent Track Record
${trackRecordBlock}

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

Based on the onchain data above and your recent track record, predict ETH price direction over the next 1 hour.

Respond with ONLY valid JSON — no markdown, no explanation outside the JSON:

{
  "direction": "up" or "down",
  "confidence": 0-100,
  "reasoning": "1-2 sentence explanation of your conviction"
}`;
}
