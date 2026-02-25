import type { Response } from "express";

export type SSEEvent =
  | { type: "price_update"; price: number; timestamp: number }
  | { type: "prediction_sold"; direction: string; confidence: number; revenue: number }
  | { type: "prediction_resolved"; id: number; correct: boolean; accuracy: number }
  | { type: "balance_update"; usdc: number; runway: number; ratio: number }
  | { type: "monologue"; text: string }
  | { type: "unlimited_purchased"; apiKey: string };

export interface SSEClient {
  id: string;
  res: Response;
}

const clients: Map<string, SSEClient> = new Map();

let clientCounter = 0;

export function addClient(res: Response): string {
  const id = String(++clientCounter);
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");

  clients.set(id, { id, res });

  res.on("close", () => {
    clients.delete(id);
  });

  return id;
}

export function emit(event: SSEEvent): void {
  const data = JSON.stringify(event);
  for (const client of clients.values()) {
    client.res.write(`data: ${data}\n\n`);
  }
}

export function getClientCount(): number {
  return clients.size;
}
