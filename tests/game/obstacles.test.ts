import { describe, expect, it } from 'vitest';
import { ObstacleManager } from '../../src/game/obstacles';
import { mulberry32 } from '../../src/game/rng';
import type { Cell } from '../../src/game/types';

const COLS = 40;
const ROWS = 40;
const EMPTY_BODY: Cell[] = [];

function makeManager(): ObstacleManager {
  return new ObstacleManager(COLS, ROWS, mulberry32(42));
}

describe('ObstacleManager initial state', () => {
  it('starts with no obstacles', () => {
    const m = makeManager();
    expect(m.obstacles).toHaveLength(0);
  });

  it('getAllCells returns empty initially', () => {
    expect(makeManager().getAllCells()).toHaveLength(0);
  });
});

describe('ObstacleManager reset', () => {
  it('reset clears obstacles', () => {
    const m = makeManager();
    m.reset(0);
    m.update(30, 0, EMPTY_BODY);
    m.reset(0);
    expect(m.obstacles).toHaveLength(0);
  });
});

describe('ObstacleManager spawning', () => {
  it('does not spawn before 30s', () => {
    const m = makeManager();
    m.reset(0);
    m.update(29.9, 0, EMPTY_BODY);
    expect(m.obstacles).toHaveLength(0);
  });

  it('spawns one obstacle at 30s mark', () => {
    const m = makeManager();
    m.reset(0);
    m.update(30, 0, EMPTY_BODY);
    expect(m.obstacles).toHaveLength(1);
  });

  it('wall length 1 in first minute', () => {
    const m = makeManager();
    m.reset(0);
    m.update(30, 30, EMPTY_BODY);
    expect(m.obstacles[0]!.cells).toHaveLength(1);
  });

  it('wall length 2 in second minute', () => {
    const m = makeManager();
    m.reset(0);
    m.update(30, 90, EMPTY_BODY);
    expect(m.obstacles[0]!.cells).toHaveLength(2);
  });

  it('wall length 3 in third minute', () => {
    const m = makeManager();
    m.reset(0);
    m.update(30, 150, EMPTY_BODY);
    expect(m.obstacles[0]!.cells).toHaveLength(3);
  });

  it('wall length capped at 3 after third minute', () => {
    const m = makeManager();
    m.reset(0);
    m.update(30, 300, EMPTY_BODY);
    expect(m.obstacles[0]!.cells).toHaveLength(3);
  });

  it('does not spawn a second obstacle before another 30s', () => {
    const m = makeManager();
    m.reset(0);
    m.update(30, 0, EMPTY_BODY);
    // Check at t=35: 5s since last spawn (< 30s), obstacle still alive (< 10s)
    m.update(35, 0, EMPTY_BODY);
    expect(m.obstacles).toHaveLength(1);
  });
});

describe('ObstacleManager lifetime', () => {
  it('obstacle is present within 10s of spawn', () => {
    const m = makeManager();
    m.reset(0);
    m.update(30, 0, EMPTY_BODY);
    m.update(39.9, 0, EMPTY_BODY);
    expect(m.obstacles).toHaveLength(1);
  });

  it('obstacle removed after 10s lifetime', () => {
    const m = makeManager();
    m.reset(0);
    m.update(30, 0, EMPTY_BODY);
    m.update(41, 0, EMPTY_BODY);
    expect(m.obstacles).toHaveLength(0);
  });

  it('new obstacle can spawn after old one expires', () => {
    const m = makeManager();
    m.reset(0);
    m.update(30, 0, EMPTY_BODY);
    m.update(60, 0, EMPTY_BODY);
    expect(m.obstacles).toHaveLength(1);
  });
});

describe('ObstacleManager collision', () => {
  it('checkCollision returns false when no obstacles', () => {
    const m = makeManager();
    m.reset(0);
    expect(m.checkCollision(5, 5)).toBe(false);
  });

  it('checkCollision returns true on an obstacle cell', () => {
    const m = makeManager();
    m.reset(0);
    m.update(30, 0, EMPTY_BODY);
    const cell = m.obstacles[0]!.cells[0]!;
    expect(m.checkCollision(cell.col, cell.row)).toBe(true);
  });

  it('checkCollision returns false off obstacle cells', () => {
    const m = makeManager();
    m.reset(0);
    m.update(30, 0, EMPTY_BODY);
    expect(m.checkCollision(999, 999)).toBe(false);
  });

  it('getAllCells lists all obstacle cells', () => {
    const m = makeManager();
    m.reset(0);
    m.update(30, 90, EMPTY_BODY);
    const cells = m.getAllCells();
    expect(cells).toHaveLength(m.obstacles[0]!.cells.length);
  });
});

describe('ObstacleManager wall shape', () => {
  it('obstacle cells form a horizontal or vertical line', () => {
    const m = makeManager();
    m.reset(0);
    m.update(30, 90, EMPTY_BODY);
    const cells = m.obstacles[0]!.cells;
    const sameRow = cells.every(c => c.row === cells[0]!.row);
    const sameCol = cells.every(c => c.col === cells[0]!.col);
    expect(sameRow || sameCol).toBe(true);
  });

  it('horizontal cells are consecutive cols', () => {
    for (let seed = 0; seed < 10; seed++) {
      const m = new ObstacleManager(COLS, ROWS, mulberry32(seed));
      m.reset(0);
      m.update(30, 90, EMPTY_BODY);
      const cells = m.obstacles[0]!.cells;
      const sameRow = cells.every(c => c.row === cells[0]!.row);
      if (sameRow) {
        const cols = cells.map(c => c.col).sort((a, b) => a - b);
        for (let i = 1; i < cols.length; i++) {
          expect(cols[i]!).toBe(cols[i - 1]! + 1);
        }
      }
    }
  });
});

describe('ObstacleManager offsetTimers', () => {
  it('offsetTimers delays next spawn', () => {
    const m = makeManager();
    m.reset(0);
    m.offsetTimers(30);
    m.update(30, 0, EMPTY_BODY);
    expect(m.obstacles).toHaveLength(0);
  });

  it('offsetTimers: spawn happens after delay + 30s', () => {
    const m = makeManager();
    m.reset(0);
    m.offsetTimers(10);
    m.update(40, 0, EMPTY_BODY);
    expect(m.obstacles).toHaveLength(1);
  });
});
