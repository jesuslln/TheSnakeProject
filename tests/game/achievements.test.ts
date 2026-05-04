import { describe, expect, it } from 'vitest';
import { checkAchievements, ALL_ACHIEVEMENT_NAMES, TOTAL_SONGS } from '../../src/game/achievements';
import { newSession } from '../../src/game/session';

function noExisting(): Record<string, boolean> {
  return {};
}

function allExisting(): Record<string, boolean> {
  return Object.fromEntries(ALL_ACHIEVEMENT_NAMES.map(n => [n, true]));
}

function makeSession(overrides: Partial<ReturnType<typeof newSession>> = {}) {
  return { ...newSession(0), ...overrides };
}

describe('ALL_ACHIEVEMENT_NAMES', () => {
  it('contains 15 achievements', () => {
    expect(ALL_ACHIEVEMENT_NAMES).toHaveLength(15);
  });

  it('includes mandatory achievement names', () => {
    expect(ALL_ACHIEVEMENT_NAMES).toContain('Snow White and the 7 Apples');
    expect(ALL_ACHIEVEMENT_NAMES).toContain('Canary Island day');
    expect(ALL_ACHIEVEMENT_NAMES).toContain('Snake is my passion');
    expect(ALL_ACHIEVEMENT_NAMES).toContain('Music Enjoyer');
    expect(ALL_ACHIEVEMENT_NAMES).toContain('Music Lover');
  });

  it('has no duplicate names', () => {
    expect(new Set(ALL_ACHIEVEMENT_NAMES).size).toBe(ALL_ACHIEVEMENT_NAMES.length);
  });
});

describe('checkAchievements returns empty', () => {
  it('returns empty when no conditions met', () => {
    const session = makeSession();
    expect(checkAchievements(session, noExisting(), 'eat_apple', 0)).toHaveLength(0);
  });

  it('returns empty when all already earned', () => {
    const session = makeSession({ totalFruits: 9999, applesEaten: 9999, bananasEaten: 9999 });
    expect(checkAchievements(session, allExisting(), 'eat_apple', 9999)).toHaveLength(0);
  });
});

describe('Fruit milestone achievements', () => {
  it('First Bite earned at 1 fruit', () => {
    const session = makeSession({ totalFruits: 1 });
    expect(checkAchievements(session, noExisting(), 'eat_apple', 1)).toContain('First Bite');
  });

  it('First Bite not earned at 0 fruits', () => {
    const session = makeSession({ totalFruits: 0 });
    expect(checkAchievements(session, noExisting(), 'eat_apple', 1)).not.toContain('First Bite');
  });

  it("Kid's Meal earned at 5 fruits", () => {
    const session = makeSession({ totalFruits: 5 });
    expect(checkAchievements(session, noExisting(), 'eat_apple', 1)).toContain("Kid's Meal");
  });

  it('A Fruit Basket earned at 10 fruits', () => {
    const session = makeSession({ totalFruits: 10 });
    expect(checkAchievements(session, noExisting(), 'eat_apple', 1)).toContain('A Fruit Basket');
  });

  it('A Healthy Diet earned at 100 fruits', () => {
    const session = makeSession({ totalFruits: 100 });
    expect(checkAchievements(session, noExisting(), 'eat_apple', 1)).toContain('A Healthy Diet');
  });

  it('A Healthy Diet not earned at 99 fruits', () => {
    const session = makeSession({ totalFruits: 99 });
    expect(checkAchievements(session, noExisting(), 'eat_apple', 1)).not.toContain('A Healthy Diet');
  });
});

describe('Apple achievements', () => {
  it('Snow White and the 7 Apples earned at 7 apples', () => {
    const session = makeSession({ applesEaten: 7 });
    expect(checkAchievements(session, noExisting(), 'eat_apple', 1)).toContain('Snow White and the 7 Apples');
  });

  it('Snow White not earned at 6 apples', () => {
    const session = makeSession({ applesEaten: 6 });
    expect(checkAchievements(session, noExisting(), 'eat_apple', 1)).not.toContain('Snow White and the 7 Apples');
  });

  it('One Apple a day... earned at 30 apples', () => {
    const session = makeSession({ applesEaten: 30 });
    expect(checkAchievements(session, noExisting(), 'eat_apple', 1)).toContain('One Apple a day...');
  });
});

describe('Banana achievements', () => {
  it('King of the Jungle earned at 10 bananas', () => {
    const session = makeSession({ bananasEaten: 10 });
    expect(checkAchievements(session, noExisting(), 'eat_banana', 1)).toContain('King of the Jungle');
  });

  it('Canary Island day earned at 30 bananas', () => {
    const session = makeSession({ bananasEaten: 30 });
    expect(checkAchievements(session, noExisting(), 'eat_banana', 1)).toContain('Canary Island day');
  });

  it('Donkey Kong earned at 100 bananas', () => {
    const session = makeSession({ bananasEaten: 100 });
    expect(checkAchievements(session, noExisting(), 'eat_banana', 1)).toContain('Donkey Kong');
  });

  it('King of the Jungle not earned at 9 bananas', () => {
    const session = makeSession({ bananasEaten: 9 });
    expect(checkAchievements(session, noExisting(), 'eat_banana', 1)).not.toContain('King of the Jungle');
  });
});

