import { describe, expect, it, vi } from 'vitest';
import { AudioEngine, TRACK_IDS } from '../../src/audio/audio-engine';

function makeMockCtx(): AudioContext {
  const osc = {
    type: 'sine' as OscillatorType,
    frequency: { value: 440 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain = {
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
  return {
    createOscillator: vi.fn(() => osc),
    createGain: vi.fn(() => gain),
    destination: {},
    currentTime: 0,
    state: 'running',
  } as unknown as AudioContext;
}

describe('AudioEngine — pre-init no-ops', () => {
  it('playEat does not throw before init', () => {
    const e = new AudioEngine(() => makeMockCtx());
    expect(() => e.playEat()).not.toThrow();
  });

  it('playDie does not throw before init', () => {
    const e = new AudioEngine(() => makeMockCtx());
    expect(() => e.playDie()).not.toThrow();
  });

  it('playGoldenEat does not throw before init', () => {
    const e = new AudioEngine(() => makeMockCtx());
    expect(() => e.playGoldenEat()).not.toThrow();
  });

  it('playAchievement does not throw before init', () => {
    const e = new AudioEngine(() => makeMockCtx());
    expect(() => e.playAchievement()).not.toThrow();
  });

  it('nextTrack does not throw before init', () => {
    const e = new AudioEngine(() => makeMockCtx());
    expect(() => e.nextTrack()).not.toThrow();
  });
});

describe('AudioEngine — track cycling', () => {
  it('starts on track_0', () => {
    const e = new AudioEngine(() => makeMockCtx());
    expect(e.getCurrentTrackId()).toBe('track_0');
  });

  it('nextTrack advances to track_1', () => {
    const e = new AudioEngine(() => makeMockCtx());
    e.nextTrack();
    expect(e.getCurrentTrackId()).toBe('track_1');
  });

  it('nextTrack wraps back to track_0 after last track', () => {
    const e = new AudioEngine(() => makeMockCtx());
    e.nextTrack(); // → track_1
    e.nextTrack(); // → track_2
    e.nextTrack(); // → track_0
    expect(e.getCurrentTrackId()).toBe('track_0');
  });

  it('nextTrack returns the new track id', () => {
    const e = new AudioEngine(() => makeMockCtx());
    expect(e.nextTrack()).toBe('track_1');
  });

  it('covers all TRACK_IDS in one full cycle', () => {
    const e = new AudioEngine(() => makeMockCtx());
    const seen = new Set<string>();
    seen.add(e.getCurrentTrackId());
    for (let i = 1; i < TRACK_IDS.length; i++) {
      seen.add(e.nextTrack());
    }
    expect(seen.size).toBe(TRACK_IDS.length);
    for (const id of TRACK_IDS) {
      expect(seen.has(id)).toBe(true);
    }
  });
});

describe('AudioEngine — init', () => {
  it('init is idempotent: factory called exactly once', () => {
    const factory = vi.fn(() => makeMockCtx());
    const e = new AudioEngine(factory);
    e.init();
    e.init();
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('playEat does not throw after init', () => {
    const e = new AudioEngine(() => makeMockCtx());
    e.init();
    expect(() => e.playEat()).not.toThrow();
  });

  it('playDie does not throw after init', () => {
    const e = new AudioEngine(() => makeMockCtx());
    e.init();
    expect(() => e.playDie()).not.toThrow();
  });

  it('playGoldenEat does not throw after init', () => {
    const e = new AudioEngine(() => makeMockCtx());
    e.init();
    expect(() => e.playGoldenEat()).not.toThrow();
  });

  it('playAchievement does not throw after init', () => {
    const e = new AudioEngine(() => makeMockCtx());
    e.init();
    expect(() => e.playAchievement()).not.toThrow();
  });

  it('nextTrack does not throw after init', () => {
    const e = new AudioEngine(() => makeMockCtx());
    e.init();
    expect(() => e.nextTrack()).not.toThrow();
  });
});

describe('AudioEngine — TRACK_IDS export', () => {
  it('has exactly 3 track ids', () => {
    expect(TRACK_IDS).toHaveLength(3);
  });

  it('all track ids are unique', () => {
    expect(new Set(TRACK_IDS).size).toBe(TRACK_IDS.length);
  });
});
