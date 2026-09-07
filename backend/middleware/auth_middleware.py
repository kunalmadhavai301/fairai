from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.auth import get_current_user_optional, get_current_user
from backend.database import get_db, User

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Enforces Role-Based Access Control (RBAC). Requires admin privilege.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator permissions required for this operation."
        )
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been suspended."
        )
    return current_user
