# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This project is in the **specification phase** — no source code has been written yet. The full requirements live in `Project Title Snake Game (Python).txt`. Implement from that spec.

## Tech Stack

- **Python** + **Pygame**
- JSON files for persistence (`highscores.json`, `achievements.json`)
- No external dependencies beyond Pygame

## Running the Game

```bash
python game.py
```

(Once implemented — entry point should be `game.py` or a dedicated `main.py`.)

## Planned Module Structure

| File | Responsibility |
|------|---------------|
| `game.py` | Main game loop, state machine (playing / game-over / settings) |
| `snake.py` | Snake entity: position list, movement, growth, self-collision |
| `food.py` | Food spawning/timing logic for apples, bananas, golden apples |
| `ui.py` | Static top bar, score display, settings menu, achievement overlay |
| `utils.py` | Shared helpers (grid math, JSON save/load, user folder paths) |

Save files go in a subfolder named after the current OS user: `<username>/highscores.json` and `<username>/achievements.json`.

## Key Game Rules (non-obvious details)

**Collision / wrapping** — when any body segment would leave the grid, it reappears on the opposite edge *one segment at a time*, following the same path. The snake only dies on self-collision, never wall collision.

**Food spawning** — max 3 fruits on screen simultaneously; new fruit spawns every 5 seconds *or* immediately when the screen has zero fruits (and resets the 5-second timer). Food must not spawn on the snake's body or directly in front of the head. Golden Apple spawns on a separate 30-second timer.

**Score** — food points: apple = 25 pts, banana = 50 pts, golden apple = 200 pts. Time bonus: +1 pt/sec (default), +5 pts/sec (snake length ≥ 7), +10 pts/sec (length ≥ 14). The clock pauses while the settings menu is open. Top 10 runs (score + duration) are persisted.

**Difficulty** — implemented as FPS: Slow = 5, Normal = 10, Fast = 15. A "Custom" option lets the user set speed manually.

**Obstacles (optional)** — one static wall appears every 30 seconds. Wall length grows by 1 square each minute (1 sq in minute 1, 2 sq in minute 2, 3 sq in minute 3). Each wall lasts 10 seconds. Snake dies on obstacle contact.

**Game over / reset** — Spacebar restarts. Everything resets except achievements (achievements are cumulative across all runs and are never cleared).

## Achievements System

Achievements are stored permanently in `<username>/achievements.json`. Once earned, they are **not re-displayed** in subsequent runs. The top bar shows the achievement title when one is earned (the space not used by score/settings button).

Required named achievements (exact names are mandatory where marked):
- "Snow White and the 7 Apples" — eat 7 apples (**mandatory name**)
- "Canary Island day" — eat 30 bananas (**mandatory name**)
- "Snake is my passion" — die within first 5 seconds (easter egg)
- "Music Enjoyer" — change a song in settings (easter egg)
- "Music Lover" — play all available songs (easter egg)

See the spec file for the full list of required and suggested achievement names.

## Architecture Constraints

**Future-proofing** — the codebase must be structured to support, without major rework:
1. Multiplayer (design game state to be separable from input handling)
2. Cloud/remote deployment (avoid hardcoded local-only assumptions; keep I/O behind interfaces in `utils.py`)

This means: avoid coupling game logic directly to Pygame input events or file system paths. Route all persistence through `utils.py` so the backend can be swapped later.
