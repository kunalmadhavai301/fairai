import os
import json
import asyncio
import urllib.parse
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.file import UploadedFile
from backend.models.chat_history import ChatHistory
from backend.models.activity_log import ActivityLog
from backend.security.jwt import get_current_user_optional
from backend.services.ai_agent_service import process_agent_command
from backend.services.cleaning_service import auto_clean_dataset
from backend.services.analytics_service import generate_file_analytics
from backend.services.chart_service import generate_file_charts
from backend.services.conversion_service import convert_file
from backend.services.report_service import generate_executive_report
from backend.services.pptx_service import create_presentation_from_file
from backend.services.security_service import protect_file_with_password, unlock_pdf_file, hash_file_password
from backend.services.pii_service import scan_sensitive_pii
from backend.services.pdf_service import delete_pdf_page
from backend.services.file_service import save_edited_file_content, extract_file_content
from backend.config import PROCESSED_DIR

router = APIRouter(prefix="/api/ai", tags=["AI & Document Intelligence"])
alias_router = APIRouter(prefix="/api", tags=["AI Legacy Aliases"])

class ChatPayload(BaseModel):
    message: str
    file_id: Optional[int] = None
    incident_mode: Optional[bool] = False

class ActionPayload(BaseModel):
    file_id: int

class ReplaceTextPayload(BaseModel):
    file_id: int
    target_text: str
    replacement_text: str

class RemovePagePayload(BaseModel):
    file_id: int
    page_number: int

class TranslatePayload(BaseModel):
    file_id: int
    target_language: str = "Marathi"

class GenerateReportPayload(BaseModel):
    file_id: int
    title: Optional[str] = "Executive Analysis Report"
    format_type: str = "pdf"  # pdf, docx, html, md, pptx

class SecurityPayload(BaseModel):
    file_id: int
    password: str
    confirm_password: Optional[str] = None
    encryption_standard: str = "AES-256"  # AES-256, AxCrypt, VeraCrypt, NordLocker, PicoCrypt

class ConvertPayload(BaseModel):
    file_id: int
    target_format: str = "pdf"

@router.post("/protect")
def protect_file_endpoint(payload: SecurityPayload, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == payload.file_id).first()
    if not file_record or not os.path.exists(file_record.storage_location):
        raise HTTPException(status_code=404, detail="File not found")

    if payload.confirm_password and payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Password and Confirm Password do not match!")

    success, protected_path_or_err = protect_file_with_password(
        input_path=file_record.storage_location,
        file_type=file_record.file_type,
        password=payload.password,
        encryption_type=payload.encryption_standard,
        output_dir=str(PROCESSED_DIR)
    )
    if not success:
        raise HTTPException(status_code=400, detail=protected_path_or_err)

    hashed_pw = hash_file_password(payload.password)
    file_record.password_protected = True
    file_record.encryption_status = True
    file_record.password_hash = hashed_pw
    db.commit()

    download_url = f"/api/files/download_report?path={urllib.parse.quote(protected_path_or_err)}"
    log = ActivityLog(user_id=current_user.id if current_user else file_record.user_id, action="Encrypt File", details=f"Locked file {file_record.original_filename} with {payload.encryption_standard}")
    db.add(log)
    db.commit()

    return {
        "message": f"File encrypted and password protected successfully with {payload.encryption_standard}",
        "protected_path": protected_path_or_err,
        "download_url": download_url,
        "filename": os.path.basename(protected_path_or_err),
        "encryption_standard": payload.encryption_standard
    }

