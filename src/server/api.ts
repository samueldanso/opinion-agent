import express from "express";
import { config, getAgentAddress } from "../config";
import { getDb, getAllSignals, getAllTrades, getAccuracy, getTotalEarned, getTotalTradePnl } from "../db";
import { addClient, getClientCount } from "../events";
import { getEconomicState } from "../economics";
import { getCurrentSignalPrice } from "../agent";
import { say } from "../agent";

export function startApiServer(): void {
  const app = express();

  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

  app.get("/events", (req, res) => {
    addClient(res);
    req.on("close", () => {});
  });

  app.get("/status", (_req, res) => {
    const db = getDb();
    const { correct, total } = getAccuracy(db);
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const totalEarned = getTotalEarned(db);
    const tradePnl = getTotalTradePnl(db);
    const state = getEconomicState(0);

    res.json({
      address: getAgentAddress(),
      accuracy,
      correct,
      total,
      totalEarned,
      tradePnl,
      ratio: state.ratio,
      tier: state.tier,
      signalPrice: getCurrentSignalPrice(),
      unlimitedProgress: state.unlimitedProgress,
      clients: getClientCount(),
    });
  });

  app.get("/signals", (_req, res) => {
    const db = getDb();
    const signals = getAllSignals(db, 100);
    const trades = getAllTrades(db, 100);
    res.json({ signals, trades });
  });

  app.listen(config.ports.api, () => {
    say(`API/SSE server on port ${config.ports.api}`);
  });
}
