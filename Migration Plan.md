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

## Target Project Structure

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
│   │   └── orchestrator.ts       # equivalent of Python `Game` class — wires modules
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
├── MIGRATION_PLAN.md             # copy of this plan, in repo
├── README.md                     # rewritten for web
└── CLAUDE.md                     # rewritten top-to-bottom for web stack
```

## Critical design decisions baked into this plan

These are the gotchas that bit prior attempts or that the codebase makes easy to get wrong:

1. **JS modulo bug** — Python's `%` returns non-negative for positive divisor, JS doesn't. `Snake.move` and `cell_in_front` wrap with negatives. **Fix:** `mod(x, n) = ((x % n) + n) % n` in `src/game/grid.ts`, used everywhere wrapping happens. Test it directly.
2. **Inject RNG and Clock.** Python tests work around `random` and `time.monotonic` with property-based assertions; TS uses a seeded mulberry32 RNG and a `FakeClock` for exact tests.
3. **Decouple tick from render.** Python's `clock.tick(fps)` conflates them. In TS: `requestAnimationFrame` calls `render()` every frame (~60Hz for smooth notification fades) but only calls `tick()` when accumulator ≥ `1000/fps`. Cap accumulator at `5 * step` to prevent spiral-of-death after tab backgrounding. Difficulty changes update `step` without resetting accumulator.
4. **Async storage interface.** Even though localStorage is sync, expose `Promise<T>` so swapping to IndexedDB or cloud KV later (per CLAUDE.md future-proofing) doesn't ripple through call sites.
5. **AudioContext requires a user gesture.** Lazily construct + `resume()` on the first input event (name-entry submit, or first arrow key for returning users). Before init, `play()` is a no-op so tests don't need a real `AudioContext`. Use `(window.AudioContext ?? window.webkitAudioContext)`.
6. **Tongue-on-wrap flag.** Add `didWrap: boolean` to `Snake.move()` return now. Tongue animation is a render concern but the data has to flow from the pure module — bolt-on later means re-editing `snake.ts`.
7. **Canvas DPR scaling** — set `canvas.width = cssWidth * devicePixelRatio` and `ctx.scale(dpr, dpr)` from day one, otherwise HiDPI displays render blurry.
8. **Pause-on-blur** via Page Visibility API, mirroring `_enter_settings` semantics so the time bonus clock pauses (spec requirement).
9. **Settings overlay** must release the game's `keydown` listener — otherwise picking difficulty turns the snake — and trap focus.
10. **`prefers-reduced-motion`** disables tongue + notification fade animations.
11. **System font stack** (`ui-monospace, Menlo, Consolas, monospace`) — no webfont, no FOIT, matches `pygame.font.SysFont("monospace", bold=True)` look.
12. **GitHub Pages base path** — `base: '/TheSnakeProject/'` in Vite config, all asset URLs through `import.meta.env.BASE_URL` or `new URL(..., import.meta.url)`. `.nojekyll` in `public/` so Vite's `_*` chunks aren't stripped.

## Phased Implementation (TDD throughout)

Each phase ends with an explicit human checkpoint — these exist because earlier pygbag deploys "looked fine in tests, broke in browser." Don't skip them.

### Phase 0 — Repo migration & scaffolding

- Tag current HEAD as `python-v1.0`; push.
- Create `python-archive` branch from current `main`; push.
- On `main`: delete Python files, scaffold Vite + TS strict + Vitest + Biome + Playwright.
- Write `index.html`, minimal `src/main.ts` rendering "hello world" on a canvas.
- `.github/workflows/ci.yml` (typecheck + biome + vitest) and `deploy.yml` (Pages).
- Rewrite `CLAUDE.md` and `README.md` for web stack; reference `python-archive` branch.
- Copy this plan into the repo as `MIGRATION_PLAN.md`.
- **Checkpoint:** human visits `https://lopezneira.github.io/TheSnakeProject/` and sees the canvas render. Catches base-path / asset-resolution bugs cheaply.

### Phase 1 — Pure game logic (TDD port)

Order matters — earlier modules unblock the dependents' tests.

1. `src/game/grid.ts` — `mod()` helper, plus tests for negative inputs.
2. `src/storage/` — async `Storage` interface, `LocalStorageBackend`, `FakeStorage` test helper. Port `tests/test_utils.py` (achievements depend on `get_total_songs()` and the registry).
3. `src/game/snake.ts` — port `test_snake.py` first (simplest module, no time/RNG). Add `didWrap` to `move()` return.
4. `src/game/rng.ts` + `src/game/clock.ts` — interfaces + seeded/fake test impls.
5. `src/game/food.ts` — port `test_food.py` using injected RNG + Clock.
6. `src/game/score.ts` — port `test_score.py`.
7. `src/game/obstacles.ts` — port `test_obstacles.py`.
8. `src/game/achievements.ts` — port `test_achievements.py` (uses storage).
9. `src/game/session.ts` + `src/game/types.ts`.

Rules for this phase:

- One module per commit. Tests written and failing first; then implementation; then green; then commit. No batch porting.
- Each TS test file must have **≥** the test count of its Python counterpart (target: ~130 total).
- Once a test file is written and committed, do not edit it during implementation — this is the TDD contract.
- **Checkpoint:** `npm test` shows ~130 green tests. Run coverage; logic modules ≥ 90%.

### Phase 2 — Engine, input, rendering

