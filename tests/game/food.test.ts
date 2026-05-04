import { describe, expect, it } from 'vitest';
import { FOOD_POINTS, FoodManager, FoodType } from '../../src/game/food';
import { mulberry32 } from '../../src/game/rng';
import type { Cell } from '../../src/game/types';

const COLS = 40;
const ROWS = 40;
const EMPTY_BODY: Cell[] = [];
const FRONT: Cell = { col: 0, row: 0 };

function makeManager(): FoodManager {
  return new FoodManager(COLS, ROWS, mulberry32(42));
}

describe('FOOD_POINTS', () => {
  it('apple is 25', () => expect(FOOD_POINTS[FoodType.APPLE]).toBe(25));
  it('banana is 50', () => expect(FOOD_POINTS[FoodType.BANANA]).toBe(50));
  it('golden_apple is 200', () => expect(FOOD_POINTS[FoodType.GOLDEN_APPLE]).toBe(200));
});

describe('FoodManager initial state', () => {
  it('starts with no items', () => {
    const m = makeManager();
    expect(m.getAllItems()).toHaveLength(0);
  });

  it('reset clears any items', () => {
    const m = makeManager();
    m.reset(0);
    m.update(0, EMPTY_BODY, FRONT);
    m.reset(0);
    expect(m.getAllItems()).toHaveLength(0);
  });
});

describe('FoodManager regular food spawning', () => {
  it('spawns one fruit immediately when empty after reset', () => {
    const m = makeManager();
    m.reset(0);
    m.update(0, EMPTY_BODY, FRONT);
    const items = m.getAllItems().filter((i) => i.foodType !== FoodType.GOLDEN_APPLE);
    expect(items).toHaveLength(1);
  });

  it('spawns another after 5s with < 3 fruits', () => {
    const m = makeManager();
    m.reset(0);
    m.update(0, EMPTY_BODY, FRONT);
    m.update(5, EMPTY_BODY, FRONT);
    const items = m.getAllItems().filter((i) => i.foodType !== FoodType.GOLDEN_APPLE);
    expect(items.length).toBeGreaterThanOrEqual(2);
  });

  it('does not spawn before 5s with 1 fruit', () => {
    const m = makeManager();
    m.reset(0);
    m.update(0, EMPTY_BODY, FRONT);
    m.update(4.9, EMPTY_BODY, FRONT);
    const items = m.getAllItems().filter((i) => i.foodType !== FoodType.GOLDEN_APPLE);
    expect(items).toHaveLength(1);
  });

  it('does not exceed 3 regular fruits', () => {
    const m = makeManager();
    m.reset(0);
    m.update(0, EMPTY_BODY, FRONT);
    m.update(5, EMPTY_BODY, FRONT);
    m.update(10, EMPTY_BODY, FRONT);
    m.update(15, EMPTY_BODY, FRONT);
    m.update(20, EMPTY_BODY, FRONT);
    const items = m.getAllItems().filter((i) => i.foodType !== FoodType.GOLDEN_APPLE);
    expect(items.length).toBeLessThanOrEqual(3);
  });

  it('spawns immediately when all fruits eaten', () => {
    const m = makeManager();
    m.reset(0);
    m.update(0, EMPTY_BODY, FRONT);
    const first = m.getAllItems()[0];
    if (first) m.tryEat(first.col, first.row);
    m.update(1, EMPTY_BODY, FRONT);
    const items = m.getAllItems().filter((i) => i.foodType !== FoodType.GOLDEN_APPLE);
    expect(items).toHaveLength(1);
  });

  it('spawned regular food is APPLE or BANANA', () => {
    const m = makeManager();
    m.reset(0);
    m.update(0, EMPTY_BODY, FRONT);
    m.update(5, EMPTY_BODY, FRONT);
    m.update(10, EMPTY_BODY, FRONT);
    const regulars = m.getAllItems().filter((i) => i.foodType !== FoodType.GOLDEN_APPLE);
    for (const item of regulars) {
      expect([FoodType.APPLE, FoodType.BANANA]).toContain(item.foodType);
    }
  });
});

