import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../src/game/rng';

describe('mulberry32', () => {
  it('returns values in [0, 1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 200; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('same seed produces same sequence', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    for (let i = 0; i < 20; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('different seeds produce different first values', () => {
    expect(mulberry32(1).next()).not.toBe(mulberry32(2).next());
  });

  it('different seeds produce different sequences', () => {
    const a = mulberry32(1);
    const b = mulberry32(9999);
    const va = Array.from({ length: 5 }, () => a.next());
    const vb = Array.from({ length: 5 }, () => b.next());
    expect(va).not.toEqual(vb);
  });

  it('nextInt returns values in [min, max] inclusive', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 200; i++) {
      const v = rng.nextInt(3, 9);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(9);
    }
  });

  it('nextInt(n, n) always returns n', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 30; i++) {
      expect(rng.nextInt(5, 5)).toBe(5);
    }
  });

  it('nextInt returns integers only', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 50; i++) {
      const v = rng.nextInt(0, 100);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('nextInt 0 to 1 only returns 0 or 1', () => {
    const rng = mulberry32(55);
    for (let i = 0; i < 100; i++) {
      const v = rng.nextInt(0, 1);
      expect([0, 1]).toContain(v);
    }
  });

  it('choice returns element from array', () => {
    const rng = mulberry32(42);
    const arr = ['a', 'b', 'c'] as const;
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(rng.choice(arr));
    }
  });

  it('choice covers all elements given enough draws', () => {
    const rng = mulberry32(1);
    const arr = ['x', 'y', 'z'] as const;
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) {
      seen.add(rng.choice(arr));
    }
    expect(seen).toContain('x');
    expect(seen).toContain('y');
    expect(seen).toContain('z');
  });

  it('generates good distribution for nextInt', () => {
    const rng = mulberry32(1000);
    const counts = [0, 0, 0];
    for (let i = 0; i < 3000; i++) {
      const idx = rng.nextInt(0, 2);
      counts[idx] = (counts[idx] ?? 0) + 1;
    }
    counts.forEach(c => {
      expect(c).toBeGreaterThan(750);
      expect(c).toBeLessThan(1250);
    });
  });

  it('sequence is deterministic after many draws', () => {
    const rng = mulberry32(777);
    for (let i = 0; i < 1000; i++) rng.next();
    const rng2 = mulberry32(777);
    for (let i = 0; i < 1000; i++) rng2.next();
    expect(rng.next()).toBe(rng2.next());
  });
});
