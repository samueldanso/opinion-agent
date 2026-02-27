# SIGINT — Overview

## What Is SIGINT?

SIGINT is a sovereign AI agent that operates its own market signal business, entirely on-chain, without human intervention.

It reads live on-chain market data every hour — ETH price, funding rates, liquidation levels, DEX/CEX volume ratio — forms a directional conviction, executes a real USDC trade with its own capital as a commitment, then sells the signal via an x402-paywalled endpoint. Every signal includes a `tradeHash`: verifiable proof the agent had skin in the game before you paid.

Revenue flows directly into the agent's wallet. Every PinionOS skill call costs $0.01 USDC. Every trade costs $0.50 USDC. The agent earns to survive, spends to operate, and either builds a profitable track record or dies when the wallet runs out.

The track record is public and permanent.

---

## The Problem

Crypto markets reward research. Almost no one has the time, tools, or discipline to do it consistently.

The edge comes from reading on-chain positioning — funding rates, liquidation pressure, market structure — before forming a view. Professional traders do this. For everyone else:

- **Time** — thorough on-chain research takes hours per cycle
- **Consistency** — humans cut corners, miss signals, make assumptions
- **No skin in the game** — anyone can publish a take; nobody is accountable for being wrong

The result: unverifiable opinions with no consequence. SIGINT changes that. Every call it sells was backed with its own money first.

---

## The Solution

SIGINT is not a tool you call. It is an economic operator.

| Property | Description |
|---|---|
| **Sovereign** | No human approves its signals. It reads data and decides. |
| **Accountable** | Every signal is backed with a real on-chain trade before it reaches the buyer |
| **Transparent** | Wallet, trades, earn/spend ratio, and reasoning are all public |
| **Self-funding** | Earns USDC from signal sales, spends USDC on data and compute |
| **Machine-native** | Accepts payment via x402 — any agent with USDC can call it |

---

## Agent Lifecycle

### 1. BOOT (once)

On first run, if no wallet exists, the agent runs genesis:

```
Creator provides PINION_PRIVATE_KEY (funded wallet)
  └─ skills.wallet()        → generate sovereign identity (address + key)
  └─ skills.send()          → construct funding tx ($5 USDC + 0.001 ETH)
  └─ skills.broadcast()     → execute funding tx on Base
  └─ Save wallet to data/wallet.json (chmod 600)
```

On subsequent runs (or Railway redeploy):
```
AGENT_PRIVATE_KEY env var → restore wallet from plain hex key
  └─ Reconstruct wallet.json without re-running genesis
  └─ Existing USDC balance preserved
```

### 2. OBSERVE (every hour)

```
skills.price("ETH")         $0.01  → price + 24h change
Coinglass funding API       free   → 8h funding rate + open interest
Coinglass liquidations API  free   → 24h long/short liquidation volumes
DeFiLlama volume API        free   → DEX + CEX 24h volume
```

All data serialised and stored in `price_log`.

### 3. RESOLVE (every hour)

Find all signals where `resolveAt ≤ now` and `resolvedAt IS NULL`:

```
skills.price("ETH")  $0.01  → current ETH price

For each pending signal:
  direction == "up"   → correct if currentPrice > signalPrice
  direction == "down" → correct if currentPrice < signalPrice

Update signal: resolvedAt, resolvedPrice, correct (0 or 1)
Update trade:  resolvedPnl = tradeAmountUSDC × (priceResolution/priceAtTrade − 1)
Emit signal_resolved SSE event
```

Resolution is purely directional. Any movement in the predicted direction counts. No threshold.

### 4. ON SIGNAL PURCHASE (on demand)

This is triggered when a buyer pays via x402:

```
1. Gather onchain context:
   skills.price()              $0.01  → latest ETH price
   Coinglass + DeFiLlama       free   → funding, liquidations, volume

2. Load context:
   Last 24 price_log entries          → price history
   Last 5 resolved signals            → track record

3. Reason:
   skills.chat(signalPrompt)   $0.01  → direction + confidence + reasoning

4. Commit:
   skills.trade("USDC","ETH","0.5")  $0.01  → unsigned 1inch swap tx
   skills.broadcast(tx)              $0.01  → execute on Base
   skills.tx(txHash)                 $0.01  → verify trade landed

5. Persist:
   insertSignal(db, ...)
   insertTrade(db, ...)

6. Respond to buyer:
   { direction, confidence, currentPrice, resolveAt, reasoning,
     tradeHash, onchainContext, trackRecord }
```

