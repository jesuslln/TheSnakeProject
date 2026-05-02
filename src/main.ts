const canvas = document.getElementById('game') as HTMLCanvasElement;
// biome-ignore lint/style/noNonNullAssertion: canvas 2d context always available
const ctx = canvas.getContext('2d')!;

const SIZE = Math.min(window.innerWidth, window.innerHeight, 800);
canvas.style.width = `${SIZE}px`;
canvas.style.height = `${SIZE}px`;
const dpr = window.devicePixelRatio || 1;
canvas.width = SIZE * dpr;
canvas.height = SIZE * dpr;
ctx.scale(dpr, dpr);

ctx.fillStyle = '#0a0a0a';
ctx.fillRect(0, 0, SIZE, SIZE);

ctx.fillStyle = '#4ade80';
ctx.font = 'bold 28px ui-monospace, Menlo, Consolas, monospace';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Snake', SIZE / 2, SIZE / 2 - 32);

ctx.fillStyle = '#94a3b8';
ctx.font = '18px ui-monospace, Menlo, Consolas, monospace';
ctx.fillText('Web Version — Phase 0 Scaffold', SIZE / 2, SIZE / 2 + 8);
ctx.fillText('Game coming soon...', SIZE / 2, SIZE / 2 + 40);
