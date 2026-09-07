import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    phone_number: Optional[str] = None
    country: Optional[str] = None
    profile_photo: Optional[str] = None

class ChangePasswordPayload(BaseModel):
    old_password: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    username: Optional[str] = None
    email: EmailStr
    phone_number: Optional[str] = None
    country: Optional[str] = None
    profile_photo: Optional[str] = None
    role: str
    status: str
    subscription_plan: str
    storage_used: int
    email_verified: bool
    created_at: datetime.datetime
