import express from "express";
import { config, getAgentAddress } from "../config";
import { getDb, getAllSignals, getAllTrades, getAccuracy, getTotalEarned, getTotalTradePnl } from "../db";
import { addClient, getClientCount } from "../events";
import { getEconomicState } from "../economics";
import { getCurrentSignalPrice } from "../agent";
import { say } from "../agent";
import { getMonologueHistory } from "../agent/monologue";

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
      totalSpent: state.totalSpent,
      tradePnl,
      ratio: state.ratio,
      tier: state.tier,
      signalPrice: getCurrentSignalPrice(),
      unlimitedProgress: state.unlimitedProgress,
      clients: getClientCount(),
      monologueHistory: getMonologueHistory(),
    });
  });

  app.get("/signals", (_req, res) => {
    const db = getDb();
    const signals = getAllSignals(db, 100);
    const trades = getAllTrades(db, 100);
    res.json({ signals, trades });
  });

  // Proxy x402 skill server so both ports are reachable from one Railway domain
  app.all("/signal/*", async (req, res) => {
    try {
      const target = `http://localhost:${config.ports.skill}${req.path}`;
      const headers: Record<string, string> = { Accept: "application/json" };
      if (req.headers["x-payment"]) headers["x-payment"] = req.headers["x-payment"] as string;

      const upstream = await fetch(target, { method: req.method, headers });

      upstream.headers.forEach((val, key) => {
        if (key.toLowerCase() !== "transfer-encoding") res.setHeader(key, val);
      });
      res.status(upstream.status).send(await upstream.text());
    } catch {
      res.status(502).json({ error: "Skill server unreachable" });
    }
  });

  const port = Number(process.env.PORT) || config.ports.api;
  app.listen(port, () => {
    say(`API/SSE server on port ${port}`);
  });
}
