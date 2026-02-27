import type { Response } from "express";

const clients = new Map<string, Response>();
let clientId = 0;

const HISTORY_SIZE = 50;
const history: string[] = [];

setInterval(() => {
  for (const res of clients.values()) {
    res.write(": keepalive\n\n");
  }
}, 25_000);

export function addClient(res: Response): string {
  const id = String(++clientId);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  res.write(": connected\n\n");

  for (const event of history) {
    res.write(`data: ${event}\n\n`);
  }

  clients.set(id, res);

  res.on("close", () => {
    clients.delete(id);
  });

  return id;
}

export function broadcast(data: string): void {
  if (history.length >= HISTORY_SIZE) {
    history.shift();
  }
  history.push(data);

  for (const res of clients.values()) {
    res.write(`data: ${data}\n\n`);
  }
}

export function getClientCount(): number {
  return clients.size;
}
