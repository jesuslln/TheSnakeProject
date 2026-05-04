import { Snake } from '../game/snake';
import { FoodManager, FoodType, FOOD_POINTS } from '../game/food';
import { ObstacleManager } from '../game/obstacles';
import { ScoreCalculator } from '../game/score';
import { checkAchievements } from '../game/achievements';
import { newSession, pushFruitTime } from '../game/session';
import type { SessionState } from '../game/session';
import { Action, GameState } from '../game/types';
import type { Rng } from '../game/rng';
import type { Storage } from '../storage/storage';
import type { Keyboard } from '../input/keyboard';
import { drawBoard } from '../ui/board';
import { drawScoreBar } from '../ui/score-bar';
import { drawGameOver } from '../ui/game-over';
import { NotificationManager } from '../ui/notifications';
import type { Layout } from '../ui/canvas';
import { DIFFICULTY_FPS, DIFFICULTY_LABEL } from './config';
import type { DifficultyId } from './config';

const COLS = 40;
const ROWS = 40;

export class Orchestrator {
  private state: GameState = GameState.NAME_ENTRY;
  private playerName = '';
  private difficultyId: DifficultyId = 'normal';

  private snake!: Snake;
  private food!: FoodManager;
  private obstacles!: ObstacleManager;
  private readonly scoreCalc = new ScoreCalculator();
  private session!: SessionState;

  private cumulativeDeaths = 0;
  private achievements: Record<string, boolean> = {};
  private highScore = 0;
  private isNewHighScore = false;

  private gameTime = 0;
  private readonly notifications = new NotificationManager();

  private onOpenSettings: () => void = () => {};

  constructor(
    private readonly storage: Storage,
    private readonly rng: Rng,
    private readonly keyboard: Keyboard,
  ) {}

  async init(): Promise<void> {
    const name = await this.storage.get<string>('playerName');
    if (name !== undefined) this.playerName = name;
    const hs = await this.storage.get<number>('highScore');
    if (hs !== undefined) this.highScore = hs;
    const ach = await this.storage.get<Record<string, boolean>>('achievements');
    if (ach !== undefined) this.achievements = { ...ach };
    const diff = await this.storage.get<DifficultyId>('difficulty');
    if (diff !== undefined) this.difficultyId = diff;
    const deaths = await this.storage.get<number>('cumulativeDeaths');
    if (deaths !== undefined) this.cumulativeDeaths = deaths;
  }

  getState(): GameState {
    return this.state;
  }

  getTickInterval(): number {
    return 1 / DIFFICULTY_FPS[this.difficultyId];
  }

  getPlayerName(): string {
    return this.playerName;
  }

  getDifficultyId(): DifficultyId {
    return this.difficultyId;
  }

  setOpenSettingsCallback(cb: () => void): void {
    this.onOpenSettings = cb;
  }

  submitName(name: string): void {
    this.playerName = name.trim() || 'Player';
    void this.storage.set('playerName', this.playerName);
    this.startGame();
  }

  startGame(): void {
    this.snake = new Snake(Math.floor(COLS / 2), Math.floor(ROWS / 2), COLS, ROWS);
    this.food = new FoodManager(COLS, ROWS, this.rng);
    this.obstacles = new ObstacleManager(COLS, ROWS, this.rng);
    this.session = newSession(0);
    this.session.deaths = this.cumulativeDeaths;
    this.gameTime = 0;
    this.isNewHighScore = false;
    this.food.reset(0);
    this.obstacles.reset(0);
    this.state = GameState.PLAYING;
  }

  openSettings(): void {
    this.state = GameState.SETTINGS;
    this.keyboard.setEnabled(false);
    this.onOpenSettings();
  }

  applySettings(difficulty: DifficultyId): void {
    this.difficultyId = difficulty;
    void this.storage.set('difficulty', this.difficultyId);
    this.state = GameState.PLAYING;
    this.keyboard.setEnabled(true);
  }

  tick(dt: number): void {
    if (this.state === GameState.GAME_OVER) {
      if (this.keyboard.consume() === Action.CONFIRM) this.startGame();
      return;
    }
    if (this.state === GameState.PLAYING) {
      this.tickPlaying(dt);
    }
  }

