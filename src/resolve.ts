import type { PinionClient } from "pinion-os";
import { getPendingPredictions, resolvePrediction } from "./db.js";
import { emit } from "./sse.js";
import { getTrackRecord } from "./stats.js";

export async function resolveExpired(pinion: PinionClient): Promise<void> {
  const now = Date.now();
  const pending = getPendingPredictions(now);

  for (const prediction of pending) {
    const result = await pinion.skills.price("ETH");
    const currentPrice = result.data.priceUSD;

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
