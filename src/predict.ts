import type { PinionClient } from "pinion-os";
import { addPrediction, getRecentPrices, logPrice } from "./db.js";
import { emit } from "./sse.js";
import { getTrackRecord } from "./stats.js";
import type { SpendTracker } from "./spend.js";

const RESOLVE_WINDOW_MS = 3_600_000;

interface PredictionOutput {
  direction: "up" | "down";
  confidence: number;
  reasoning: string;
}

export interface PredictionResponse {
  direction: "up" | "down";
  confidence: number;
  currentPrice: number;
  resolveAt: number;
  reasoning: string;
  trackRecord: ReturnType<typeof getTrackRecord>;
}

export async function makePrediction(
  pinion: PinionClient,
  tracker: SpendTracker,
): Promise<PredictionResponse> {
  const priceResult = await pinion.skills.price("ETH");
  tracker.recordSpend(0.01);

  const freshPrice = priceResult.data.priceUSD;
  const change24h = priceResult.data.change24h
    ? parseFloat(priceResult.data.change24h)
    : null;
  const now = Date.now();

  logPrice(now, freshPrice, change24h);
  emit({ type: "price_update", price: freshPrice, timestamp: now });

  const history = getRecentPrices(24);
  const historyJson = JSON.stringify(
    history.map((p) => ({
      price: p.priceUSD,
      change24h: p.change24h,
      time: new Date(p.timestamp).toISOString(),
    })),
  );

  const prompt = `You are an ETH price prediction agent. Analyze the last 24 hours of hourly price data and predict whether ETH will go UP or DOWN in the next 1 hour.

Current ETH price: $${freshPrice}
24h change: ${change24h !== null ? `${change24h}%` : "unknown"}

Hourly price history (newest first):
${historyJson}

Respond with ONLY valid JSON, no markdown, no explanation outside the JSON:
{"direction":"up" or "down","confidence":0-100,"reasoning":"one sentence"}`;

  emit({ type: "monologue", text: `Fetching ETH price... $${freshPrice}` });
  emit({
    type: "monologue",
    text: `Analyzing ${history.length} hourly data points...`,
  });

  const chatResult = await pinion.skills.chat(prompt, []);
  tracker.recordSpend(0.01);

  const parsed = parsePrediction(chatResult.data.response);

  emit({
    type: "monologue",
    text: `Prediction: ${parsed.direction.toUpperCase()} (confidence: ${parsed.confidence})`,
  });
  emit({ type: "monologue", text: `Reasoning: ${parsed.reasoning}` });

  const resolveAt = now + RESOLVE_WINDOW_MS;
  addPrediction(
    now,
    resolveAt,
    parsed.direction,
    parsed.confidence,
    parsed.reasoning,
    freshPrice,
  );

  const trackRecord = getTrackRecord();

  emit({
    type: "prediction_sold",
    direction: parsed.direction,
    confidence: parsed.confidence,
    revenue: 0.1,
  });

  return {
    direction: parsed.direction,
    confidence: parsed.confidence,
    currentPrice: freshPrice,
    resolveAt,
    reasoning: parsed.reasoning,
    trackRecord,
  };
}

function parsePrediction(raw: string): PredictionOutput {
  const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  const obj = JSON.parse(cleaned) as Record<string, unknown>;

  const direction = obj.direction === "down" ? "down" : "up";
  const confidence = Math.min(
    100,
    Math.max(0, Number(obj.confidence) || 50),
  );
  const reasoning = String(obj.reasoning || "No reasoning provided");

  return { direction, confidence, reasoning };
}
