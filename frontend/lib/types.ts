export type SpendTier = "Starving" | "Surviving" | "Breaking Even" | "Thriving";

export interface PredictionRow {
  id: number;
  predictedAt: number;
  resolveAt: number;
  resolvedAt: number | null;
  direction: string;
  confidence: number;
  reasoning: string;
  currentPrice: number;
  resolvedPrice: number | null;
  correct: number | null;
}

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

export interface StatusResponse {
  trackRecord: TrackRecord;
  predictions: PredictionRow[];
}

export type SSEEvent =
  | { type: "price_update"; price: number; timestamp: number }
  | { type: "prediction_sold"; direction: string; confidence: number; revenue: number }
  | { type: "prediction_resolved"; id: number; correct: boolean; accuracy: number }
  | { type: "balance_update"; usdc: number; runway: number; ratio: number; earned: number; spent: number }
  | { type: "monologue"; text: string }
  | { type: "unlimited_purchased"; apiKey: string };

export interface AgentState {
  connected: boolean;
  price: number | null;
  usdc: number | null;
  runway: number | null;
  ratio: number | null;
  earned: number;
  spent: number;
  tier: SpendTier;
  accuracy: number;
  totalPredictions: number;
  correctCount: number;
  last5: TrackRecord["last5"];
  predictions: PredictionRow[];
  monologue: string[];
  unlimitedKey: string | null;
}
