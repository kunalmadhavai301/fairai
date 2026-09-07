from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import health, targets, scans, connection, platform

app = FastAPI(title="Sentinel AI Backend", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(targets.router)
app.include_router(scans.router)
app.include_router(connection.router)
app.include_router(platform.router)

