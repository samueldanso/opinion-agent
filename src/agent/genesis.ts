import fs from "node:fs";
import path from "node:path";
import { PinionClient } from "pinion-os";
import { say } from "./monologue";

const WALLET_PATH = path.resolve("data/wallet.json");

interface WalletData {
  privateKey: string;
  address: string;
  bornAt: number;
  creatorAddress: string;
}

export function hasWallet(): boolean {
  if (fs.existsSync(WALLET_PATH)) return true;

  // Railway/production: restore wallet from a plain private key env var
  const agentKey = process.env.AGENT_PRIVATE_KEY;
  if (agentKey) {
    const pinion = new PinionClient({ privateKey: agentKey });
    const walletData: WalletData = {
      privateKey: agentKey,
      address: pinion.address,
      bornAt: Date.now(),
      creatorAddress: "restored-from-env",
    };
    fs.mkdirSync(path.dirname(WALLET_PATH), { recursive: true });
    fs.writeFileSync(WALLET_PATH, JSON.stringify(walletData), { mode: 0o600 });
    return true;
  }

  return false;
}

export function loadWallet(): WalletData {
  const raw = fs.readFileSync(WALLET_PATH, "utf-8");
  return JSON.parse(raw) as WalletData;
}

export async function runGenesis(creatorKey: string, seedUsdc: string, seedEth: string): Promise<WalletData> {
  say("GENESIS — No agent wallet found. Spawning sovereign identity...");

  const creator = new PinionClient({ privateKey: creatorKey });
  say(`Creator: ${creator.address}`);

  say("Generating agent keypair via skills.wallet()...");
  const walletResult = await creator.skills.wallet();

  if (walletResult.status !== 200 || !walletResult.data?.address) {
    const errMsg = (walletResult.data as { error?: string })?.error ?? `HTTP ${walletResult.status}`;
    throw new Error(`Genesis wallet generation failed: ${errMsg}`);
  }

  const agentAddress = walletResult.data.address as string;
  const agentKey = walletResult.data.privateKey as string;
  say(`Agent born: ${agentAddress}`);

  say(`Funding agent with ${seedUsdc} USDC...`);
  const sendUsdc = await creator.skills.send(agentAddress, seedUsdc, "USDC");
  if (sendUsdc.status !== 200 || !sendUsdc.data?.tx) {
    const errMsg = (sendUsdc.data as { error?: string })?.error ?? `HTTP ${sendUsdc.status}`;
    throw new Error(`Genesis USDC send failed: ${errMsg}`);
  }

  const broadcastUsdc = await creator.skills.broadcast(sendUsdc.data.tx);
  if (broadcastUsdc.status !== 200 || !broadcastUsdc.data?.txHash) {
    const errMsg = (broadcastUsdc.data as { error?: string })?.error ?? `HTTP ${broadcastUsdc.status}`;
    throw new Error(`Genesis USDC broadcast failed: ${errMsg}`);
  }
  say(`USDC funded: ${broadcastUsdc.data.txHash}`);

  say(`Funding agent with ${seedEth} ETH for gas...`);
  const sendEth = await creator.skills.send(agentAddress, seedEth, "ETH");
  if (sendEth.status !== 200 || !sendEth.data?.tx) {
    const errMsg = (sendEth.data as { error?: string })?.error ?? `HTTP ${sendEth.status}`;
    throw new Error(`Genesis ETH send failed: ${errMsg}`);
  }

  const broadcastEth = await creator.skills.broadcast(sendEth.data.tx);
  if (broadcastEth.status !== 200 || !broadcastEth.data?.txHash) {
    const errMsg = (broadcastEth.data as { error?: string })?.error ?? `HTTP ${broadcastEth.status}`;
    throw new Error(`Genesis ETH broadcast failed: ${errMsg}`);
  }
  say(`ETH funded: ${broadcastEth.data.txHash}`);

  const walletData: WalletData = {
    privateKey: agentKey,
    address: agentAddress,
    bornAt: Date.now(),
    creatorAddress: creator.address,
  };

  fs.mkdirSync(path.dirname(WALLET_PATH), { recursive: true });
  fs.writeFileSync(WALLET_PATH, JSON.stringify(walletData, null, 2), { mode: 0o600 });
  say(`Wallet saved: ${WALLET_PATH}`);

  say("GENESIS COMPLETE — Agent is sovereign.");
  return walletData;
}
