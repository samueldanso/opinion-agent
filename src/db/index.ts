import { Database } from "bun:sqlite";
import { config } from "../config";
import { initSchema } from "./schema";

let _db: Database | null = null;

export function getDb(): Database {
  if (!_db) {
    _db = new Database(config.db.path, { create: true });
    _db.exec("PRAGMA journal_mode=WAL");
    initSchema(_db);
  }
  return _db;
}

export { insertPrice, getRecentPrices, getLatestPrice } from "./prices";
export type { PriceRow } from "./prices";

export {
  insertSignal,
  getPendingSignals,
  resolveSignal,
  getAllSignals,
  getResolvedSignals,
  getAccuracy,
  getLast5Signals,
  getTotalEarned,
} from "./signals";
export type { SignalRow } from "./signals";

export {
  insertTrade,
  resolveTrade,
  getTradeBySignalId,
  getTotalTradePnl,
  getAllTrades,
} from "./trades";
export type { TradeRow } from "./trades";

export { insertMonologue, getRecentMonologue } from "./monologue";
export { insertSpend, getTotalSpend } from "./spend";
