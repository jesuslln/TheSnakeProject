export interface Layout {
  cellSize: number;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  scoreBarH: number;
  canvasW: number;
  canvasH: number;
}

const SCORE_BAR_H = 48;
const COLS = 40;
const ROWS = 40;

export function computeLayout(): Layout {
  const cellSize = Math.max(
    8,
    Math.min(
      Math.floor(window.innerWidth / COLS),
      Math.floor((window.innerHeight - SCORE_BAR_H) / ROWS),
    ),
  );
  const gridW = cellSize * COLS;
  const gridH = cellSize * ROWS;
  return {
    cellSize,
    gridX: 0,
    gridY: SCORE_BAR_H,
    gridW,
    gridH,
    scoreBarH: SCORE_BAR_H,
    canvasW: gridW,
    canvasH: gridH + SCORE_BAR_H,
  };
}

export function setupCanvas(canvas: HTMLCanvasElement, layout: Layout): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${layout.canvasW}px`;
  canvas.style.height = `${layout.canvasH}px`;
  canvas.width = layout.canvasW * dpr;
  canvas.height = layout.canvasH * dpr;
  // biome-ignore lint/style/noNonNullAssertion: 2d context always available on <canvas>
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
