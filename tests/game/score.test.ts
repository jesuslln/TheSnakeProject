import { describe, expect, it } from 'vitest';
import { ScoreCalculator } from '../../src/game/score';
import { newSession, pushFruitTime } from '../../src/game/session';

function makeCalc(): ScoreCalculator {
  return new ScoreCalculator();
}

describe('ScoreCalculator.timeBonusRate', () => {
  it('returns 1 for length 1', () => {
    expect(makeCalc().timeBonusRate(1)).toBe(1);
  });

  it('returns 1 for length 6', () => {
    expect(makeCalc().timeBonusRate(6)).toBe(1);
  });

  it('returns 5 for length 7', () => {
    expect(makeCalc().timeBonusRate(7)).toBe(5);
  });

  it('returns 5 for length 13', () => {
    expect(makeCalc().timeBonusRate(13)).toBe(5);
  });

  it('returns 10 for length 14', () => {
    expect(makeCalc().timeBonusRate(14)).toBe(10);
  });

  it('returns 10 for length 100', () => {
    expect(makeCalc().timeBonusRate(100)).toBe(10);
  });

  it('boundary: length 0 returns 1', () => {
    expect(makeCalc().timeBonusRate(0)).toBe(1);
  });
});

describe('ScoreCalculator.applyTimeBonus', () => {
  it('increases score by rate * delta for short snake', () => {
    const calc = makeCalc();
    const session = newSession(0);
    calc.applyTimeBonus(session, 2.0, 3);
    expect(session.score).toBeCloseTo(2.0);
  });

  it('increases score by rate * delta for medium snake', () => {
    const calc = makeCalc();
    const session = newSession(0);
    calc.applyTimeBonus(session, 2.0, 7);
    expect(session.score).toBeCloseTo(10.0);
  });

  it('increases score by rate * delta for long snake', () => {
    const calc = makeCalc();
    const session = newSession(0);
    calc.applyTimeBonus(session, 2.0, 14);
    expect(session.score).toBeCloseTo(20.0);
  });

  it('accumulates score across multiple calls', () => {
    const calc = makeCalc();
    const session = newSession(0);
    calc.applyTimeBonus(session, 1.0, 3);
    calc.applyTimeBonus(session, 1.0, 3);
    expect(session.score).toBeCloseTo(2.0);
  });
});

describe('ScoreCalculator.checkMultiplier', () => {
  it('returns 1.0 with no fruits eaten', () => {
    const calc = makeCalc();
    const session = newSession(0);
    expect(calc.checkMultiplier(session, 5)).toBe(1.0);
  });

  it('returns 1.0 with fewer than 3 fruits', () => {
    const calc = makeCalc();
    const session = newSession(0);
    pushFruitTime(session, 1);
    pushFruitTime(session, 2);
    expect(calc.checkMultiplier(session, 5)).toBe(1.0);
  });

  it('returns 2.0 when 3 fruits eaten within 10s', () => {
    const calc = makeCalc();
    const session = newSession(0);
    pushFruitTime(session, 1);
    pushFruitTime(session, 2);
    pushFruitTime(session, 3);
    expect(calc.checkMultiplier(session, 11)).toBe(2.0);
  });

  it('returns 1.0 when 3 fruits but oldest > 10s ago', () => {
    const calc = makeCalc();
    const session = newSession(0);
    pushFruitTime(session, 1);
    pushFruitTime(session, 2);
    pushFruitTime(session, 3);
    expect(calc.checkMultiplier(session, 12)).toBe(1.0);
  });

  it('returns 2.0 at exact 10s boundary', () => {
    const calc = makeCalc();
    const session = newSession(0);
    pushFruitTime(session, 0);
    pushFruitTime(session, 1);
    pushFruitTime(session, 2);
    expect(calc.checkMultiplier(session, 10)).toBe(2.0);
  });

  it('returns 1.0 just past 10s boundary', () => {
    const calc = makeCalc();
    const session = newSession(0);
    pushFruitTime(session, 0);
    pushFruitTime(session, 1);
    pushFruitTime(session, 2);
    expect(calc.checkMultiplier(session, 10.001)).toBe(1.0);
  });
});
