import { PinionClient } from "pinion-os";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const config = {
  pinion: {
    privateKey: requireEnv("PINION_PRIVATE_KEY"),
    address: requireEnv("ADDRESS"),
    network: (process.env.PINION_NETWORK ?? "base") as
      | "base"
      | "base-sepolia",
  },
  ports: {
    skill: 4020,
    api: 3001,
  },
  agent: {
    pollIntervalMs: 3_600_000,
    signalResolutionMs: 3_600_000,
    tradeAmountUSDC: "0.5",
    milestoneAmountUSDC: "0.01",
    milestoneAddress: requireEnv("ADDRESS"),
    minBalanceToOperate: 0.1,
  },
  pricing: {
    starving: 0.05,
    surviving: 0.1,
    breakingEven: 0.1,
    thriving: 0.15,
    flush: 0.2,
    flushThreshold: 50,
    unlimitedThreshold: 100,
  },
  db: {
    path: "./data/agent.db",
  },
} as const;

let _pinion: PinionClient | null = null;

export function getPinion(): PinionClient {
  if (!_pinion) {
    _pinion = new PinionClient({
      privateKey: config.pinion.privateKey,
    });
  }
  return _pinion;
}

export function setPinionApiKey(key: string): void {
  getPinion().setApiKey(key);
}
