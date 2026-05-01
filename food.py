import random
from dataclasses import dataclass
from enum import IntEnum


class FoodType(IntEnum):
    APPLE = 0
    BANANA = 1
    GOLDEN_APPLE = 2


FOOD_POINTS: dict[FoodType, int] = {
    FoodType.APPLE: 25,
    FoodType.BANANA: 50,
    FoodType.GOLDEN_APPLE: 200,
}

REGULAR_INTERVAL = 5.0
GOLDEN_INTERVAL = 30.0
MAX_REGULAR_FOOD = 3


@dataclass
class FoodItem:
    col: int
    row: int
    food_type: FoodType
    spawn_time: float


class FoodManager:
    def __init__(self, grid_cols: int, grid_rows: int) -> None:
        self._cols = grid_cols
        self._rows = grid_rows
        self.items: list[FoodItem] = []
        self.golden: FoodItem | None = None
        self._last_regular_spawn: float = 0.0
        self._last_golden_spawn: float = 0.0

    def reset(self, now: float) -> None:
        self.items.clear()
        self.golden = None
        self._last_regular_spawn = now
        self._last_golden_spawn = now

    def update(self, now: float, snake_body: list[tuple[int, int]],
               snake_head_next: tuple[int, int]) -> None:
        existing = [(i.col, i.row) for i in self.items]
        if self.golden:
            existing.append((self.golden.col, self.golden.row))

        # Regular food
        if len(self.items) == 0:
            self._spawn_regular(now, snake_body, snake_head_next, existing)
        elif now - self._last_regular_spawn >= REGULAR_INTERVAL and len(self.items) < MAX_REGULAR_FOOD:
            self._spawn_regular(now, snake_body, snake_head_next, existing)

        # Golden apple
        if self.golden is None and now - self._last_golden_spawn >= GOLDEN_INTERVAL:
            existing2 = [(i.col, i.row) for i in self.items]
            cell = self._find_valid_cell(snake_body, snake_head_next, existing2)
            if cell:
                self.golden = FoodItem(cell[0], cell[1], FoodType.GOLDEN_APPLE, now)
                self._last_golden_spawn = now

    def try_eat(self, col: int, row: int) -> FoodItem | None:
        if self.golden and self.golden.col == col and self.golden.row == row:
            item = self.golden
            self.golden = None
            return item
        for i, item in enumerate(self.items):
            if item.col == col and item.row == row:
                self.items.pop(i)
                return item
        return None

    def get_all_items(self) -> list[FoodItem]:
        return list(self.items) + ([self.golden] if self.golden else [])

    def offset_timers(self, delta: float) -> None:
        self._last_regular_spawn += delta
        self._last_golden_spawn += delta

    def _spawn_regular(self, now: float, snake_body: list[tuple[int, int]],
                       forbidden: tuple[int, int],
                       existing_food: list[tuple[int, int]]) -> None:
        cell = self._find_valid_cell(snake_body, forbidden, existing_food)
        if cell:
            food_type = random.choice([FoodType.APPLE, FoodType.BANANA])
            self.items.append(FoodItem(cell[0], cell[1], food_type, now))
            self._last_regular_spawn = now

    def _find_valid_cell(self, snake_body: list[tuple[int, int]],
                         forbidden: tuple[int, int],
                         existing_food: list[tuple[int, int]]) -> tuple[int, int] | None:
        occupied = set(snake_body) | {forbidden} | set(existing_food)
        free = [(c, r) for c in range(self._cols) for r in range(self._rows)
                if (c, r) not in occupied]
        return random.choice(free) if free else None
