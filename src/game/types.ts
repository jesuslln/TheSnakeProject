export enum Action {
  NONE = 0,
  UP = 1,
  DOWN = 2,
  LEFT = 3,
  RIGHT = 4,
  PAUSE = 5,
  CONFIRM = 6,
  QUIT = 7,
  MUSIC_NEXT = 8,
}

export enum GameState {
  NAME_ENTRY = 0,
  PLAYING = 1,
  SETTINGS = 2,
  GAME_OVER = 3,
}

export interface Cell {
  col: number;
  row: number;
}
