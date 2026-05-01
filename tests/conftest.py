import pytest


@pytest.fixture
def tmp_config(tmp_path, monkeypatch):
    """Redirects utils path helpers to tmp_path so no real files are touched."""
    import utils

    monkeypatch.setattr(utils, "BASE_DIR", tmp_path)
    return tmp_path
