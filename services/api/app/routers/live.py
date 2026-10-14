import logging
from collections import defaultdict

import anyio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder

from ..security import HOSPITAL_ROLES, decode_token

log = logging.getLogger("sahay.live")
router = APIRouter()

# facility_id -> {socket: doctor_id or None}. In-process only (one uvicorn worker).
_rooms: dict[int, dict[WebSocket, int | None]] = defaultdict(dict)


def _wanted(message: dict, doctor_id: int | None) -> bool:
    """A doctor's socket only hears about that doctor's own appointments, never calls or other doctors."""
    if doctor_id is None:
        return True
    return message.get("type") == "appointment" and message["appointment"]["doctor"]["id"] == doctor_id


async def _publish(facility_id: int, message: dict) -> None:
    for ws, doctor_id in list(_rooms[facility_id].items()):
        if not _wanted(message, doctor_id):
            continue
        try:
            await ws.send_json(message)
        except Exception:
            log.warning("dropping desk socket for facility %s", facility_id, exc_info=True)
            _rooms[facility_id].pop(ws, None)


def push(facility_ids, message: dict) -> None:
    """Broadcast to Desk sockets. Call from sync route handlers (worker threads)."""
    payload = jsonable_encoder(message)
    for facility_id in set(f for f in facility_ids if f is not None):
        anyio.from_thread.run(_publish, facility_id, payload)


@router.websocket("/live/desk/{facility_id}")
async def desk_socket(ws: WebSocket, facility_id: int, token: str | None = None):
    # Pushes carry patient names and phone numbers, so the socket needs a staff token for this facility.
    claims = decode_token(token) if token else None
    allowed = claims and (claims["role"] == "admin"
                          or (claims["role"] in HOSPITAL_ROLES and claims.get("facility_id") == facility_id))
    if not allowed:
        await ws.close(code=1008)
        return
    await ws.accept()
    _rooms[facility_id][ws] = claims.get("doctor_id") if claims["role"] == "doctor" else None
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        _rooms[facility_id].pop(ws, None)
