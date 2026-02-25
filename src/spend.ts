export type SpendTier = "Starving" | "Surviving" | "Breaking Even" | "Thriving";

const DAILY_BURN = 0.48;

export interface SpendState {
  totalEarned: number;
  totalSpent: number;
  ratio: number;
  tier: SpendTier;
  runway: number;
  unlimitedProgress: number;
}

export class SpendTracker {
  private earned = 0;
  private spent = 0;
  private unlocked = false;

  recordEarning(amount: number): void {
    this.earned += amount;
  }

  recordSpend(amount: number): void {
    this.spent += amount;
  }

  markUnlocked(): void {
    this.unlocked = true;
  }

  getState(currentBalance: number): SpendState {
    const ratio = this.spent > 0 ? this.earned / this.spent : 0;
    return {
      totalEarned: this.earned,
      totalSpent: this.spent,
      ratio,
      tier: deriveTier(ratio),
      runway: currentBalance / DAILY_BURN,
      unlimitedProgress: Math.min((this.earned / 100) * 100, 100),
    };
  }

  shouldUnlock(): boolean {
    return !this.unlocked && this.earned >= 100;
  }
}

function deriveTier(ratio: number): SpendTier {
  if (ratio < 0.5) return "Starving";
  if (ratio < 1.0) return "Surviving";
  if (ratio < 1.5) return "Breaking Even";
  return "Thriving";
}