- `src/engine.ts` — fixed-timestep accumulator loop. Unit-test with FakeClock.
- `src/input/keyboard.ts` — keydown listener, `preventDefault` on arrows, pause on `visibilitychange`.
- `src/ui/canvas.ts` — DPR-aware setup, responsive sizing (min 200×200, max viewport).
- `src/ui/board.ts` — grid + snake + food + obstacle draw functions.
- `src/ui/score-bar.ts` — score, gear icon, achievement notification slot.
- `src/ui/notifications.ts` — fade in/out (respect `prefers-reduced-motion`).
- `src/ui/{name-entry,settings,game-over}.ts` — screen rendering + key handling.
- `src/app/orchestrator.ts` — wires storage + engine + game modules + UI + input.
- **Checkpoint:** `npm run dev` → board renders, snake responds to arrow keys, score increments, dies on self-collision, restart works. **Manual play required — automated tests don't catch "looks wrong."**

### Phase 3 — Audio

- `src/audio/audio-engine.ts` — lazy `AudioContext` on first gesture, `play(name)` / `setVolume(v)` / `playMusic(name)`. Webkit fallback.
- Source CC0 sounds: apple-eat (crunch), banana-eat (peel), death, 3 looping tracks. Add to `public/audio/`.
- Wire settings menu music selection to `audio.playMusic(...)` and to `session.songsPlayed` for "Music Lover" / "Music Enjoyer" achievements (count distinct songs **played to start**, matching Python `songs_played.add(song)` on song change).
- **Checkpoint:** Audio plays on gesture in Chrome + Firefox + Safari; achievements fire correctly.

### Phase 4 — Polish & deploy

- Tongue animation on `didWrap` (`prefers-reduced-motion`-aware).
- Settings focus trap; verify keydown is fully released to settings while open.
- Lighthouse pass — performance budget (canvas game should hit 90+).
- Playwright smoke tests (2 max):
  1. Page loads, presses ArrowRight, snake position changes.
  2. Set high score, reload, verify it persists (localStorage round-trip).
- Manual smoke checklist:
  - All achievements trigger (especially the mandatory-named ones)
  - Pause-on-blur works
  - Difficulty change mid-game doesn't hitch
  - Game-over → Spacebar restart preserves achievements
  - Wrap teleport renders correctly with tongue
- **Checkpoint:** human plays a full game on the deployed Pages URL and signs off.

## Files modified or created

### Phase 0

- **Delete (kept on `python-archive`):** `game.py`, `snake.py`, `food.py`, `ui.py`, `utils.py`, `main.py`, `tests/*.py`, `requirements.txt`, `requirements-dev.txt`, `build/`
- **Rewrite:** `CLAUDE.md`, `README.md`, `.github/workflows/deploy.yml`
- **Create:** `package.json`, `tsconfig.json`, `vite.config.ts`, `biome.json`, `playwright.config.ts`, `index.html`, `src/main.ts`, `public/.nojekyll`, `MIGRATION_PLAN.md`, `.github/workflows/ci.yml`

### Phase 1

- **Create:** `src/game/{grid,snake,food,score,obstacles,achievements,session,types,rng,clock}.ts`
- **Create:** `src/storage/{storage,local-storage}.ts`
- **Create:** `tests/{game,storage,helpers}/*.test.ts`

### Phase 2

- **Create:** `src/engine.ts`, `src/input/keyboard.ts`, `src/app/orchestrator.ts`
- **Create:** `src/ui/{canvas,board,score-bar,notifications,name-entry,settings,game-over}.ts`

### Phase 3

- **Create:** `src/audio/audio-engine.ts`, `public/audio/*` (CC0 assets)

### Phase 4

- **Modify:** `src/ui/board.ts` (tongue), `src/ui/notifications.ts` (reduced motion), `src/ui/settings.ts` (focus trap)
- **Create:** `tests/e2e/*.spec.ts`

## Reused from Python (semantic ports — not literal translation)

| Python source | TS target | Notes |
|---|---|---|
| `snake.py: Snake.move()` | `src/game/snake.ts` | add `didWrap` to return |
| `food.py: FoodManager` | `src/game/food.ts` | RNG injected via constructor |
| `game.py: ScoreCalculator` | `src/game/score.ts` | unchanged semantics |
| `game.py: AchievementChecker` | `src/game/achievements.ts` | mandatory-named achievements preserved verbatim |
| `game.py: ObstacleManager` | `src/game/obstacles.ts` | spawn cadence + 3-cell cap preserved |
| `game.py: SessionState` | `src/game/session.ts` | dataclass → TS class with the same fields |
| `utils.py: _LocalStorage` | `src/storage/local-storage.ts` | `snake:` key prefix preserved |
| `utils.py: get_all_achievement_names()` | `src/game/achievements.ts` registry | exact same names |
| `tests/test_*.py` | `tests/**/*.test.ts` | one-to-one port; ≥ same test count |

## Verification (end-to-end)

After Phase 4, verify:

1. **Local dev:** `npm install && npm run dev`, open `http://localhost:5173/TheSnakeProject/`. Play a complete game.
2. **Tests:** `npm test` shows ≥130 unit tests green. `npm run test:e2e` runs Playwright smoke tests green.
3. **Build:** `npm run build && npm run preview` mimics Pages deploy locally.
4. **Deploy:** push to `main`, GitHub Action builds and deploys, visit `https://lopezneira.github.io/TheSnakeProject/`.
5. **Feature parity smoke (manual):**
   - Eat 7 apples → "Snow White and the 7 Apples" notification
   - Eat 30 bananas across runs → "Canary Island day"
   - Die in <5s → "Snake is my passion"
   - Change song in settings → "Music Enjoyer"
   - Play all 3 songs → "Music Lover"
   - Wall obstacle spawns at 30s mark, lasts 10s
   - Snake length ≥7 → 5pt/sec, ≥14 → 10pt/sec
   - Settings menu pauses time bonus
   - Tab blur pauses game
   - Spacebar restarts; achievements persist across restart and reload
6. **Python preservation:** `git checkout python-archive` shows the full Python project intact; tag `python-v1.0` resolves to the last Python commit.
