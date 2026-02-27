# PinionOS Hackathon — Reference Document

## Overview

The first PinionOS hackathon. **$2,750 in prizes. 1 week to build.**

PinionOS is an infrastructure layer for autonomous AI agents that need to make and receive payments on-chain — without any human involvement. Think of it as giving your AI agent a wallet, a set of on-chain skills, and an automatic payment system all in one SDK.

---

## Timeline

- **Start:** February 22, 2026
- **Deadline:** March 1, 2026
- **Winners announced:** March 2, 2026

---

## Prizes

| Place | Prize |
|-------|-------|
| 1st | $1,500 |
| 2nd | $750 |
| 3rd | $500 |
| **Total** | **$2,750** |

---

## Eligibility & Requirements

- Anyone can join — solo builders or teams
- Build using PinionOS infrastructure
- Mention `@PinionOS` on X when you submit
- No restrictions on what you ship — if it runs on PinionOS, it counts

---

## Judging Criteria

- **Creativity** — Is this a novel use of PinionOS?
- **Functionality** — Does it work?
- **Completeness** — Is it usable, not just a concept?
- **Code quality** — Clean, readable, well-structured

---

## Links

| Resource | URL |
|----------|-----|
| Website | https://pinionos.com/ |
| Docs (Overview) | https://pinionos.com/os/overview |
| Docs (Developers) | https://pinionos.com/os/developers |
| GitHub | https://github.com/chu2bard/pinion-os |
| npm package | https://www.npmjs.com/package/pinion-os |
| x402 Server | https://www.x402scan.com/server/49a688db-0234-4609-948c-c3eee1719e5d |
| X/Twitter | https://x.com/PinionOS |

---

## What is PinionOS?

PinionOS is built on **Base** (Coinbase's L2 blockchain) and uses **USDC** as its payment token. It gives AI agents everything they need to operate autonomously on-chain: a wallet, on-chain skills, and an automatic micropayment system via the **x402 protocol**.

### The Stack

```
Your App / Agent / Claude Code
        ↓
   pinion-os SDK (handles x402 payment signing)
        ↓
   PinionOS skill server (verifies payment, returns data)
        ↓
   Base L2 / USDC settlement
```

---

## What is x402?

x402 revives the dormant **HTTP 402 "Payment Required"** status code and turns it into a real autonomous payment protocol.

**Flow:**
1. Your agent calls a paid API endpoint
2. Server responds with HTTP 402 + payment requirements (price, wallet, chain)
3. SDK **automatically signs a USDC payment** using your private key (EIP-3009)
4. Request retried with `X-PAYMENT` header containing the signed proof
5. Facilitator verifies and settles payment on-chain
6. Server returns the actual data

Completely stateless — no accounts, no API keys, no credit cards. Just a funded wallet.

---

## The 12 Built-in Skills

Each skill costs a micropayment per call (default ~$0.01 USDC):

| Skill | What it does |
|-------|-------------|
| `balance` | Check ETH/USDC balance of any address |
| `price` | Token price via CoinGecko |
| `tx` | Decode / look up a transaction |
| `wallet` | Generate a new keypair |
| `chat` | AI chat via Anthropic (Claude) |
| `send` | Construct a send transaction |
| `swap` | Token swaps |
| + more | Price feeds, on-chain data, etc. |

---

## Three Integration Modes

1. **npm SDK** — `npm install pinion-os` — for any Node.js app or agent
2. **Claude Code plugin** — 12 tools available inside Claude Code via MCP
   ```
   /plugin install pinion-os
   ```
3. **Skill server framework** — Build, deploy, and monetize your own x402 paywalled endpoints

---

## Unlimited Access (v0.4.0)

Pay **$100 USDC once** via `pinion_unlimited` → receive a `pk_` API key tied to your wallet address. Every future request sends this as `X-API-KEY`, the payment middleware skips per-call charges, and all 12 skills are free forever.

Built for agent fleets: $0.01/call sounds cheap until you're running 10 agents making 10,000 calls/day.

```
pinion_unlimited         → pay $100, receive pk_ key
pinion_unlimited_verify  → verify your key (free)
```

---

## Stripe / Web2 Compatibility

PinionOS v0.4.0 also ships Stripe x402 compatibility — any Stripe-powered API on the internet is now payable in USDC on Base. Web2 and web3 in one SDK, auto-detected, zero config.

---

## Quickstart

```bash
npm install pinion-os
```

You'll need:
- A Base wallet (e.g. from Coinbase)
- USDC on Base (for micropayments, or $100 for unlimited access)
- A private key set in your environment

Claude Code:
```
/plugin install pinion-os
```

---

## Bigger Picture

x402 is a growing standard — Coinbase, Google, Solana, and others are building around it. The core idea: **AI agents should be able to pay for things autonomously**, the same way they make HTTP requests. PinionOS's differentiator is the Base/USDC implementation plus a skill server framework that lets anyone build and monetize their own paywalled AI endpoints.

---

## Hackathon Strategy Notes

Strong submissions will likely:
- Demonstrate a **real, complete use case** (not just a proof of concept)
- Show something **novel** — agents that earn autonomously, agent-to-agent payments, new skill servers others would actually pay for
- Have clean, readable code
- Be actually usable end-to-end

---

*Reference compiled: February 24, 2026*
