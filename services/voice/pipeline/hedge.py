"""Cut the slow tail of a network call: if it has not finished after `delay` s, start a second identical attempt."""
import asyncio
import logging
from typing import Awaitable, Callable, TypeVar

log = logging.getLogger("sahay.hedge")
T = TypeVar("T")


async def hedged(make: Callable[[], Awaitable[T]], delay: float, name: str = "call") -> T:
    """Only for requests with no side effects (speech synthesis, transcription, a model completion)."""
    tasks = {asyncio.ensure_future(make())}
    done, _ = await asyncio.wait(tasks, timeout=delay)
    if not done:
        log.warning("%s still running after %.1f s, starting a second attempt", name, delay)
        tasks.add(asyncio.ensure_future(make()))
    error: BaseException | None = None
    while tasks:
        done, tasks = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        for t in done:
            if t.exception() is None:
                for p in tasks:
                    p.cancel()
                return t.result()
            error = t.exception()
    raise error
