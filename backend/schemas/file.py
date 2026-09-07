import datetime
from pydantic import BaseModel
from typing import Optional

class FileEditPayload(BaseModel):
    text: Optional[str] = None
    table_data: Optional[dict] = None
    change_summary: Optional[str] = "Manual Edit"

class FileProtectPayload(BaseModel):
    file_id: int
    password: str

class FileDecryptPayload(BaseModel):
    file_id: int
    password: str

class FileResponse(BaseModel):
    id: int
    user_id: int
    original_filename: str
    edited_filename: Optional[str] = None
    file_size: int
    file_type: str
    encryption_status: bool
    password_protected: bool
    version: int
    upload_date: datetime.datetime
    modification_date: datetime.datetime
