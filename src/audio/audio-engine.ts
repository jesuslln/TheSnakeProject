export const TRACK_IDS = ['track_0', 'track_1', 'track_2'] as const;
export type TrackId = (typeof TRACK_IDS)[number];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private trackIdx = 0;
  private readonly createCtx: () => AudioContext;

  constructor(createCtx?: () => AudioContext) {
    if (createCtx) {
      this.createCtx = createCtx;
    } else {
      this.createCtx = () => {
        const W = window as unknown as { webkitAudioContext?: typeof AudioContext };
        const Ctor = window.AudioContext ?? W.webkitAudioContext;
        if (!Ctor) throw new Error('AudioContext not supported');
        return new Ctor();
      };
    }
  }

  init(): void {
    if (this.ctx) return;
    try {
      this.ctx = this.createCtx();
    } catch {
      // Audio unavailable; all play methods will no-op
    }
  }

  getCurrentTrackId(): TrackId {
    // trackIdx is always in [0, TRACK_IDS.length), so the element is always defined
    return TRACK_IDS[this.trackIdx] ?? TRACK_IDS[0];
  }

  nextTrack(): TrackId {
    this.trackIdx = (this.trackIdx + 1) % TRACK_IDS.length;
    if (this.ctx) this.playTrackStab(this.ctx);
    return this.getCurrentTrackId();
  }

  playEat(): void {
    if (!this.ctx) return;
    this.tone(this.ctx, 660, 0.08, 'square', 0.2);
  }

  playGoldenEat(): void {
    if (!this.ctx) return;
    this.tone(this.ctx, 784, 0.07, 'square', 0.2, 0.0);
    this.tone(this.ctx, 988, 0.07, 'square', 0.2, 0.08);
    this.tone(this.ctx, 1175, 0.12, 'square', 0.2, 0.16);
  }

  playDie(): void {
    if (!this.ctx) return;
    this.tone(this.ctx, 440, 0.14, 'sawtooth', 0.18, 0.0);
    this.tone(this.ctx, 330, 0.14, 'sawtooth', 0.18, 0.14);
    this.tone(this.ctx, 220, 0.2, 'sawtooth', 0.18, 0.28);
  }

  playAchievement(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    [523, 659, 784].forEach((freq, i) => {
      this.tone(ctx, freq, 0.15, 'triangle', 0.25, i * 0.1);
    });
  }

  private tone(
    ctx: AudioContext,
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.01);
  }

  // Brief chord sting played when the user switches tracks
  private playTrackStab(ctx: AudioContext): void {
    const chords: [number, number, number][] = [
      [261, 329, 392], // C major  (track_0)
      [220, 262, 330], // A minor  (track_1)
      [196, 247, 294], // G major  (track_2)
    ];
    const chord = chords[this.trackIdx] ?? chords[0] ?? [261, 329, 392];
    chord.forEach((freq, i) => {
      this.tone(ctx, freq, 0.4, 'triangle', 0.12, i * 0.04);
    });
  }
}
