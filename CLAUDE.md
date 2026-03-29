# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

7並べ (Sevens) — a browser-based Japanese card game built with Nuxt 4 + Vue 3 + TypeScript. One human player vs 3 CPU opponents. PWA-enabled with localStorage game state persistence.

## Commands

This project uses **Vite+** (`vp`) as the unified toolchain. Do **not** use `pnpm`, `npm`, or `yarn` directly.

```bash
vp dev          # Start dev server (http://localhost:3000)
vp check        # Format + lint + TypeScript type check
vp check --fix  # Auto-fix lint/format issues
vp test run     # Run all tests
vp test run <pattern>  # Run specific tests (e.g. vp test run rules)
vp build        # Production build
```

> `vp test` (without `run`) starts watch mode. For CI or one-shot validation, always use `vp test run`.

Import test utilities from `vite-plus/test`, not from `vitest` directly:

```ts
import { expect, test, vi } from "vite-plus/test";
```

## Architecture

### Game Logic (`app/game/`)

Pure TypeScript modules with no Vue dependencies — all state transitions are immutable (return new objects):

- **`types/game.ts`** — All type definitions (`Card`, `Board`, `GameState`, `Player`, etc.)
- **`game/constants.ts`** — `SUITS`, `MAX_PASSES`, `INITIAL_RANK`, `PLAYER_COUNT`
- **`game/deck.ts`** — Deck creation, shuffling, dealing; exports `JOKER_CARD` singleton
- **`game/rules.ts`** — `isValidPlay`, `getValidCards`, `getJokerWithCardOptions`, `getValidJokerPositions`
- **`game/state.ts`** — State transition functions: `initGame`, `placeCard`, `placeJoker`, `placeJokerWithCard`, `passTurn`
- **`game/cpu.ts`** — CPU AI decision logic
- **`utils/card.ts`** — `isJokerCard`, `areCardsEqual` helpers

### Vue Layer (`app/`)

- **`composables/useGame.ts`** — Main game composable; bridges pure game logic with Vue reactivity and drives the CPU turn loop
- **`composables/useLocalStorage.ts`** — Persistence hook; game state is saved/restored from localStorage
- **`pages/index.vue`** — Single game page
- **`components/game/`** — 11 focused components (`GameBoard`, `PlayerHand`, `HandCard`, `CpuPlayer`, `GameStatus`, `GameOverModal`, `ActionButtons`, `CardSlot`, `BoardRow`, `ResetConfirmModal`, `JokerReceivedOverlay`)

### Key Game Rules

- All 7s start pre-placed on the board (not dealt to hands)
- `Board` tracks `{ low, high }` per suit; valid plays extend the sequence outward
- Joker can be placed at any board edge; the player holding the displaced card receives the Joker
- Joker combo: if the player also holds the card one step further out, both can be played together
- Each player has a limited number of passes (`MAX_PASSES`)

### Tailwind

Dynamic suit colors (`blue`/`orange`/`violet`) are safelisted in `tailwind.config.ts` because they're generated at runtime.
