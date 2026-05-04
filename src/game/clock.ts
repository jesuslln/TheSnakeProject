export interface Clock {
  now(): number;
}

export interface FakeClock extends Clock {
  advance(dt: number): void;
  set(t: number): void;
}

export function realClock(): Clock {
  return { now: () => performance.now() / 1000 };
}

export function fakeClock(initial = 0): FakeClock {
  let t = initial;
  return {
    now: () => t,
    advance(dt: number) {
      t += dt;
    },
    set(time: number) {
      t = time;
    },
  };
}
