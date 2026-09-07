import os
import urllib.parse
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.file import UploadedFile
from backend.security.jwt import get_current_user_optional
from backend.services.version_service import create_version_snapshot
from backend.config import BASE_DIR

router = APIRouter(prefix="/api/onlyoffice", tags=["ONLYOFFICE Docs Integration"])

@router.get("/config/{file_id}")
def get_onlyoffice_config(
    file_id: int,
    is_original: bool = False,
    mode: str = "edit",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Generates ONLYOFFICE Document Server configuration JSON payload.
    Supports DOCX (word), XLSX (cell), PPTX (slide), and PDF viewing/editing.
    """
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File record not found")

    target_path = file_record.original_storage_location if is_original else file_record.storage_location
    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="Physical document file missing on disk")

    ext = file_record.file_type.lower().replace('.', '')
    
    # Determine ONLYOFFICE Document Type
    doc_type = "word"
    if ext in ["xlsx", "xls", "csv"]:
        doc_type = "cell"
    elif ext in ["pptx", "ppt"]:
        doc_type = "slide"
    elif ext == "pdf":
        doc_type = "word"

    doc_key = f"{file_id}_v{file_record.version}_{'orig' if is_original else 'edit'}"
    
    # Download URL for ONLYOFFICE Document Server
    file_download_url = f"/api/files/{file_id}/download" if not is_original else f"/api/files/download_report?path={urllib.parse.quote(target_path)}"
    callback_url = f"/api/onlyoffice/callback/{file_id}"

    user_info = {
        "id": str(current_user.id) if current_user else "guest",
        "name": current_user.full_name if current_user else "Guest User"
    }

    config = {
        "documentType": doc_type,
        "document": {
            "fileType": ext if ext != "pdf" else "pdf",
            "key": doc_key,
            "title": file_record.original_filename,
            "url": file_download_url,
            "permissions": {
                "edit": not is_original and mode == "edit",
                "download": True,
                "print": True,
                "review": True
            }
        },
        "editorConfig": {
            "mode": "view" if is_original else mode,
            "lang": "en",
            "callbackUrl": callback_url,
            "user": user_info,
            "customization": {
                "autosave": True,
                "forcesave": True,
                "comments": True,
                "compactHeader": False,
                "toolbarNoTabs": False
            }
        }
    }

    return config

@router.post("/callback/{file_id}")
async def onlyoffice_callback(file_id: int, request: Request, db: Session = Depends(get_db)):
    """
    Callback endpoint triggered by ONLYOFFICE Document Server on document save events.
    Status 2 (Ready for saving) or Status 6 (Force save).
    """
    body = await request.json()
    status_code = body.get("status")

    # Status 2: Document is ready for saving (user closed editor or saved)
    # Status 6: Force save triggered
    if status_code in [2, 6]:
        download_url = body.get("url")
        file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
        if file_record and download_url:
            import urllib.request
            try:
                # Fetch updated document from ONLYOFFICE server and overwrite storage
                req = urllib.request.Request(download_url)
                with urllib.request.urlopen(req) as res, open(file_record.storage_location, "wb") as out_f:
                    out_f.write(res.read())

                file_record.file_size = os.path.getsize(file_record.storage_location)
                file_record.version += 1
                db.commit()

                # Create version snapshot
                create_version_snapshot(db, file_id, "ONLYOFFICE Document Save")
            except Exception as e:
                return {"error": 1, "message": f"Failed to save ONLYOFFICE document: {str(e)}"}

    return {"error": 0}
