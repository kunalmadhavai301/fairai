import logging
import os
from backend.config import LOGS_DIR

log_file_path = os.path.join(LOGS_DIR, "surveysnap.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(log_file_path),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("SurveySnapAI")
