import type { Database } from "bun:sqlite";

export function insertSpend(db: Database, amount: number): void {
  db.run("INSERT INTO spend_log (timestamp, amount) VALUES (?, ?)", [Date.now(), amount]);
}

export function getTotalSpend(db: Database): number {
  const row = db.query<{ total: number }, []>("SELECT COALESCE(SUM(amount), 0) as total FROM spend_log").get();
  return row?.total ?? 0;
}
