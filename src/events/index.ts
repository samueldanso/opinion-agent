import { broadcast, addClient, getClientCount } from "./registry";

export type SSEEvent =
  | { type: "price_update"; price: number; timestamp: number }
  | {
      type: "signal_sold";
      direction: string;
      confidence: number;
      revenue: number;
      price: number;
    }
  | {
      type: "trade_executed";
      direction: string;
      amountUSDC: number;
      txHash: string;
    }
  | { type: "trade_verified"; txHash: string; status: "success" | "failed" }
  | {
      type: "signal_resolved";
      id: number;
      correct: boolean;
      pnl: number;
      accuracy: number;
    }
  | {
      type: "balance_update";
      usdc: number;
      runway: number;
      ratio: number;
      earned: number;
      spent: number;
    }
  | {
      type: "price_adjusted";
      oldPrice: number;
      newPrice: number;
      reason: string;
    }
  | { type: "reinvestment"; amount: number; into: string }
  | { type: "milestone"; event: string; txHash: string }
  | { type: "monologue"; text: string }
  | { type: "unlimited_purchased"; apiKey: string };

export function emit(event: SSEEvent): void {
  broadcast(JSON.stringify(event));
}

export { addClient, getClientCount };
