import { PinionClient } from "pinion-os";
import { SpendTracker } from "./spend.js";
import { startSkillServer, startApiServer } from "./server.js";
import { startLoop } from "./loop.js";
import { emit } from "./sse.js";

const pinion = new PinionClient({
  privateKey: process.env.PINION_PRIVATE_KEY!,
  network: process.env.PINION_NETWORK || "base-sepolia",
});

const tracker = new SpendTracker();

async function boot(): Promise<void> {
  console.log(`OPINION agent booting — wallet: ${pinion.address}`);
  emit({ type: "monologue", text: `Agent booting — wallet: ${pinion.address}` });

  const balanceResult = await pinion.skills.balance(pinion.address);
  tracker.recordSpend(0.01);

  const usdc = parseFloat(balanceResult.data.balances.USDC);
  const eth = parseFloat(balanceResult.data.balances.ETH);

  console.log(`Balance: ${usdc} USDC, ${eth} ETH`);
  emit({ type: "monologue", text: `Balance: ${usdc.toFixed(2)} USDC, ${eth.toFixed(4)} ETH` });
  emit({ type: "balance_update", usdc, runway: usdc / 0.24, ratio: 0, earned: 0, spent: 0.01 });

  startSkillServer(pinion, tracker);
  startApiServer();
  startLoop(pinion, tracker);

  emit({ type: "monologue", text: "Agent online. Prediction endpoint live on port 4020." });
}

boot().catch((err) => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});
