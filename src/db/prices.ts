import type { Database } from "bun:sqlite";

export interface PriceRow {
  id: number;
  timestamp: number;
  priceUSD: number;
  change24h: number | null;
}

export function insertPrice(
  db: Database,
  price: { priceUSD: number; change24h: number | null },
): void {
  db.run(
    "INSERT INTO price_log (timestamp, priceUSD, change24h) VALUES (?, ?, ?)",
    [Date.now(), price.priceUSD, price.change24h],
  );
}

export function getRecentPrices(db: Database, limit = 24): PriceRow[] {
  return db
    .query("SELECT * FROM price_log ORDER BY timestamp DESC LIMIT ?")
    .all(limit) as PriceRow[];
}

export function getLatestPrice(db: Database): PriceRow | null {
  return (
    (db
      .query("SELECT * FROM price_log ORDER BY timestamp DESC LIMIT 1")
      .get() as PriceRow | null) ?? null
  );
}
