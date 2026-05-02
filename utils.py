import json
import sys
from datetime import date
from pathlib import Path

BASE_DIR = Path(__file__).parent / "local"
IS_BROWSER = sys.platform == "emscripten"


class _FileStorage:
    def get(self, key: str):
        try:
            return json.loads((BASE_DIR / key).read_text(encoding="utf-8"))
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def set(self, key: str, data) -> None:
        path = BASE_DIR / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")


class _LocalStorage:
    def __init__(self):
        import platform  # pygbag-injected shim

        self._ls = platform.window.localStorage

    def get(self, key: str):
        raw = self._ls.getItem(f"snake:{key}")
        if raw is None:
            return {}
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {}

    def set(self, key: str, data) -> None:
        self._ls.setItem(f"snake:{key}", json.dumps(data))


storage: _FileStorage | _LocalStorage = (
    _LocalStorage() if IS_BROWSER else _FileStorage()
)

_ALL_ACHIEVEMENT_NAMES: list[str] = [
    # Fruit milestones
    "First Bite",
    "Kid's Meal",
    "A Fruit Basket",
    "A Healthy Diet",
    "King of the Jungle",
    "Snow White and the 7 Apples",
    "Canary Island day",
    "One Apple a day...",
    "Donkey Kong",
    # Death milestones
    "Follow the Light",
    "A cementery visit",
    "Lord of the Dead",
    # Easter eggs
    "Snake is my passion",
    "Music Enjoyer",
    "Music Lover",
]

_TOTAL_SONGS = 3  # placeholder count; update when real songs are added


def get_all_achievement_names() -> list[str]:
    return list(_ALL_ACHIEVEMENT_NAMES)


def get_total_songs() -> int:
    return _TOTAL_SONGS


# --- Path helpers ---


def get_config_path() -> Path:
    return BASE_DIR / "config.json"


def get_save_dir(username: str) -> Path:
    return BASE_DIR / username


def get_highscores_path(username: str) -> Path:
    return get_save_dir(username) / "highscores.json"


def get_achievements_path(username: str) -> Path:
    return get_save_dir(username) / "achievements.json"


# --- JSON helpers ---


def read_json(path: Path) -> dict | list:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def write_json(path: Path, data: dict | list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


# --- Config ---


def get_saved_username() -> str | None:
    data = storage.get("config.json")
    return data.get("username") if isinstance(data, dict) else None


def save_config(data: dict) -> None:
    storage.set("config.json", data)


def ensure_user_dir(username: str) -> None:
    if not IS_BROWSER:
        get_save_dir(username).mkdir(parents=True, exist_ok=True)


# --- High scores ---


def load_highscores(username: str) -> list[dict]:
    data = storage.get(f"{username}/highscores.json")
    return data if isinstance(data, list) else []


def save_highscore(username: str, score: int, duration: float) -> None:
    scores = load_highscores(username)
    scores.append(
        {"score": score, "duration": duration, "date": date.today().isoformat()}
    )
    scores.sort(key=lambda e: e["score"], reverse=True)
    storage.set(f"{username}/highscores.json", scores[:10])


# --- Achievements ---


def load_achievements(username: str) -> dict[str, bool]:
    data = storage.get(f"{username}/achievements.json")
    base = {name: False for name in _ALL_ACHIEVEMENT_NAMES}
    if isinstance(data, dict):
        base.update({k: bool(v) for k, v in data.items() if k in base})
    return base


def save_achievements(username: str, achievements: dict[str, bool]) -> None:
    storage.set(f"{username}/achievements.json", achievements)
