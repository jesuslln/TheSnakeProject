from __future__ import annotations

import time
from dataclasses import dataclass

import pygame

from food import FoodItem, FoodType

# Colours
_BLACK = (0, 0, 0)
_WHITE = (255, 255, 255)
_GREEN = (50, 200, 50)
_DARK_GREEN = (30, 140, 30)
_RED = (200, 50, 50)
_YELLOW = (240, 220, 50)
_GOLD = (255, 200, 0)
_GRAY = (60, 60, 60)
_LIGHT_GRAY = (160, 160, 160)
_BAR_BG = (20, 20, 30)
_OVERLAY = (0, 0, 0, 180)


@dataclass
class AchievementNotification:
    title: str
    display_until: float  # monotonic time


# ---------------------------------------------------------------------------
# Score bar
# ---------------------------------------------------------------------------


class ScoreBar:
    _GEAR_SIZE = 28
    _PAD = 8

    def __init__(
        self, screen_width: int, bar_height: int, font: pygame.font.Font
    ) -> None:
        self._w = screen_width
        self._h = bar_height
        self._font = font

    def draw(
        self,
        surface: pygame.Surface,
        score: int,
        notification: AchievementNotification | None,
    ) -> pygame.Rect:
        pygame.draw.rect(surface, _BAR_BG, (0, 0, self._w, self._h))

        # Gear icon (simple rectangle placeholder)
        gear_rect = pygame.Rect(
            self._w - self._GEAR_SIZE - self._PAD,
            (self._h - self._GEAR_SIZE) // 2,
            self._GEAR_SIZE,
            self._GEAR_SIZE,
        )
        pygame.draw.rect(surface, _LIGHT_GRAY, gear_rect, border_radius=4)
        gear_label = self._font.render("⚙", True, _BLACK)
        surface.blit(gear_label, gear_label.get_rect(center=gear_rect.center))

        # Score text
        score_surf = self._font.render(f"Score: {score}", True, _WHITE)
        score_x = self._w - self._GEAR_SIZE - self._PAD * 2 - score_surf.get_width()
        surface.blit(score_surf, (score_x, (self._h - score_surf.get_height()) // 2))

        # Achievement notification
        if notification:
            notif_surf = self._font.render(f"★ {notification.title}", True, _GOLD)
            surface.blit(
                notif_surf, (self._PAD, (self._h - notif_surf.get_height()) // 2)
            )

        return gear_rect


# ---------------------------------------------------------------------------
# Game board
# ---------------------------------------------------------------------------


class GameBoard:
    def __init__(self, board_rect: pygame.Rect, grid_cols: int, grid_rows: int) -> None:
        self._rect = board_rect
        self._cols = grid_cols
        self._rows = grid_rows
        self._cell_w = board_rect.width // grid_cols
        self._cell_h = board_rect.height // grid_rows

    def cell_to_pixel(self, col: int, row: int) -> tuple[int, int]:
        return (
            self._rect.left + col * self._cell_w,
            self._rect.top + row * self._cell_h,
        )

    def draw(
        self,
        surface: pygame.Surface,
        snake_body: list[tuple[int, int]],
        food_items: list[FoodItem],
        obstacle_cells: list[tuple[int, int]],
    ) -> None:
        pygame.draw.rect(surface, _GRAY, self._rect)

        # Obstacles
        for col, row in obstacle_cells:
            x, y = self.cell_to_pixel(col, row)
            pygame.draw.rect(
                surface, _RED, (x + 1, y + 1, self._cell_w - 2, self._cell_h - 2)
            )

        # Food
        for item in food_items:
            x, y = self.cell_to_pixel(item.col, item.row)
            match item.food_type:
                case FoodType.APPLE:
                    colour = (220, 50, 50)
                case FoodType.BANANA:
                    colour = (240, 220, 50)
                case FoodType.GOLDEN_APPLE:
                    colour = _GOLD
            pygame.draw.ellipse(
                surface, colour, (x + 2, y + 2, self._cell_w - 4, self._cell_h - 4)
            )

        # Snake
        for i, (col, row) in enumerate(snake_body):
            x, y = self.cell_to_pixel(col, row)
            colour = _GREEN if i == 0 else _DARK_GREEN
            pygame.draw.rect(
                surface,
                colour,
                (x + 1, y + 1, self._cell_w - 2, self._cell_h - 2),
                border_radius=3,
            )


# ---------------------------------------------------------------------------
# Name entry screen
# ---------------------------------------------------------------------------


class NameEntryScreen:
    def __init__(
        self, screen_width: int, screen_height: int, font: pygame.font.Font
    ) -> None:
        self._w = screen_width
        self._h = screen_height
        self._font = font
        self.text: str = ""
        self.max_length: int = 20
        self._cursor_visible: bool = True
        self._cursor_tick: float = time.monotonic()

    def handle_event(self, event: pygame.event.Event) -> str | None:
        if event.type != pygame.KEYDOWN:
            return None
        if event.key == pygame.K_RETURN and self.text.strip():
            return self.text.strip()
        if event.key == pygame.K_BACKSPACE:
            self.text = self.text[:-1]
        elif event.unicode.isprintable() and len(self.text) < self.max_length:
            self.text += event.unicode
        return None

    def draw(self, surface: pygame.Surface) -> None:
        surface.fill(_BLACK)
        now = time.monotonic()
        if now - self._cursor_tick > 0.5:
            self._cursor_visible = not self._cursor_visible
            self._cursor_tick = now

        prompt = self._font.render("Enter your name:", True, _WHITE)
        surface.blit(prompt, prompt.get_rect(center=(self._w // 2, self._h // 2 - 40)))

        cursor = "|" if self._cursor_visible else " "
        input_surf = self._font.render(self.text + cursor, True, _GREEN)
        surface.blit(
            input_surf, input_surf.get_rect(center=(self._w // 2, self._h // 2 + 10))
        )

        hint = self._font.render("Press Enter to confirm", True, _LIGHT_GRAY)
        surface.blit(hint, hint.get_rect(center=(self._w // 2, self._h // 2 + 60)))


# ---------------------------------------------------------------------------
# Settings menu
# ---------------------------------------------------------------------------

_DIFFICULTY_OPTIONS: list[tuple[str, int | None]] = [
    ("Slow", 5),
    ("Normal", 10),
    ("Fast", 15),
    ("Custom", None),
]

_PLACEHOLDER_SONGS = ["Song 1", "Song 2", "Song 3"]


class SettingsMenu:
    def __init__(
        self, screen_width: int, screen_height: int, font: pygame.font.Font
    ) -> None:
        self._w = screen_width
        self._h = screen_height
        self._font = font
        self._selected_difficulty: int = 1
        self._custom_fps_input: str = ""
        self._volume: float = 1.0
        self._show_achievements: bool = False
        self._selected_song: int = 0
        self._rects: dict[str, pygame.Rect] = {}

    def handle_event(
        self, event: pygame.event.Event, achievements: dict[str, bool]
    ) -> dict | None:
        if event.type != pygame.KEYDOWN and event.type != pygame.MOUSEBUTTONDOWN:
            return None

        if event.type == pygame.KEYDOWN:
            diff_name, diff_fps = _DIFFICULTY_OPTIONS[self._selected_difficulty]
            if diff_fps is None:  # custom difficulty — accept digit input
                if event.key == pygame.K_BACKSPACE:
                    self._custom_fps_input = self._custom_fps_input[:-1]
                    return None
                if event.unicode.isdigit() and len(self._custom_fps_input) < 2:
                    self._custom_fps_input += event.unicode
                    return None
                if event.key == pygame.K_RETURN and self._custom_fps_input:
                    fps = max(1, min(60, int(self._custom_fps_input)))
                    return {"type": "difficulty", "fps": fps}
            if event.key == pygame.K_p or event.key == pygame.K_ESCAPE:
                return {"type": "close"}

        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            pos = event.pos
            # Difficulty buttons
            for i, (label, fps) in enumerate(_DIFFICULTY_OPTIONS):
                key = f"diff_{i}"
                if key in self._rects and self._rects[key].collidepoint(pos):
                    self._selected_difficulty = i
                    if fps is not None:
                        return {"type": "difficulty", "fps": fps}
                    return None
            # Song buttons
            for i, song in enumerate(_PLACEHOLDER_SONGS):
                key = f"song_{i}"
                if key in self._rects and self._rects[key].collidepoint(pos):
                    prev = self._selected_song
                    self._selected_song = i
                    if i != prev:
                        return {"type": "song_change", "song": song}
                    return None
            # Toggle achievements
            if "ach_toggle" in self._rects and self._rects["ach_toggle"].collidepoint(
                pos
            ):
                self._show_achievements = not self._show_achievements
                return None
            # Close button
            if "close" in self._rects and self._rects["close"].collidepoint(pos):
                return {"type": "close"}

        return None

    def draw(self, surface: pygame.Surface, achievements: dict[str, bool]) -> None:
        overlay = pygame.Surface((self._w, self._h), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 180))
        surface.blit(overlay, (0, 0))

        panel_w, panel_h = 420, 480
        panel_x = (self._w - panel_w) // 2
        panel_y = (self._h - panel_h) // 2
        pygame.draw.rect(
            surface,
            (30, 30, 40),
            (panel_x, panel_y, panel_w, panel_h),
            border_radius=12,
        )

        y = panel_y + 20
        title = self._font.render("SETTINGS", True, _WHITE)
        surface.blit(title, title.get_rect(centerx=self._w // 2, top=y))
        y += 50

        # Difficulty
        diff_label = self._font.render("Difficulty:", True, _LIGHT_GRAY)
        surface.blit(diff_label, (panel_x + 20, y))
        y += 30
        btn_w = 80
        for i, (label, fps) in enumerate(_DIFFICULTY_OPTIONS):
            r = pygame.Rect(panel_x + 20 + i * (btn_w + 8), y, btn_w, 32)
            self._rects[f"diff_{i}"] = r
            colour = _GREEN if i == self._selected_difficulty else _GRAY
            pygame.draw.rect(surface, colour, r, border_radius=6)
            txt = self._font.render(label, True, _WHITE)
            surface.blit(txt, txt.get_rect(center=r.center))
        y += 48

        # Custom FPS input (only shown when Custom is selected)
        if _DIFFICULTY_OPTIONS[self._selected_difficulty][1] is None:
            inp = self._font.render(f"FPS: {self._custom_fps_input}_", True, _YELLOW)
            surface.blit(inp, (panel_x + 20, y))
            y += 36

        # Volume (cosmetic placeholder)
        vol_label = self._font.render(
            f"Volume: {int(self._volume * 100)}%", True, _LIGHT_GRAY
        )
        surface.blit(vol_label, (panel_x + 20, y))
        y += 36

        # Song selector (cosmetic placeholder)
        song_label = self._font.render("Music:", True, _LIGHT_GRAY)
        surface.blit(song_label, (panel_x + 20, y))
        y += 28
        for i, song in enumerate(_PLACEHOLDER_SONGS):
            r = pygame.Rect(panel_x + 20 + i * 120, y, 110, 28)
            self._rects[f"song_{i}"] = r
            colour = _GREEN if i == self._selected_song else _GRAY
            pygame.draw.rect(surface, colour, r, border_radius=5)
            stxt = self._font.render(song, True, _WHITE)
            surface.blit(stxt, stxt.get_rect(center=r.center))
        y += 44

        # Achievements toggle
        ach_r = pygame.Rect(panel_x + 20, y, 200, 30)
        self._rects["ach_toggle"] = ach_r
        pygame.draw.rect(surface, _GRAY, ach_r, border_radius=6)
        ach_txt = self._font.render(
            "Hide Achievements" if self._show_achievements else "Show Achievements",
            True,
            _WHITE,
        )
        surface.blit(ach_txt, ach_txt.get_rect(center=ach_r.center))
        y += 40

        if self._show_achievements:
            earned = [n for n, v in achievements.items() if v]
            for name in earned[:4]:
                line = self._font.render(f"• {name}", True, _GOLD)
                surface.blit(line, (panel_x + 20, y))
                y += 22

        # Close
        close_r = pygame.Rect(panel_x + 20, panel_y + panel_h - 44, panel_w - 40, 32)
        self._rects["close"] = close_r
        pygame.draw.rect(surface, _RED, close_r, border_radius=8)
        close_txt = self._font.render("Close  (P)", True, _WHITE)
        surface.blit(close_txt, close_txt.get_rect(center=close_r.center))


# ---------------------------------------------------------------------------
# Game over screen
# ---------------------------------------------------------------------------


class GameOverScreen:
    def __init__(
        self, screen_width: int, screen_height: int, font: pygame.font.Font
    ) -> None:
        self._w = screen_width
        self._h = screen_height
        self._font = font

    def draw(self, surface: pygame.Surface, final_score: int) -> None:
        overlay = pygame.Surface((self._w, self._h), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 160))
        surface.blit(overlay, (0, 0))

        cx = self._w // 2
        over_surf = self._font.render("GAME OVER", True, _RED)
        surface.blit(
            over_surf, over_surf.get_rect(centerx=cx, centery=self._h // 2 - 50)
        )

        score_surf = self._font.render(f"Score: {final_score}", True, _WHITE)
        surface.blit(score_surf, score_surf.get_rect(centerx=cx, centery=self._h // 2))

        hint_surf = self._font.render("Press Space to play again", True, _LIGHT_GRAY)
        surface.blit(
            hint_surf, hint_surf.get_rect(centerx=cx, centery=self._h // 2 + 50)
        )
