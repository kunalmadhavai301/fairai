from pydantic import BaseModel, EmailStr
from typing import Optional

class RegisterPayload(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    username: Optional[str] = None
    phone_number: Optional[str] = None
    country: Optional[str] = None

class LoginPayload(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class RefreshTokenPayload(BaseModel):
    refresh_token: str

class ForgotPasswordPayload(BaseModel):
    email: EmailStr

class ResetPasswordPayload(BaseModel):
    email: EmailStr
    token: str
    new_password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict
