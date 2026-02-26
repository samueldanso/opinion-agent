export type SpendTier = "Starving" | "Surviving" | "Breaking Even" | "Thriving" | "Flush";

export interface SignalRow {
  id: number;
  formedAt: number;
  resolveAt: number;
  resolvedAt: number | null;
  direction: "up" | "down";
  confidence: number;
  reasoning: string;
  currentPrice: number;
  resolvedPrice: number | null;
  correct: number | null;
  priceCharged: number;
  revenue: number | null;
}

export interface TradeRow {
  id: number;
  signalId: number;
  executedAt: number;
  resolvedAt: number | null;
  direction: "up" | "down";
  amountUSDC: number;
  txHash: string;
  resolvedPnl: number | null;
}

export interface StatusResponse {
  accuracy: number;
  correct: number;
  total: number;
  totalEarned: number;
  tradePnl: number;
  ratio: number;
  tier: SpendTier;
  signalPrice: number;
  unlimitedProgress: number;
  clients: number;
}

export type SSEEvent =
  | { type: "price_update"; price: number; timestamp: number }
  | { type: "signal_sold"; direction: string; confidence: number; revenue: number; price: number }
  | { type: "trade_executed"; direction: string; amountUSDC: number; txHash: string }
  | { type: "trade_verified"; txHash: string; status: "success" | "failed" }
  | { type: "signal_resolved"; id: number; correct: boolean; pnl: number; accuracy: number }
  | { type: "balance_update"; usdc: number; runway: number; ratio: number; earned: number; spent: number }
  | { type: "price_adjusted"; oldPrice: number; newPrice: number; reason: string }
  | { type: "reinvestment"; amount: number; into: string }
  | { type: "milestone"; event: string; txHash: string }
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
  totalSignals: number;
  correctCount: number;
  tradePnl: number;
  signalPrice: number;
  unlimitedProgress: number;
  signals: SignalRow[];
  trades: TradeRow[];
  monologue: string[];
  unlimitedKey: string | null;
}
