export type DifficultyId = 'slow' | 'normal' | 'fast';

export const DIFFICULTY_FPS: Record<DifficultyId, number> = {
  slow: 5,
  normal: 10,
  fast: 15,
};

export const DIFFICULTY_LABEL: Record<DifficultyId, string> = {
  slow: 'SLOW',
  normal: 'NORM',
  fast: 'FAST',
};
