import os
import urllib.parse
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db, UploadedFile, ActivityLog, User
from backend.auth import get_current_user_optional
from backend.config import PROCESSED_DIR
from backend.services.security_service import protect_file_with_password, unlock_pdf_file, hash_file_password

router = APIRouter(prefix="/api/security", tags=["Security & Encryption"])

class ProtectFilePayload(BaseModel):
    file_id: int
    password: str

class UnlockFilePayload(BaseModel):
    file_id: int
    password: str

@router.post("/protect")
def protect_file(
    payload: ProtectFilePayload,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if not payload.password or len(payload.password.strip()) == 0:
        raise HTTPException(status_code=400, detail="Password cannot be empty.")

    file_record = db.query(UploadedFile).filter(UploadedFile.id == payload.file_id).first()
    if not file_record or not os.path.exists(file_record.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    success, protected_path_or_err = protect_file_with_password(
        input_path=file_record.file_path,
        file_type=file_record.file_type,
        password=payload.password,
        output_dir=str(PROCESSED_DIR)
    )

    if not success:
        raise HTTPException(status_code=400, detail=protected_path_or_err)

    file_record.is_protected = True
    file_record.password_hash = hash_file_password(payload.password)
    file_record.file_path = protected_path_or_err
    file_record.file_size = os.path.getsize(protected_path_or_err)
    file_record.file_type = ".pdf"
    db.commit()

    # Log Activity
    log = ActivityLog(
        user_id=current_user.id if current_user else None,
        action="File Protected",
        details=f"Applied AES-256 password lock on {file_record.original_name}"
    )
    db.add(log)
    db.commit()

    download_url = f"/api/files/download_report?path={urllib.parse.quote(protected_path_or_err)}"

    return {
        "message": "File encrypted with AES-256 password protection successfully!",
        "is_protected": True,
        "file_id": file_record.id,
        "download_url": download_url,
        "filename": os.path.basename(protected_path_or_err)
    }

@router.post("/unlock")
def unlock_file(
    payload: UnlockFilePayload,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == payload.file_id).first()
    if not file_record or not os.path.exists(file_record.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    success, result_path_or_err = unlock_pdf_file(file_record.file_path, payload.password)
    if not success:
        raise HTTPException(status_code=400, detail=result_path_or_err)

    file_record.is_protected = False
    file_record.file_path = result_path_or_err
    file_record.file_size = os.path.getsize(result_path_or_err)
    db.commit()

    # Log Activity
    log = ActivityLog(
        user_id=current_user.id if current_user else None,
        action="File Unlocked",
        details=f"Unlocked PDF {file_record.original_name}"
    )
    db.add(log)
    db.commit()

    return {
        "message": "File unlocked successfully",
        "is_protected": False,
        "file_id": file_record.id,
        "download_url": f"/api/files/download_report?path={urllib.parse.quote(result_path_or_err)}"
    }
