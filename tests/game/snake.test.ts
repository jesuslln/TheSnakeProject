import { describe, expect, it } from 'vitest';
import { Snake } from '../../src/game/snake';

const COLS = 40;
const ROWS = 40;

function makeSnake(col = 20, row = 20): Snake {
  return new Snake(col, row, COLS, ROWS);
}

function growAndMove(snake: Snake, times: number): void {
  for (let i = 0; i < times; i++) {
    snake.grow();
    snake.move();
  }
}

describe('Snake construction', () => {
  it('head is at start position', () => {
    const s = makeSnake(10, 15);
    expect(s.head()).toEqual({ col: 10, row: 15 });
  });

  it('initial length is 1', () => {
    expect(makeSnake().length).toBe(1);
  });

  it('getBodyCells returns single cell initially', () => {
    const s = makeSnake(5, 8);
    expect(s.getBodyCells()).toEqual([{ col: 5, row: 8 }]);
  });
});

describe('Snake movement', () => {
  it('moves right by default', () => {
    const s = makeSnake(20, 20);
    s.move();
    expect(s.head()).toEqual({ col: 21, row: 20 });
  });

  it('moves in direction set to up', () => {
    const s = makeSnake(20, 20);
    s.setDirection(0, -1);
    s.move();
    expect(s.head()).toEqual({ col: 20, row: 19 });
  });

  it('moves in direction set to down', () => {
    const s = makeSnake(20, 20);
    s.setDirection(0, 1);
    s.move();
    expect(s.head()).toEqual({ col: 20, row: 21 });
  });

  it('moves in direction set to left', () => {
    const s = makeSnake(20, 20);
    s.setDirection(0, 1);
    s.move();
    s.setDirection(-1, 0);
    s.move();
    expect(s.head()).toEqual({ col: 19, row: 21 });
  });

  it('tail length stays 1 without growth', () => {
    const s = makeSnake(20, 20);
    s.move();
    s.move();
    s.move();
    expect(s.length).toBe(1);
  });

  it('body follows head path', () => {
    const s = makeSnake(20, 20);
    s.grow();
    s.move();
    expect(s.getBodyCells()).toEqual([
      { col: 21, row: 20 },
      { col: 20, row: 20 },
    ]);
  });
});

describe('Snake wrapping', () => {
  it('wraps at right edge', () => {
    const s = makeSnake(39, 20);
    s.move();
    expect(s.head().col).toBe(0);
  });

  it('wraps at left edge', () => {
    const s = makeSnake(0, 20);
    s.setDirection(0, 1);
    s.move();
    s.setDirection(-1, 0);
    s.move();
    expect(s.head().col).toBe(39);
  });

  it('wraps at bottom edge', () => {
    const s = makeSnake(20, 39);
    s.setDirection(0, 1);
    s.move();
    expect(s.head().row).toBe(0);
  });

  it('wraps at top edge', () => {
    const s = makeSnake(20, 0);
    s.setDirection(0, -1);
    s.move();
    expect(s.head().row).toBe(39);
  });

  it('didWrap is false when not at edge', () => {
    const s = makeSnake(20, 20);
    const { didWrap } = s.move();
    expect(didWrap).toBe(false);
  });

  it('didWrap is true when head wraps right', () => {
    const s = makeSnake(39, 20);
    const { didWrap } = s.move();
    expect(didWrap).toBe(true);
  });

  it('didWrap is true when head wraps left', () => {
    const s = makeSnake(0, 20);
    s.setDirection(0, 1);
    s.move();
    s.setDirection(-1, 0);
    const { didWrap } = s.move();
    expect(didWrap).toBe(true);
  });

  it('didWrap is true when head wraps down', () => {
    const s = makeSnake(20, 39);
    s.setDirection(0, 1);
    const { didWrap } = s.move();
    expect(didWrap).toBe(true);
  });

  it('didWrap is true when head wraps up', () => {
    const s = makeSnake(20, 0);
    s.setDirection(0, -1);
    const { didWrap } = s.move();
    expect(didWrap).toBe(true);
  });
});

describe('Snake direction rules', () => {
  it('cannot reverse when going right → left', () => {
    const s = makeSnake(20, 20);
    s.setDirection(-1, 0);
    s.move();
    expect(s.head().col).toBe(21);
  });

  it('cannot reverse when going up → down', () => {
    const s = makeSnake(20, 20);
    s.setDirection(0, -1);
    s.move();
    s.setDirection(0, 1);
    s.move();
    expect(s.head().row).toBe(18);
  });

  it('cannot reverse when going left → right', () => {
    const s = makeSnake(20, 20);
    s.setDirection(0, 1);
    s.move();
    s.setDirection(-1, 0);
    s.move();
    s.setDirection(1, 0);
    s.move();
    expect(s.head().col).toBe(18);
  });

  it('can set perpendicular direction', () => {
    const s = makeSnake(20, 20);
    s.setDirection(0, -1);
    s.move();
    expect(s.head().row).toBe(19);
  });

  it('same direction is accepted', () => {
    const s = makeSnake(20, 20);
    s.setDirection(1, 0);
    s.move();
    expect(s.head().col).toBe(21);
  });
});

describe('Snake growth', () => {
  it('grow() increases length on next move', () => {
    const s = makeSnake(20, 20);
    s.grow();
    s.move();
    expect(s.length).toBe(2);
  });

  it('multiple grows accumulate', () => {
    const s = makeSnake(20, 20);
    s.grow();
    s.grow();
    s.grow();
    s.move();
    s.move();
    s.move();
    expect(s.length).toBe(4);
  });

  it('getBodyCells length matches grow calls + 1', () => {
    const s = makeSnake(20, 20);
    growAndMove(s, 4);
    expect(s.getBodyCells()).toHaveLength(5);
  });
});

describe('cellInFront', () => {
  it('returns position ahead in current direction', () => {
    const s = makeSnake(20, 20);
    expect(s.cellInFront()).toEqual({ col: 21, row: 20 });
  });

  it('wraps at right boundary', () => {
    const s = makeSnake(39, 20);
    expect(s.cellInFront()).toEqual({ col: 0, row: 20 });
  });

  it('wraps at left boundary', () => {
    const s = makeSnake(5, 5);
    s.setDirection(0, 1);
    s.move();
    s.setDirection(-1, 0);
    expect(s.cellInFront()).toEqual({ col: 4, row: 6 });
  });
});

describe('checkSelfCollision', () => {
  it('no collision for length 1', () => {
    const s = makeSnake(20, 20);
    s.move();
    expect(s.checkSelfCollision()).toBe(false);
  });

  it('no collision for short snake moving straight', () => {
    const s = makeSnake(20, 20);
    growAndMove(s, 3);
    expect(s.checkSelfCollision()).toBe(false);
  });

  it('detects collision when head hits body', () => {
    // Build snake of length 5, then turn into itself
    const s = makeSnake(5, 5);
    s.grow();
    s.grow();
    s.grow();
    s.grow();
    s.move();
    s.move();
    s.move();
    s.move();
    // body: [(9,5),(8,5),(7,5),(6,5),(5,5)]
    s.setDirection(0, -1);
    s.move();
    // body: [(9,4),(9,5),(8,5),(7,5),(6,5)]
    s.setDirection(-1, 0);
    s.move();
    // body: [(8,4),(9,4),(9,5),(8,5),(7,5)]
    s.setDirection(0, 1);
    s.move();
    // head moves to (8,5), which is in body
    expect(s.checkSelfCollision()).toBe(true);
  });
});
