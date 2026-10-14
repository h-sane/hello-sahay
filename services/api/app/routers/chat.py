from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..chat.service import answer
from ..db import get_session
from ..models import AdvisoryChunk

router = APIRouter()


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    lang: Literal["ta", "hi", "en"] = "en"


@router.post("/chat")
def chat(body: ChatIn, session: Session = Depends(get_session)):
    return answer(session, body.message, body.lang)


@router.get("/advisories")
def advisories(lang: Literal["ta", "hi", "en"] | None = None, session: Session = Depends(get_session)):
    """One row per source document, newest first, each with its issuer and link."""
    first_chunks = select(func.min(AdvisoryChunk.id)).group_by(AdvisoryChunk.doc_id)
    if lang:
        first_chunks = first_chunks.where(AdvisoryChunk.lang == lang)
    rows = session.scalars(
        select(AdvisoryChunk).where(AdvisoryChunk.id.in_(first_chunks))
        .order_by(AdvisoryChunk.published.desc().nulls_last(), AdvisoryChunk.id)
    )
    return [{"doc_id": c.doc_id, "title": c.title, "issuer": c.issuer, "url": c.url,
             "published": c.published, "lang": c.lang, "summary": c.text[:300]} for c in rows]
