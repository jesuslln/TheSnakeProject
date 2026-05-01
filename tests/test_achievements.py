import pytest
from collections import deque
import utils
from game import AchievementChecker, SessionState


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
def checker():
    return AchievementChecker()


@pytest.fixture
def blank():
    return {name: False for name in utils.get_all_achievement_names()}


def test_snow_white_at_7_apples(checker, blank):
    session = make_session(apples_eaten=7)
    earned = checker.check_all(session, blank, "eat_apple", now=10.0)
    assert "Snow White and the 7 Apples" in earned


def test_snow_white_not_before_7(checker, blank):
    session = make_session(apples_eaten=6)
    earned = checker.check_all(session, blank, "eat_apple", now=10.0)
    assert "Snow White and the 7 Apples" not in earned


def test_snow_white_skipped_if_already_earned(checker, blank):
    blank["Snow White and the 7 Apples"] = True
    session = make_session(apples_eaten=7)
    earned = checker.check_all(session, blank, "eat_apple", now=10.0)
    assert "Snow White and the 7 Apples" not in earned


def test_canary_island_at_30_bananas(checker, blank):
    session = make_session(bananas_eaten=30)
    earned = checker.check_all(session, blank, "eat_banana", now=10.0)
    assert "Canary Island day" in earned


def test_snake_passion_within_5s(checker, blank):
    session = make_session(start_time=0.0, pause_accumulated=0.0)
    earned = checker.check_all(session, blank, "die", now=3.0)
    assert "Snake is my passion" in earned


def test_snake_passion_after_5s_not_earned(checker, blank):
    session = make_session(start_time=0.0, pause_accumulated=0.0)
    earned = checker.check_all(session, blank, "die", now=6.0)
    assert "Snake is my passion" not in earned


def test_snake_passion_uses_game_time_not_wall_time(checker, blank):
    # 8 wall-clock seconds elapsed, but 4 were paused → 4 game seconds → should earn
    session = make_session(start_time=0.0, pause_accumulated=4.0)
    earned = checker.check_all(session, blank, "die", now=8.0)
    assert "Snake is my passion" in earned


def test_follow_the_light_on_first_death(checker, blank):
    session = make_session(deaths_this_session=1)
    earned = checker.check_all(session, blank, "die", now=30.0)
    assert "Follow the Light" in earned


def test_first_bite_on_first_fruit(checker, blank):
    session = make_session(total_fruits=1)
    earned = checker.check_all(session, blank, "eat_apple", now=5.0)
    assert "First Bite" in earned


def test_multiple_achievements_same_event(checker, blank):
    session = make_session(apples_eaten=7, total_fruits=1)
    earned = checker.check_all(session, blank, "eat_apple", now=5.0)
    assert "Snow White and the 7 Apples" in earned
    assert "First Bite" in earned


def test_no_duplicate_earnings(checker, blank):
    blank["First Bite"] = True
    session = make_session(total_fruits=1)
    earned = checker.check_all(session, blank, "eat_apple", now=5.0)
    assert "First Bite" not in earned


def test_music_enjoyer_on_second_song(checker, blank):
    session = make_session(songs_played={"song_a", "song_b"})
    earned = checker.check_all(session, blank, "song_change", now=10.0)
    assert "Music Enjoyer" in earned


def test_music_lover_on_all_songs(checker, blank):
    from utils import get_total_songs
    all_songs = {f"song_{i}" for i in range(get_total_songs())}
    session = make_session(songs_played=all_songs)
    earned = checker.check_all(session, blank, "song_change", now=10.0)
    assert "Music Lover" in earned
