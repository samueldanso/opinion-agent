import { getDb, getPendingSignals, resolveSignal, getAccuracy, getTradeBySignalId, resolveTrade } from "../db";
import { fetchPrice } from "../data";
import { emit } from "../events";
import { recordSpend } from "../economics";
import { isCorrect, calculateTradePnl, calculatePriceDelta } from "./verdict";

export async function resolvePendingSignals(): Promise<void> {
  const db = getDb();
  const pending = getPendingSignals(db);

  if (pending.length === 0) return;

  emit({ type: "monologue", text: `Resolving ${pending.length} pending signal(s)...` });

  const priceData = await fetchPrice();
  recordSpend(0.01);
  const currentPrice = priceData.priceUSD;

  for (const signal of pending) {
    const correct = isCorrect(
      signal.direction as "up" | "down",
      signal.currentPrice,
      currentPrice,
    );

    resolveSignal(db, signal.id, currentPrice, correct);

    const trade = getTradeBySignalId(db, signal.id);
    let pnl = 0;
    if (trade) {
      pnl = calculateTradePnl(trade.amountUSDC, signal.currentPrice, currentPrice);
      resolveTrade(db, signal.id, pnl);
    }

    const { delta, formatted: deltaFormatted } = calculatePriceDelta(
      signal.currentPrice,
      currentPrice,
    );

    const { correct: correctCount, total } = getAccuracy(db);
    const accuracy = total > 0 ? (correctCount / total) * 100 : 0;

    const dir = (signal.direction as string).toUpperCase();
    const mark = correct ? "✓" : "✗";

    emit({
      type: "signal_resolved",
      id: signal.id,
      correct,
      pnl: parseFloat(pnl.toFixed(4)),
      accuracy: parseFloat(accuracy.toFixed(1)),
      priceDelta: parseFloat(delta.toFixed(2)),
      deltaFormatted,
    });

    emit({
      type: "monologue",
      text: `${dir} ${mark} ${deltaFormatted} | PnL: $${pnl.toFixed(4)} | Accuracy: ${accuracy.toFixed(1)}%`,
    });
  }
}

export { isCorrect, calculateTradePnl, calculatePriceDelta } from "./verdict";
