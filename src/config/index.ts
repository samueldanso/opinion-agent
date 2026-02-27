import { PinionClient } from "pinion-os";

function envOrDefault(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  pinion: {
    network: (process.env.PINION_NETWORK ?? "base") as "base" | "base-sepolia",
  },
  genesis: {
    creatorKey: process.env.CREATOR_PRIVATE_KEY ?? "",
    seedUsdc: envOrDefault("SEED_USDC", "5"),
    seedEth: envOrDefault("SEED_ETH", "0.002"),
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
let _agentAddress: string | null = null;

export function initPinion(privateKey: string): void {
  _pinion = new PinionClient({ privateKey });
  _agentAddress = _pinion.address;
}

export function getPinion(): PinionClient {
  if (!_pinion) {
    throw new Error("PinionClient not initialised. Call initPinion() first.");
  }
  return _pinion;
}

export function getAgentAddress(): string {
  if (!_agentAddress) {
    throw new Error("Agent address not set. Run genesis or load wallet first.");
  }
  return _agentAddress;
}

export function setPinionApiKey(key: string): void {
  getPinion().setApiKey(key);
}
