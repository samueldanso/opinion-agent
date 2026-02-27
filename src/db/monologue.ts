import type { Database } from "bun:sqlite";

export function insertMonologue(db: Database, text: string): void {
  db.run("INSERT INTO monologue_log (timestamp, text) VALUES (?, ?)", [Date.now(), text]);
}

export function getRecentMonologue(db: Database, limit = 100): string[] {
  const rows = db
    .query<{ text: string }, [number]>(
      "SELECT text FROM monologue_log ORDER BY id DESC LIMIT ?",
    )
    .all(limit);
  return rows.map((r) => r.text).reverse();
}
