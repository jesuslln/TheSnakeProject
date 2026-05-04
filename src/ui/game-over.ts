const FONT = 'ui-monospace, Menlo, Consolas, monospace';

export function drawGameOver(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  score: number,
  highScore: number,
  playerName: string,
  isNewHigh: boolean,
): void {
  ctx.fillStyle = 'rgba(10,10,10,0.82)';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const cx = canvasW / 2;
  const cy = canvasH / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = `bold 30px ${FONT}`;
  ctx.fillStyle = '#ef4444';
  ctx.fillText('GAME  OVER', cx, cy - 68);

  ctx.font = `16px ${FONT}`;
  ctx.fillStyle = '#4b5563';
  ctx.fillText(playerName, cx, cy - 28);

  ctx.font = `bold 40px ${FONT}`;
  ctx.fillStyle = isNewHigh ? '#f59e0b' : '#4ade80';
  ctx.fillText(Math.floor(score).toString(), cx, cy + 16);

  if (isNewHigh) {
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('NEW HIGH SCORE!', cx, cy + 54);
  } else if (highScore > 0) {
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = '#374151';
    ctx.fillText(`Best: ${Math.floor(highScore)}`, cx, cy + 54);
  }

  ctx.font = `13px ${FONT}`;
  ctx.fillStyle = '#374151';
  ctx.fillText('Press  Enter  to  play  again', cx, cy + 96);
}
