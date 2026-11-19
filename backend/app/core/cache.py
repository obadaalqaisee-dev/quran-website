"""A small async-safe TTL cache for upstream responses."""

from __future__ import annotations

import asyncio
import time
from collections import OrderedDict
from collections.abc import Awaitable, Callable
from typing import Any


class TTLCache:
    def __init__(self, ttl_seconds: float, max_items: int = 2048):
        self.ttl = ttl_seconds
        self.max_items = max_items
        self._data: OrderedDict[Any, tuple[float, Any]] = OrderedDict()
        self._locks: dict[Any, asyncio.Lock] = {}

    def get(self, key):
        item = self._data.get(key)
        if item is None:
            return None
        expires, value = item
        if expires < time.monotonic():
            self._data.pop(key, None)
            return None
        self._data.move_to_end(key)
        return value

    def set(self, key, value) -> None:
        self._data[key] = (time.monotonic() + self.ttl, value)
        self._data.move_to_end(key)
        while len(self._data) > self.max_items:
            self._data.popitem(last=False)

    async def get_or_set(self, key, factory: Callable[[], Awaitable[Any]]):
        """Return a cached value, computing it once even under concurrent requests."""
        cached = self.get(key)
        if cached is not None:
            return cached
        lock = self._locks.setdefault(key, asyncio.Lock())
        async with lock:
            cached = self.get(key)
            if cached is None:
                cached = await factory()
                self.set(key, cached)
        self._locks.pop(key, None)
        return cached

    def clear(self) -> None:
        self._data.clear()
