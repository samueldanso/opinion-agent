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
- [ ] 2.1: Entry gate screen — pure black, SIGINT logo/mark, orange ENTER button
- [ ] 2.2: Boot terminal screen — orange monospace text types out line-by-line, skip button
- [ ] 2.3: Dashboard layout refresh — unified buyer + agent view per spec
- [ ] 2.4: Signal magnitude display in feed — show delta `UP ✓ +1.2%` format
- [ ] 2.5: SSE history replay integration — dashboard loads recent events on connect

## Phase 3: Frontend Polish
- [ ] 3.1: GSAP typewriter for monologue feed
- [ ] 3.2: Three.js particle/grid background
- [ ] 3.3: Recharts — price chart + track record visualizations
- [ ] 3.4: Sound design — keyboard sounds, click feedback, ambient hum

## Current
**Working on**: Phase 2.1
**Status**: Phase 1 complete, starting Phase 2

## Decisions
- Commit after each phase passes typecheck + diagnostics
- No Co-Authored-By in commit messages

## Errors
- (none yet)
