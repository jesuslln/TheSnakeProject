import pytest
from snake import Snake

COLS, ROWS = 40, 40


@pytest.fixture
def s():
    return Snake(start_col=20, start_row=20, grid_cols=COLS, grid_rows=ROWS)


def test_initial_length_is_3(s):
    assert s.length == 3


def test_initial_head_position(s):
    assert s.head() == (20, 20)


def test_move_advances_head_right(s):
    s.move()
    assert s.head() == (21, 20)


def test_move_maintains_length(s):
    s.move()
    assert s.length == 3


def test_wrap_right(s):
    s._body = __import__("collections").deque([(COLS - 1, 20), (COLS - 2, 20), (COLS - 3, 20)])
    s._direction = (1, 0)
    s._pending = (1, 0)
    s.move()
    assert s.head() == (0, 20)


def test_wrap_left(s):
    s._body = __import__("collections").deque([(0, 20), (1, 20), (2, 20)])
    s._direction = (-1, 0)
    s._pending = (-1, 0)
    s.move()
    assert s.head() == (COLS - 1, 20)


def test_wrap_bottom(s):
    s._body = __import__("collections").deque([(20, ROWS - 1), (20, ROWS - 2), (20, ROWS - 3)])
    s._direction = (0, 1)
    s._pending = (0, 1)
    s.move()
    assert s.head() == (20, 0)


def test_wrap_top(s):
    s._body = __import__("collections").deque([(20, 0), (20, 1), (20, 2)])
    s._direction = (0, -1)
    s._pending = (0, -1)
    s.move()
    assert s.head() == (20, ROWS - 1)


def test_grow_prevents_tail_removal(s):
    s.grow()
    s.move()
    assert s.length == 4


def test_grow_resets_after_move(s):
    s.grow()
    s.move()
    s.move()
    assert s.length == 4  # only grew once


def test_set_direction_rejects_180_opposite(s):
    s._direction = (1, 0)
    s.set_direction(-1, 0)
    s.move()
    assert s.head()[0] == 21  # still moved right


def test_set_direction_accepts_90(s):
    s._direction = (1, 0)
    s.set_direction(0, -1)
    s.move()
    col, row = s.head()
    assert col == 20 and row == 19


def test_self_collision_false_normal(s):
    s.move()
    assert s.check_self_collision() is False


def test_self_collision_true(s):
    from collections import deque
    # Artificially place head on a body cell
    s._body = deque([(5, 5), (5, 4), (5, 5)])
    assert s.check_self_collision() is True


def test_cell_in_front_matches_next_head(s):
    front = s.cell_in_front()
    s.move()
    assert s.head() == front


def test_occupies_head(s):
    assert s.occupies(20, 20) is True


def test_occupies_body(s):
    assert s.occupies(19, 20) is True


def test_occupies_outside(s):
    assert s.occupies(0, 0) is False


def test_get_body_cells_is_copy(s):
    cells = s.get_body_cells()
    cells.clear()
    assert s.length == 3  # original unaffected
