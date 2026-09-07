import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.file import UploadedFile
from backend.models.login_history import LoginHistory
from backend.models.chat_history import ChatHistory
from backend.models.report import AnalysisReport
from backend.models.activity_log import ActivityLog
from backend.security.rbac import require_admin
from backend.security.password import hash_password

router = APIRouter(prefix="/api/admin", tags=["Admin Control Panel"])

class AdminResetPasswordPayload(BaseModel):
    new_password: str

class RoleChangePayload(BaseModel):
    role: str  # 'admin' or 'user'

@router.get("/users")
def get_all_users(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    users = db.query(User).order_by(User.id.asc()).all()
    return [{
        "id": u.id,
        "full_name": u.full_name,
        "username": u.username,
        "email": u.email,
        "phone_number": u.phone_number,
        "country": u.country,
        "role": u.role,
        "status": u.status,
        "subscription_plan": u.subscription_plan,
        "storage_used": u.storage_used,
        "login_count": u.login_count,
        "last_login": u.last_login,
        "created_at": u.created_at
    } for u in users]

@router.delete("/delete-user/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    db.delete(user)
    db.commit()

    log = ActivityLog(user_id=admin_user.id, action="Admin Delete User", details=f"Admin deleted user #{user_id} ({user.email})")
    db.add(log)
    db.commit()

    return {"message": f"User #{user_id} deleted successfully"}

@router.put("/suspend-user/{user_id}")
def suspend_user(user_id: int, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot suspend your own admin account")

    user.status = "suspended" if user.status == "active" else "active"
    db.commit()

    log = ActivityLog(user_id=admin_user.id, action="Admin Toggle Status", details=f"User #{user_id} status changed to {user.status}")
    db.add(log)
    db.commit()

    return {"message": f"User status changed to {user.status}", "status": user.status}

@router.put("/reset-password/{user_id}")
def admin_reset_password(user_id: int, payload: AdminResetPasswordPayload, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    db.commit()

    log = ActivityLog(user_id=admin_user.id, action="Admin Reset Password", details=f"Admin reset password for user #{user_id}")
    db.add(log)
    db.commit()

    return {"message": f"Password for user #{user_id} reset successfully"}

@router.get("/logins")
def get_login_history(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    logins = db.query(LoginHistory).order_by(LoginHistory.login_time.desc()).limit(100).all()
    return [{
        "id": l.id,
        "user_id": l.user_id,
        "email": l.email,
        "login_time": l.login_time,
        "logout_time": l.logout_time,
        "ip_address": l.ip_address,
        "browser": l.browser,
        "operating_system": l.operating_system,
        "device_type": l.device_type,
        "status": l.status,
        "failed_attempts": l.failed_attempts
    } for l in logins]

@router.get("/files")
def get_all_files(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    files = db.query(UploadedFile).order_by(UploadedFile.upload_date.desc()).all()
    return [{
        "id": f.id,
        "user_id": f.user_id,
        "original_filename": f.original_filename,
        "edited_filename": f.edited_filename,
        "file_size": f.file_size,
        "file_type": f.file_type,
        "password_protected": f.password_protected,
        "encryption_status": f.encryption_status,
        "upload_date": f.upload_date
    } for f in files]

@router.get("/chat-history")
def get_all_chat_history(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    chats = db.query(ChatHistory).order_by(ChatHistory.timestamp.desc()).limit(100).all()
    return [{
        "id": c.id,
        "user_id": c.user_id,
        "file_id": c.file_id,
        "conversation": c.conversation,
        "commands_used": c.commands_used,
        "timestamp": c.timestamp
    } for c in chats]

@router.get("/dashboard-stats")
def get_admin_dashboard_stats(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.status == "active").count()

    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    daily_logins = db.query(LoginHistory).filter(LoginHistory.login_time >= today_start, LoginHistory.status == "success").count()
    failed_logins = db.query(LoginHistory).filter(LoginHistory.status == "failed").count()

    files_count = db.query(UploadedFile).count()
    reports_count = db.query(AnalysisReport).count()
    ai_requests_count = db.query(ChatHistory).count()

    total_storage = sum(f.file_size for f in db.query(UploadedFile).all())

    recent_activities = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(15).all()

    return {
        "admin_metrics": {
            "total_users": total_users,
            "active_users": active_users,
            "online_users": active_users,
            "files_uploaded": files_count,
            "reports_generated": reports_count,
            "ai_requests": ai_requests_count,
            "storage_usage_bytes": total_storage,
            "storage_usage_mb": round(total_storage / (1024 * 1024), 2),
            "daily_logins": daily_logins,
            "failed_login_attempts": failed_logins,
            "system_health": "100% Operational"
        },
        "recent_activities": [{
            "id": a.id,
            "user_id": a.user_id,
            "action": a.action,
            "details": a.details,
            "timestamp": a.timestamp
        } for a in recent_activities]
    }
