export interface Engine {
  stop(): void;
}

export function startEngine(
  getTickInterval: () => number,
  tick: (dt: number) => void,
  render: () => void,
): Engine {
  let last: DOMHighResTimeStamp | null = null;
  let accumulator = 0;
  let rafId = 0;

  function frame(ts: DOMHighResTimeStamp): void {
    if (last === null) {
      last = ts;
      rafId = requestAnimationFrame(frame);
      return;
    }

    // Cap elapsed to prevent spiral-of-death and post-pause tick bursts
    const elapsed = Math.min((ts - last) / 1000, 0.25);
    last = ts;

    const dt = getTickInterval();
    accumulator += elapsed;
    while (accumulator >= dt) {
      tick(dt);
      accumulator -= dt;
    }

    render();
    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);
  return { stop: () => cancelAnimationFrame(rafId) };
}
