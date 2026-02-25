interface FundingData {
  fundingRate: number;
  openInterestDelta: number;
}

const COINGLASS_FUNDING_URL =
  "https://open-api.coinglass.com/public/v2/funding?symbol=ETH&time_type=h8";

export async function fetchFundingRate(): Promise<FundingData> {
  try {
    const res = await fetch(COINGLASS_FUNDING_URL);
    if (!res.ok) return fallback();

    const json = (await res.json()) as {
      code: number;
      data?: Array<{ uMarginList?: Array<{ rate: number; openInterest: number }> }>;
    };

    if (json.code !== 0 || !json.data?.length) return fallback();

    const exchanges = json.data[0]?.uMarginList ?? [];
    if (exchanges.length === 0) return fallback();

    const avgRate =
      exchanges.reduce((sum, e) => sum + e.rate, 0) / exchanges.length;
    const totalOI = exchanges.reduce((sum, e) => sum + e.openInterest, 0);

    return {
      fundingRate: avgRate,
      openInterestDelta: totalOI,
    };
  } catch {
    return fallback();
  }
}

function fallback(): FundingData {
  return { fundingRate: 0, openInterestDelta: 0 };
}
