import express from "express";
import { privateKeyToAccount } from "viem/accounts";
import { getCurrentSignalPrice, say } from "../agent";
import { getMonologueHistory } from "../agent/monologue";
import { config, getAgentAddress } from "../config";
import {
	getAccuracy,
	getAllSignals,
	getAllTrades,
	getDb,
	getTotalEarned,
	getTotalTradePnl,
} from "../db";
import { getEconomicState } from "../economics";
import { addClient, getClientCount } from "../events";

const ORIGIN = "https://sigint-agent-production.up.railway.app";
const SIGNAL_ENDPOINT = `${ORIGIN}/signal/eth`;

async function buildOwnershipProof(): Promise<string | null> {
	const key = process.env.AGENT_PRIVATE_KEY ?? process.env.PINION_PRIVATE_KEY;
	if (!key) return null;
	try {
		const account = privateKeyToAccount(key as `0x${string}`);
		return await account.signMessage({ message: ORIGIN });
	} catch {
		return null;
	}
}

export async function startApiServer(): Promise<void> {
	const app = express();
	const ownershipProof = await buildOwnershipProof();

	app.use((_req, res, next) => {
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
		res.setHeader("Access-Control-Allow-Headers", "Content-Type");
		next();
	});

	app.get("/events", (req, res) => {
		addClient(res);
		req.on("close", () => {});
	});

	app.get("/status", (_req, res) => {
		const db = getDb();
		const { correct, total } = getAccuracy(db);
		const accuracy = total > 0 ? (correct / total) * 100 : 0;
		const totalEarned = getTotalEarned(db);
		const tradePnl = getTotalTradePnl(db);
		const state = getEconomicState(0);

		res.json({
			address: getAgentAddress(),
			accuracy,
			correct,
			total,
			totalEarned,
			totalSpent: state.totalSpent,
			tradePnl,
			ratio: state.ratio,
			tier: state.tier,
			signalPrice: getCurrentSignalPrice(),
			unlimitedProgress: state.unlimitedProgress,
			clients: getClientCount(),
			monologueHistory: getMonologueHistory(),
		});
	});

	app.get("/signals", (_req, res) => {
		const db = getDb();
		const signals = getAllSignals(db, 100);
		const trades = getAllTrades(db, 100);
		res.json({ signals, trades });
	});

	app.get("/.well-known/x402", (_req, res) => {
		const doc: {
			version: number;
			resources: string[];
			ownershipProofs?: string[];
			instructions: string;
		} = {
			version: 1,
			resources: [SIGNAL_ENDPOINT],
			instructions:
				"# SIGINT — On-chain Signals Intelligence\n\nSIGINT is a sovereign AI that generates ETH price direction signals, backs each call with a real on-chain trade, and sells them via x402 micropayments.\n\n## Signal endpoint\n\n`GET /signal/eth` — $0.10 USDC on Base\n\nEvery response includes a `tradeHash` — verifiable proof the agent had skin in the game before you paid.\n\n## Agent wallet\n\n`0x9fe05351902e13c341e54f681e9541790efbe9b9` — all activity on-chain and verifiable on BaseScan.\n\n## Dashboard\n\nhttps://sigint-agent.vercel.app",
		};

		if (ownershipProof) {
			doc.ownershipProofs = [ownershipProof];
		}

		res.json(doc);
	});

	// Proxy x402 skill server so both ports are reachable from one Railway domain
	app.all("/signal/*", async (req, res) => {
		try {
			const target = `http://localhost:${config.ports.skill}${req.path}`;
			const headers: Record<string, string> = { Accept: "application/json" };
			if (req.headers["x-payment"])
				headers["x-payment"] = req.headers["x-payment"] as string;

			const upstream = await fetch(target, { method: req.method, headers });

			upstream.headers.forEach((val, key) => {
				if (key.toLowerCase() !== "transfer-encoding") res.setHeader(key, val);
			});
			res.status(upstream.status).send(await upstream.text());
		} catch {
			res.status(502).json({ error: "Skill server unreachable" });
		}
	});

	const port = Number(process.env.PORT) || config.ports.api;
	app.listen(port, () => {
		say(`API/SSE server on port ${port}`);
	});
}
