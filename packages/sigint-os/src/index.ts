import { PinionClient, payX402Service } from "pinion-os";

const SIGINT_ENDPOINT =
	"https://sigint-agent-production.up.railway.app/signal/eth";

export interface Signal {
	direction: "up" | "down";
	confidence: number;
	currentPrice: number;
	resolveAt: number;
	reasoning: string;
	tradeHash: string | null;
	onchainContext: {
		fundingRate: number;
		liquidationBias: "long-heavy" | "short-heavy" | "balanced";
		dexCexVolumeRatio: number;
	};
	trackRecord: {
		correct: number;
		total: number;
		tradePnl: number;
	};
}

export interface SigintOptions {
	/** Hex private key (0x...) of a wallet with USDC on Base */
	privateKey: string;
	/** Override signal endpoint (defaults to live SIGINT agent) */
	endpoint?: string;
}

/**
 * Get an ETH direction signal from the SIGINT agent.
 * Automatically pays $0.05–$0.20 USDC via x402.
 *
 * @example
 * const signal = await getEthSignal({ privateKey: process.env.WALLET_KEY })
 * console.log(signal.direction) // "up" | "down"
 * console.log(signal.tradeHash) // agent's on-chain trade, verified before response
 */
export async function getEthSignal(options: SigintOptions): Promise<Signal> {
	const pinion = new PinionClient({ privateKey: options.privateKey });
	const endpoint = options.endpoint ?? SIGINT_ENDPOINT;
	const response = await payX402Service(pinion.signer, endpoint);
	return response as Signal;
}

/**
 * Reusable client for repeated signal calls.
 *
 * @example
 * const sigint = new SigintClient({ privateKey: process.env.WALLET_KEY })
 * const signal = await sigint.getSignal()
 */
export class SigintClient {
	private pinion: PinionClient;
	private endpoint: string;

	constructor(options: SigintOptions) {
		this.pinion = new PinionClient({ privateKey: options.privateKey });
		this.endpoint = options.endpoint ?? SIGINT_ENDPOINT;
	}

	async getSignal(): Promise<Signal> {
		const response = await payX402Service(this.pinion.signer, this.endpoint);
		return response as Signal;
	}
}