@router.post("/chat")
def ai_chat(payload: ChatPayload, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    res = process_agent_command(
        db=db,
        user_message=payload.message,
        file_id=payload.file_id,
        incident_mode=payload.incident_mode
    )

    user_id = current_user.id if current_user else 1
    chat_rec = ChatHistory(
        user_id=user_id,
        file_id=payload.file_id,
        conversation=json.dumps({"prompt": payload.message, "response": res.get("reply", "")}),
        commands_used=res.get("action_taken", "qna"),
        edited_file=res.get("modified_content") is not None
    )
    db.add(chat_rec)

    log = ActivityLog(user_id=user_id, action="AI Prompt", details=f"Prompt: {payload.message[:50]}")
    db.add(log)
    db.commit()

    return res

@router.post("/chat/stream")
async def ai_chat_stream(payload: ChatPayload, db: Session = Depends(get_db)):
    res = process_agent_command(db=db, user_message=payload.message, file_id=payload.file_id, incident_mode=payload.incident_mode)
    full_text = res.get("reply", "")

    async def event_generator():
        words = full_text.split(" ")
        for word in words:
            yield f"data: {json.dumps({'chunk': word + ' '})}\n\n"
            await asyncio.sleep(0.04)
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/charts/{file_id}")
def get_file_charts_endpoint(file_id: int, db: Session = Depends(get_db)):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record or not os.path.exists(file_record.storage_location):
        raise HTTPException(status_code=404, detail="File not found")

    ext = file_record.file_type.lower()
    charts_res = generate_file_charts(file_record.storage_location, ext)
    return charts_res

@router.post("/remove-page")
def remove_page_endpoint(payload: RemovePagePayload, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == payload.file_id).first()
    if not file_record or not os.path.exists(file_record.storage_location):
        raise HTTPException(status_code=404, detail="File not found")

    if file_record.file_type.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="Page deletion is only available for PDF files.")

    success, msg = delete_pdf_page(file_record.storage_location, payload.page_number)
    if not success:
        raise HTTPException(status_code=400, detail=msg)

    file_record.version += 1
    log = ActivityLog(user_id=current_user.id if current_user else file_record.user_id, action="Delete Page", details=f"Removed page {payload.page_number} from file #{payload.file_id}")
    db.add(log)
    db.commit()

    return {"message": msg, "current_version": file_record.version}

@router.post("/replace-text")
def replace_text_endpoint(payload: ReplaceTextPayload, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == payload.file_id).first()
    if not file_record or not os.path.exists(file_record.storage_location):
        raise HTTPException(status_code=404, detail="File not found")

    content_data = extract_file_content(file_record.storage_location, file_record.file_type)
    text = content_data.get("text", "")
    if payload.target_text not in text:
        return {"message": f"Target text '{payload.target_text}' not found in document.", "modified": False}

    updated_text = text.replace(payload.target_text, payload.replacement_text)
    save_edited_file_content(file_record.storage_location, updated_text, file_record.file_type)

    file_record.version += 1
    log = ActivityLog(user_id=current_user.id if current_user else file_record.user_id, action="Replace Text", details=f"Replaced '{payload.target_text}' with '{payload.replacement_text}' in file #{payload.file_id}")
    db.add(log)
    db.commit()

    return {"message": f"Replaced '{payload.target_text}' with '{payload.replacement_text}'", "modified": True, "current_version": file_record.version}

@router.post("/pii")
def scan_pii_endpoint(payload: ActionPayload, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == payload.file_id).first()
    if not file_record or not os.path.exists(file_record.storage_location):
        raise HTTPException(status_code=404, detail="File not found")

    content_data = extract_file_content(file_record.storage_location, file_record.file_type)
    text = content_data.get("text", "")

    pii_res = scan_sensitive_pii(text)
    log = ActivityLog(user_id=current_user.id if current_user else file_record.user_id, action="PII Scan", details=f"Scanned PII for file #{payload.file_id} (Found {pii_res['pii_count']} items)")
    db.add(log)
    db.commit()

    return pii_res