describe('Death achievements', () => {
  it('Follow the Light earned on first death', () => {
    const session = makeSession({ deaths: 1 });
    expect(checkAchievements(session, noExisting(), 'die', 10)).toContain('Follow the Light');
  });

  it('A cementery visit earned at 10 deaths', () => {
    const session = makeSession({ deaths: 10 });
    expect(checkAchievements(session, noExisting(), 'die', 10)).toContain('A cementery visit');
  });

  it('Lord of the Dead earned at 1000 deaths', () => {
    const session = makeSession({ deaths: 1000 });
    expect(checkAchievements(session, noExisting(), 'die', 10)).toContain('Lord of the Dead');
  });

  it('Follow the Light not triggered on non-die event', () => {
    const session = makeSession({ deaths: 1 });
    expect(checkAchievements(session, noExisting(), 'eat_apple', 10)).not.toContain('Follow the Light');
  });

  it('Lord of the Dead not triggered on eat event', () => {
    const session = makeSession({ deaths: 1000 });
    expect(checkAchievements(session, noExisting(), 'eat_apple', 10)).not.toContain('Lord of the Dead');
  });
});

describe('Snake is my passion', () => {
  it('earned when dying within 5s', () => {
    const session = makeSession({ startTime: 0, deaths: 1 });
    expect(checkAchievements(session, noExisting(), 'die', 4.9)).toContain('Snake is my passion');
  });

  it('earned exactly at 5s boundary', () => {
    const session = makeSession({ startTime: 0, deaths: 1 });
    const result = checkAchievements(session, noExisting(), 'die', 4.999);
    expect(result).toContain('Snake is my passion');
  });

  it('not earned when dying at or after 5s', () => {
    const session = makeSession({ startTime: 0, deaths: 1 });
    expect(checkAchievements(session, noExisting(), 'die', 5.0)).not.toContain('Snake is my passion');
  });

  it('accounts for paused time', () => {
    const session = makeSession({ startTime: 0, pauseAccumulated: 10, deaths: 1 });
    // gameTime = now(14) - start(0) - paused(10) = 4 → < 5 → earned
    expect(checkAchievements(session, noExisting(), 'die', 14)).toContain('Snake is my passion');
  });
});

describe('Music achievements', () => {
  it('Music Enjoyer earned on song_change with 2 songs played', () => {
    const session = makeSession({ songsPlayed: new Set(['a', 'b']) });
    expect(checkAchievements(session, noExisting(), 'song_change', 1)).toContain('Music Enjoyer');
  });

  it('Music Enjoyer not earned with 1 song played', () => {
    const session = makeSession({ songsPlayed: new Set(['a']) });
    expect(checkAchievements(session, noExisting(), 'song_change', 1)).not.toContain('Music Enjoyer');
  });

  it('Music Enjoyer not triggered on non-song_change event', () => {
    const session = makeSession({ songsPlayed: new Set(['a', 'b', 'c']) });
    expect(checkAchievements(session, noExisting(), 'eat_apple', 1)).not.toContain('Music Enjoyer');
  });

  it('Music Lover earned when all songs played', () => {
    const songs = new Set(Array.from({ length: TOTAL_SONGS }, (_, i) => `song${i}`));
    const session = makeSession({ songsPlayed: songs });
    expect(checkAchievements(session, noExisting(), 'song_change', 1)).toContain('Music Lover');
  });

  it('Music Lover not earned with fewer songs', () => {
    const session = makeSession({ songsPlayed: new Set(['a']) });
    expect(checkAchievements(session, noExisting(), 'song_change', 1)).not.toContain('Music Lover');
  });
});

describe('Achievement deduplication', () => {
  it('already-earned achievement is not re-awarded', () => {
    const session = makeSession({ totalFruits: 1 });
    const existing = { 'First Bite': true };
    expect(checkAchievements(session, existing, 'eat_apple', 1)).not.toContain('First Bite');
  });

  it('multiple achievements can be earned at once', () => {
    const session = makeSession({ totalFruits: 10, applesEaten: 7 });
    const result = checkAchievements(session, noExisting(), 'eat_apple', 1);
    expect(result).toContain('A Fruit Basket');
    expect(result).toContain('Snow White and the 7 Apples');
  });

  it('partial existing does not block unearned', () => {
    const session = makeSession({ totalFruits: 10, applesEaten: 7 });
    const existing = { 'A Fruit Basket': true };
    const result = checkAchievements(session, existing, 'eat_apple', 1);
    expect(result).not.toContain('A Fruit Basket');
    expect(result).toContain('Snow White and the 7 Apples');
  });
});
