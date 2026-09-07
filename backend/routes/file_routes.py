import os
import shutil
import datetime
import urllib.parse
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.file import UploadedFile, FileVersion
from backend.models.activity_log import ActivityLog
from backend.security.jwt import get_current_user_optional, get_current_user
from backend.config import UPLOADS_DIR, ORIGINALS_DIR
from backend.services.file_service import extract_file_content, save_edited_file_content, get_file_extension
from backend.services.version_service import create_version_snapshot, compute_text_diff, restore_version
from backend.services.pdf_service import render_pdf_page_image

router = APIRouter(prefix="/api/files", tags=["Files & Version Control"])

@router.get("/download_report")
@router.post("/download_report")
def download_report_by_path(path: str, current_user: Optional[User] = Depends(get_current_user_optional)):
    clean_path = urllib.parse.unquote(path)
    if not os.path.exists(clean_path):
        clean_path = path

    if not os.path.exists(clean_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=clean_path,
        filename=os.path.basename(clean_path),
        media_type="application/octet-stream"
    )

@router.post("/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    saved_records = []
    user_id = current_user.id if current_user else None

    for file in files:
        ext = get_file_extension(file.filename)
        timestamp_str = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        safe_filename = f"{timestamp_str}_{file.filename.replace(' ', '_')}"

        file_path = os.path.join(UPLOADS_DIR, safe_filename)
        original_file_path = os.path.join(ORIGINALS_DIR, f"orig_{safe_filename}")

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        shutil.copy2(file_path, original_file_path)

        file_size = os.path.getsize(file_path)

        db_file = UploadedFile(
            user_id=user_id or 1,
            original_filename=file.filename,
            edited_filename=safe_filename,
            file_type=ext,
            file_size=file_size,
            storage_location=file_path,
            original_storage_location=original_file_path,
            version=1
        )
        db.add(db_file)

        if current_user:
            current_user.storage_used = (current_user.storage_used or 0) + file_size

        db.commit()
        db.refresh(db_file)

        create_version_snapshot(db, db_file.id, "Initial Upload Baseline")

        log = ActivityLog(user_id=user_id, action="Upload", details=f"Uploaded file {file.filename} ({file_size} bytes)")
        db.add(log)
        db.commit()

        saved_records.append({
            "id": db_file.id,
            "filename": db_file.edited_filename,
            "original_name": db_file.original_filename,
            "file_type": db_file.file_type,
            "file_size": db_file.file_size,
            "current_version": db_file.version,
            "created_at": db_file.upload_date
        })

    return {"message": "Upload successful", "files": saved_records}

@router.get("")
def list_files(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(UploadedFile)

    if current_user and current_user.role != "admin":
        query = query.filter(UploadedFile.user_id == current_user.id)

    files = query.order_by(UploadedFile.upload_date.desc()).all()

    return [{
        "id": f.id,
        "user_id": f.user_id,
        "filename": f.edited_filename,
        "original_name": f.original_filename,
        "file_type": f.file_type,
        "file_size": f.file_size,
        "current_version": f.version,
        "password_protected": f.password_protected,
        "encryption_status": f.encryption_status,
        "created_at": f.upload_date
    } for f in files]

@router.get("/{file_id}/pdf_stream")
def get_pdf_stream(file_id: int, is_original: bool = False, db: Session = Depends(get_db)):
    """
    Serves the PDF file directly with inline disposition so browser native PDF viewers open original document.
    """
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    target_path = file_record.original_storage_location if is_original else file_record.storage_location
    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="File missing on disk")

    return FileResponse(
        target_path,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=\"{file_record.original_filename}\""}
    )

@router.get("/{file_id}/raw")
def get_raw_file(file_id: int, is_original: bool = False, db: Session = Depends(get_db)):
    """
    Serves raw original file directly (images, pdfs, documents) without text extraction.
    """
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    target_path = file_record.original_storage_location if is_original else file_record.storage_location
    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="File missing on disk")

    ext = file_record.file_type.lower()
    mime_type = "application/octet-stream"
    if ext == ".pdf": mime_type = "application/pdf"
    elif ext in [".png", ".jpg", ".jpeg", ".webp"]: mime_type = f"image/{ext.replace('.', '')}"
    elif ext == ".txt": mime_type = "text/plain"
    elif ext == ".json": mime_type = "application/json"
    elif ext == ".xml": mime_type = "application/xml"

    return FileResponse(target_path, media_type=mime_type)

