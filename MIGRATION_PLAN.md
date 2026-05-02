# Snake Game — Web Migration Plan

## Context

The project is currently a mature Python/Pygame implementation (1,298 LOC across 6 modules, ~130 pytest tests). It was deployed to GitHub Pages via Pygbag (Python-WASM), but the result is unsatisfactory — likely browser performance and interaction issues inherent to running Pygame inside a WASM runtime, not bugs in the code.

The goal is a **true web-native version** that runs smoothly on GitHub Pages and locally via `npm run dev`, while preserving every game rule, achievement, and feature in the spec (`Project Title Snake Game (Python).txt`) and CLAUDE.md. The Python codebase is well-structured for this: game logic (`snake.py`, `food.py`, `ScoreCalculator`, `AchievementChecker`, `ObstacleManager`, `SessionState`) is already pygame-free; only the rendering, input, and storage layers need replacement.

This migration is also an opportunity to follow strict TDD — every Python test has a TS counterpart written *before* its module is implemented — and to bake in checkpoints designed for agent-driven development.

## Final Decisions

| Area | Choice |
|---|---|
| Stack | TypeScript 5 (strict) + HTML5 Canvas, no game framework |
| Build | Vite 5 (`base: '/TheSnakeProject/'`) |
| Tests | Vitest + happy-dom; **one** Playwright smoke test |
| Lint/format | Biome (single config) |
| Repo | Tag Python as `python-v1.0`, archive on long-lived `python-archive` branch, replace `main` with web version |
| Mobile | Desktop-only v1; design with touch in mind (no swipe code yet) |
| Audio | Full Web Audio system at v1 with CC0 placeholder sounds |
| Storage | localStorage behind an **async** interface (future-proofs to IndexedDB/cloud per CLAUDE.md) |
| Deploy | GitHub Actions → `actions/deploy-pages@v4` |

## Project Structure

```
/
├── index.html
├── public/
│   ├── audio/                    # CC0 SFX + 3 looping tracks
│   ├── favicon.png
│   └── .nojekyll                 # so GitHub Pages serves _vite chunks
├── src/
│   ├── main.ts                   # entry: bootstraps engine
│   ├── engine.ts                 # game loop (rAF + fixed timestep accumulator)
│   ├── game/                     # PURE — no DOM, no Web APIs
│   │   ├── types.ts              # Action, GameState enums
│   │   ├── snake.ts
│   │   ├── food.ts
│   │   ├── score.ts
│   │   ├── achievements.ts
│   │   ├── obstacles.ts
│   │   ├── session.ts
│   │   ├── rng.ts                # seedable RNG interface (mulberry32 + Math.random impl)
│   │   ├── clock.ts              # Clock interface (real + fake for tests)
│   │   └── grid.ts               # mod() helper — fixes JS negative-modulo bug
│   ├── app/
│   │   └── orchestrator.ts       # equivalent of Python Game class — wires modules
│   ├── ui/                       # canvas rendering, no game logic
│   │   ├── canvas.ts             # DPR-aware setup
│   │   ├── score-bar.ts
│   │   ├── board.ts
│   │   ├── settings.ts           # focus trap, releases keydown
│   │   ├── name-entry.ts
│   │   ├── game-over.ts
│   │   └── notifications.ts
│   ├── input/
│   │   └── keyboard.ts           # preventDefault on arrow keys; pause on blur
│   ├── storage/
│   │   ├── storage.ts            # async interface { get, set }
│   │   └── local-storage.ts      # localStorage impl
│   └── audio/
│       └── audio-engine.ts       # lazy AudioContext; webkitAudioContext fallback
├── tests/                        # mirrors src/, ≥ Python test count per module
│   ├── game/, storage/, audio/, e2e/
│   └── helpers/                  # FakeStorage, FakeClock, SeededRng
├── .github/workflows/
│   ├── ci.yml                    # typecheck + biome + vitest on PR
│   └── deploy.yml                # build + Pages on main
├── package.json
├── tsconfig.json                 # strict, exactOptionalPropertyTypes
├── vite.config.ts                # base: '/TheSnakeProject/'
├── biome.json
├── playwright.config.ts
├── MIGRATION_PLAN.md             # this file
├── README.md
└── CLAUDE.md
```

## Critical Design Decisions

1. **JS modulo bug** — `mod(x, n) = ((x % n) + n) % n` in `src/game/grid.ts`, used everywhere wrapping happens.
2. **Inject RNG and Clock.** Seeded mulberry32 RNG and `FakeClock` for deterministic tests.
3. **Decouple tick from render.** Fixed-timestep accumulator in `engine.ts`; render at 60Hz, tick at 5/10/15 FPS.
4. **Async storage interface.** localStorage impl behind `Promise<T>` for future cloud swap.
5. **AudioContext requires user gesture.** Lazy init on first input event; no-op before init.
6. **Tongue-on-wrap flag.** `Snake.move()` returns `{ didWrap: boolean }`.
7. **Canvas DPR scaling.** `canvas.width = cssW * devicePixelRatio` + `ctx.scale(dpr, dpr)`.
8. **Pause-on-blur** via Page Visibility API.
9. **Settings overlay** releases game keydown listeners; traps focus.
10. **`prefers-reduced-motion`** disables tongue + notification fade.
11. **System font stack** — `ui-monospace, Menlo, Consolas, monospace`.
12. **GitHub Pages base path** — `base: '/TheSnakeProject/'`; assets via `import.meta.env.BASE_URL`.

## Phases

### Phase 0 — Scaffold ✓
Tag `python-v1.0`, archive on `python-archive`, scaffold Vite/TS/Vitest/Biome.
**Checkpoint:** `https://lopezneira.github.io/TheSnakeProject/` shows canvas.

### Phase 1 — Pure game logic (TDD)
Port order: `grid` → `storage` → `snake` → `rng/clock` → `food` → `score` → `obstacles` → `achievements` → `session/types`.
**Checkpoint:** `npm test` ≥ 130 green tests.

### Phase 2 — Engine, input, rendering
`engine.ts` (accumulator loop) → `keyboard.ts` → canvas UI → `orchestrator.ts`.
**Checkpoint:** `npm run dev` → playable game locally.

### Phase 3 — Audio
`audio-engine.ts` + CC0 sounds. Wire music achievements.
**Checkpoint:** Audio in Chrome/Firefox/Safari; Music Enjoyer/Lover trigger.

### Phase 4 — Polish & deploy
Tongue animation, focus trap, Lighthouse 90+, 2 Playwright smoke tests.
**Checkpoint:** Manual play on live Pages URL.

## Python Preservation

- Tag: `python-v1.0`
- Branch: `python-archive`
- Run: `git checkout python-archive && python game.py`