describe('FoodManager golden apple', () => {
  it('golden apple spawns after 30s', () => {
    const m = makeManager();
    m.reset(0);
    m.update(0, EMPTY_BODY, FRONT);
    m.update(30, EMPTY_BODY, FRONT);
    const golden = m.getAllItems().filter((i) => i.foodType === FoodType.GOLDEN_APPLE);
    expect(golden).toHaveLength(1);
  });

  it('golden apple does not spawn before 30s', () => {
    const m = makeManager();
    m.reset(0);
    m.update(0, EMPTY_BODY, FRONT);
    m.update(29.9, EMPTY_BODY, FRONT);
    const golden = m.getAllItems().filter((i) => i.foodType === FoodType.GOLDEN_APPLE);
    expect(golden).toHaveLength(0);
  });

  it('golden apple does not count against regular cap', () => {
    const m = makeManager();
    m.reset(0);
    m.update(0, EMPTY_BODY, FRONT);
    m.update(5, EMPTY_BODY, FRONT);
    m.update(10, EMPTY_BODY, FRONT);
    m.update(30, EMPTY_BODY, FRONT);
    const total = m.getAllItems().length;
    expect(total).toBeGreaterThan(3);
  });

  it('only one golden apple at a time', () => {
    const m = makeManager();
    m.reset(0);
    m.update(30, EMPTY_BODY, FRONT);
    m.update(60, EMPTY_BODY, FRONT);
    const golden = m.getAllItems().filter((i) => i.foodType === FoodType.GOLDEN_APPLE);
    expect(golden).toHaveLength(1);
  });
});

describe('FoodManager tryEat', () => {
  it('returns null when nothing at position', () => {
    const m = makeManager();
    m.reset(0);
    expect(m.tryEat(0, 0)).toBeNull();
  });

  it('returns the food item when eaten', () => {
    const m = makeManager();
    m.reset(0);
    m.update(0, EMPTY_BODY, FRONT);
    const items = m.getAllItems();
    expect(items.length).toBeGreaterThan(0);
    const item = items[0]!;
    const eaten = m.tryEat(item.col, item.row);
    expect(eaten).not.toBeNull();
    expect(eaten?.foodType).toBe(item.foodType);
  });

  it('removes eaten item from the list', () => {
    const m = makeManager();
    m.reset(0);
    m.update(0, EMPTY_BODY, FRONT);
    const before = m.getAllItems().length;
    const item = m.getAllItems()[0]!;
    m.tryEat(item.col, item.row);
    expect(m.getAllItems().length).toBe(before - 1);
  });

  it('tryEat at wrong position returns null', () => {
    const m = makeManager();
    m.reset(0);
    m.update(0, EMPTY_BODY, FRONT);
    expect(m.tryEat(999, 999)).toBeNull();
  });
});

describe('FoodManager placement constraints', () => {
  it('food does not spawn on snake body', () => {
    const body: Cell[] = Array.from({ length: 39 * 40 }, (_, i) => ({
      col: Math.floor(i / 40),
      row: i % 40,
    }));
    const m = makeManager();
    m.reset(0);
    m.update(0, body, FRONT);
    const items = m.getAllItems();
    for (const item of items) {
      const onBody = body.some((c) => c.col === item.col && c.row === item.row);
      expect(onBody).toBe(false);
    }
  });

  it('offsetTimers delays next golden spawn', () => {
    const m = makeManager();
    m.reset(0);
    m.update(0, EMPTY_BODY, FRONT);
    m.offsetTimers(30);
    m.update(30, EMPTY_BODY, FRONT);
    const golden = m.getAllItems().filter((i) => i.foodType === FoodType.GOLDEN_APPLE);
    expect(golden).toHaveLength(0);
  });
});
