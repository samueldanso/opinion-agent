import { boot, startLoop } from "./agent";
import { hasWallet, loadWallet, runGenesis } from "./agent/genesis";
import { config, initPinion } from "./config";
import { getDb } from "./db";
import { startApiServer, startSkillServer } from "./server";

async function main(): Promise<void> {
  let agentKey: string;

  if (hasWallet()) {
    const wallet = loadWallet();
    agentKey = wallet.privateKey;
    console.log(`[SIGINT] Wallet loaded: ${wallet.address}`);
  } else {
    if (!config.genesis.creatorKey) {
      throw new Error(
        "No agent wallet found and PINION_PRIVATE_KEY not set.\n" +
        "First run requires PINION_PRIVATE_KEY to spawn and fund the agent.\n" +
        "See .env.example for setup.",
      );
    }
    const wallet = await runGenesis(
      config.genesis.creatorKey,
      config.genesis.seedUsdc,
      config.genesis.seedEth,
    );
    agentKey = wallet.privateKey;
  }

  initPinion(agentKey);
  getDb();

  await boot();

  startSkillServer();
  startApiServer();
  startLoop();
}

main().catch((err) => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});