  private tickPlaying(dt: number): void {
    const action = this.keyboard.consume();

    if (action === Action.PAUSE) {
      this.openSettings();
      return;
    }

    switch (action) {
      case Action.UP:    this.snake.setDirection(0, -1);  break;
      case Action.DOWN:  this.snake.setDirection(0, 1);   break;
      case Action.LEFT:  this.snake.setDirection(-1, 0);  break;
      case Action.RIGHT: this.snake.setDirection(1, 0);   break;
    }

    this.gameTime += dt;
    this.scoreCalc.applyTimeBonus(this.session, dt, this.snake.length);
    this.snake.move();

    const head = this.snake.head();
    const eaten = this.food.tryEat(head.col, head.row);
    if (eaten) {
      const multiplier = this.scoreCalc.checkMultiplier(this.session, this.gameTime);
      this.session.score += FOOD_POINTS[eaten.foodType] * multiplier;
      pushFruitTime(this.session, this.gameTime);
      this.session.totalFruits++;

      let event: string;
      if (eaten.foodType === FoodType.APPLE) {
        this.session.applesEaten++;
        event = 'eat_apple';
      } else if (eaten.foodType === FoodType.BANANA) {
        this.session.bananasEaten++;
        event = 'eat_banana';
      } else {
        event = 'eat_golden';
      }

      this.snake.grow();
      this.award(checkAchievements(this.session, this.achievements, event, this.gameTime));
    }

    this.food.update(this.gameTime, this.snake.getBodyCells(), this.snake.cellInFront());
    this.obstacles.update(this.gameTime, this.gameTime, this.snake.getBodyCells());

    if (this.obstacles.checkCollision(head.col, head.row) || this.snake.checkSelfCollision()) {
      this.endGame();
    }
  }

  private award(names: string[]): void {
    let anyNew = false;
    for (const name of names) {
      if (!this.achievements[name]) {
        this.achievements[name] = true;
        this.notifications.push(name, this.gameTime);
        anyNew = true;
      }
    }
    if (anyNew) void this.storage.set('achievements', this.achievements);
  }

  private endGame(): void {
    this.cumulativeDeaths++;
    this.session.deaths = this.cumulativeDeaths;
    this.session.diedEarly = this.gameTime < 5;
    void this.storage.set('cumulativeDeaths', this.cumulativeDeaths);

    this.award(checkAchievements(this.session, this.achievements, 'die', this.gameTime));

    if (this.session.score > this.highScore) {
      this.highScore = this.session.score;
      this.isNewHighScore = true;
      void this.storage.set('highScore', this.highScore);
    }

    this.state = GameState.GAME_OVER;
  }

  render(ctx: CanvasRenderingContext2D, layout: Layout): void {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, layout.canvasW, layout.canvasH);

    if (this.state === GameState.NAME_ENTRY) return;

    const multiplierActive =
      this.scoreCalc.checkMultiplier(this.session, this.gameTime) > 1;

    drawScoreBar(ctx, layout, {
      score: this.session.score,
      highScore: this.highScore,
      snakeLength: this.snake.length,
      elapsedSeconds: this.gameTime,
      difficultyLabel: DIFFICULTY_LABEL[this.difficultyId],
      multiplierActive,
    });

    drawBoard(
      ctx,
      layout,
      this.snake.getBodyCells(),
      this.food.getAllItems(),
      this.obstacles.getAllCells(),
    );

    this.notifications.draw(ctx, layout.canvasW, layout.canvasH, this.gameTime);

    if (this.state === GameState.SETTINGS) {
      ctx.fillStyle = 'rgba(10,10,10,0.55)';
      ctx.fillRect(0, 0, layout.canvasW, layout.canvasH);
    }

    if (this.state === GameState.GAME_OVER) {
      drawGameOver(
        ctx,
        layout.canvasW,
        layout.canvasH,
        this.session.score,
        this.highScore,
        this.playerName,
        this.isNewHighScore,
      );
    }
  }
}
