import { getResolvedPredictions, getLastNResolved } from "./db.js";
import type { PredictionRow } from "./db.js";

export interface TrackRecord {
  accuracy: number;
  totalPredictions: number;
  correct: number;
  last5: Array<{
    direction: "up" | "down";
    actual: "up" | "down";
    correct: boolean;
    timestamp: number;
  }>;
}

export function getTrackRecord(): TrackRecord {
  const resolved = getResolvedPredictions();
  const correctCount = resolved.filter((p) => p.correct === 1).length;
  const accuracy =
    resolved.length > 0 ? (correctCount / resolved.length) * 100 : 0;

  const last5 = getLastNResolved(5).map((p) => ({
    direction: p.direction as "up" | "down",
    actual: deriveActual(p),
    correct: p.correct === 1,
    timestamp: p.predictedAt,
  }));

  return {
    accuracy,
    totalPredictions: resolved.length,
    correct: correctCount,
    last5,
  };
}

function deriveActual(p: PredictionRow): "up" | "down" {
  if (p.resolvedPrice === null) return p.direction as "up" | "down";
  return p.resolvedPrice >= p.currentPrice ? "up" : "down";
}
