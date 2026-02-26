import { createSkillServer, skill } from "pinion-os/server";
import { config } from "../config";
import { getDb, insertSignal, insertTrade, getAccuracy, getLast5Signals, getTotalTradePnl } from "../db";
import { generateSignal } from "../signal";
import { executeTrade } from "../market";
import { recordSpend } from "../economics";
import { emit } from "../events";
import { getCurrentSignalPrice } from "../agent";
import { say } from "../agent";

export function startSkillServer(): void {
  const server = createSkillServer({
    payTo: config.pinion.address,
    network: config.pinion.network,
  });

  server.add(
    skill("signal-eth", {
      description: "ETH directional signal backed by agent's own trade",
      endpoint: "/signal/eth",
      method: "GET",
      price: `$${getCurrentSignalPrice().toFixed(2)}`,
      handler: async (_req, res) => {
        try {
          const currentPrice = getCurrentSignalPrice();

          const signal = await generateSignal();
          recordSpend(0.02);

          const tradeResult = await executeTrade(signal.direction);
          recordSpend(0.03 + parseFloat(config.agent.tradeAmountUSDC));

          const db = getDb();
          const signalId = insertSignal(db, {
            direction: signal.direction,
            confidence: signal.confidence,
            reasoning: signal.reasoning,
            currentPrice: signal.currentPrice,
            priceCharged: currentPrice,
            revenue: currentPrice,
            resolveAt: signal.resolveAt,
          });

          insertTrade(db, {
            signalId,
            direction: signal.direction,
            amountUSDC: parseFloat(config.agent.tradeAmountUSDC),
            txHash: tradeResult.txHash,
          });

          const { correct, total } = getAccuracy(db);
          const last5 = getLast5Signals(db).map((s) => ({
            direction: s.direction,
            correct: s.correct === 1,
            timestamp: s.formedAt,
          }));
          const tradePnl = getTotalTradePnl(db);

          emit({
            type: "signal_sold",
            direction: signal.direction,
            confidence: signal.confidence,
            revenue: currentPrice,
            price: currentPrice,
          });

          say(`Signal sold: ${signal.direction.toUpperCase()} (${signal.confidence}%) for $${currentPrice.toFixed(2)}`);

          res.json({
            direction: signal.direction,
            confidence: signal.confidence,
            currentPrice: signal.currentPrice,
            resolveAt: signal.resolveAt,
            reasoning: signal.reasoning,
            tradeHash: tradeResult.txHash,
            onchainContext: signal.onchainContext,
            trackRecord: {
              correct,
              total,
              last5,
              tradePnl,
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          say(`Signal generation failed: ${message}`);
          res.status(500).json({ error: "Signal generation failed" });
        }
      },
    }),
  );

  server.listen(config.ports.skill);
  say(`x402 skill server on port ${config.ports.skill}`);
}
