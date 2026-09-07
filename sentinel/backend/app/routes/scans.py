from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models.models import Target, Scan, Finding
from ..schemas.scan import ScanCreate, ScanRead, FindingRead
from ..services.connection import execute_scan

router = APIRouter(prefix="/scans", tags=["scans"])

@router.post("/", response_model=ScanRead, status_code=status.HTTP_201_CREATED)
def create_scan(scan_in: ScanCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == scan_in.target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    db_scan = Scan(
        target_id=scan_in.target_id,
        status="pending",
        started_at=datetime.utcnow(),
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)
    background_tasks.add_task(execute_scan, db_scan.id)
    return db_scan

@router.get("/", response_model=List[ScanRead])
def list_scans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Scan).offset(skip).limit(limit).all()

@router.get("/{scan_id}", response_model=ScanRead)
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan

@router.get("/{scan_id}/findings", response_model=List[FindingRead])
def get_scan_findings(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return db.query(Finding).filter(Finding.scan_id == scan_id).all()
