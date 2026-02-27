import { config, getPinion, setPinionApiKey } from "../config";
import { getDb, insertPrice } from "../db";
import { fetchPrice } from "../data";
import { emit } from "../events";
import { resolvePendingSignals } from "../resolution";
import {
  getEconomicState,
  recordSpend,
  shouldUnlock,
  markUnlocked,
  evaluateReinvestment,
  getSignalPrice,
} from "../economics";
import { say } from "./monologue";

let _currentSignalPrice: number = config.pricing.surviving;
let _milestoneSent = false;

export function getCurrentSignalPrice(): number {
  return _currentSignalPrice;
}

function printBanner(): void {
  const orange = "\x1b[38;5;208m";
  const dim = "\x1b[2m";
  const reset = "\x1b[0m";

  console.log(`${orange}
  ███████╗██╗ ██████╗ ██╗███╗   ██╗████████╗
  ██╔════╝██║██╔════╝ ██║████╗  ██║╚══██╔══╝
  ███████╗██║██║  ███╗██║██╔██╗ ██║   ██║
  ╚════██║██║██║   ██║██║██║╚██╗██║   ██║
  ███████║██║╚██████╔╝██║██║ ╚████║   ██║
  ╚══════╝╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝   ╚═╝
${dim}  On-chain Signals Intelligence${reset}
`);
}

export async function boot(): Promise<void> {
  printBanner();

  const pinion = getPinion();

  say("SIGINT v3 initialising...");
  say(`Sovereign identity: ${pinion.address}`);

  const balanceResult = await pinion.skills.balance(pinion.address);
  recordSpend(0.01);

  if (balanceResult.status !== 200 || !balanceResult.data?.balances) {
    const errMsg =
      (balanceResult.data as { error?: string })?.error ??
      `HTTP ${balanceResult.status}`;
    throw new Error(
      `Balance check failed: ${errMsg}. Fund wallet with USDC on Base mainnet: ${pinion.address}`,
    );
  }

  const usdc = parseFloat(balanceResult.data.balances.USDC);
  const eth = parseFloat(balanceResult.data.balances.ETH);

  say(`Balance: ${usdc.toFixed(2)} USDC | ${eth.toFixed(4)} ETH`);

  const state = getEconomicState(usdc);
  emit({
    type: "balance_update",
    usdc,
    runway: state.runway,
    ratio: state.ratio,
    earned: state.totalEarned,
    spent: state.totalSpent,
  });

  if (usdc < config.agent.minBalanceToOperate) {
    say(
      `Insufficient balance ($${usdc.toFixed(2)} USDC). Need $${config.agent.minBalanceToOperate}. Fund: ${pinion.address}`,
    );
    say("Pausing until funded. Will retry on next tick.");
    return;
  }

  const signalPrice = getCurrentSignalPrice();
  say(`Signal price: $${signalPrice.toFixed(2)} USDC — ${state.tier} tier`);
  say("Agent online. Starting hourly loop.");
}

export function startLoop(): NodeJS.Timer {
  async function tick(): Promise<void> {
    try {
      say("Hourly tick starting...");

      const priceData = await fetchPrice();
      recordSpend(0.01);

      const db = getDb();
      insertPrice(db, {
        priceUSD: priceData.priceUSD,
        change24h: priceData.change24h,
      });

      emit({
        type: "price_update",
        price: priceData.priceUSD,
        timestamp: Date.now(),
      });

      say(`ETH: $${priceData.priceUSD.toFixed(2)}`);

      await resolvePendingSignals();

      const pinion = getPinion();
      const balanceResult = await pinion.skills.balance(pinion.address);
      recordSpend(0.01);

      if (balanceResult.status !== 200 || !balanceResult.data?.balances) {
        const errMsg =
          (balanceResult.data as { error?: string })?.error ??
          `HTTP ${balanceResult.status}`;
        say(`Balance check failed: ${errMsg}`);
        return;
      }

      const usdc = parseFloat(balanceResult.data.balances.USDC);
      const state = getEconomicState(usdc);

      emit({
        type: "balance_update",
        usdc,
        runway: state.runway,
        ratio: state.ratio,
        earned: state.totalEarned,
        spent: state.totalSpent,
      });

      const newPrice = getSignalPrice(state.tier);
      if (newPrice !== _currentSignalPrice) {
        emit({
          type: "price_adjusted",
          oldPrice: _currentSignalPrice,
          newPrice,
          reason: `Tier changed to ${state.tier}`,
        });
        say(`Signal price adjusted: $${_currentSignalPrice.toFixed(2)} → $${newPrice.toFixed(2)} (${state.tier})`);
        _currentSignalPrice = newPrice;
      }

      if (!_milestoneSent && state.ratio >= 1.0 && state.totalEarned > 0) {
        await sendMilestone(pinion);
        _milestoneSent = true;
      }

      if (shouldUnlock()) {
        await purchaseUnlimited(pinion);
      }

      evaluateReinvestment(state);

      say("Cycle complete. Sleeping 1h.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      say(`Loop error: ${message}`);
    }
  }

  tick();
  return setInterval(tick, config.agent.pollIntervalMs);
}

async function sendMilestone(pinion: ReturnType<typeof getPinion>): Promise<void> {
  try {
    say("Ratio crossed 1.0 — sending milestone proof onchain...");

    const sendResult = await pinion.skills.send(
      config.agent.milestoneAddress,
      config.agent.milestoneAmountUSDC,
      "USDC",
    );
    recordSpend(0.01);

    const broadcastResult = await pinion.skills.broadcast(sendResult.data.tx);
    recordSpend(0.01 + parseFloat(config.agent.milestoneAmountUSDC));

    emit({
      type: "milestone",
      event: "ratio_crossed_1",
      txHash: broadcastResult.data.txHash,
    });

    say(`Survival proven onchain: ${broadcastResult.data.txHash}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    say(`Milestone tx failed: ${message}`);
  }
}

async function purchaseUnlimited(pinion: ReturnType<typeof getPinion>): Promise<void> {
  try {
    say("Lifetime earnings crossed $100 — purchasing unlimited key...");

    const result = await pinion.skills.unlimited();
    const apiKey = result.data.apiKey;

    setPinionApiKey(apiKey);
    markUnlocked();

    emit({ type: "unlimited_purchased", apiKey });
    say("Unlimited key active. All future skill calls are free.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    say(`Unlimited purchase failed: ${message}`);
  }
}
