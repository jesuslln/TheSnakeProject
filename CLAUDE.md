# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

A Snake game running natively in the browser via TypeScript + HTML5 Canvas, deployed to GitHub Pages.

**Python/Pygame predecessor:** archived on the `python-archive` branch, tagged `python-v1.0`.

## Tech Stack

- **TypeScript 5** (strict mode, `exactOptionalPropertyTypes`)
- **Vite 5** — dev server + bundler (`base: '/TheSnakeProject/'`)
- **Vitest** — unit tests (`tests/**/*.test.ts`, excludes `tests/e2e/`)
- **Playwright** — E2E smoke tests (`tests/e2e/`)
- **Biome** — linter + formatter (replaces ESLint+Prettier)
- No game framework — pure HTML5 Canvas

## Running Locally

```bash
npm install
npm run dev        # http://localhost:5173/TheSnakeProject/
npm test           # unit tests
npm run build      # production build → dist/
npm run preview    # preview production build locally
```

## Module Structure

| Path | Responsibility |
|---|---|
| `src/main.ts` | Entry point — bootstraps the engine |
| `src/engine.ts` | rAF game loop with fixed-timestep accumulator |
| `src/game/` | **Pure logic — no DOM, no Web APIs** |
| `src/game/types.ts` | `Action` and `GameState` enums |
| `src/game/grid.ts` | `mod(x, n)` helper — fixes JS negative-modulo |
| `src/game/snake.ts` | Snake entity: movement, wrapping, growth, collision |
| `src/game/food.ts` | Food spawning (apple, banana, golden apple) |
| `src/game/score.ts` | Time bonus rates + 2× multiplier logic |
| `src/game/achievements.ts` | 15 achievements, all conditions, dedup |
| `src/game/obstacles.ts` | Spawning walls (30s interval, 10s lifetime) |
| `src/game/session.ts` | Per-game mutable state |
| `src/game/rng.ts` | Seedable RNG interface + mulberry32 impl |
| `src/game/clock.ts` | `Clock` interface + real/fake impls |
| `src/app/orchestrator.ts` | Wires all modules; replaces Python `Game` class |
| `src/ui/` | Canvas rendering — no game logic |
| `src/input/keyboard.ts` | Key → Action mapping; `preventDefault` on arrows |
| `src/storage/storage.ts` | Async `Storage` interface |
| `src/storage/local-storage.ts` | `localStorage` implementation (`snake:` prefix) |
| `src/audio/audio-engine.ts` | Lazy `AudioContext`; webkit fallback |

## Key Game Rules (non-obvious)

**Wrapping** — walls are passable; each body segment wraps one at a time. Death only on self-collision or obstacle.

**Food** — max 3 regular fruits on screen; new fruit spawns every 5 s or immediately if screen is empty (resets timer). Golden apple spawns on a separate 30 s timer; doesn't count against the 3-food cap.

**Score** — apple = 25, banana = 50, golden apple = 200. Time bonus: +1/s (length < 7), +5/s (≥ 7), +10/s (≥ 14). 2× multiplier when 3 fruits eaten within 10 s. Clock pauses while settings are open.

**Obstacles** — one static wall every 30 s. Length = `min(3, floor(elapsed_minutes) + 1)`. Each wall lasts 10 s. Snake dies on contact.

**Difficulty** — FPS-based: Slow = 5, Normal = 10, Fast = 15. Custom option available.

**Achievements** — cumulative across runs; never reset. Not re-displayed once earned.
Mandatory names: `"Snow White and the 7 Apples"` (7 apples), `"Canary Island day"` (30 bananas),
`"Snake is my passion"` (die < 5 s), `"Music Enjoyer"` (change song), `"Music Lover"` (play all songs).

## Architecture Constraints

**Future-proofing:**
1. **Multiplayer** — game state must be separable from input handling; `src/game/` is pure.
2. **Cloud/remote** — all persistence goes through `src/storage/storage.ts` interface; no direct `localStorage` calls in game logic.

**JS modulo hazard** — always use `mod(x, n)` from `src/game/grid.ts` for grid wrapping, never the raw `%` operator. `(-1) % 40 === -1` in JS but the snake must wrap to `39`.

**Canvas DPR** — `canvas.width = cssW * devicePixelRatio`; `ctx.scale(dpr, dpr)`. This must be set up in `src/ui/canvas.ts` and never bypassed.

**AudioContext user-gesture rule** — `AudioEngine.init()` must be called from a user-gesture handler (first key press or name-entry submit). Before init, `play()` is a no-op.

## TDD Rules

- For every `src/game/*.ts` module, the corresponding `tests/game/*.test.ts` must be written (failing) and committed **before** the implementation.
- Once a test file is committed, do not edit tests during implementation — that's the TDD contract.
- Test count parity: each TS test file must have ≥ the equivalent Python test count.

## Deployment

GitHub Actions → `.github/workflows/deploy.yml` builds with Vite and deploys via `actions/deploy-pages@v4`.
Currently triggers on push to `web-version` and `main`.
Live at: https://lopezneira.github.io/TheSnakeProject/
