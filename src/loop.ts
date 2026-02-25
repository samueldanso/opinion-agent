import type { PinionClient } from "pinion-os";
import { logPrice } from "./db.js";
import { emit } from "./sse.js";
import { resolveExpired } from "./resolve.js";
import type { SpendTracker } from "./spend.js";

const POLL_INTERVAL_MS = 3_600_000;

export function startLoop(
  pinion: PinionClient,
  tracker: SpendTracker,
): NodeJS.Timer {
  async function tick(): Promise<void> {
    try {
      emit({ type: "monologue", text: "Starting hourly cycle..." });

      const result = await pinion.skills.price("ETH");
      tracker.recordSpend(0.01);

      const { priceUSD, change24h } = result.data;
      const now = Date.now();
      const parsedChange = change24h ? parseFloat(change24h) : null;

      logPrice(now, priceUSD, parsedChange);
      emit({ type: "price_update", price: priceUSD, timestamp: now });
      emit({
        type: "monologue",
        text: `ETH: $${priceUSD}${parsedChange !== null ? ` (${parsedChange}%)` : ""}`,
      });

      await resolveExpired(pinion);

      const balanceResult = await pinion.skills.balance(pinion.address);
      tracker.recordSpend(0.01);

      const usdc = parseFloat(balanceResult.data.balances.USDC);
      const state = tracker.getState(usdc);

      emit({
        type: "balance_update",
        usdc,
        runway: state.runway,
        ratio: state.ratio,
      });

      emit({
        type: "monologue",
        text: `Balance: ${usdc.toFixed(2)} USDC | Tier: ${state.tier} | Ratio: ${state.ratio.toFixed(2)}`,
      });

      if (tracker.shouldUnlock()) {
        emit({ type: "monologue", text: "Earnings crossed $100! Purchasing unlimited key..." });
        const unlimitedResult = await pinion.skills.unlimited();
        const apiKey = unlimitedResult.data.apiKey;
        pinion.setApiKey(apiKey);
        emit({ type: "unlimited_purchased", apiKey });
      }

      emit({ type: "monologue", text: "Cycle complete. Sleeping 1h." });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      emit({ type: "monologue", text: `Loop error: ${message}` });
    }
  }

  tick();
  return setInterval(tick, POLL_INTERVAL_MS);
}
