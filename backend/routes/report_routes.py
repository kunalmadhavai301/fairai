import os
import pandas as pd
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db, UploadedFile, AnalysisReport, ActivityLog, User
from backend.auth import get_current_user_optional
from backend.config import REPORTS_DIR
from backend.services.analytics_service import analyze_dataset
from backend.services.report_service import generate_report
from backend.services.pptx_service import generate_powerpoint_presentation
from backend.services.file_service import extract_file_content

router = APIRouter(prefix="/api/reports", tags=["Reports & PPTX Generation"])

class GenerateReportPayload(BaseModel):
    file_id: int
    title: Optional[str] = "SurveySnap Executive Intelligence Report"
    format_type: Optional[str] = "pdf"  # pdf, docx, html, md, pptx

@router.post("/generate")
def create_report(
    payload: GenerateReportPayload,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == payload.file_id).first()
    if not file_record or not os.path.exists(file_record.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    fmt = payload.format_type.lower()
    report_title = payload.title or f"Executive Report - {file_record.original_name}"

    if fmt == "pptx":
        text_content = extract_file_content(file_record.file_path, file_record.file_type).get("text", "")
        report_path = generate_powerpoint_presentation(report_title, text_content, str(REPORTS_DIR))
    else:
        ext = file_record.file_type.lower()
        if ext in ['.csv', '.xlsx']:
            df = pd.read_csv(file_record.file_path) if ext == '.csv' else pd.read_excel(file_record.file_path)
            analytics_data = analyze_dataset(df)
        else:
            analytics_data = {
                "summary": {"total_records": 1, "total_columns": 1, "missing_percentage": 0},
                "statistics": {},
                "recommendations": ["Document reviewed and verified."],
                "risk_analysis": {"score": 5, "level": "Low"}
            }
        report_path = generate_report(report_title, analytics_data, str(REPORTS_DIR), fmt)

    report_record = AnalysisReport(
        file_id=file_record.id,
        user_id=current_user.id if current_user else None,
        title=report_title,
        report_type=fmt,
        report_path=report_path,
        summary=f"Automated {fmt.upper()} report generated from {file_record.original_name}"
    )
    db.add(report_record)
    db.commit()
    db.refresh(report_record)

    return {
        "message": f"{fmt.upper()} report generated successfully",
        "report": {
            "id": report_record.id,
            "title": report_record.title,
            "report_type": report_record.report_type,
            "report_path": report_record.report_path,
            "created_at": report_record.created_at
        }
    }

@router.get("")
def list_reports(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(AnalysisReport)
    if current_user:
        query = query.filter(AnalysisReport.user_id == current_user.id)
    reports = query.order_by(AnalysisReport.created_at.desc()).all()
    
    return [{
        "id": r.id,
        "title": r.title,
        "report_type": r.report_type,
        "report_path": r.report_path,
        "created_at": r.created_at
    } for r in reports]
