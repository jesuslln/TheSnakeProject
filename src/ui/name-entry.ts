export class NameEntryOverlay {
  private readonly el: HTMLDivElement;
  private readonly input: HTMLInputElement;
  private onSubmit: (name: string) => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.style.cssText = [
      'position:fixed;inset:0',
      'display:none;flex-direction:column;align-items:center;justify-content:center',
      'background:rgba(10,10,10,0.97)',
      'font-family:ui-monospace,Menlo,Consolas,monospace',
      'color:#e2e8f0',
      'z-index:10',
    ].join(';');

    this.el.innerHTML = `
      <h1 style="color:#4ade80;font-size:2.5rem;letter-spacing:.2em;margin-bottom:8px">SNAKE</h1>
      <p style="color:#374151;margin-bottom:36px;font-size:.85rem">Arrows / WASD · ESC for settings</p>
      <label for="ne-input" style="color:#6b7280;font-size:.85rem;margin-bottom:8px">Your name</label>
      <input id="ne-input" type="text" maxlength="16" autocomplete="off" spellcheck="false"
        style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:10px 18px;
               font-size:1rem;font-family:inherit;border-radius:4px;outline:none;
               text-align:center;width:220px;margin-bottom:20px"/>
      <button id="ne-btn" style="background:#4ade80;color:#0a0a0a;font-family:inherit;
               padding:10px 40px;font-size:1rem;font-weight:bold;border:none;
               border-radius:4px;cursor:pointer">PLAY</button>
    `;

    document.body.appendChild(this.el);

    // biome-ignore lint/style/noNonNullAssertion: elements defined in innerHTML above
    this.input = this.el.querySelector<HTMLInputElement>('#ne-input')!;
    // biome-ignore lint/style/noNonNullAssertion: elements defined in innerHTML above
    const btn = this.el.querySelector<HTMLButtonElement>('#ne-btn')!;

    const submit = () => {
      this.onSubmit(this.input.value.trim() || 'Player');
    };

    btn.addEventListener('click', submit);
    this.input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.stopPropagation();
        submit();
      }
    });
  }

  show(defaultName: string, callback: (name: string) => void): void {
    this.onSubmit = callback;
    this.input.value = defaultName;
    this.el.style.display = 'flex';
    requestAnimationFrame(() => this.input.focus());
  }

  hide(): void {
    this.el.style.display = 'none';
  }
}
