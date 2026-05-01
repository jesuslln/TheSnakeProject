from __future__ import annotations

import math
import random
import time
from collections import deque
from dataclasses import dataclass, field
from enum import IntEnum

import utils


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class GameState(IntEnum):
    NAME_ENTRY = 0
    PLAYING = 1
    SETTINGS = 2
    GAME_OVER = 3


class Action(IntEnum):
    NONE = 0
    UP = 1
    DOWN = 2
    LEFT = 3
    RIGHT = 4
    PAUSE = 5
    CONFIRM = 6
    QUIT = 7


# ---------------------------------------------------------------------------
# Session state
# ---------------------------------------------------------------------------

@dataclass
class SessionState:
    score: float
    apples_eaten: int
    bananas_eaten: int
    total_fruits: int
    deaths_this_session: int
    start_time: float
    pause_accumulated: float
    pause_start: float | None
    last_fruit_times: deque
    songs_played: set
    died_early: bool


def _new_session() -> SessionState:
    return SessionState(
        score=0.0,
        apples_eaten=0,
        bananas_eaten=0,
        total_fruits=0,
        deaths_this_session=0,
        start_time=time.monotonic(),
        pause_accumulated=0.0,
        pause_start=None,
        last_fruit_times=deque(maxlen=3),
        songs_played=set(),
        died_early=False,
    )


# ---------------------------------------------------------------------------
# Obstacle
# ---------------------------------------------------------------------------

@dataclass
class Obstacle:
    cells: list[tuple[int, int]]
    spawn_time: float
    duration: float = 10.0


class ObstacleManager:
    SPAWN_INTERVAL = 30.0

    def __init__(self, grid_cols: int, grid_rows: int) -> None:
        self._cols = grid_cols
        self._rows = grid_rows
        self.obstacles: list[Obstacle] = []
        self._last_spawn: float = 0.0

    def reset(self, now: float) -> None:
        self.obstacles.clear()
        self._last_spawn = now

    def update(self, now: float, elapsed_game_time: float,
               snake_body: list[tuple[int, int]]) -> None:
        self.obstacles = [o for o in self.obstacles
                          if now - o.spawn_time < o.duration]

        if now - self._last_spawn >= self.SPAWN_INTERVAL:
            length = min(3, math.floor(elapsed_game_time / 60) + 1)
            cells = self._pick_wall(length, snake_body)
            if cells:
                self.obstacles.append(Obstacle(cells=cells, spawn_time=now))
            self._last_spawn = now

    def _pick_wall(self, length: int,
                   snake_body: list[tuple[int, int]]) -> list[tuple[int, int]] | None:
        occupied = set(snake_body) | {c for o in self.obstacles for c in o.cells}
        for _ in range(20):
            orientation = random.choice(("H", "V"))
            if orientation == "H":
                col = random.randint(0, self._cols - length)
                row = random.randint(0, self._rows - 1)
                cells = [(col + i, row) for i in range(length)]
            else:
                col = random.randint(0, self._cols - 1)
                row = random.randint(0, self._rows - length)
                cells = [(col, row + i) for i in range(length)]
            if not any(c in occupied for c in cells):
                return cells
        return None

    def check_collision(self, col: int, row: int) -> bool:
        return any((col, row) in o.cells for o in self.obstacles)

    def get_all_cells(self) -> list[tuple[int, int]]:
        return [c for o in self.obstacles for c in o.cells]

    def offset_timers(self, delta: float) -> None:
        self._last_spawn += delta


# ---------------------------------------------------------------------------
# Score calculator
# ---------------------------------------------------------------------------

class ScoreCalculator:
    TIME_THRESHOLDS = [(14, 10), (7, 5), (0, 1)]

    def time_bonus_rate(self, snake_length: int) -> int:
        for min_len, rate in self.TIME_THRESHOLDS:
            if snake_length >= min_len:
                return rate
        return 1

    def apply_time_bonus(self, session: SessionState, delta: float,
                         snake_length: int) -> None:
        session.score += self.time_bonus_rate(snake_length) * delta

    def check_multiplier(self, session: SessionState, now: float) -> float:
        times = session.last_fruit_times
        if len(times) == 3 and now - times[0] <= 10.0:
            return 2.0
        return 1.0


# ---------------------------------------------------------------------------
# Achievement checker
# ---------------------------------------------------------------------------

