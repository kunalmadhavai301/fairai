import time
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

class SimpleRateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Sliding window rate limiter middleware protecting backend endpoints.
    Allows max 120 requests per minute per IP address.
    """
    def __init__(self, app, max_requests: int = 120, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()

        # Clean expired timestamps
        timestamps = self.requests.get(client_ip, [])
        timestamps = [ts for ts in timestamps if now - ts < self.window_seconds]

        if len(timestamps) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Too many requests. Please wait a minute."
            )

        timestamps.append(now)
        self.requests[client_ip] = timestamps

        response = await call_next(request)
        return response
