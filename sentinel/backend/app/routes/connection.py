from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.models import Target
from ..schemas.scan import ConnectionTestRequest, ConnectionTestResponse
from ..services.connection import test_connection

router = APIRouter(tags=["connection"])

@router.post("/targets/{target_id}/test", response_model=ConnectionTestResponse)
async def test_target_connection(target_id: int, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    result = await test_connection(target.type, target.config)
    
    # Update target health status and latency
    target.last_latency_ms = result.get("latency_ms", 0.0)
    if result.get("success"):
        target.health_status = "HEALTHY"
    elif result.get("latency_ms", 0) > 3000:
        target.health_status = "DEGRADED"
    else:
        target.health_status = "OFFLINE"
    db.commit()
    db.refresh(target)
    
    return ConnectionTestResponse(**result)

@router.post("/test-connection", response_model=ConnectionTestResponse)
async def test_connection_direct(req: ConnectionTestRequest):
    result = await test_connection(req.type, req.config)
    return ConnectionTestResponse(**result)