@router.get("/{file_id}/page/{page_num}")
def get_pdf_page_image(file_id: int, page_num: int = 1, is_original: bool = False, db: Session = Depends(get_db)):
    """
    Renders 300 DPI high-definition PDF page image for pixel-perfect document viewing.
    """
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    target_path = file_record.original_storage_location if is_original else file_record.storage_location
    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="File missing on disk")

    success, png_bytes, total_pages = render_pdf_page_image(target_path, page_num, dpi=300)
    if not success:
        raise HTTPException(status_code=400, detail="Unable to render PDF page")

    return Response(content=png_bytes, media_type="image/png", headers={"X-Total-Pages": str(total_pages)})

@router.get("/{file_id}/content")
def get_edited_file_content(file_id: int, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record or not os.path.exists(file_record.storage_location):
        raise HTTPException(status_code=404, detail="File not found")

    if current_user and current_user.role != "admin" and file_record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You can only view your own files.")

    content_data = extract_file_content(file_record.storage_location, file_record.file_type)

    return {
        "file": {
            "id": file_record.id,
            "original_name": file_record.original_filename,
            "file_type": file_record.file_type,
            "file_size": file_record.file_size,
            "current_version": file_record.version
        },
        "content": content_data
    }

@router.get("/{file_id}/original_content")
def get_original_file_content(file_id: int, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record or not os.path.exists(file_record.original_storage_location):
        raise HTTPException(status_code=404, detail="Original baseline file missing")

    if current_user and current_user.role != "admin" and file_record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    content_data = extract_file_content(file_record.original_storage_location, file_record.file_type)

    return {
        "file_id": file_id,
        "original_name": file_record.original_filename,
        "content": content_data
    }

@router.put("/{file_id}/save")
def save_file_edits(
    file_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    if current_user and current_user.role != "admin" and file_record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    new_content = payload.get("text", "")
    table_data = payload.get("table_data")

    save_edited_file_content(file_record.storage_location, new_content, file_record.file_type, table_data)
    ver = create_version_snapshot(db, file_record.id, payload.get("change_summary", "Manual Workspace Save"))

    log = ActivityLog(user_id=current_user.id if current_user else file_record.user_id, action="Replace Text / Edit", details=f"Edited file #{file_id}")
    db.add(log)
    db.commit()

    return {
        "message": "File updated & version snapshot saved",
        "current_version": file_record.version,
        "version_id": ver.id if ver else None
    }

@router.get("/{file_id}/versions")
def list_file_versions(file_id: int, db: Session = Depends(get_db)):
    versions = db.query(FileVersion).filter(FileVersion.file_id == file_id).order_by(FileVersion.version_number.desc()).all()
    return [{
        "id": v.id,
        "version_number": v.version_number,
        "change_summary": v.change_summary,
        "created_at": v.created_at
    } for v in versions]

@router.post("/{file_id}/versions/restore/{version_number}")
def restore_file_version_endpoint(file_id: int, version_number: int, db: Session = Depends(get_db)):
    success, msg = restore_version(db, file_id, version_number)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg, "current_version": version_number}

@router.get("/{file_id}/diff")
def compute_file_diff(file_id: int, db: Session = Depends(get_db)):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    orig_content = extract_file_content(file_record.original_storage_location, file_record.file_type).get("text", "")
    edit_content = extract_file_content(file_record.storage_location, file_record.file_type).get("text", "")

    diff_res = compute_text_diff(orig_content, edit_content)
    return {"file_id": file_id, "diff": diff_res}

@router.delete("/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    if current_user and current_user.role != "admin" and file_record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    if current_user:
        current_user.storage_used = max(0, (current_user.storage_used or 0) - file_record.file_size)

    if os.path.exists(file_record.storage_location):
        try: os.remove(file_record.storage_location)
        except Exception: pass
    if os.path.exists(file_record.original_storage_location):
        try: os.remove(file_record.original_storage_location)
        except Exception: pass

    log = ActivityLog(user_id=current_user.id if current_user else file_record.user_id, action="Delete", details=f"Deleted file {file_record.original_filename}")
    db.add(log)

    db.delete(file_record)
    db.commit()
    return {"message": "File deleted"}

@router.get("/{file_id}/download")
def download_file(file_id: int, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record or not os.path.exists(file_record.storage_location):
        raise HTTPException(status_code=404, detail="File not found")

    if current_user and current_user.role != "admin" and file_record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    log = ActivityLog(user_id=current_user.id if current_user else file_record.user_id, action="Download", details=f"Downloaded file {file_record.original_filename}")
    db.add(log)
    db.commit()

    return FileResponse(file_record.storage_location, filename=file_record.original_filename, media_type="application/octet-stream")
