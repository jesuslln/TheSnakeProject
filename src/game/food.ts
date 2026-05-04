import type { Cell } from './types';
import type { Rng } from './rng';

export enum FoodType {
  APPLE = 'apple',
  BANANA = 'banana',
  GOLDEN_APPLE = 'golden_apple',
}

export const FOOD_POINTS: Readonly<Record<FoodType, number>> = {
  [FoodType.APPLE]: 25,
  [FoodType.BANANA]: 50,
  [FoodType.GOLDEN_APPLE]: 200,
};

export interface FoodItem {
  col: number;
  row: number;
  foodType: FoodType;
}

const REGULAR_SPAWN_INTERVAL = 5.0;
const GOLDEN_SPAWN_INTERVAL = 30.0;
const MAX_REGULAR = 3;

export class FoodManager {
  private items: FoodItem[] = [];
  private lastRegularSpawn = 0;
  private lastGoldenSpawn = 0;
  private readonly cols: number;
  private readonly rows: number;
  private readonly rng: Rng;

  constructor(gridCols: number, gridRows: number, rng: Rng) {
    this.cols = gridCols;
    this.rows = gridRows;
    this.rng = rng;
  }

  reset(now: number): void {
    this.items = [];
    this.lastRegularSpawn = now;
    this.lastGoldenSpawn = now;
  }

  update(now: number, snakeBody: Cell[], cellInFront: Cell): void {
    const regulars = this.items.filter(i => i.foodType !== FoodType.GOLDEN_APPLE);

    if (regulars.length === 0) {
      const cell = this.pickCell(snakeBody, cellInFront);
      if (cell) {
        const type = this.rng.next() < 0.5 ? FoodType.APPLE : FoodType.BANANA;
        this.items.push({ col: cell.col, row: cell.row, foodType: type });
        this.lastRegularSpawn = now;
      }
    } else if (regulars.length < MAX_REGULAR && now - this.lastRegularSpawn >= REGULAR_SPAWN_INTERVAL) {
      const cell = this.pickCell(snakeBody, cellInFront);
      if (cell) {
        const type = this.rng.next() < 0.5 ? FoodType.APPLE : FoodType.BANANA;
        this.items.push({ col: cell.col, row: cell.row, foodType: type });
        this.lastRegularSpawn = now;
      }
    }

    const hasGolden = this.items.some(i => i.foodType === FoodType.GOLDEN_APPLE);
    if (!hasGolden && now - this.lastGoldenSpawn >= GOLDEN_SPAWN_INTERVAL) {
      const cell = this.pickCell(snakeBody, cellInFront);
      if (cell) {
        this.items.push({ col: cell.col, row: cell.row, foodType: FoodType.GOLDEN_APPLE });
        this.lastGoldenSpawn = now;
      }
    }
  }

  tryEat(col: number, row: number): FoodItem | null {
    const idx = this.items.findIndex(i => i.col === col && i.row === row);
    if (idx === -1) return null;
    // biome-ignore lint/style/noNonNullAssertion: idx !== -1 guarantees splice returns ≥1 element
    return this.items.splice(idx, 1)[0]!;
  }

  getAllItems(): FoodItem[] {
    return [...this.items];
  }

  offsetTimers(delta: number): void {
    this.lastRegularSpawn += delta;
    this.lastGoldenSpawn += delta;
  }

  private pickCell(snakeBody: Cell[], cellInFront: Cell): Cell | null {
    const occupied = new Set<string>(snakeBody.map(c => `${c.col},${c.row}`));
    occupied.add(`${cellInFront.col},${cellInFront.row}`);
    for (const item of this.items) {
      occupied.add(`${item.col},${item.row}`);
    }

    for (let attempt = 0; attempt < 100; attempt++) {
      const col = this.rng.nextInt(0, this.cols - 1);
      const row = this.rng.nextInt(0, this.rows - 1);
      if (!occupied.has(`${col},${row}`)) {
        return { col, row };
      }
    }
    return null;
  }
}
