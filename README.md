# Snake Game

A Snake game built with TypeScript + HTML5 Canvas, playable in the browser.

**Play:** https://lopezneira.github.io/TheSnakeProject/

## Features

- Classic Snake with grid wrapping (no wall deaths)
- Three food types: Apple (25 pts), Banana (50 pts), Golden Apple (200 pts)
- Time bonus: +1/s, +5/s at length ≥7, +10/s at length ≥14
- 2× score multiplier for eating 3 fruits within 10 seconds
- Obstacle walls that spawn every 30 seconds
- 15 achievements persisted across sessions
- Difficulty: Slow (5 FPS), Normal (10 FPS), Fast (15 FPS), Custom
- High scores (top 10) saved per player
- Background music + sound effects

## Controls

| Key | Action |
|---|---|
| Arrow keys / WASD | Move snake |
| P | Open/close settings |
| Space | Restart (on game over) |

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/TheSnakeProject/`

## Development

```bash
npm test              # unit tests (Vitest)
npm run typecheck     # TypeScript type check
npm run lint          # Biome linter
npm run build         # production build
npm run preview       # preview production build
```

## Project Structure

See [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) for full architecture details.

| Path | Purpose |
|---|---|
| `src/game/` | Pure game logic (no DOM, fully testable) |
| `src/ui/` | Canvas rendering |
| `src/input/` | Keyboard input → game actions |
| `src/storage/` | Async persistence (localStorage) |
| `src/audio/` | Web Audio engine |
| `src/engine.ts` | Fixed-timestep game loop |
| `tests/` | Unit tests (Vitest) + E2E smoke (Playwright) |

## Python Version

The original Python/Pygame implementation is preserved:

```bash
git checkout python-archive
pip install pygame
python game.py
```

Or see the `python-v1.0` tag.
