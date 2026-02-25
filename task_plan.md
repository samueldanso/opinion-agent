# Task Plan: Scaffold OPINION Project

## Goal

All files, folders, configs, and dependencies in place so `bun run typecheck` passes on backend and pinion-os imports resolve. Frontend already scaffolded by user.

## Features / Steps

- [x] Step 1: Install backend deps at root (`bun install`)
- [x] Step 2: Create all src/ skeleton files with correct types, exports, and pinion-os imports
- [x] Step 3: Verify — `bun run typecheck` passes, pinion-os imports resolve

## Current

**Working on**: Complete
**Status**: done

## Decisions

- bun:sqlite over better-sqlite3: Bun has built-in SQLite, avoids native addon compilation
- Two Express servers (port 4020 + 3001): createSkillServer doesn't expose its app
- express as explicit dep: needed for the SSE/API server on port 3001 (skill server bundles its own)
- Frontend already scaffolded: Next.js 16 + shadcn + Tailwind v4 (user did this)
- Frontend uses app/ not src/app/: following user's existing structure

# MCP Plugins installed by use in claude code and ready to use when needed

- /plugin marketplace add chu2bard/pinion-os
- /plugin install pinion-os

## Errors

(none yet)
