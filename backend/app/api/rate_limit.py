"""Simple in-memory, per-IP rate limit for the chat endpoint.

Protects the free LLM quota from a single visitor. State is per process,
which is fine for a single Render instance.
"""

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from app.core.config import get_settings

WINDOW_SECONDS = 3600.0

_requests: dict[str, deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    # Render sits behind a proxy, so the real client IP is in X-Forwarded-For
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def chat_rate_limit(request: Request) -> None:
    limit = get_settings().chat_rate_limit_per_hour
    if limit <= 0:
        return

    now = time.monotonic()
    timestamps = _requests[_client_ip(request)]
    while timestamps and now - timestamps[0] > WINDOW_SECONDS:
        timestamps.popleft()

    if len(timestamps) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Chat limit reached. Please try again later.",
        )
    timestamps.append(now)


def reset_rate_limits() -> None:
    _requests.clear()
