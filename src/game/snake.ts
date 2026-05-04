import { mod } from './grid';
import type { Cell } from './types';

export class Snake {
  private readonly body: Cell[];
  private dc: number;
  private dr: number;
  private pendingGrowth: number;
  readonly cols: number;
  readonly rows: number;

  constructor(startCol: number, startRow: number, gridCols: number, gridRows: number) {
    this.cols = gridCols;
    this.rows = gridRows;
    this.dc = 1;
    this.dr = 0;
    this.body = [{ col: startCol, row: startRow }];
    this.pendingGrowth = 0;
  }

  setDirection(dc: number, dr: number): void {
    if (dc !== 0 && dc === -this.dc) return;
    if (dr !== 0 && dr === -this.dr) return;
    this.dc = dc;
    this.dr = dr;
  }

  move(): { didWrap: boolean } {
    // biome-ignore lint/style/noNonNullAssertion: body always has ≥1 element
    const head = this.body[0]!;
    const rawCol = head.col + this.dc;
    const rawRow = head.row + this.dr;
    const newCol = mod(rawCol, this.cols);
    const newRow = mod(rawRow, this.rows);
    const didWrap = newCol !== rawCol || newRow !== rawRow;

    this.body.unshift({ col: newCol, row: newRow });

    if (this.pendingGrowth > 0) {
      this.pendingGrowth--;
    } else {
      this.body.pop();
    }

    return { didWrap };
  }

  grow(): void {
    this.pendingGrowth++;
  }

  head(): Cell {
    // biome-ignore lint/style/noNonNullAssertion: body always has ≥1 element
    return this.body[0]!;
  }

  get length(): number {
    return this.body.length;
  }

  getBodyCells(): Cell[] {
    return [...this.body];
  }

  cellInFront(): Cell {
    // biome-ignore lint/style/noNonNullAssertion: body always has ≥1 element
    const h = this.body[0]!;
    return {
      col: mod(h.col + this.dc, this.cols),
      row: mod(h.row + this.dr, this.rows),
    };
  }

  checkSelfCollision(): boolean {
    // biome-ignore lint/style/noNonNullAssertion: body always has ≥1 element
    const h = this.body[0]!;
    return this.body.slice(1).some(c => c.col === h.col && c.row === h.row);
  }
}
