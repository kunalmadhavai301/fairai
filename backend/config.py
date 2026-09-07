import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Load .env if present
env_file = BASE_DIR.parent / ".env"
if env_file.exists():
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip().strip("'").strip('"')

# Directory Storage Structure
UPLOADS_DIR = BASE_DIR / "uploads"
REPORTS_DIR = BASE_DIR / "reports"
ANALYTICS_DIR = BASE_DIR / "analytics"
CHATBOT_DIR = BASE_DIR / "chatbot"
LOGS_DIR = BASE_DIR / "logs"
ORIGINALS_DIR = UPLOADS_DIR / "originals"
VERSIONS_DIR = UPLOADS_DIR / "versions"
PROCESSED_DIR = UPLOADS_DIR / "processed"

DATABASE_PATH = BASE_DIR / "surveysnap.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Ensure directories exist
for folder in [UPLOADS_DIR, REPORTS_DIR, ANALYTICS_DIR, CHATBOT_DIR, LOGS_DIR, ORIGINALS_DIR, VERSIONS_DIR, PROCESSED_DIR]:
    folder.mkdir(parents=True, exist_ok=True)

# Security Secrets
SECRET_KEY = os.getenv("JWT_SECRET", "surveysnap_super_secret_jwt_key_2026_production")
REFRESH_SECRET_KEY = os.getenv("JWT_REFRESH_SECRET", "surveysnap_super_secret_refresh_jwt_key_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS = 7  # 7 days

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

def update_env_api_key(key_name: str, key_value: str):
    """
    Updates API Key dynamically in memory and saves to root .env file.
    """
    os.environ[key_name] = key_value
    lines = []
    found = False
    if env_file.exists():
        with open(env_file, "r") as f:
            lines = f.readlines()
    
    new_lines = []
    for line in lines:
        if line.strip().startswith(f"{key_name}="):
            new_lines.append(f"{key_name}={key_value}\n")
            found = True
        else:
            new_lines.append(line)
    
    if not found:
        new_lines.append(f"{key_name}={key_value}\n")
    
    with open(env_file, "w") as f:
        f.writelines(new_lines)
