import { Action } from '../game/types';

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

const KEY_MAP: Readonly<Record<string, Action>> = {
  ArrowUp: Action.UP,
  ArrowDown: Action.DOWN,
  ArrowLeft: Action.LEFT,
  ArrowRight: Action.RIGHT,
  w: Action.UP,
  s: Action.DOWN,
  a: Action.LEFT,
  d: Action.RIGHT,
  W: Action.UP,
  S: Action.DOWN,
  A: Action.LEFT,
  D: Action.RIGHT,
  Escape: Action.PAUSE,
  Enter: Action.CONFIRM,
  ' ': Action.CONFIRM,
};

export class Keyboard {
  private pending: Action = Action.NONE;
  private enabled = true;

  constructor() {
    window.addEventListener('keydown', (e: KeyboardEvent) => this.onKey(e));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.push(Action.PAUSE);
    });
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.enabled) return;
    if (ARROW_KEYS.has(e.key)) e.preventDefault();
    const action = KEY_MAP[e.key];
    if (action !== undefined && this.pending === Action.NONE) {
      this.pending = action;
    }
  }

  private push(action: Action): void {
    if (this.pending === Action.NONE) this.pending = action;
  }

  consume(): Action {
    const a = this.pending;
    this.pending = Action.NONE;
    return a;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.pending = Action.NONE;
  }
}
