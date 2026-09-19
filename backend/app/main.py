"""SkillSwap AI — FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api import auth, bookings, chat, client, creator, gigs, jobs, notifications, reviews, users
from app.config import get_settings
from app.database import Base, engine
from app.utils.rate_limit import limiter

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create tables for local/dev bootstrap; production should use Alembic migrations
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-powered marketplace for students and young creators — "
        "portfolios, intelligent matching, and milestone-safe bookings."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

prefix = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=prefix)
app.include_router(creator.router, prefix=prefix)
app.include_router(gigs.router, prefix=prefix)
app.include_router(client.router, prefix=prefix)
app.include_router(jobs.router, prefix=prefix)
app.include_router(bookings.router, prefix=prefix)
app.include_router(reviews.router, prefix=prefix)
app.include_router(chat.router, prefix=prefix)
app.include_router(notifications.router, prefix=prefix)
app.include_router(users.router, prefix=prefix)


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    if settings.DEBUG:
        return JSONResponse(status_code=500, content={"detail": str(exc)})
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
