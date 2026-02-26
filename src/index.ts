import { config, getPinion } from "./config";
import { getDb } from "./db";
import { emit } from "./events";
import { recordSpend } from "./economics";

async function boot(): Promise<void> {
  const pinion = getPinion();
  getDb();

  console.log(`SIGINT agent booting — wallet: ${pinion.address}`);
  emit({ type: "monologue", text: `Agent booting — wallet: ${pinion.address}` });

  const balanceResult = await pinion.skills.balance(pinion.address);
  recordSpend(0.01);

  const usdc = parseFloat(balanceResult.data.balances.USDC);
  const eth = parseFloat(balanceResult.data.balances.ETH);

  console.log(`Balance: ${usdc} USDC, ${eth} ETH`);
  emit({ type: "monologue", text: `Balance: ${usdc.toFixed(2)} USDC, ${eth.toFixed(4)} ETH` });

  if (usdc < config.agent.minBalanceToOperate) {
    emit({
      type: "monologue",
      text: `Insufficient balance ($${usdc.toFixed(2)} USDC). Need $${config.agent.minBalanceToOperate} to operate. Fund wallet: ${pinion.address}`,
    });
    return;
  }

  emit({ type: "monologue", text: "Agent online. Awaiting Phase 3 integration." });
}

boot().catch((err) => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});
