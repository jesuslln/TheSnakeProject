import type { DifficultyId } from '../app/config';

export type { DifficultyId };

export interface SettingsResult {
  difficulty: DifficultyId;
}

const DIFFICULTIES: Array<{ id: DifficultyId; label: string; fps: number }> = [
  { id: 'slow', label: 'Slow', fps: 5 },
  { id: 'normal', label: 'Normal', fps: 10 },
  { id: 'fast', label: 'Fast', fps: 15 },
];

export class SettingsOverlay {
  private readonly el: HTMLDivElement;
  private onClose: (result: SettingsResult) => void = () => {};
  private current: DifficultyId = 'normal';

  constructor() {
    this.el = document.createElement('div');
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-label', 'Settings');
    this.el.style.cssText = [
      'position:fixed;inset:0',
      'display:none;align-items:center;justify-content:center',
      'background:rgba(10,10,10,0.88)',
      'font-family:ui-monospace,Menlo,Consolas,monospace',
      'z-index:20',
    ].join(';');

    const panel = document.createElement('div');
    panel.style.cssText = [
      'background:#1e293b;border:1px solid #334155;border-radius:8px',
      'padding:32px;min-width:260px;color:#e2e8f0',
    ].join(';');

    panel.innerHTML = `
      <h2 style="color:#4ade80;margin-bottom:24px;font-size:1.1rem;letter-spacing:.1em">SETTINGS</h2>
      <fieldset style="border:none;padding:0;margin-bottom:28px">
        <legend style="color:#94a3b8;margin-bottom:12px;font-size:.85rem">Difficulty</legend>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${DIFFICULTIES.map(d => `
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
              <input type="radio" name="diff" value="${d.id}" style="accent-color:#4ade80"/>
              <span style="color:#e2e8f0">${d.label}</span>
              <span style="color:#4b5563;font-size:.8rem">${d.fps} FPS</span>
            </label>
          `).join('')}
        </div>
      </fieldset>
      <button id="settings-resume" style="
        display:block;width:100%;background:#4ade80;color:#0a0a0a;
        font-family:inherit;font-weight:bold;font-size:.95rem;
        padding:10px;border:none;border-radius:4px;cursor:pointer">
        RESUME  (ESC)
      </button>
    `;

    this.el.appendChild(panel);
    document.body.appendChild(this.el);

    // biome-ignore lint/style/noNonNullAssertion: element defined in innerHTML above
    const resumeBtn = panel.querySelector<HTMLButtonElement>('#settings-resume')!;
    resumeBtn.addEventListener('click', () => this.close());

    this.el.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
      if (e.key === 'Tab') this.trapFocus(e);
    });
  }

  private trapFocus(e: KeyboardEvent): void {
    const focusable = Array.from(
      this.el.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled])',
      ),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  private close(): void {
    const checked = this.el.querySelector<HTMLInputElement>('input[name="diff"]:checked');
    const difficulty = (checked?.value ?? this.current) as DifficultyId;
    this.el.style.display = 'none';
    this.onClose({ difficulty });
  }

  show(current: DifficultyId, callback: (result: SettingsResult) => void): void {
    this.current = current;
    this.onClose = callback;
    const radio = this.el.querySelector<HTMLInputElement>(`input[value="${current}"]`);
    if (radio) radio.checked = true;
    this.el.style.display = 'flex';
    const resumeBtn = this.el.querySelector<HTMLButtonElement>('#settings-resume');
    resumeBtn?.focus();
  }

  hide(): void {
    this.el.style.display = 'none';
  }
}
