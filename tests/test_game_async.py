import asyncio
import inspect


def test_game_run_is_coroutine_function():
    from game import Game

    assert asyncio.iscoroutinefunction(Game.run)


def test_main_is_coroutine_function():
    import game

    assert asyncio.iscoroutinefunction(game.main)


def test_run_loop_yields_each_frame():
    from game import Game

    src = inspect.getsource(Game.run)
    assert "await asyncio.sleep(0)" in src