**Cost per signal generated: ~$0.05 USDC + $0.50 USDC trade = $0.55 USDC**

### 5. ADAPT (every hour)

```
Recalculate earn/spend ratio
If ratio tier changed → adjust signal price + emit price_adjusted

If ratio >= 1.0 AND milestone not yet sent:
  skills.send(agentAddress, "0.01", "USDC")   → construct proof tx
  skills.broadcast(tx)                         → execute on Base
  Emit milestone event with txHash

If totalEarned >= $100 AND not yet unlocked:
  skills.unlimited()      → purchase unlimited key ($100 USDC)
  pinion.setApiKey(key)   → all future skill calls free
```

### 6. SURVIVE OR DIE

- Wallet hits zero → agent halts permanently
- Track record is public and permanent on-chain

---

## Survival Model

The earn/spend ratio is the core metric. Signal price adjusts automatically each hour:

| Tier | Ratio | Signal Price | What It Means |
|---|---|---|---|
| **Starving** | < 0.5 | $0.05 | Spending 2× what it earns |
| **Surviving** | 0.5–1.0 | $0.10 | Approaching breakeven |
| **Breaking Even** | 1.0–1.5 | $0.10 | Profitable — thesis proven |
| **Thriving** | ≥ 1.5 | $0.15 | Consistently profitable |
| **Flush** | earned ≥ $50 | $0.20 | Abundant capital |

**At $100 lifetime earnings:** `skills.unlimited()` auto-triggered — all future PinionOS skill calls become free, dramatically improving unit economics.

### Daily Burn Rate

| Activity | Cost |
|---|---|
| Hourly price fetch | $0.01 |
| 2× balance checks per cycle | $0.02 |
| Resolution price fetch (each) | $0.01 |
| **Base burn (no signals)** | **~$0.72/day** |
| Per signal generated | $0.05 + $0.50 trade |

**Breakeven signal count:** ~15 signals/day at $0.05 price (Starving tier)

---

## PinionOS SDK Coverage

All 9 paid PinionOS skills are used. Every call is justified:

| Skill | Cost | Used In | Purpose |
|---|---|---|---|
| `skills.wallet()` | $0.01 | Genesis | Generate sovereign identity |
| `skills.fund()` | $0.01 | Genesis | Boot balance check + funding instructions |
| `skills.price("ETH")` | $0.01 | Loop, signal, resolution | Price data at every critical point |
| `skills.balance(addr)` | $0.01 | Boot, post-trade | Wallet health check |
| `skills.chat(prompt)` | $0.01 | Signal generation | Onchain context → directional signal |
| `skills.trade(src,dst,amt)` | $0.01 | Signal generation | Construct $0.50 USDC swap tx |
| `skills.broadcast(tx)` | $0.01 | Signal gen + milestone | Execute trades on Base |
| `skills.tx(hash)` | $0.01 | Signal generation | Verify trade landed (not hallucinated) |
| `skills.send(to,amt,token)` | $0.01 | Milestone | Construct proof-of-survival tx |
| `skills.unlimited()` | $100 USDC | At $100 earned | Purchase unlimited key |

Plus server-side:
- `createSkillServer` + `skill()` — agent's x402 revenue endpoint
- `payX402Service` — buyer integration pattern

---

## External Data Sources

| Source | API | Data | Cost |
|---|---|---|---|
| PinionOS Birdeye | `skills.price("ETH")` | Price + 24h change | $0.01 USDC |
| Coinglass | `open-api.coinglass.com/public/v2/funding` | 8h funding rate, open interest | Free |
| Coinglass | `open-api.coinglass.com/public/v2/liquidation` | 24h long/short liquidations | Free |
| DeFiLlama | `api.llama.fi/overview/dexs/ethereum` | DEX 24h volume | Free |
| DeFiLlama | `api.llama.fi/overview/dexs` | CEX 24h volume | Free |

**Liquidation bias logic:**
- `long-heavy`: long liquidations > 60% of total
- `short-heavy`: long liquidations < 40% of total
- `balanced`: everything else
