export interface Rng {
  next(): number;
  nextInt(min: number, max: number): number;
  choice<T>(arr: readonly T[]): T;
}

export function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  const rng: Rng = {
    next(): number {
      s += 0x6d2b79f5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    nextInt(min: number, max: number): number {
      return min + Math.floor(rng.next() * (max - min + 1));
    },
    choice<T>(arr: readonly T[]): T {
      // biome-ignore lint/style/noNonNullAssertion: nextInt guarantees valid index for non-empty arr
      return arr[rng.nextInt(0, arr.length - 1)]!;
    },
  };
  return rng;
}

export function mathRng(): Rng {
  const rng: Rng = {
    next(): number {
      return Math.random();
    },
    nextInt(min: number, max: number): number {
      return min + Math.floor(rng.next() * (max - min + 1));
    },
    choice<T>(arr: readonly T[]): T {
      // biome-ignore lint/style/noNonNullAssertion: nextInt guarantees valid index for non-empty arr
      return arr[rng.nextInt(0, arr.length - 1)]!;
    },
  };
  return rng;
}
