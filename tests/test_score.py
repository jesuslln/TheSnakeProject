import pytest
from collections import deque
from game import ScoreCalculator, SessionState


def make_session(**kwargs):
    defaults = dict(
        score=0.0,
        apples_eaten=0,
        bananas_eaten=0,
        total_fruits=0,
        deaths_this_session=0,
        start_time=0.0,
        pause_accumulated=0.0,
        pause_start=None,
        last_fruit_times=deque(maxlen=3),
        songs_played=set(),
        died_early=False,
    )
    defaults.update(kwargs)
    return SessionState(**defaults)


@pytest.fixture
def calc():
    return ScoreCalculator()


def test_time_bonus_rate_default(calc):
    assert calc.time_bonus_rate(1) == 1


def test_time_bonus_rate_medium(calc):
    assert calc.time_bonus_rate(7) == 5


def test_time_bonus_rate_high(calc):
    assert calc.time_bonus_rate(14) == 10


def test_time_bonus_rate_boundary_6(calc):
    assert calc.time_bonus_rate(6) == 1


def test_time_bonus_rate_boundary_13(calc):
    assert calc.time_bonus_rate(13) == 5


def test_apply_time_bonus_mutates_session(calc):
    session = make_session()
    calc.apply_time_bonus(session, delta=1.0, snake_length=1)
    assert session.score == pytest.approx(1.0)


def test_apply_time_bonus_high_rate(calc):
    session = make_session()
    calc.apply_time_bonus(session, delta=2.0, snake_length=14)
    assert session.score == pytest.approx(20.0)


def test_multiplier_none_initially(calc):
    session = make_session()
    assert calc.check_multiplier(session, now=5.0) == pytest.approx(1.0)


def test_multiplier_3_fruits_within_10s(calc):
    session = make_session(last_fruit_times=deque([0.0, 4.0, 8.0], maxlen=3))
    assert calc.check_multiplier(session, now=8.0) == pytest.approx(2.0)


def test_multiplier_3_fruits_outside_10s(calc):
    session = make_session(last_fruit_times=deque([0.0, 5.0, 12.0], maxlen=3))
    assert calc.check_multiplier(session, now=12.0) == pytest.approx(1.0)


def test_multiplier_only_2_fruits(calc):
    session = make_session(last_fruit_times=deque([0.0, 4.0], maxlen=3))
    assert calc.check_multiplier(session, now=4.0) == pytest.approx(1.0)


def test_multiplier_4th_fruit_resets_window(calc):
    # After 4th fruit, the deque discards the first; new window is [4, 8, 11]
    times = deque([1.0, 4.0, 8.0], maxlen=3)
    times.append(11.0)
    session = make_session(last_fruit_times=times)
    # window = [4, 8, 11], span = 7s → still within 10s
    assert calc.check_multiplier(session, now=11.0) == pytest.approx(2.0)
