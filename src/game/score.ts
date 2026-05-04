import type { SessionState } from './session';

export class ScoreCalculator {
  private static readonly THRESHOLDS: ReadonlyArray<readonly [number, number]> = [
    [14, 10],
    [7, 5],
    [0, 1],
  ];

  timeBonusRate(snakeLength: number): number {
    for (const [minLen, rate] of ScoreCalculator.THRESHOLDS) {
      if (snakeLength >= minLen) return rate;
    }
    return 1;
  }

  applyTimeBonus(session: SessionState, delta: number, snakeLength: number): void {
    session.score += this.timeBonusRate(snakeLength) * delta;
  }

  checkMultiplier(session: SessionState, now: number): number {
    const times = session.lastFruitTimes;
    // biome-ignore lint/style/noNonNullAssertion: length === 3 guarantees index 0 exists
    if (times.length === 3 && now - times[0]! <= 10.0) return 2.0;
    return 1.0;
  }
}
