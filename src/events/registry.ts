import type { Response } from "express";

const clients = new Map<string, Response>();
let clientId = 0;

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
  clients.set(id, res);

  res.on("close", () => {
    clients.delete(id);
  });

  return id;
}

export function broadcast(data: string): void {
  for (const res of clients.values()) {
    res.write(`data: ${data}\n\n`);
  }
}

export function getClientCount(): number {
  return clients.size;
}
