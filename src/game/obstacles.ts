import type { Cell } from './types';
import type { Rng } from './rng';

export interface Obstacle {
  cells: Cell[];
  spawnTime: number;
  duration: number;
}

const SPAWN_INTERVAL = 30.0;
const OBSTACLE_DURATION = 10.0;

export class ObstacleManager {
  obstacles: Obstacle[] = [];
  private lastSpawn = 0;
  private readonly cols: number;
  private readonly rows: number;
  private readonly rng: Rng;

  constructor(gridCols: number, gridRows: number, rng: Rng) {
    this.cols = gridCols;
    this.rows = gridRows;
    this.rng = rng;
  }

  reset(now: number): void {
    this.obstacles = [];
    this.lastSpawn = now;
  }

  update(now: number, elapsedGameTime: number, snakeBody: Cell[]): void {
    this.obstacles = this.obstacles.filter(o => now - o.spawnTime < o.duration);

    if (now - this.lastSpawn >= SPAWN_INTERVAL) {
      const length = Math.min(3, Math.floor(elapsedGameTime / 60) + 1);
      const cells = this.pickWall(length, snakeBody);
      if (cells) {
        this.obstacles.push({ cells, spawnTime: now, duration: OBSTACLE_DURATION });
      }
      this.lastSpawn = now;
    }
  }

  checkCollision(col: number, row: number): boolean {
    return this.obstacles.some(o => o.cells.some(c => c.col === col && c.row === row));
  }

  getAllCells(): Cell[] {
    return this.obstacles.flatMap(o => o.cells);
  }

  offsetTimers(delta: number): void {
    this.lastSpawn += delta;
  }

  private pickWall(length: number, snakeBody: Cell[]): Cell[] | null {
    const occupied = new Set<string>([
      ...snakeBody.map(c => `${c.col},${c.row}`),
      ...this.obstacles.flatMap(o => o.cells).map(c => `${c.col},${c.row}`),
    ]);

    for (let attempt = 0; attempt < 20; attempt++) {
      const horizontal = this.rng.next() < 0.5;
      let cells: Cell[];

      if (horizontal) {
        const col = this.rng.nextInt(0, this.cols - length);
        const row = this.rng.nextInt(0, this.rows - 1);
        cells = Array.from({ length }, (_, i) => ({ col: col + i, row }));
      } else {
        const col = this.rng.nextInt(0, this.cols - 1);
        const row = this.rng.nextInt(0, this.rows - length);
        cells = Array.from({ length }, (_, i) => ({ col, row: row + i }));
      }

      if (!cells.some(c => occupied.has(`${c.col},${c.row}`))) {
        return cells;
      }
    }
    return null;
  }
}
