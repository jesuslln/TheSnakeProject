from collections import deque


class Snake:
    def __init__(
        self, start_col: int, start_row: int, grid_cols: int, grid_rows: int
    ) -> None:
        self._cols = grid_cols
        self._rows = grid_rows
        self._body: deque[tuple[int, int]] = deque(
            [
                (start_col, start_row),
                (start_col - 1, start_row),
                (start_col - 2, start_row),
            ]
        )
        self._direction: tuple[int, int] = (1, 0)
        self._pending: tuple[int, int] = (1, 0)
        self._grew: bool = False

    def set_direction(self, dx: int, dy: int) -> None:
        if (dx, dy) != (-self._direction[0], -self._direction[1]):
            self._pending = (dx, dy)

    def move(self) -> None:
        self._direction = self._pending
        hc, hr = self._body[0]
        new_head = (
            (hc + self._direction[0]) % self._cols,
            (hr + self._direction[1]) % self._rows,
        )
        self._body.appendleft(new_head)
        if not self._grew:
            self._body.pop()
        self._grew = False

    def grow(self) -> None:
        self._grew = True

    def head(self) -> tuple[int, int]:
        return self._body[0]

    def cell_in_front(self) -> tuple[int, int]:
        hc, hr = self._body[0]
        return (
            (hc + self._direction[0]) % self._cols,
            (hr + self._direction[1]) % self._rows,
        )

    def occupies(self, col: int, row: int) -> bool:
        return (col, row) in self._body

    def check_self_collision(self) -> bool:
        head = self._body[0]
        return any(seg == head for seg in list(self._body)[1:])

    @property
    def length(self) -> int:
        return len(self._body)

    def get_body_cells(self) -> list[tuple[int, int]]:
        return list(self._body)
