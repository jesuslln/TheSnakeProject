import pytest
from food import FoodManager, FoodType

COLS, ROWS = 40, 40
SNAKE = [(20, 20), (19, 20), (18, 20)]
FRONT = (21, 20)


@pytest.fixture
def fm():
    mgr = FoodManager(grid_cols=COLS, grid_rows=ROWS)
    mgr.reset(now=0.0)
    return mgr


def test_reset_clears_all_food(fm):
    fm.update(now=0.0, snake_body=SNAKE, snake_head_next=FRONT)
    fm.reset(now=100.0)
    assert fm.get_all_items() == []


def test_spawns_immediately_when_empty(fm):
    # At t=0 with 0 food, should spawn right away
    fm.update(now=0.0, snake_body=SNAKE, snake_head_next=FRONT)
    assert len(fm.items) == 1


def test_no_spawn_before_5s(fm):
    fm.update(now=0.0, snake_body=SNAKE, snake_head_next=FRONT)  # spawns 1
    fm.update(now=2.0, snake_body=SNAKE, snake_head_next=FRONT)  # only 2s later
    assert len(fm.items) == 1


def test_spawns_after_5s(fm):
    fm.update(now=0.0, snake_body=SNAKE, snake_head_next=FRONT)  # spawns 1
    fm.update(now=5.1, snake_body=SNAKE, snake_head_next=FRONT)  # 5.1s later
    assert len(fm.items) == 2


def test_max_3_regular_food(fm):
    fm.update(now=0.0, snake_body=SNAKE, snake_head_next=FRONT)
    fm.update(now=5.1, snake_body=SNAKE, snake_head_next=FRONT)
    fm.update(now=10.2, snake_body=SNAKE, snake_head_next=FRONT)
    fm.update(now=15.3, snake_body=SNAKE, snake_head_next=FRONT)  # should not add 4th
    assert len(fm.items) == 3


def test_golden_spawns_at_30s(fm):
    assert fm.golden is None
    fm.update(now=30.1, snake_body=SNAKE, snake_head_next=FRONT)
    assert fm.golden is not None
    assert fm.golden.food_type == FoodType.GOLDEN_APPLE


def test_golden_does_not_respawn_until_eaten(fm):
    fm.update(now=30.1, snake_body=SNAKE, snake_head_next=FRONT)
    golden_pos = (fm.golden.col, fm.golden.row)
    fm.update(now=61.0, snake_body=SNAKE, snake_head_next=FRONT)
    assert fm.golden is not None  # still the same golden, not a new one
    assert (fm.golden.col, fm.golden.row) == golden_pos


def test_golden_independent_of_cap(fm):
    # Fill regular slots first
    fm.update(now=0.0, snake_body=SNAKE, snake_head_next=FRONT)
    fm.update(now=5.1, snake_body=SNAKE, snake_head_next=FRONT)
    fm.update(now=10.2, snake_body=SNAKE, snake_head_next=FRONT)
    # Golden should still spawn even though regular cap is hit
    fm.update(now=30.1, snake_body=SNAKE, snake_head_next=FRONT)
    assert fm.golden is not None
    assert len(fm.items) == 3  # regular cap unchanged


def test_try_eat_apple_removes_item(fm):
    fm.update(now=0.0, snake_body=SNAKE, snake_head_next=FRONT)
    item = fm.items[0]
    result = fm.try_eat(item.col, item.row)
    assert result is not None
    assert result.col == item.col
    assert len(fm.items) == 0


def test_try_eat_golden_removes_golden(fm):
    fm.update(now=30.1, snake_body=SNAKE, snake_head_next=FRONT)
    g = fm.golden
    result = fm.try_eat(g.col, g.row)
    assert result is not None
    assert fm.golden is None


def test_try_eat_miss_returns_none(fm):
    assert fm.try_eat(0, 0) is None


def test_offset_timers_advances_both_clocks(fm):
    fm.update(now=0.0, snake_body=SNAKE, snake_head_next=FRONT)  # spawns 1 at t=0
    fm.offset_timers(10.0)
    # After offset, the 5s interval should fire again at 5s relative to new base
    fm.update(now=5.1, snake_body=SNAKE, snake_head_next=FRONT)
    # Without offset this would have spawned at t=5.1, but after offset
    # the last_spawn was moved to t=10, so 5.1 < 10 → no spawn
    assert len(fm.items) == 1


def test_no_spawn_on_snake_body(fm):
    # Use a snake that fills almost the entire grid to force exhaustion check
    # Instead, verify that no spawned cell is ever in the snake body
    for _ in range(20):
        fm.reset(now=0.0)
        fm.update(now=0.0, snake_body=SNAKE, snake_head_next=FRONT)
        for item in fm.get_all_items():
            assert (item.col, item.row) not in SNAKE


def test_no_spawn_in_front_of_head(fm):
    for _ in range(20):
        fm.reset(now=0.0)
        fm.update(now=0.0, snake_body=SNAKE, snake_head_next=FRONT)
        for item in fm.get_all_items():
            assert (item.col, item.row) != FRONT


def test_spawns_on_empty_board_succeeds(fm):
    fm.update(now=0.0, snake_body=[], snake_head_next=(0, 0))
    assert len(fm.items) == 1


def test_get_all_items_includes_golden(fm):
    fm.update(now=0.0, snake_body=SNAKE, snake_head_next=FRONT)
    fm.update(now=30.1, snake_body=SNAKE, snake_head_next=FRONT)
    all_items = fm.get_all_items()
    types = {i.food_type for i in all_items}
    assert FoodType.GOLDEN_APPLE in types
