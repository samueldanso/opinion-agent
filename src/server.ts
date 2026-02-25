import type { PinionClient } from "pinion-os";
import { createSkillServer, skill } from "pinion-os/server";
import express from "express";
import { makePrediction } from "./predict.js";
import { addClient } from "./sse.js";
import { getTrackRecord } from "./stats.js";
import { getAllPredictions } from "./db.js";
import type { SpendTracker } from "./spend.js";

const SKILL_PORT = 4020;
const API_PORT = 3001;

export function startSkillServer(
  pinion: PinionClient,
  tracker: SpendTracker,
): void {
  const server = createSkillServer({
    payTo: process.env.ADDRESS!,
    network: process.env.PINION_NETWORK || "base-sepolia",
  });

  server.add(
    skill("predict-eth", {
      description: "ETH price direction prediction with track record",
      endpoint: "/predict/eth",
      method: "GET",
      price: "$0.10",
      handler: async (_req, res) => {
        tracker.recordEarning(0.1);
        const prediction = await makePrediction(pinion, tracker);
        res.json(prediction);
      },
    }),
  );

  server.listen(SKILL_PORT);
  console.log(`x402 skill server listening on port ${SKILL_PORT}`);
}

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
    const trackRecord = getTrackRecord();
    const predictions = getAllPredictions();
    res.json({ trackRecord, predictions });
  });

  app.listen(API_PORT, () => {
    console.log(`API/SSE server listening on port ${API_PORT}`);
  });
}