class AchievementChecker:
    def check_all(self, session: SessionState, existing: dict[str, bool],
                  event: str, now: float) -> list[str]:
        earned: list[str] = []

        def _check(name: str, condition: bool) -> None:
            if not existing.get(name, False) and condition:
                earned.append(name)

        game_time = (now - session.start_time) - session.pause_accumulated

        # Fruit milestones
        _check("First Bite", session.total_fruits >= 1)
        _check("Kid's Meal", session.total_fruits >= 5)
        _check("A Fruit Basket", session.total_fruits >= 10)
        _check("A Healthy Diet", session.total_fruits >= 100)
        _check("Snow White and the 7 Apples", session.apples_eaten >= 7)
        _check("One Apple a day...", session.apples_eaten >= 30)
        _check("King of the Jungle", session.bananas_eaten >= 10)
        _check("Canary Island day", session.bananas_eaten >= 30)
        _check("Donkey Kong", session.bananas_eaten >= 100)

        # Death milestones
        if event == "die":
            _check("Follow the Light", session.deaths_this_session >= 1)
            _check("A cementery visit", session.deaths_this_session >= 10)
            _check("Lord of the Dead", session.deaths_this_session >= 1000)
            _check("Snake is my passion", game_time < 5.0)

        # Music easter eggs
        if event == "song_change":
            _check("Music Enjoyer", len(session.songs_played) >= 2)
            _check("Music Lover",
                   len(session.songs_played) >= utils.get_total_songs())

        return earned


# ---------------------------------------------------------------------------
# Input translation (only place pygame key constants are used for game logic)
# ---------------------------------------------------------------------------

def events_to_actions(events: list) -> list[Action]:
    import pygame
    actions: list[Action] = []
    for event in events:
        if event.type == pygame.QUIT:
            actions.append(Action.QUIT)
        elif event.type == pygame.KEYDOWN:
            match event.key:
                case pygame.K_UP | pygame.K_w:
                    actions.append(Action.UP)
                case pygame.K_DOWN | pygame.K_s:
                    actions.append(Action.DOWN)
                case pygame.K_LEFT | pygame.K_a:
                    actions.append(Action.LEFT)
                case pygame.K_RIGHT | pygame.K_d:
                    actions.append(Action.RIGHT)
                case pygame.K_p:
                    actions.append(Action.PAUSE)
                case pygame.K_SPACE:
                    actions.append(Action.CONFIRM)
                case pygame.K_ESCAPE:
                    actions.append(Action.QUIT)
    return actions


# ---------------------------------------------------------------------------
# Main Game class
# ---------------------------------------------------------------------------

