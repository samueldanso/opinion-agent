import { fetchPrice } from "./price";
import { fetchFundingRate } from "./funding";
import { fetchLiquidations } from "./liquidations";
import { fetchDexCexVolume } from "./volume";
import type { LiquidationBias } from "./liquidations";

export interface OnchainContext {
  price: {
    priceUSD: number;
    change24h: number | null;
  };
  funding: {
    fundingRate: number;
    openInterestDelta: number;
  };
  liquidations: {
    bias: LiquidationBias;
    longLiquidations: number;
    shortLiquidations: number;
  };
  volume: {
    dexCexRatio: number;
    dexVolume: number;
    cexVolume: number;
  };
}

export async function fetchOnchainContext(): Promise<OnchainContext> {
  const [price, funding, liquidations, volume] = await Promise.all([
    fetchPrice(),
    fetchFundingRate(),
    fetchLiquidations(),
    fetchDexCexVolume(),
  ]);

  return { price, funding, liquidations, volume };
}

export { fetchPrice } from "./price";
export type { PriceData } from "./price";
export type { LiquidationBias };
