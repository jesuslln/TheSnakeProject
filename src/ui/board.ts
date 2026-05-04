import { FoodType } from '../game/food';
import type { FoodItem } from '../game/food';
import type { Cell } from '../game/types';
import type { Layout } from './canvas';

const FOOD_COLORS: Record<FoodType, string> = {
  [FoodType.APPLE]: '#ef4444',
  [FoodType.BANANA]: '#eab308',
  [FoodType.GOLDEN_APPLE]: '#f59e0b',
};

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  snake: Cell[],
  food: FoodItem[],
  obstacles: Cell[],
): void {
  const { cellSize, gridX, gridY, gridW, gridH } = layout;

  ctx.fillStyle = '#111111';
  ctx.fillRect(gridX, gridY, gridW, gridH);

  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 0.5;
  const cols = gridW / cellSize;
  const rows = gridH / cellSize;
  for (let c = 0; c <= cols; c++) {
    const x = gridX + c * cellSize;
    ctx.beginPath();
    ctx.moveTo(x, gridY);
    ctx.lineTo(x, gridY + gridH);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    const y = gridY + r * cellSize;
    ctx.beginPath();
    ctx.moveTo(gridX, y);
    ctx.lineTo(gridX + gridW, y);
    ctx.stroke();
  }

  for (const cell of obstacles) {
    const x = gridX + cell.col * cellSize;
    const y = gridY + cell.row * cellSize;
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
  }

  for (const item of food) {
    const x = gridX + item.col * cellSize;
    const y = gridY + item.row * cellSize;
    const r = Math.max(2, cellSize / 2 - 1);
    ctx.fillStyle = FOOD_COLORS[item.foodType];
    ctx.beginPath();
    ctx.arc(x + cellSize / 2, y + cellSize / 2, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const [i, cell] of snake.entries()) {
    const x = gridX + cell.col * cellSize;
    const y = gridY + cell.row * cellSize;
    ctx.fillStyle = i === 0 ? '#4ade80' : '#22c55e';
    const pad = i === 0 ? 0 : 1;
    ctx.fillRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);
  }
}
