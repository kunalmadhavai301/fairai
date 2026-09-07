import os
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db, UploadedFile, ActivityLog, User
from backend.auth import get_current_user_optional
from backend.config import PROCESSED_DIR
from backend.services.conversion_service import convert_file

router = APIRouter(prefix="/api/convert", tags=["File Conversion"])

class ConvertRequest(BaseModel):
    file_id: int
    target_format: str

@router.post("")
def trigger_conversion(
    payload: ConvertRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == payload.file_id).first()
    if not file_record or not os.path.exists(file_record.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    target_fmt = payload.target_format.lower().replace('.', '')
    
    try:
        output_path = convert_file(file_record.file_path, target_fmt, str(PROCESSED_DIR))
        out_filename = os.path.basename(output_path)
        out_size = os.path.getsize(output_path)

        # Register converted file as new file record
        new_db_file = UploadedFile(
            filename=out_filename,
            original_name=f"Converted_{file_record.original_name}.{target_fmt}",
            file_type=f".{target_fmt}",
            file_size=out_size,
            file_path=output_path,
            user_id=current_user.id if current_user else None
        )
        db.add(new_db_file)
        db.commit()
        db.refresh(new_db_file)

        # Log activity
        log = ActivityLog(
            user_id=current_user.id if current_user else None,
            action="File Converted",
            details=f"Converted {file_record.original_name} to {target_fmt.upper()}"
        )
        db.add(log)
        db.commit()

        return {
            "message": "Conversion completed",
            "converted_file": {
                "id": new_db_file.id,
                "filename": new_db_file.filename,
                "original_name": new_db_file.original_name,
                "file_type": new_db_file.file_type,
                "file_size": new_db_file.file_size,
                "file_path": output_path
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")
