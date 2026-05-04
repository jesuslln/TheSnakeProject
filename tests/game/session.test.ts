import { describe, expect, it } from 'vitest';
import { newSession, pushFruitTime } from '../../src/game/session';

describe('newSession', () => {
  it('score starts at 0', () => {
    expect(newSession(0).score).toBe(0);
  });

  it('applesEaten starts at 0', () => {
    expect(newSession(0).applesEaten).toBe(0);
  });

  it('bananasEaten starts at 0', () => {
    expect(newSession(0).bananasEaten).toBe(0);
  });

  it('totalFruits starts at 0', () => {
    expect(newSession(0).totalFruits).toBe(0);
  });

  it('deaths starts at 0', () => {
    expect(newSession(0).deaths).toBe(0);
  });

  it('sets startTime to given now', () => {
    expect(newSession(42).startTime).toBe(42);
    expect(newSession(100).startTime).toBe(100);
  });

  it('pauseAccumulated starts at 0', () => {
    expect(newSession(0).pauseAccumulated).toBe(0);
  });

  it('pauseStart is null initially', () => {
    expect(newSession(0).pauseStart).toBeNull();
  });

  it('lastFruitTimes starts empty', () => {
    expect(newSession(0).lastFruitTimes).toEqual([]);
  });

  it('songsPlayed starts empty', () => {
    expect(newSession(0).songsPlayed.size).toBe(0);
  });

  it('diedEarly starts false', () => {
    expect(newSession(0).diedEarly).toBe(false);
  });

  it('each call returns independent state', () => {
    const s1 = newSession(0);
    const s2 = newSession(0);
    s1.score = 999;
    expect(s2.score).toBe(0);
  });
});

describe('pushFruitTime', () => {
  it('adds time to empty list', () => {
    const session = newSession(0);
    pushFruitTime(session, 5);
    expect(session.lastFruitTimes).toEqual([5]);
  });

  it('adds a second time', () => {
    const session = newSession(0);
    pushFruitTime(session, 5);
    pushFruitTime(session, 10);
    expect(session.lastFruitTimes).toEqual([5, 10]);
  });

  it('keeps at most 3 times', () => {
    const session = newSession(0);
    pushFruitTime(session, 1);
    pushFruitTime(session, 2);
    pushFruitTime(session, 3);
    pushFruitTime(session, 4);
    expect(session.lastFruitTimes).toHaveLength(3);
  });

  it('removes oldest when over 3', () => {
    const session = newSession(0);
    pushFruitTime(session, 1);
    pushFruitTime(session, 2);
    pushFruitTime(session, 3);
    pushFruitTime(session, 4);
    expect(session.lastFruitTimes).toEqual([2, 3, 4]);
  });

  it('keeps correct order', () => {
    const session = newSession(0);
    pushFruitTime(session, 10);
    pushFruitTime(session, 20);
    pushFruitTime(session, 30);
    expect(session.lastFruitTimes[0]).toBe(10);
    expect(session.lastFruitTimes[2]).toBe(30);
  });
});
