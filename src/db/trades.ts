import type { Database } from "bun:sqlite";

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

export function insertTrade(
  db: Database,
  trade: {
    signalId: number;
    direction: "up" | "down";
    amountUSDC: number;
    txHash: string;
  },
): number {
  const result = db.run(
    `INSERT INTO trades (signalId, executedAt, direction, amountUSDC, txHash)
     VALUES (?, ?, ?, ?, ?)`,
    [trade.signalId, Date.now(), trade.direction, trade.amountUSDC, trade.txHash],
  );
  return Number(result.lastInsertRowid);
}

export function resolveTrade(
  db: Database,
  signalId: number,
  pnl: number,
): void {
  db.run(
    "UPDATE trades SET resolvedAt = ?, resolvedPnl = ? WHERE signalId = ?",
    [Date.now(), pnl, signalId],
  );
}

export function getTradeBySignalId(
  db: Database,
  signalId: number,
): TradeRow | null {
  return (
    (db
      .query("SELECT * FROM trades WHERE signalId = ?")
      .get(signalId) as TradeRow | null) ?? null
  );
}

export function getTotalTradePnl(db: Database): number {
  const row = db
    .query(
      "SELECT COALESCE(SUM(resolvedPnl), 0) as total FROM trades WHERE resolvedPnl IS NOT NULL",
    )
    .get() as { total: number };
  return row.total;
}

export function getAllTrades(db: Database, limit = 50): TradeRow[] {
  return db
    .query("SELECT * FROM trades ORDER BY executedAt DESC LIMIT ?")
    .all(limit) as TradeRow[];
}
