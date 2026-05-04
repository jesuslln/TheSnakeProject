import { describe, expect, it } from 'vitest';
import { mod } from '../../src/game/grid';

describe('mod', () => {
  it('returns same as % for positive inputs', () => {
    expect(mod(7, 40)).toBe(7);
    expect(mod(0, 40)).toBe(0);
    expect(mod(39, 40)).toBe(39);
  });

  it('wraps negative values to non-negative', () => {
    expect(mod(-1, 40)).toBe(39);
    expect(mod(-2, 40)).toBe(38);
    expect(mod(-40, 40)).toBe(0);
  });

  it('handles values equal to n (wraps to 0)', () => {
    expect(mod(40, 40)).toBe(0);
  });

  it('handles values larger than n', () => {
    expect(mod(41, 40)).toBe(1);
    expect(mod(80, 40)).toBe(0);
  });

  it('works for arbitrary grid sizes', () => {
    expect(mod(-1, 20)).toBe(19);
    expect(mod(20, 20)).toBe(0);
  });
});
