const DURATION = 3.5;
const FADE = 0.4;

interface Notification {
  text: string;
  t: number;
}

export class NotificationManager {
  private items: Notification[] = [];

  push(text: string, now: number): void {
    this.items.push({ text, t: now });
  }

  draw(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, now: number): void {
    this.items = this.items.filter((n) => now - n.t < DURATION);
    const visible = this.items.slice(-4);

    for (const [i, n] of visible.entries()) {
      const age = now - n.t;
      let alpha = 1;
      if (age < FADE) alpha = age / FADE;
      else if (age > DURATION - FADE) alpha = (DURATION - age) / FADE;
      alpha = Math.max(0, Math.min(1, alpha));

      const x = canvasW / 2;
      const y = canvasH - 56 - (visible.length - 1 - i) * 38;
      const label = `★  ${n.text}`;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 13px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const tw = ctx.measureText(label).width;
      const px = 14;
      const py = 7;

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x - tw / 2 - px, y - py - 4, tw + px * 2, (py + 4) * 2, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4ade80';
      ctx.fillText(label, x, y);
      ctx.restore();
    }
  }
}
