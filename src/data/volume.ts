interface VolumeData {
  dexCexRatio: number;
  dexVolume: number;
  cexVolume: number;
}

const DEFILLAMA_DEX_URL = "https://api.llama.fi/overview/dexs/ethereum?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume";
const DEFILLAMA_CEX_URL = "https://api.llama.fi/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume";

export async function fetchDexCexVolume(): Promise<VolumeData> {
  try {
    const [dexRes, cexRes] = await Promise.all([
      fetch(DEFILLAMA_DEX_URL),
      fetch(DEFILLAMA_CEX_URL),
    ]);

    if (!dexRes.ok || !cexRes.ok) return fallback();

    const dexJson = (await dexRes.json()) as { totalDataChart?: Array<[number, number]>; total24h?: number };
    const cexJson = (await cexRes.json()) as { totalDataChart?: Array<[number, number]>; total24h?: number };

    const dexVolume = dexJson.total24h ?? 0;
    const cexVolume = cexJson.total24h ?? 0;

    const ratio = cexVolume > 0 ? dexVolume / cexVolume : 0;

    return { dexCexRatio: ratio, dexVolume, cexVolume };
  } catch {
    return fallback();
  }
}

function fallback(): VolumeData {
  return { dexCexRatio: 0, dexVolume: 0, cexVolume: 0 };
}
