import os
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import SessionLocal, init_db
from .routers import auth, booking, calls, chat, facilities, live


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    with SessionLocal() as session:
        auth.ensure_demo_users(session)
    yield


app = FastAPI(title="Hello Sahay API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get(
        "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api/v1")
for module in (facilities, booking, auth, live, calls, chat):
    api.include_router(module.router)


@api.get("/health")
def health():
    return {"status": "ok"}


app.include_router(api)
app.add_api_route("/health", health)
