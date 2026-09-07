from fastapi import Depends, HTTPException, status
from backend.security.jwt import get_current_user
from backend.models.user import User

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Enforces Role-Based Access Control (RBAC). Requires admin privilege.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator permissions required for this operation."
        )
    if current_user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been suspended."
        )
    return current_user

def require_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Ensures user account is active (not suspended).
    """
    if current_user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been suspended by an Administrator."
        )
    return current_user
