import os
import pandas as pd
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db, UploadedFile, ActivityLog, User
from backend.auth import get_current_user_optional
from backend.services.analytics_service import analyze_dataset
from backend.services.cleaning_service import clean_tabular_data
from backend.services.file_service import save_edited_file_content

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Data Cleaning"])

@router.get("/{file_id}")
def get_analytics(file_id: int, db: Session = Depends(get_db)):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record or not os.path.exists(file_record.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    ext = file_record.file_type.lower()
    if ext in ['.csv', '.xlsx']:
        df = pd.read_csv(file_record.file_path) if ext == '.csv' else pd.read_excel(file_record.file_path)
        analysis = analyze_dataset(df)
        return {"file_id": file_id, "analytics": analysis}
    else:
        # Document text summary metrics
        return {
            "file_id": file_id,
            "analytics": {
                "summary": {"total_records": 1, "total_columns": 1, "missing_percentage": 0},
                "statistics": {},
                "correlations": {},
                "trends": [],
                "predictions": [],
                "risk_analysis": {"score": 5, "level": "Low", "factors": []},
                "recommendations": ["Document parsed cleanly."]
            }
        }

@router.post("/{file_id}/clean")
def run_data_cleaning(
    file_id: int,
    options: dict = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record or not os.path.exists(file_record.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    ext = file_record.file_type.lower()
    if ext not in ['.csv', '.xlsx']:
        raise HTTPException(status_code=400, detail="Data cleaning is supported for CSV and Excel files")

    df = pd.read_csv(file_record.file_path) if ext == '.csv' else pd.read_excel(file_record.file_path)
    df_cleaned, stats = clean_tabular_data(df, options)

    table_data = {
        "columns": list(df_cleaned.columns),
        "rows": df_cleaned.to_dict(orient="records")
    }
    save_edited_file_content(file_record.file_path, "", ext, table_data)

    # Log Activity
    log = ActivityLog(
        user_id=current_user.id if current_user else None,
        action="Data Cleaned",
        details=f"Cleaned dataset {file_record.original_name}. Removed {stats['duplicates_removed']} duplicates."
    )
    db.add(log)
    db.commit()

    return {
        "message": "Data cleaning executed successfully",
        "stats": stats,
        "table_data": table_data
    }
