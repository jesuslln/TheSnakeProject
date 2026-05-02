import pytest
import utils


def test_get_saved_username_missing_config(tmp_config):
    assert utils.get_saved_username() is None


def test_save_and_load_config(tmp_config):
    utils.save_config({"username": "testplayer"})
    assert utils.get_saved_username() == "testplayer"


def test_save_highscore_keeps_top_10(tmp_config):
    utils.ensure_user_dir("alice")
    for score in range(1, 12):
        utils.save_highscore("alice", score * 100, float(score))
    scores = utils.load_highscores("alice")
    assert len(scores) == 10
    assert scores[0]["score"] == 1100


def test_highscore_sorted_descending(tmp_config):
    utils.ensure_user_dir("alice")
    for score in [300, 100, 200]:
        utils.save_highscore("alice", score, 10.0)
    scores = utils.load_highscores("alice")
    values = [s["score"] for s in scores]
    assert values == sorted(values, reverse=True)


def test_load_achievements_defaults_false(tmp_config):
    utils.ensure_user_dir("newuser")
    ach = utils.load_achievements("newuser")
    assert isinstance(ach, dict)
    assert all(v is False for v in ach.values())
    assert len(ach) == len(utils.get_all_achievement_names())


def test_save_and_load_achievements(tmp_config):
    utils.ensure_user_dir("bob")
    ach = utils.load_achievements("bob")
    ach["First Bite"] = True
    utils.save_achievements("bob", ach)
    loaded = utils.load_achievements("bob")
    assert loaded["First Bite"] is True


def test_ensure_user_dir_creates_folder(tmp_config):
    utils.ensure_user_dir("charlie")
    assert (tmp_config / "charlie").is_dir()


def test_read_json_handles_missing_file(tmp_config):
    result = utils.read_json(tmp_config / "nonexistent.json")
    assert result in ({}, [])


def test_read_json_handles_corrupt_json(tmp_config):
    bad = tmp_config / "bad.json"
    bad.write_text("not json{{{{")
    result = utils.read_json(bad)
    assert result in ({}, [])


def test_highscores_empty_for_new_user(tmp_config):
    utils.ensure_user_dir("fresh")
    assert utils.load_highscores("fresh") == []


def test_highscore_includes_duration(tmp_config):
    utils.ensure_user_dir("dave")
    utils.save_highscore("dave", 500, 42.5)
    scores = utils.load_highscores("dave")
    assert scores[0]["duration"] == pytest.approx(42.5)


# --- Storage abstraction TDD ---


def test_is_browser_false_on_desktop():
    assert utils.IS_BROWSER is False


def test_file_storage_roundtrip(tmp_config):
    utils.storage.set("alice/highscores.json", [{"score": 100}])
    assert utils.storage.get("alice/highscores.json") == [{"score": 100}]


def test_file_storage_missing_key_returns_empty(tmp_config):
    assert utils.storage.get("nonexistent.json") == {}


def test_ensure_user_dir_noop_on_browser(tmp_config, monkeypatch):
    monkeypatch.setattr(utils, "IS_BROWSER", True)
    utils.ensure_user_dir("bob")
    assert not (utils.BASE_DIR / "bob").exists()


class _FakeJS:
    def __init__(self):
        self._d = {}

    def getItem(self, k):
        return self._d.get(k)

    def setItem(self, k, v):
        self._d[k] = v


def test_localstorage_backend_roundtrip():
    backend = utils._LocalStorage.__new__(utils._LocalStorage)
    backend._ls = _FakeJS()
    backend.set("config.json", {"username": "carol"})
    assert backend.get("config.json") == {"username": "carol"}
    assert backend.get("missing.json") == {}


def test_localstorage_backend_handles_corrupt_json():
    fake = _FakeJS()
    fake._d["snake:x"] = "{not json"
    backend = utils._LocalStorage.__new__(utils._LocalStorage)
    backend._ls = fake
    assert backend.get("x") == {}
