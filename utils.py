import json
from datetime import date
from pathlib import Path

BASE_DIR = Path(__file__).parent / "local"

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
    data = read_json(get_config_path())
    return data.get("username") if isinstance(data, dict) else None


def save_config(data: dict) -> None:
    write_json(get_config_path(), data)


def ensure_user_dir(username: str) -> None:
    get_save_dir(username).mkdir(parents=True, exist_ok=True)


# --- High scores ---


def load_highscores(username: str) -> list[dict]:
    data = read_json(get_highscores_path(username))
    return data if isinstance(data, list) else []


def save_highscore(username: str, score: int, duration: float) -> None:
    scores = load_highscores(username)
    scores.append(
        {"score": score, "duration": duration, "date": date.today().isoformat()}
    )
    scores.sort(key=lambda e: e["score"], reverse=True)
    write_json(get_highscores_path(username), scores[:10])


# --- Achievements ---


def load_achievements(username: str) -> dict[str, bool]:
    data = read_json(get_achievements_path(username))
    base = {name: False for name in _ALL_ACHIEVEMENT_NAMES}
    if isinstance(data, dict):
        base.update({k: bool(v) for k, v in data.items() if k in base})
    return base


def save_achievements(username: str, achievements: dict[str, bool]) -> None:
    write_json(get_achievements_path(username), achievements)
