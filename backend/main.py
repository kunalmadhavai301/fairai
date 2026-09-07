import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.database import init_db
from backend.middleware.rate_limiter import SimpleRateLimiterMiddleware
from backend.middleware.security_middleware import SecurityHeadersMiddleware
from backend.routes.auth_routes import router as auth_router
from backend.routes.user_routes import router as user_router
from backend.routes.file_routes import router as file_router
from backend.routes.ai_routes import router as ai_router, alias_router as ai_alias_router
from backend.routes.dashboard_routes import router as dashboard_router
from backend.routes.admin_routes import router as admin_router
from backend.routes.contact_routes import router as contact_router
from backend.routes.onlyoffice_routes import router as onlyoffice_router

# Initialize Database Tables
init_db()

app = FastAPI(
    title="SurveySnap AI Enterprise API",
    description="Production-grade backend for SurveySnap AI document editing platform, ONLYOFFICE Docs integration, tool-calling AI agent, and RBAC governance.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Apply Custom Security Headers & Rate Limiting Middlewares
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(SimpleRateLimiterMiddleware, max_requests=150, window_seconds=60)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(file_router)
app.include_router(ai_router)
app.include_router(ai_alias_router)
app.include_router(dashboard_router)
app.include_router(admin_router)
app.include_router(contact_router)
app.include_router(onlyoffice_router)

# Mount Frontend Single Page Application
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
