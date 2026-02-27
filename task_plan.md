# Task Plan: SIGINT v3 Implementation

## Goal
Implement all v3 features from `docs/sigint-v3-spec.md` in 3 phases — backend core, frontend experience, frontend polish. Commit after each phase passes.

## Phase 1: Backend Core
- [x] 1.1: Create `src/agent/identity.ts` — PERSONA constant
- [x] 1.2: Update `src/signal/compose.ts` — import PERSONA + inject last 5 signals track record
- [x] 1.3: Update `src/events/registry.ts` — circular history buffer (50 events), replay on SSE connect
- [x] 1.4: Update boot sequence — emit monologue SSE events, ASCII banner for CLI
- [x] 1.5: Update resolution — store + display price delta magnitude

## Phase 2: Frontend Experience
- [x] 2.1: Entry gate screen — pure black, SIGINT logo/mark, orange ENTER button
- [x] 2.2: Boot terminal screen — orange monospace text types out line-by-line, skip button
- [x] 2.3: Dashboard layout refresh — unified buyer + agent view per spec
- [x] 2.4: Signal magnitude display in feed — show delta `UP ✓ +1.2%` format
- [x] 2.5: SSE history replay integration — works out of box with backend replay

## Phase 3: Frontend Polish
- [x] 3.1: GSAP typewriter for monologue feed
- [x] 3.2: Three.js particle/grid background
- [x] 3.3: Recharts — track record bar chart with delta
- [x] 3.4: Sound design — keyboard sounds, click feedback via Web Audio API

## Current
**Working on**: Complete
**Status**: All 3 phases implemented. Backend + frontend typecheck clean. Frontend build passes.

## Decisions
- Commit after each phase passes typecheck + diagnostics
- No Co-Authored-By in commit messages

## Errors
- (none yet)
