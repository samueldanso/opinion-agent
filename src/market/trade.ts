import { config, getPinion } from "../config";
import { emit } from "../events";

export interface TradeResult {
  txHash: string;
  verified: boolean;
}

export async function executeTrade(direction: "up" | "down"): Promise<TradeResult> {
  const pinion = getPinion();
  const amount = config.agent.tradeAmountUSDC;

  emit({
    type: "monologue",
    text: `Executing $${amount} USDC → ETH trade (skin in the game)...`,
  });

  const tradeResult = await pinion.skills.trade("USDC", "ETH", amount);
  if (tradeResult.status !== 200 || !tradeResult.data?.swap) {
    const errMsg =
      (tradeResult.data as { error?: string })?.error ??
      `HTTP ${tradeResult.status}`;
    throw new Error(`Trade quote failed: ${errMsg}`);
  }
  const tx = tradeResult.data.swap;

  emit({ type: "monologue", text: "Broadcasting trade to Base..." });
  const broadcastResult = await pinion.skills.broadcast(tx);
  if (!broadcastResult.data?.txHash) {
    const errMsg =
      (broadcastResult.data as { error?: string })?.error ?? "no txHash returned";
    throw new Error(`Trade broadcast failed: ${errMsg}`);
  }
  const txHash = broadcastResult.data.txHash;

  emit({
    type: "trade_executed",
    direction,
    amountUSDC: parseFloat(amount),
    txHash,
  });

  emit({ type: "monologue", text: `Trade broadcast: ${txHash}` });

  let verified = false;
  try {
    emit({ type: "monologue", text: "Verifying trade on-chain..." });
    const txResult = await pinion.skills.tx(txHash);
    verified = txResult.data.status === "success";
    emit({
      type: "trade_verified",
      txHash,
      status: verified ? "success" : "failed",
    });
  } catch {
    emit({ type: "trade_verified", txHash, status: "failed" });
  }

  return { txHash, verified };
}
