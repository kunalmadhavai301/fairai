import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SQLITE_DB_PATH = BASE_DIR / "sentinel.db"
