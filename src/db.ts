import { Database } from "bun:sqlite";
import path from "node:path";

const DB_PATH = path.join(import.meta.dir, "..", "data", "opinion.db");

const db = new Database(DB_PATH, { create: true });
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS price_log (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    priceUSD  REAL    NOT NULL,
    change24h REAL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS predictions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    predictedAt   INTEGER NOT NULL,
    resolveAt     INTEGER NOT NULL,
    resolvedAt    INTEGER,
    direction     TEXT    NOT NULL,
    confidence    INTEGER NOT NULL,
    reasoning     TEXT    NOT NULL,
    currentPrice  REAL    NOT NULL,
    resolvedPrice REAL,
    correct       INTEGER
  );
`);

export interface PriceRow {
  id: number;
  timestamp: number;
  priceUSD: number;
  change24h: number | null;
}

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

const insertPrice = db.prepare(
  "INSERT INTO price_log (timestamp, priceUSD, change24h) VALUES (?, ?, ?)",
);

const insertPrediction = db.prepare(`
  INSERT INTO predictions (predictedAt, resolveAt, direction, confidence, reasoning, currentPrice)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const selectRecentPrices = db.prepare(
  "SELECT * FROM price_log ORDER BY timestamp DESC LIMIT ?",
);

const selectPendingPredictions = db.prepare(
  "SELECT * FROM predictions WHERE correct IS NULL AND resolveAt <= ?",
);

const updateResolution = db.prepare(
  "UPDATE predictions SET resolvedAt = ?, resolvedPrice = ?, correct = ? WHERE id = ?",
);

const selectAllPredictions = db.prepare(
  "SELECT * FROM predictions ORDER BY predictedAt DESC",
);

const selectResolvedPredictions = db.prepare(
  "SELECT * FROM predictions WHERE correct IS NOT NULL ORDER BY predictedAt DESC",
);

const selectLastNResolved = db.prepare(
  "SELECT * FROM predictions WHERE correct IS NOT NULL ORDER BY predictedAt DESC LIMIT ?",
);

export function logPrice(
  timestamp: number,
  priceUSD: number,
  change24h: number | null,
): void {
  insertPrice.run(timestamp, priceUSD, change24h);
}

export function getRecentPrices(limit = 24): PriceRow[] {
  return selectRecentPrices.all(limit) as PriceRow[];
}

export function addPrediction(
  predictedAt: number,
  resolveAt: number,
  direction: string,
  confidence: number,
  reasoning: string,
  currentPrice: number,
): number {
  const result = insertPrediction.run(
    predictedAt,
    resolveAt,
    direction,
    confidence,
    reasoning,
    currentPrice,
  );
  return Number(result.lastInsertRowid);
}

export function getPendingPredictions(now: number): PredictionRow[] {
  return selectPendingPredictions.all(now) as PredictionRow[];
}

export function resolvePrediction(
  id: number,
  resolvedAt: number,
  resolvedPrice: number,
  correct: boolean,
): void {
  updateResolution.run(resolvedAt, resolvedPrice, correct ? 1 : 0, id);
}

export function getAllPredictions(): PredictionRow[] {
  return selectAllPredictions.all() as PredictionRow[];
}

export function getResolvedPredictions(): PredictionRow[] {
  return selectResolvedPredictions.all() as PredictionRow[];
}

export function getLastNResolved(n: number): PredictionRow[] {
  return selectLastNResolved.all(n) as PredictionRow[];
}
