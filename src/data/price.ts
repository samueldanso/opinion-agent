import { getPinion } from "../config";

export interface PriceData {
  priceUSD: number;
  change24h: number | null;
}

export async function fetchPrice(): Promise<PriceData> {
  const pinion = getPinion();
  const result = await pinion.skills.price("ETH");

  return {
    priceUSD: result.data.priceUSD,
    change24h:
      result.data.change24h != null
        ? parseFloat(String(result.data.change24h))
        : null,
  };
}
