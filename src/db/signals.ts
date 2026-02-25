import type { Database } from "bun:sqlite";

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

export function insertSignal(
  db: Database,
  signal: {
    direction: "up" | "down";
    confidence: number;
    reasoning: string;
    currentPrice: number;
    priceCharged: number;
    revenue: number;
    resolveAt: number;
  },
): number {
  const now = Date.now();
  const result = db.run(
    `INSERT INTO signals (formedAt, resolveAt, direction, confidence, reasoning, currentPrice, priceCharged, revenue)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      now,
      signal.resolveAt,
      signal.direction,
      signal.confidence,
      signal.reasoning,
      signal.currentPrice,
      signal.priceCharged,
      signal.revenue,
    ],
  );
  return Number(result.lastInsertRowid);
}

export function getPendingSignals(db: Database): SignalRow[] {
  return db
    .query("SELECT * FROM signals WHERE resolvedAt IS NULL AND resolveAt <= ?")
    .all(Date.now()) as SignalRow[];
}

export function resolveSignal(
  db: Database,
  id: number,
  resolvedPrice: number,
  correct: boolean,
): void {
  db.run(
    "UPDATE signals SET resolvedAt = ?, resolvedPrice = ?, correct = ? WHERE id = ?",
    [Date.now(), resolvedPrice, correct ? 1 : 0, id],
  );
}

export function getAllSignals(db: Database, limit = 50): SignalRow[] {
  return db
    .query("SELECT * FROM signals ORDER BY formedAt DESC LIMIT ?")
    .all(limit) as SignalRow[];
}

export function getResolvedSignals(db: Database): SignalRow[] {
  return db
    .query("SELECT * FROM signals WHERE correct IS NOT NULL ORDER BY formedAt DESC")
    .all() as SignalRow[];
}

export function getAccuracy(db: Database): { correct: number; total: number } {
  const resolved = getResolvedSignals(db);
  const correct = resolved.filter((s) => s.correct === 1).length;
  return { correct, total: resolved.length };
}

export function getLast5Signals(db: Database): SignalRow[] {
  return db
    .query(
      "SELECT * FROM signals WHERE correct IS NOT NULL ORDER BY formedAt DESC LIMIT 5",
    )
    .all() as SignalRow[];
}

export function getTotalEarned(db: Database): number {
  const row = db
    .query("SELECT COALESCE(SUM(revenue), 0) as total FROM signals WHERE revenue IS NOT NULL")
    .get() as { total: number };
  return row.total;
}
