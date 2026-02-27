import { config } from "../config";
import { getDb, getTotalEarned, getTotalTradePnl, insertSpend, getTotalSpend } from "../db";

export type SpendTier = "Starving" | "Surviving" | "Breaking Even" | "Thriving" | "Flush";

export interface EconomicState {
  totalEarned: number;
  totalSpent: number;
  ratio: number;
  tier: SpendTier;
  runway: number;
  unlimitedProgress: number;
  tradePnl: number;
  margin: number;
}

const DAILY_BURN = 0.24;

let _unlocked = false;

export function recordSpend(amount: number): void {
  try {
    insertSpend(getDb(), amount);
  } catch {
    // Non-fatal — DB may not be ready on very first boot call
  }
}

export function markUnlocked(): void {
  _unlocked = true;
}

export function shouldUnlock(): boolean {
  const db = getDb();
  const earned = getTotalEarned(db);
  return !_unlocked && earned >= config.pricing.unlimitedThreshold;
}

export function getEconomicState(currentBalance: number): EconomicState {
  const db = getDb();
  const totalEarned = getTotalEarned(db);
  const tradePnl = getTotalTradePnl(db);
  const totalSpent = getTotalSpend(db);
  const ratio = totalSpent > 0 ? totalEarned / totalSpent : 0;
  const tier = deriveTier(ratio, totalEarned);

  return {
    totalEarned,
    totalSpent,
    ratio,
    tier,
    runway: currentBalance / DAILY_BURN,
    unlimitedProgress: Math.min((totalEarned / config.pricing.unlimitedThreshold) * 100, 100),
    tradePnl,
    margin: totalEarned - totalSpent,
  };
}

function deriveTier(ratio: number, totalEarned: number): SpendTier {
  if (totalEarned >= config.pricing.flushThreshold) return "Flush";
  if (ratio < 0.5) return "Starving";
  if (ratio < 1.0) return "Surviving";
  if (ratio < 1.5) return "Breaking Even";
  return "Thriving";
}
