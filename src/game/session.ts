export interface SessionState {
  score: number;
  applesEaten: number;
  bananasEaten: number;
  totalFruits: number;
  deaths: number;
  startTime: number;
  pauseAccumulated: number;
  pauseStart: number | null;
  lastFruitTimes: number[];
  songsPlayed: Set<string>;
  diedEarly: boolean;
}

export function newSession(now: number): SessionState {
  return {
    score: 0,
    applesEaten: 0,
    bananasEaten: 0,
    totalFruits: 0,
    deaths: 0,
    startTime: now,
    pauseAccumulated: 0,
    pauseStart: null,
    lastFruitTimes: [],
    songsPlayed: new Set(),
    diedEarly: false,
  };
}

export function pushFruitTime(session: SessionState, now: number): void {
  session.lastFruitTimes.push(now);
  if (session.lastFruitTimes.length > 3) {
    session.lastFruitTimes.shift();
  }
}
