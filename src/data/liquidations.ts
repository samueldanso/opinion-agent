export type LiquidationBias = "long-heavy" | "short-heavy" | "balanced";

interface LiquidationData {
  bias: LiquidationBias;
  longLiquidations: number;
  shortLiquidations: number;
}

const COINGLASS_LIQUIDATION_URL =
  "https://open-api.coinglass.com/public/v2/liquidation?symbol=ETH&time_type=h24";

export async function fetchLiquidations(): Promise<LiquidationData> {
  try {
    const res = await fetch(COINGLASS_LIQUIDATION_URL);
    if (!res.ok) return fallback();

    const json = (await res.json()) as {
      code: number;
      data?: Array<{ longVolUsd?: number; shortVolUsd?: number }>;
    };

    if (json.code !== 0 || !json.data?.length) return fallback();

    const longVol = json.data[0]?.longVolUsd ?? 0;
    const shortVol = json.data[0]?.shortVolUsd ?? 0;
    const total = longVol + shortVol;

    let bias: LiquidationBias = "balanced";
    if (total > 0) {
      const longRatio = longVol / total;
      if (longRatio > 0.6) bias = "long-heavy";
      else if (longRatio < 0.4) bias = "short-heavy";
    }

    return { bias, longLiquidations: longVol, shortLiquidations: shortVol };
  } catch {
    return fallback();
  }
}

function fallback(): LiquidationData {
  return { bias: "balanced", longLiquidations: 0, shortLiquidations: 0 };
}
