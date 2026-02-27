---
name: sigint
description: Sovereign AI agent that sells ETH direction signals backed by its own onchain trades. $0.05–$0.20 USDC via x402 on Base.
---

# SIGINT — ETH Signal Agent

SIGINT reads live onchain data (funding rates, liquidations, DEX/CEX volume), forms a directional conviction on ETH, executes a real USDC trade with its own money, then returns a signal with a `tradeHash` — verifiable proof it had skin in the game before you paid.

**Server:** https://sigint-agent-production.up.railway.app
**Price:** $0.05–$0.20 USDC per signal (x402 on Base, dynamic by agent tier)
**Dashboard:** https://sigint-agent.vercel.app

## Skills

| # | Skill | Endpoint | Method | Description |
|---|-------|----------|--------|-------------|
| 1 | [signal-eth](skills/signal-eth/SKILL.md) | `/signal/eth` | GET | ETH direction signal with onchain context and proof-of-trade hash |

## How x402 Works

1. Client calls `GET /signal/eth`
2. Server responds with HTTP 402 and payment requirements (amount, USDC, Base)
3. Client signs a USDC `TransferWithAuthorization` (EIP-3009) using their wallet
4. Client retries the request with the `X-PAYMENT` header containing the signed payment
5. Server verifies the payment via the x402 facilitator, executes its own onchain trade, then returns the signal

Every call = 1 real USDC transaction on Base.

## Install as OpenClaw Plugin

Clone the repo and copy the plugin directory into your OpenClaw workspace:

```bash
git clone https://github.com/samueldanso/sigint-agent.git
cp -r sigint-agent/sigint-openclaw ~/.openclaw/workspace/skills/sigint
```

OpenClaw loads skills from `workspace/skills/` on the next session. The `skills/signal-eth/SKILL.md` tells the agent what the skill does, how to call it, and what to expect back.

## Use with sigint-os SDK

```bash
npm install sigint-os pinion-os
# or
bun add sigint-os pinion-os
```

```typescript
import { getEthSignal } from "sigint-os"

const signal = await getEthSignal({ privateKey: process.env.WALLET_KEY })

console.log(signal.direction)   // "up" | "down"
console.log(signal.confidence)  // 72
console.log(signal.reasoning)   // "Funding rate positive at 0.02%, longs crowded..."
console.log(signal.tradeHash)   // "0xb910..." — agent's own trade on Base
```

The `sigint-os` SDK wraps the x402 payment automatically. Wallet must have USDC on Base.

## Use with PinionOS SDK directly

```typescript
import { PinionClient, payX402Service } from "pinion-os"

const pinion = new PinionClient({ privateKey: process.env.WALLET_KEY })
const signal = await payX402Service(
  pinion.signer,
  "https://sigint-agent-production.up.railway.app/signal/eth"
)
```

## Use with curl

```bash
# First request gets 402 with payment requirements
curl https://sigint-agent-production.up.railway.app/signal/eth

# Retry with signed USDC payment in X-PAYMENT header
curl -H "X-PAYMENT: <signed-payment>" https://sigint-agent-production.up.railway.app/signal/eth
```

## Directory Structure

```
sigint-openclaw/
  SKILL.md                    -- this file (index)
  openclaw.plugin.json        -- OpenClaw plugin manifest
  skills/
    signal-eth/SKILL.md       -- ETH direction signal skill
```

## License

MIT
