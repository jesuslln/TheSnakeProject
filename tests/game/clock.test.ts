import { describe, expect, it } from 'vitest';
import { fakeClock, realClock } from '../../src/game/clock';

describe('fakeClock', () => {
  it('returns initial time', () => {
    const clk = fakeClock(100);
    expect(clk.now()).toBe(100);
  });

  it('defaults to 0', () => {
    const clk = fakeClock();
    expect(clk.now()).toBe(0);
  });

  it('advance adds to current time', () => {
    const clk = fakeClock(10);
    clk.advance(5);
    expect(clk.now()).toBe(15);
  });

  it('multiple advance calls accumulate', () => {
    const clk = fakeClock(0);
    clk.advance(1);
    clk.advance(2);
    clk.advance(3);
    expect(clk.now()).toBe(6);
  });

  it('set overrides current time', () => {
    const clk = fakeClock(10);
    clk.set(42);
    expect(clk.now()).toBe(42);
  });

  it('set then advance works correctly', () => {
    const clk = fakeClock(0);
    clk.set(100);
    clk.advance(10);
    expect(clk.now()).toBe(110);
  });

  it('now() is idempotent without advance', () => {
    const clk = fakeClock(7);
    expect(clk.now()).toBe(7);
    expect(clk.now()).toBe(7);
    expect(clk.now()).toBe(7);
  });

  it('advance by 0 does not change time', () => {
    const clk = fakeClock(5);
    clk.advance(0);
    expect(clk.now()).toBe(5);
  });
});

describe('realClock', () => {
  it('returns a number', () => {
    const clk = realClock();
    expect(typeof clk.now()).toBe('number');
  });

  it('returns a positive number', () => {
    const clk = realClock();
    expect(clk.now()).toBeGreaterThan(0);
  });

  it('successive calls are non-decreasing', () => {
    const clk = realClock();
    const t1 = clk.now();
    const t2 = clk.now();
    expect(t2).toBeGreaterThanOrEqual(t1);
  });
});