class Game:
    SCREEN_WIDTH = 800
    SCREEN_HEIGHT = 800
    GRID_COLS = 40
    GRID_ROWS = 40
    DEFAULT_FPS = 10

    def __init__(self) -> None:
        import pygame
        from snake import Snake
        from food import FoodManager
        from ui import (ScoreBar, GameBoard, NameEntryScreen,
                        SettingsMenu, GameOverScreen, AchievementNotification)

        pygame.init()
        self._screen = pygame.display.set_mode((self.SCREEN_WIDTH, self.SCREEN_HEIGHT))
        pygame.display.set_caption("Snake")
        self._clock = pygame.time.Clock()

        bar_h = int(self.SCREEN_HEIGHT * 0.10)
        font = pygame.font.SysFont("monospace", 20, bold=True)
        big_font = pygame.font.SysFont("monospace", 32, bold=True)

        import pygame as pg
        board_rect = pg.Rect(0, bar_h, self.SCREEN_WIDTH, self.SCREEN_HEIGHT - bar_h)

        self._score_bar = ScoreBar(self.SCREEN_WIDTH, bar_h, font)
        self._board = GameBoard(board_rect, self.GRID_COLS, self.GRID_ROWS)
        self._name_screen = NameEntryScreen(self.SCREEN_WIDTH, self.SCREEN_HEIGHT, big_font)
        self._settings = SettingsMenu(self.SCREEN_WIDTH, self.SCREEN_HEIGHT, font)
        self._gameover = GameOverScreen(self.SCREEN_WIDTH, self.SCREEN_HEIGHT, big_font)

        self._snake_cls = Snake
        self._food_cls = FoodManager
        self._AchievementNotification = AchievementNotification

        self._score_calc = ScoreCalculator()
        self._achieve_checker = AchievementChecker()

        self._fps: int = self.DEFAULT_FPS
        self._username: str = ""
        self._achievements: dict[str, bool] = {}
        self._notification_queue: deque = deque()
        self._active_notification = None
        self._gear_rect = None

        self._snake = None
        self._food_mgr = None
        self._obstacle_mgr = None
        self._session = None

        saved = utils.get_saved_username()
        if saved:
            self._username = saved
            utils.ensure_user_dir(saved)
            self._achievements = utils.load_achievements(saved)
            self._start_new_game()
            self._state = GameState.PLAYING
        else:
            self._state = GameState.NAME_ENTRY

    # ------------------------------------------------------------------
    # Main loop
    # ------------------------------------------------------------------

    def run(self) -> None:
        import pygame
        running = True
        while running:
            events = pygame.event.get()
            self._handle_events(events)
            if self._state == GameState.PLAYING and self._session is not None:
                delta = self._clock.tick(self._fps) / 1000.0
                self._update(delta)
            else:
                self._clock.tick(60)
            self._render()
            if self._state == GameState.QUIT if hasattr(GameState, "QUIT") else False:
                running = False

    # ------------------------------------------------------------------
    # Event handling
    # ------------------------------------------------------------------

    def _handle_events(self, events: list) -> None:
        import pygame
        for event in events:
            if event.type == pygame.QUIT:
                import sys
                pygame.quit()
                sys.exit()

            if self._state == GameState.NAME_ENTRY:
                name = self._name_screen.handle_event(event)
                if name:
                    self._handle_name_entry_complete(name)
                continue

            if self._state == GameState.SETTINGS:
                result = self._settings.handle_event(event, self._achievements)
                if result:
                    self._handle_settings_change(result)
                    continue

        if self._state not in (GameState.NAME_ENTRY, GameState.SETTINGS):
            actions = events_to_actions(events)
            self._process_actions(actions)

        # Gear icon click
        if self._gear_rect and self._state == GameState.PLAYING:
            import pygame as pg
            for event in events:
                if event.type == pg.MOUSEBUTTONDOWN and event.button == 1:
                    if self._gear_rect.collidepoint(event.pos):
                        self._enter_settings(time.monotonic())

    def _process_actions(self, actions: list[Action]) -> None:
        for action in actions:
            match self._state:
                case GameState.PLAYING:
                    match action:
                        case Action.UP:
                            self._snake.set_direction(0, -1)
                        case Action.DOWN:
                            self._snake.set_direction(0, 1)
                        case Action.LEFT:
                            self._snake.set_direction(-1, 0)
                        case Action.RIGHT:
                            self._snake.set_direction(1, 0)
                        case Action.PAUSE:
                            self._enter_settings(time.monotonic())
                case GameState.SETTINGS:
                    if action in (Action.PAUSE, Action.CONFIRM):
                        self._exit_settings(time.monotonic())
                case GameState.GAME_OVER:
                    if action == Action.CONFIRM:
                        self._start_new_game()
                        self._state = GameState.PLAYING

    def _handle_settings_change(self, result: dict) -> None:
        match result.get("type"):
            case "difficulty":
                self._fps = result["fps"]
            case "song_change":
                song = result.get("song", "")
                self._session.songs_played.add(song)
                self._fire_achievements("song_change")
            case "close":
                self._exit_settings(time.monotonic())

    # ------------------------------------------------------------------
    # Game update
    # ------------------------------------------------------------------

    def _update(self, delta: float) -> None:
        now = time.monotonic()
        self._snake.move()

        # Collision checks
        head = self._snake.head()
        if self._obstacle_mgr.check_collision(*head):
            self._handle_death(now)
            return
        if self._snake.check_self_collision():
            self._handle_death(now)
            return

        # Food
        eaten = self._food_mgr.try_eat(*head)
        if eaten:
            from food import FOOD_POINTS, FoodType
            multiplier = self._score_calc.check_multiplier(self._session, now)
            self._session.score += FOOD_POINTS[eaten.food_type] * multiplier
            self._session.last_fruit_times.append(now)
            self._snake.grow()
            self._session.total_fruits += 1
            if eaten.food_type == FoodType.APPLE:
                self._session.apples_eaten += 1
                self._fire_achievements("eat_apple")
            elif eaten.food_type == FoodType.BANANA:
                self._session.bananas_eaten += 1
                self._fire_achievements("eat_banana")
            else:
                self._fire_achievements("eat_golden")

        elapsed = (now - self._session.start_time) - self._session.pause_accumulated
        self._food_mgr.update(now, self._snake.get_body_cells(), self._snake.cell_in_front())
        self._obstacle_mgr.update(now, elapsed, self._snake.get_body_cells())

        self._score_calc.apply_time_bonus(self._session, delta, self._snake.length)

        # Notification queue
        if self._active_notification and now > self._active_notification.display_until:
            self._active_notification = None
        if self._active_notification is None and self._notification_queue:
            self._active_notification = self._notification_queue.popleft()

    def _fire_achievements(self, event: str) -> None:
        now = time.monotonic()
        new_names = self._achieve_checker.check_all(
            self._session, self._achievements, event, now)
        for name in new_names:
            self._achievements[name] = True
            self._notify_achievement(name, now)
        if new_names:
            utils.save_achievements(self._username, self._achievements)

    # ------------------------------------------------------------------
    # Rendering
    # ------------------------------------------------------------------

    def _render(self) -> None:
        import pygame
        self._screen.fill((10, 10, 10))

        if self._state == GameState.NAME_ENTRY:
            self._name_screen.draw(self._screen)
        else:
            self._board.draw(
                self._screen,
                self._snake.get_body_cells() if self._snake else [],
                self._food_mgr.get_all_items() if self._food_mgr else [],
                self._obstacle_mgr.get_all_cells() if self._obstacle_mgr else [],
            )
            self._gear_rect = self._score_bar.draw(
                self._screen,
                int(self._session.score) if self._session else 0,
                self._active_notification,
            )
            if self._state == GameState.SETTINGS:
                self._settings.draw(self._screen, self._achievements)
            elif self._state == GameState.GAME_OVER:
                self._gameover.draw(self._screen,
                                    int(self._session.score) if self._session else 0)

        pygame.display.flip()

    # ------------------------------------------------------------------
    # State transitions
    # ------------------------------------------------------------------

    def _enter_settings(self, now: float) -> None:
        self._state = GameState.SETTINGS
        self._session.pause_start = now

    def _exit_settings(self, now: float) -> None:
        if self._session.pause_start is not None:
            pause_dur = now - self._session.pause_start
            self._session.pause_accumulated += pause_dur
            self._session.pause_start = None
            self._food_mgr.offset_timers(pause_dur)
            self._obstacle_mgr.offset_timers(pause_dur)
        self._state = GameState.PLAYING

    def _start_new_game(self) -> None:
        now = time.monotonic()
        self._snake = self._snake_cls(
            start_col=self.GRID_COLS // 2,
            start_row=self.GRID_ROWS // 2,
            grid_cols=self.GRID_COLS,
            grid_rows=self.GRID_ROWS,
        )
        self._food_mgr = self._food_cls(grid_cols=self.GRID_COLS, grid_rows=self.GRID_ROWS)
        self._food_mgr.reset(now)
        self._obstacle_mgr = ObstacleManager(grid_cols=self.GRID_COLS, grid_rows=self.GRID_ROWS)
        self._obstacle_mgr.reset(now)
        self._session = _new_session()
        self._notification_queue.clear()
        self._active_notification = None
        self._state = GameState.PLAYING

    def _handle_death(self, now: float) -> None:
        self._session.deaths_this_session += 1
        game_time = (now - self._session.start_time) - self._session.pause_accumulated
        if game_time < 5.0:
            self._session.died_early = True
        self._fire_achievements("die")
        duration = (now - self._session.start_time) - self._session.pause_accumulated
        utils.save_highscore(self._username, int(self._session.score), duration)
        self._state = GameState.GAME_OVER

    def _handle_name_entry_complete(self, name: str) -> None:
        self._username = name
        utils.save_config({"username": name})
        utils.ensure_user_dir(name)
        self._achievements = utils.load_achievements(name)
        self._start_new_game()

    def _notify_achievement(self, name: str, now: float) -> None:
        notif = self._AchievementNotification(title=name, display_until=now + 4.0)
        self._notification_queue.append(notif)


if __name__ == "__main__":
    Game().run()