@router.post("/summarize")
def summarize_doc(payload: ActionPayload, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    return ai_chat(ChatPayload(message="Summarize this report", file_id=payload.file_id), db=db, current_user=current_user)

@router.post("/translate")
def translate_doc(payload: TranslatePayload, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    return ai_chat(ChatPayload(message=f"Translate this document into {payload.target_language}", file_id=payload.file_id), db=db, current_user=current_user)

@router.post("/analyze")
def analyze_doc(payload: ActionPayload, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    analytics = generate_file_analytics(db, payload.file_id)
    log = ActivityLog(user_id=current_user.id if current_user else None, action="Analysis", details=f"Ran statistical analytics on file #{payload.file_id}")
    db.add(log)
    db.commit()
    return {"file_id": payload.file_id, "analytics": analytics}

@router.post("/clean")
def clean_doc(payload: ActionPayload, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    res = auto_clean_dataset(db, payload.file_id)
    log = ActivityLog(user_id=current_user.id if current_user else None, action="Clean Data", details=f"Automated cleaning performed on file #{payload.file_id}")
    db.add(log)
    db.commit()
    return res

@router.post("/convert")
def convert_doc(payload: ConvertPayload, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == payload.file_id).first()
    if not file_record or not os.path.exists(file_record.storage_location):
        raise HTTPException(status_code=404, detail="File not found")

    output_path = convert_file(file_record.storage_location, payload.target_format, str(PROCESSED_DIR))
    download_url = f"/api/files/download_report?path={urllib.parse.quote(output_path)}"

    log = ActivityLog(user_id=current_user.id if current_user else file_record.user_id, action="Convert", details=f"Converted {file_record.original_filename} to {payload.target_format.upper()}")
    db.add(log)
    db.commit()

    return {
        "message": f"Converted to {payload.target_format.upper()} successfully",
        "output_path": output_path,
        "download_url": download_url
    }

@router.post("/generate-report")
def generate_report(payload: GenerateReportPayload, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    from backend.models.report import AnalysisReport

    if payload.format_type.lower() == "pptx":
        res = create_presentation_from_file(db, payload.file_id, payload.title or "Executive Deck")
        report_path = res.get("output_path")
    else:
        res = generate_executive_report(db, payload.file_id, payload.title or "Executive Report", payload.format_type)
        report_path = res.get("report_path")

    rep_rec = AnalysisReport(
        user_id=current_user.id if current_user else 1,
        file_id=payload.file_id,
        title=payload.title or "Executive Report",
        report_type=payload.format_type,
        report_path=report_path,
        summary=f"Generated {payload.format_type.upper()} report"
    )
    db.add(rep_rec)

    log = ActivityLog(user_id=current_user.id if current_user else 1, action="Report Generation", details=f"Generated {payload.format_type.upper()} report for file #{payload.file_id}")
    db.add(log)
    db.commit()

    download_url = f"/api/files/download_report?path={urllib.parse.quote(report_path)}"

    return {
        "message": "Report generated successfully",
        "report": {
            "title": payload.title,
            "report_type": payload.format_type,
            "report_path": report_path,
            "download_url": download_url
        }
    }



class AIConfigPayload(BaseModel):
    provider: str = "openai"  # openai, gemini, groq
    api_key: str

@router.get("/config")
def get_ai_config():
    openai_set = bool(os.getenv("OPENAI_API_KEY"))
    gemini_set = bool(os.getenv("GEMINI_API_KEY"))
    groq_set = bool(os.getenv("GROQ_API_KEY"))
    return {
        "openai_configured": openai_set,
        "gemini_configured": gemini_set,
        "groq_configured": groq_set,
        "active_provider": "openai" if openai_set else ("gemini" if gemini_set else ("groq" if groq_set else "offline_rag"))
    }

@router.post("/config")
def update_ai_config(payload: AIConfigPayload):
    from backend.config import update_env_api_key
    provider_upper = payload.provider.upper()
    if provider_upper == "OPENAI":
        update_env_api_key("OPENAI_API_KEY", payload.api_key.strip())
    elif provider_upper == "GEMINI":
        update_env_api_key("GEMINI_API_KEY", payload.api_key.strip())
    elif provider_upper == "GROQ":
        update_env_api_key("GROQ_API_KEY", payload.api_key.strip())
    else:
        update_env_api_key("OPENAI_API_KEY", payload.api_key.strip())

    return {
        "message": f"Successfully updated {payload.provider.upper()} API Key in .env file and activated real-time AI completion!",
        "provider": payload.provider
    }

# Register Alias Endpoints on alias_router to guarantee 200 OK across legacy URLs
alias_router.add_api_route("/chat", ai_chat, methods=["POST"])
alias_router.add_api_route("/convert", convert_doc, methods=["POST"])
alias_router.add_api_route("/security/protect", protect_file_endpoint, methods=["POST"])
alias_router.add_api_route("/protect", protect_file_endpoint, methods=["POST"])
alias_router.add_api_route("/reports/generate", generate_report, methods=["POST"])
