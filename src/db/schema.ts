import { Database } from "bun:sqlite";

export function initSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS price_log (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      priceUSD  REAL    NOT NULL,
      change24h REAL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS signals (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      formedAt      INTEGER NOT NULL,
      resolveAt     INTEGER NOT NULL,
      resolvedAt    INTEGER,
      direction     TEXT    NOT NULL,
      confidence    INTEGER NOT NULL,
      reasoning     TEXT    NOT NULL,
      currentPrice  REAL    NOT NULL,
      resolvedPrice REAL,
      correct       INTEGER,
      priceCharged  REAL    NOT NULL,
      revenue       REAL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS trades (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      signalId    INTEGER REFERENCES signals(id),
      executedAt  INTEGER NOT NULL,
      resolvedAt  INTEGER,
      direction   TEXT    NOT NULL,
      amountUSDC  REAL    NOT NULL,
      txHash      TEXT    NOT NULL,
      resolvedPnl REAL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS monologue_log (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      text      TEXT    NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS spend_log (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      amount    REAL    NOT NULL
    )
  `);
}
