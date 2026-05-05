import { Orchestrator } from './app/orchestrator';
import { AudioEngine } from './audio/audio-engine';
import { startEngine } from './engine';
import { mathRng } from './game/rng';
import { Keyboard } from './input/keyboard';
import { LocalStorage } from './storage/local-storage';
import { computeLayout, setupCanvas } from './ui/canvas';
import { NameEntryOverlay } from './ui/name-entry';
import { SettingsOverlay } from './ui/settings';

const canvas = document.getElementById('game') as HTMLCanvasElement;

let layout = computeLayout();
let ctx = setupCanvas(canvas, layout);

const storage = new LocalStorage();
const rng = mathRng();
const keyboard = new Keyboard();
const audio = new AudioEngine();
const orchestrator = new Orchestrator(storage, rng, keyboard, audio);
const nameEntry = new NameEntryOverlay();
const settings = new SettingsOverlay();

orchestrator.setOpenSettingsCallback(() => {
  settings.show(orchestrator.getDifficultyId(), (result) => {
    orchestrator.applySettings(result.difficulty);
  });
});

window.addEventListener('resize', () => {
  layout = computeLayout();
  ctx = setupCanvas(canvas, layout);
});

async function init(): Promise<void> {
  await orchestrator.init();
  nameEntry.show(orchestrator.getPlayerName(), (name) => {
    nameEntry.hide();
    orchestrator.submitName(name);
  });
}

void init();

startEngine(
  () => orchestrator.getTickInterval(),
  (dt) => orchestrator.tick(dt),
  () => orchestrator.render(ctx, layout),
);
