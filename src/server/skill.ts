import { createSkillServer, skill } from "pinion-os/server";
import { config, getAgentAddress, getPinion } from "../config";
import { getDb, insertSignal, insertTrade, getAccuracy, getLast5Signals, getTotalTradePnl } from "../db";
import { generateSignal, type GeneratedSignal } from "../signal";
import { executeTrade } from "../market";
import { getEconomicState, recordSpend } from "../economics";
import { emit } from "../events";
import { getCurrentSignalPrice } from "../agent";
import { say } from "../agent";

interface CachedSignalEntry {
  signal: GeneratedSignal;
  tradeHash: string | null;
}

let _signalCache: CachedSignalEntry | null = null;

function isCacheValid(): boolean {
  if (!_signalCache) return false;
  return _signalCache.signal.resolveAt > Date.now();
}

export function startSkillServer(): void {
  const server = createSkillServer({
    payTo: getAgentAddress(),
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

          let signal: GeneratedSignal;
          let tradeHash: string | null = null;
          let isFromCache = false;

          if (isCacheValid() && _signalCache) {
            signal = _signalCache.signal;
            tradeHash = _signalCache.tradeHash;
            isFromCache = true;
            say(`Signal served from cache (expires ${new Date(signal.resolveAt).toISOString()})`);
          } else {
            signal = await generateSignal();
            recordSpend(0.02);

            try {
              const tradeResult = await executeTrade(signal.direction);
              tradeHash = tradeResult.txHash;
              recordSpend(0.03 + parseFloat(config.agent.tradeAmountUSDC));
            } catch (tradeError) {
              const msg = tradeError instanceof Error ? tradeError.message : String(tradeError);
              say(`Trade failed (signal still delivered): ${msg}`);
            }

            _signalCache = { signal, tradeHash };
          }

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

          if (tradeHash && !isFromCache) {
            insertTrade(db, {
              signalId,
              direction: signal.direction,
              amountUSDC: parseFloat(config.agent.tradeAmountUSDC),
              txHash: tradeHash,
            });
          }

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

          // Refresh live balance so dashboard reflects the trade deduction immediately
          try {
            const pinion = getPinion();
            const balanceResult = await pinion.skills.balance(pinion.address);
            recordSpend(0.01);
            if (balanceResult.status === 200 && balanceResult.data?.balances) {
              const usdc = parseFloat(balanceResult.data.balances.USDC);
              const state = getEconomicState(usdc);
              emit({ type: "balance_update", usdc, runway: state.runway, ratio: state.ratio, earned: state.totalEarned, spent: state.totalSpent });
            }
          } catch { /* non-fatal */ }

          res.json({
            direction: signal.direction,
            confidence: signal.confidence,
            currentPrice: signal.currentPrice,
            resolveAt: signal.resolveAt,
            reasoning: signal.reasoning,
            tradeHash,
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
