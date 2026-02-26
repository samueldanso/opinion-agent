import { getPinion } from "../config";
import { getDb, getRecentPrices, insertPrice } from "../db";
import { fetchOnchainContext } from "../data";
import { emit } from "../events";
import { buildSignalPrompt } from "./compose";
import { parseSignalResponse, type ParsedSignal } from "./parse";

export interface GeneratedSignal extends ParsedSignal {
  currentPrice: number;
  resolveAt: number;
  onchainContext: {
    fundingRate: number;
    liquidationBias: string;
    dexCexVolumeRatio: number;
  };
}

export async function generateSignal(): Promise<GeneratedSignal> {
  const pinion = getPinion();
  const db = getDb();

  emit({ type: "monologue", text: "Fetching onchain context..." });
  const context = await fetchOnchainContext();

  insertPrice(db, {
    priceUSD: context.price.priceUSD,
    change24h: context.price.change24h,
  });

  emit({
    type: "price_update",
    price: context.price.priceUSD,
    timestamp: Date.now(),
  });

  const history = getRecentPrices(db, 24);

  emit({ type: "monologue", text: "Composing signal prompt with onchain data..." });
  const prompt = buildSignalPrompt(context, history);

  emit({ type: "monologue", text: "Reasoning over market data..." });
  const chatResult = await pinion.skills.chat(prompt, []);

  if (chatResult.status !== 200 || !chatResult.data?.response) {
    const errMsg =
      (chatResult.data as { error?: string })?.error ??
      `HTTP ${chatResult.status}`;
    throw new Error(`Signal reasoning failed: ${errMsg}`);
  }

  const parsed = parseSignalResponse(chatResult.data.response);

  emit({
    type: "monologue",
    text: `Conviction: ${parsed.direction.toUpperCase()} (${parsed.confidence}%) — ${parsed.reasoning}`,
  });

  return {
    ...parsed,
    currentPrice: context.price.priceUSD,
    resolveAt: Date.now() + 3_600_000,
    onchainContext: {
      fundingRate: context.funding.fundingRate,
      liquidationBias: context.liquidations.bias,
      dexCexVolumeRatio: context.volume.dexCexRatio,
    },
  };
}

export { buildSignalPrompt } from "./compose";
export { parseSignalResponse, type ParsedSignal } from "./parse";
