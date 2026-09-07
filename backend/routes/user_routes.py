from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.activity_log import ActivityLog
from backend.security.jwt import get_current_user
from backend.security.password import hash_password, verify_password
from backend.schemas.user import UserProfileUpdate, ChangePasswordPayload

router = APIRouter(prefix="/api/users", tags=["User Profile"])

@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "username": current_user.username,
        "email": current_user.email,
        "phone_number": current_user.phone_number,
        "country": current_user.country,
        "profile_photo": current_user.profile_photo,
        "role": current_user.role,
        "status": current_user.status,
        "subscription_plan": current_user.subscription_plan,
        "storage_used": current_user.storage_used,
        "email_verified": current_user.email_verified,
        "login_count": current_user.login_count,
        "created_at": current_user.created_at
    }

@router.put("/profile")
def update_profile(payload: UserProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.full_name is not None: current_user.full_name = payload.full_name
    if payload.username is not None: current_user.username = payload.username
    if payload.phone_number is not None: current_user.phone_number = payload.phone_number
    if payload.country is not None: current_user.country = payload.country
    if payload.profile_photo is not None: current_user.profile_photo = payload.profile_photo

    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated successfully", "user": current_user}

@router.post("/change-password")
def change_password(payload: ChangePasswordPayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(payload.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()

    log = ActivityLog(user_id=current_user.id, action="Password Changed", details="User changed password")
    db.add(log)
    db.commit()

    return {"message": "Password changed successfully"}

@router.delete("/account")
def delete_account(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    db.delete(current_user)
    db.commit()

    log = ActivityLog(user_id=None, action="Account Deleted", details=f"User #{user_id} deleted account")
    db.add(log)
    db.commit()

    return {"message": "Account deleted successfully"}
