from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.models import Target
from ..schemas.target import TargetCreate, TargetRead, TargetUpdate

router = APIRouter(prefix="/targets", tags=["targets"])

@router.get("/", response_model=list[TargetRead])
def read_targets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    targets = db.query(Target).offset(skip).limit(limit).all()
    return targets

@router.get("/{target_id}", response_model=TargetRead)
def read_target(target_id: int, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    return target

@router.post("/", response_model=TargetRead, status_code=status.HTTP_201_CREATED)
def create_target(target_in: TargetCreate, db: Session = Depends(get_db)):
    existing = db.query(Target).filter(Target.name == target_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Target with this name already exists")
    db_target = Target(
        name=target_in.name,
        type=target_in.type,
        environment=target_in.environment or "development",
        provider=target_in.provider,
        health_status=target_in.health_status or "HEALTHY",
        last_latency_ms=target_in.last_latency_ms or 0.0,
        config=target_in.config,
        tags=target_in.tags,
        description=target_in.description
    )
    db.add(db_target)
    db.commit()
    db.refresh(db_target)
    return db_target

@router.put("/{target_id}", response_model=TargetRead)
def update_target(target_id: int, target_in: TargetUpdate, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    update_data = target_in.model_dump(exclude_unset=True) if hasattr(target_in, "model_dump") else target_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(target, field, value)
    db.commit()
    db.refresh(target)
    return target

@router.delete("/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_target(target_id: int, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    db.delete(target)
    db.commit()
    return None
