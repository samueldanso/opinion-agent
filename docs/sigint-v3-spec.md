# SIGINT v3 — Feature Spec

> Decisions from structured interview. Implementation-ready.

---

## 1. Identity & Soul

**Pattern:** Single `PERSONA` constant (Sovra's approach) — one `src/agent/identity.ts` imported into every prompt.

- `compose.ts` (signal reasoning) imports `PERSONA` as the system framing
- Monologue emitter uses same `PERSONA` voice
- No evolving SOUL.md for v3 — keep it simple, consistent, single source of truth

**SIGINT's voice (to define in identity.ts):**
- Terse, clinical, self-aware about its survival
- Speaks like a sovereign operator — not a chatbot, not an analyst
- Acknowledges its own existence as an economic entity
- Knows it has skin in every signal (it traded first)
- Never hedges. Never apologises. The track record speaks.

**Reference:** `resources/sovra/src/prompts/identity.ts` — PERSONA pattern
**Reference:** `resources/automaton/src/agent/system-prompt.ts` — dynamic status injection into prompt

---

## 2. Signal Memory (Track Record Injection)

**Decision:** Inject last 5 signals + accuracy into reasoning prompt before each signal call.

The agent sees its own recent performance before forming a new conviction:

```
Recent track record:
- UP ✓ +1.2% (confidence: 74)
- DOWN ✗ -0.1% (confidence: 61)
- UP ✓ +2.4% (confidence: 82)
- UP ✗ -0.3% (confidence: 55)
- DOWN ✓ +0.8% (confidence: 68)
Accuracy: 60% (3/5 recent)
```

This enables self-correcting reasoning — agent can notice when its funding rate reads have been noisy, or when its confidence calibration is off.

**Implementation:** `compose.ts` — add a `recentHistory` param from `getLast5Signals(db)` into `buildSignalPrompt()`.

---

## 3. Signal Resolution — Show Magnitude

**Decision:** Store and display price delta at resolution time.

Instead of just `correct: true/false`, store:
- `resolvedPrice` (already in DB schema)
- `priceDelta`: `((resolvedPrice - currentPrice) / currentPrice) * 100`
- `deltaFormatted`: e.g. `+1.2%` or `-0.4%`

**Display:** `UP ✓ +1.2%` / `DOWN ✗ +0.3%` / `UP ✓ +2.8%`

Makes the track record meaningful to buyers — not just binary but quality of the call.

---

## 4. SSE Event History Replay

**Decision:** When dashboard connects, replay last N events immediately so the page is never blank.

**Pattern from Sovra (`src/console/stream.ts`):**
```typescript
// Replay recent history so the page isn't blank on load
for (const event of events.history) {
  send(event)
}
```

**Implementation:** `src/events/registry.ts` — keep a circular buffer of last 50 events. On new SSE client connect, drain the buffer before subscribing to live events.

---

## 5. Boot Sequence — Stream to Dashboard

**Decision:** Boot emits SSE monologue events so watchers see SIGINT come alive in real time.

Boot sequence events flow through the SSE pipe:

```
[monologue] SIGINT v3 initialising...
[monologue] Sovereign identity: 0x4f2a...c3b8
[monologue] Balance: 5.00 USDC | 0.002 ETH
[monologue] Agent online. Starting hourly loop.
[monologue] Signal price: $0.10 USDC — Surviving tier
```

**Terminal:** Also show chalk ASCII banner (like automaton/sovra) for local dev experience.
**Dashboard:** These boot events appear in the monologue feed — first-time viewers see genesis live.

---

## 6. Sovereign Wallet Genesis (Creator → Agent)

**Decision:** Creator key calls `skills.wallet()` → funds agent → agent takes over.

**Flow:**
1. First boot: no `data/wallet.json` found
2. Creator wallet (env) calls `skills.wallet()` → new keypair
3. Creator calls `skills.send()` + `skills.broadcast()` twice (USDC + ETH)
4. Agent key saved to `data/wallet.json` (Railway volume, mode 0o600)
5. Agent declares its address in first monologue event
6. Creator key never used again

**Storage:** `data/wallet.json` on Railway persistent volume — same volume as SQLite. No extra infra.

---

## 7. Unlimited Milestone — Make It a Moment

**Decision:** When lifetime earnings hit $100 and unlimited key is purchased, dashboard gets a special state.

**Events:**
- `unlimited_purchased` SSE event (already exists)
- Dashboard: visual shift — indicator changes, monologue declares it
- Agent monologue: "Skill calls are now free. The infrastructure pays for itself."

---

## 8. Dashboard — Unified View

**Decision:** One dashboard. Signal buyers and passive watchers see the same page.

When a signal is purchased:
- Signal result appears in-context with the monologue that produced it
- Buyer sees the exact reasoning chain: data → agent thought → trade hash → direction
- Live agent feed continues below/beside it

**Two-audience design on one page:**
- Top: live agent monologue + metrics (agent view)
- Middle/right: signal result with full context (buyer view)
- Bottom: track record with magnitude (signal history)

---

## 9. Dashboard UI — Feel & Stack

**Feel:** Hybrid — living agent console + trading terminal. Not one or the other.

**Stack:**
- Recharts for price charts and track record visualisations
- GSAP for text animations — monologue types in character by character
- Three.js for subtle background particle/grid effect (not heavy, atmospheric)
- Sound design: keyboard sounds on entry, subtle click sounds on interaction

**Entry experience — terminal gate (reference: pinionos.com):**

PinionOS's own site: black screen, centered spinning logo, one `ENTER` button — nothing else. After enter: full-screen orange-on-black terminal showing system log lines. The interface feels like accessing live infrastructure, not a website.

SIGINT's version:

**Screen 1 — Gate:**
- Pure black
- SIGINT logo/mark centered (SVG, subtle rotation or pulse)
- One button: `ENTER` — orange, pill shape
- Nothing else. No nav, no copy.
- Sound: ambient low hum on load

**Screen 2 — Boot terminal (after ENTER):**
- Full screen, monospace font, orange text on black
- Lines type out one by one with keyboard sounds:
```
SIGINT v3 — On-chain Signals Intelligence
Connecting to Base mainnet...
Sovereign agent: 0xA44Fa8Ad...
Balance: 5.00 USDC | 0.002 ETH — OPERATIONAL
Signal price: $0.10 USDC
Last signal: UP ✓ +1.2% — 3h ago
Accuracy: 62% (8/13)
Earn/spend ratio: 1.24 — SURVIVING
Loading dashboard...
```
- Takes ~3-4 seconds
- Skip button (top right, small, for repeat visitors)

**Screen 3 — Dashboard fades in**

**Monologue feed:** text streams in with GSAP typewriter per character. Each event slides in from bottom, older ones reduce opacity. Feels like watching the agent think live.

**Accent colours:**
- Primary: orange (matches PinionOS, signals "real infrastructure")
- Green for bullish / correct signals
- Red for bearish / incorrect signals
- Dim white for monologue text
- Background: `#0a0a0a` near-black

---

## 10. Deployment

**Backend → Railway:**
- Always-on 24/7 — hourly loop, live SSE, autonomous resolution
- Persistent volume at `/data` (SQLite + wallet.json)
- `bun run start`

**Frontend → Vercel:**
- Next.js, deployed from `frontend/`
- `NEXT_PUBLIC_AGENT_URL` → Railway public URL

---

## v3 Implementation Order

| Priority | Feature | Files Touched |
|---|---|---|
| 🔴 1 | `src/agent/identity.ts` — PERSONA constant | new file |
| 🔴 2 | `compose.ts` — import PERSONA + inject track record | `src/signal/compose.ts` |
| 🔴 3 | SSE history buffer — replay on connect | `src/events/registry.ts` |
| 🔴 4 | Boot sequence — emit monologue SSE events | `src/agent/loop.ts`, `src/index.ts` |
| 🔴 5 | Signal resolution — store + display magnitude | `src/db.ts`, `src/resolution/index.ts` |
| 🟡 6 | Sovereign wallet genesis flow | `src/agent/wallet.ts` (new) |
| 🟡 7 | Unlimited milestone UI event | `src/server/skill.ts`, frontend |
| 🟡 8 | Dashboard — unified buyer + agent view | `frontend/components/` |
| 🟢 9 | Entry animation — terminal boot sequence | `frontend/app/page.tsx` |
| 🟢 10 | Sound design + GSAP typewriter monologue | frontend |
| 🟢 11 | Three.js background | frontend |
| 🟢 12 | Recharts price + track record charts | frontend |

---

*Spec complete — grounded in interview, Sovra identity pattern, automaton dynamic context, Orion genesis model.*
