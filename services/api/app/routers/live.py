import logging
from collections import defaultdict

import anyio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder

from ..security import decode_token

log = logging.getLogger("sahay.live")
router = APIRouter()

# facility_id -> connected Desk sockets. In-process only (one uvicorn worker).
_rooms: dict[int, set[WebSocket]] = defaultdict(set)


async def _publish(facility_id: int, message: dict) -> None:
    for ws in list(_rooms[facility_id]):
        try:
            await ws.send_json(message)
        except Exception:
            log.warning("dropping desk socket for facility %s", facility_id, exc_info=True)
            _rooms[facility_id].discard(ws)


def push(facility_ids, message: dict) -> None:
    """Broadcast to Desk sockets. Call from sync route handlers (worker threads)."""
    payload = jsonable_encoder(message)
    for facility_id in set(f for f in facility_ids if f is not None):
        anyio.from_thread.run(_publish, facility_id, payload)


@router.websocket("/live/desk/{facility_id}")
async def desk_socket(ws: WebSocket, facility_id: int, token: str | None = None):
    # The contract has no token on this socket; when one is sent it must match.
    if token is not None:
        claims = decode_token(token)
        if not claims or (claims["role"] == "desk" and claims["facility_id"] != facility_id):
            await ws.close(code=1008)
            return
    await ws.accept()
    _rooms[facility_id].add(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        _rooms[facility_id].discard(ws)
