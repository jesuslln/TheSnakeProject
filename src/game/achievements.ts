import type { SessionState } from './session';

export const TOTAL_SONGS = 3;

export const ALL_ACHIEVEMENT_NAMES: readonly string[] = [
  'First Bite',
  "Kid's Meal",
  'A Fruit Basket',
  'A Healthy Diet',
  'Snow White and the 7 Apples',
  'One Apple a day...',
  'King of the Jungle',
  'Canary Island day',
  'Donkey Kong',
  'Follow the Light',
  'A cementery visit',
  'Lord of the Dead',
  'Snake is my passion',
  'Music Enjoyer',
  'Music Lover',
];

export function checkAchievements(
  session: SessionState,
  existing: Readonly<Record<string, boolean>>,
  event: string,
  now: number,
): string[] {
  const earned: string[] = [];

  function check(name: string, condition: boolean): void {
    if (!existing[name] && condition) {
      earned.push(name);
    }
  }

  const gameTime = now - session.startTime - session.pauseAccumulated;

  check('First Bite', session.totalFruits >= 1);
  check("Kid's Meal", session.totalFruits >= 5);
  check('A Fruit Basket', session.totalFruits >= 10);
  check('A Healthy Diet', session.totalFruits >= 100);
  check('Snow White and the 7 Apples', session.applesEaten >= 7);
  check('One Apple a day...', session.applesEaten >= 30);
  check('King of the Jungle', session.bananasEaten >= 10);
  check('Canary Island day', session.bananasEaten >= 30);
  check('Donkey Kong', session.bananasEaten >= 100);

  if (event === 'die') {
    check('Follow the Light', session.deaths >= 1);
    check('A cementery visit', session.deaths >= 10);
    check('Lord of the Dead', session.deaths >= 1000);
    check('Snake is my passion', gameTime < 5.0);
  }

  if (event === 'song_change') {
    check('Music Enjoyer', session.songsPlayed.size >= 2);
    check('Music Lover', session.songsPlayed.size >= TOTAL_SONGS);
  }

  return earned;
}
