import type { Layout } from './canvas';

export interface ScoreBarData {
  score: number;
  highScore: number;
  snakeLength: number;
  elapsedSeconds: number;
  difficultyLabel: string;
  multiplierActive: boolean;
  trackLabel: string;
}

const FONT = '14px ui-monospace, Menlo, Consolas, monospace';
const BOLD = 'bold 14px ui-monospace, Menlo, Consolas, monospace';

export function drawScoreBar(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  data: ScoreBarData,
): void {
  const { canvasW, scoreBarH } = layout;

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, canvasW, scoreBarH);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, scoreBarH - 1, canvasW, 1);

  const cy = scoreBarH / 2;
  ctx.textBaseline = 'middle';

  ctx.textAlign = 'left';
  ctx.font = BOLD;
  ctx.fillStyle = data.multiplierActive ? '#f59e0b' : '#4ade80';
  const scoreText = data.multiplierActive
    ? `${Math.floor(data.score)}  ×2`
    : `${Math.floor(data.score)}`;
  ctx.fillText(scoreText, 12, cy);

  ctx.font = FONT;
  ctx.fillStyle = '#374151';
  ctx.fillText(`HI ${Math.floor(data.highScore)}`, 116, cy);

  ctx.textAlign = 'center';
  ctx.font = FONT;
  ctx.fillStyle = '#94a3b8';
  const m = Math.floor(data.elapsedSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(data.elapsedSeconds % 60)
    .toString()
    .padStart(2, '0');
  ctx.fillText(`${m}:${s}`, canvasW / 2, cy);

  ctx.textAlign = 'right';
  ctx.font = FONT;
  ctx.fillStyle = '#4b5563';
  ctx.fillText(
    `${data.trackLabel}  len ${data.snakeLength}  ${data.difficultyLabel}`,
    canvasW - 12,
    cy,
  );
}
