import { describe, expect, it } from 'vitest';
import { Action, GameState } from '../../src/game/types';

describe('Action enum', () => {
  it('NONE is 0', () => expect(Action.NONE).toBe(0));
  it('UP is 1', () => expect(Action.UP).toBe(1));
  it('DOWN is 2', () => expect(Action.DOWN).toBe(2));
  it('LEFT is 3', () => expect(Action.LEFT).toBe(3));
  it('RIGHT is 4', () => expect(Action.RIGHT).toBe(4));
  it('PAUSE is 5', () => expect(Action.PAUSE).toBe(5));
  it('CONFIRM is 6', () => expect(Action.CONFIRM).toBe(6));
  it('QUIT is 7', () => expect(Action.QUIT).toBe(7));
  it('has 8 distinct values', () => {
    const values = [
      Action.NONE,
      Action.UP,
      Action.DOWN,
      Action.LEFT,
      Action.RIGHT,
      Action.PAUSE,
      Action.CONFIRM,
      Action.QUIT,
    ];
    expect(new Set(values).size).toBe(8);
  });
});

describe('GameState enum', () => {
  it('NAME_ENTRY is 0', () => expect(GameState.NAME_ENTRY).toBe(0));
  it('PLAYING is 1', () => expect(GameState.PLAYING).toBe(1));
  it('SETTINGS is 2', () => expect(GameState.SETTINGS).toBe(2));
  it('GAME_OVER is 3', () => expect(GameState.GAME_OVER).toBe(3));
  it('has 4 distinct values', () => {
    const values = [
      GameState.NAME_ENTRY,
      GameState.PLAYING,
      GameState.SETTINGS,
      GameState.GAME_OVER,
    ];
    expect(new Set(values).size).toBe(4);
  });
});
