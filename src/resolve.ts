import type { PinionClient } from "pinion-os";
import { getPendingPredictions, resolvePrediction } from "./db.js";
import type { SpendTracker } from "./spend.js";
import { emit } from "./sse.js";
import { getTrackRecord } from "./stats.js";

export async function resolveExpired(
  pinion: PinionClient,
  tracker: SpendTracker,
): Promise<void> {
  const now = Date.now();
  const pending = getPendingPredictions(now);

  if (pending.length === 0) return;

  const result = await pinion.skills.price("ETH");
  tracker.recordSpend(0.01);
  const currentPrice = result.data.priceUSD;

  for (const prediction of pending) {
    const wentUp = currentPrice > prediction.currentPrice;
    const predictedUp = prediction.direction === "up";
    const correct = wentUp === predictedUp;

    resolvePrediction(prediction.id, now, currentPrice, correct);

    const { accuracy } = getTrackRecord();
    emit({
      type: "prediction_resolved",
      id: prediction.id,
      correct,
      accuracy,
    });
  }
}
