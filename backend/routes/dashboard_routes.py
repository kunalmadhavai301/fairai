from fastapi import APIRouter, Depends
from typing import Optional
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.file import UploadedFile
from backend.models.report import AnalysisReport
from backend.models.chat_history import ChatHistory
from backend.models.activity_log import ActivityLog
from backend.security.jwt import get_current_user_optional

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard & Analytics"])

@router.get("/stats")
@router.get("")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    user_id = current_user.id if current_user else None

    file_query = db.query(UploadedFile)
    report_query = db.query(AnalysisReport)
    chat_query = db.query(ChatHistory)
    activity_query = db.query(ActivityLog)

    if current_user and current_user.role != "admin":
        file_query = file_query.filter(UploadedFile.user_id == user_id)
        report_query = report_query.filter(AnalysisReport.user_id == user_id)
        chat_query = chat_query.filter(ChatHistory.user_id == user_id)
        activity_query = activity_query.filter(ActivityLog.user_id == user_id)

    total_files = file_query.count()
    total_reports = report_query.count()
    total_ai_chats = chat_query.count()

    files = file_query.all()
    storage_used = sum(f.file_size for f in files)

    recent_activities = activity_query.order_by(ActivityLog.timestamp.desc()).limit(10).all()

    return {
        "stats": {
            "total_files": total_files,
            "total_reports": total_reports,
            "total_ai_chats": total_ai_chats,
            "storage_used_bytes": storage_used,
            "storage_used_mb": round(storage_used / (1024 * 1024), 2),
            "storage_limit_mb": 500
        },
        "recent_activity": [{
            "id": a.id,
            "action": a.action,
            "details": a.details,
            "timestamp": a.timestamp
        } for a in recent_activities]
    }

@router.get("/analytics")
def get_analytics_summary(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_files = db.query(UploadedFile).count()
    total_reports = db.query(AnalysisReport).count()
    total_chats = db.query(ChatHistory).count()

    return {
        "system_analytics": {
            "total_registered_users": total_users,
            "total_uploaded_files": total_files,
            "total_generated_reports": total_reports,
            "total_ai_conversations": total_chats,
            "system_health": "100% Operational"
        }
    }

@router.get("/reports")
def list_user_reports(db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    query = db.query(AnalysisReport)
    if current_user and current_user.role != "admin":
        query = query.filter(AnalysisReport.user_id == current_user.id)

    reports = query.order_by(AnalysisReport.generated_date.desc()).all()
    return [{
        "id": r.id,
        "title": r.title,
        "report_type": r.report_type,
        "report_path": r.report_path,
        "download_count": r.download_count,
        "generated_date": r.generated_date
    } for r in reports]

@router.get("/activity")
def get_activity_logs(db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    query = db.query(ActivityLog)
    if current_user and current_user.role != "admin":
        query = query.filter(ActivityLog.user_id == current_user.id)

    logs = query.order_by(ActivityLog.timestamp.desc()).limit(50).all()
    return [{
        "id": l.id,
        "action": l.action,
        "details": l.details,
        "timestamp": l.timestamp
    } for l in logs]

@router.get("/storage")
def get_storage_breakdown(db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    user_id = current_user.id if current_user else 1
    files = db.query(UploadedFile).filter(UploadedFile.user_id == user_id).all()

    by_type = {}
    total_bytes = 0
    for f in files:
        ext = f.file_type.lower()
        by_type[ext] = by_type.get(ext, 0) + f.file_size
        total_bytes += f.file_size

    return {
        "user_id": user_id,
        "total_bytes": total_bytes,
        "total_mb": round(total_bytes / (1024 * 1024), 2),
        "breakdown_by_extension": by_type
    }
