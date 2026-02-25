import type { Response } from "express";

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

export function emit(event: Record<string, unknown>): void {
  const data = JSON.stringify(event);
  for (const client of clients.values()) {
    client.res.write(`data: ${data}\n\n`);
  }
}

export function getClientCount(): number {
  return clients.size;
}
