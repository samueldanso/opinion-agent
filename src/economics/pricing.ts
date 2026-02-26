import { config } from "../config";
import type { SpendTier } from "./tracker";

const TIER_PRICES: Record<SpendTier, number> = {
  Starving: config.pricing.starving,
  Surviving: config.pricing.surviving,
  "Breaking Even": config.pricing.breakingEven,
  Thriving: config.pricing.thriving,
  Flush: config.pricing.flush,
};

export function getSignalPrice(tier: SpendTier): number {
  return TIER_PRICES[tier];
}
