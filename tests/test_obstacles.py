import pytest
from game import ObstacleManager

COLS, ROWS = 40, 40
SNAKE = [(20, 20), (19, 20), (18, 20)]


@pytest.fixture
def om():
    mgr = ObstacleManager(grid_cols=COLS, grid_rows=ROWS)
    mgr.reset(now=0.0)
    return mgr


def test_reset_clears_obstacles(om):
    om.update(now=30.1, elapsed_game_time=30.1, snake_body=SNAKE)
    om.reset(now=0.0)
    assert om.obstacles == []


def test_wall_length_minute_1(om):
    om.update(now=30.1, elapsed_game_time=45.0, snake_body=SNAKE)
    assert len(om.obstacles) == 1
    assert len(om.obstacles[0].cells) == 1


def test_wall_length_minute_2(om):
    om.update(now=30.1, elapsed_game_time=90.0, snake_body=SNAKE)
    assert len(om.obstacles[0].cells) == 2


def test_wall_length_minute_3_capped(om):
    om.update(now=30.1, elapsed_game_time=200.0, snake_body=SNAKE)
    assert len(om.obstacles[0].cells) == 3


def test_obstacle_expires_after_10s(om):
    om.update(now=30.1, elapsed_game_time=45.0, snake_body=SNAKE)
    assert len(om.obstacles) == 1
    om.update(now=40.2, elapsed_game_time=55.1, snake_body=SNAKE)
    assert len(om.obstacles) == 0


def test_check_collision_hit(om):
    om.update(now=30.1, elapsed_game_time=45.0, snake_body=SNAKE)
    cell = om.obstacles[0].cells[0]
    assert om.check_collision(cell[0], cell[1]) is True


def test_check_collision_miss(om):
    assert om.check_collision(0, 0) is False


def test_offset_timers(om):
    # After reset at t=0, spawn interval is 30s.
    # Offset by 20s → _last_spawn becomes 20.
    om.offset_timers(20.0)
    # At t=30, only 10s have passed since offset base, so no spawn yet.
    om.update(now=30.0, elapsed_game_time=30.0, snake_body=SNAKE)
    assert len(om.obstacles) == 0
    # At t=50, 30s have passed since the offset base (20) → spawn.
    om.update(now=50.1, elapsed_game_time=50.1, snake_body=SNAKE)
    assert len(om.obstacles) == 1


def test_no_spawn_on_snake_body(om):
    for _ in range(10):
        om.reset(now=0.0)
        om.update(now=30.1, elapsed_game_time=45.0, snake_body=SNAKE)
        for obs in om.obstacles:
            for cell in obs.cells:
                assert cell not in SNAKE


def test_get_all_cells_empty(om):
    assert om.get_all_cells() == []


def test_get_all_cells_after_spawn(om):
    om.update(now=30.1, elapsed_game_time=45.0, snake_body=SNAKE)
    cells = om.get_all_cells()
    assert len(cells) == 1
