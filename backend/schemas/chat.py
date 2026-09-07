from pydantic import BaseModel
from typing import Optional

class ChatPromptPayload(BaseModel):
    message: str
    file_id: Optional[int] = None
    incident_mode: Optional[bool] = False

class ChatResponse(BaseModel):
    response: str
    action_taken: Optional[str] = None
    action_result: Optional[dict] = None
    edited_file: Optional[str] = None
    generated_report: Optional[str] = None
