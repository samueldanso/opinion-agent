# sigint-os

Client SDK for [SIGINT](https://sigint-agent.vercel.app) — the autonomous ETH signal agent.

SIGINT reads live on-chain data (funding rates, liquidations, DEX/CEX volume), forms a directional conviction on ETH, executes a real USDC trade with its own money, then returns the signal with a `tradeHash` — verifiable proof it had skin in the game before you paid.

Every call costs $0.05–$0.20 USDC via [x402](https://www.x402.org), paid automatically.

---

## Install

```bash
npm install sigint-os pinion-os
# or
bun add sigint-os pinion-os
```

Requires a wallet with **USDC on Base** for the x402 payment.

---

## Usage

### One-liner

```typescript
import { getEthSignal } from "sigint-os"

const signal = await getEthSignal({
  privateKey: process.env.WALLET_KEY  // wallet with USDC on Base
})

console.log(signal.direction)    // "up" | "down"
console.log(signal.confidence)   // 72
console.log(signal.reasoning)    // "Funding rate positive at 0.02%, longs crowded..."
console.log(signal.tradeHash)    // "0xb910..." — agent's own trade on Base
```

### Reusable client

```typescript
import { SigintClient } from "sigint-os"

const sigint = new SigintClient({ privateKey: process.env.WALLET_KEY })

// Call as many times as you need
const signal = await sigint.getSignal()
```

### With PinionOS directly (no SDK)

```typescript
import { PinionClient, payX402Service } from "pinion-os"

const pinion = new PinionClient({ privateKey: process.env.WALLET_KEY })
const signal = await payX402Service(
  pinion.signer,
  "https://sigint-agent-production.up.railway.app/signal/eth"
)
```

---

## Signal Response

```typescript
{
  direction: "up" | "down",          // ETH price direction prediction
  confidence: number,                 // 0–100
  currentPrice: number,               // ETH price at signal formation
  resolveAt: number,                  // UNIX ms — when prediction resolves (1h)
  reasoning: string,                  // agent's on-chain analysis
  tradeHash: string | null,           // agent's own trade hash (verify on Basescan)
  onchainContext: {
    fundingRate: number,              // 8h funding rate (%)
    liquidationBias: string,          // "long-heavy" | "short-heavy" | "balanced"
    dexCexVolumeRatio: number         // DEX vol / CEX vol
  },
  trackRecord: {
    correct: number,                  // count of correct resolved signals
    total: number,                    // count of all resolved signals
    tradePnl: number                  // agent's cumulative trade PnL in USDC
  }
}
```

The `tradeHash` is verifiable on [Basescan](https://basescan.org) — the agent executed a real USDC → ETH swap **before** generating this response.

---

## How It Works

1. You call `getEthSignal()` — your wallet pays $0.05–$0.20 USDC via x402
2. SIGINT fetches live on-chain context (price, funding, liquidations, volume)
3. SIGINT reasons with `skills.chat()` → forms direction + confidence
4. SIGINT executes its own $0.50 USDC → ETH trade on 1inch (before responding)
5. Signal returned with `tradeHash` — the agent committed first

---

## Live Agent

- **Dashboard:** [sigint-agent.vercel.app](https://sigint-agent.vercel.app)
- **Wallet:** [`0x9fe05351902e13c341e54f681e9541790efbe9b9`](https://basescan.org/address/0x9fe05351902e13c341e54f681e9541790efbe9b9)
- **x402scan:** [x402scan.com/server/effc53a3...](https://www.x402scan.com/server/effc53a3-3235-48d5-a054-81c80b01bad2)

---

## License

MIT
