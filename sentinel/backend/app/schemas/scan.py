from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime

class ScanCreate(BaseModel):
    target_id: int
    datasets: List[str] = Field(default_factory=list, description="Dataset names to use")
    max_budget: int = Field(default=100, description="Max budget for scan")
    max_threshold: float = Field(default=0.3, description="Failure threshold 0-1")

class ScanRead(BaseModel):
    id: int
    target_id: int
    campaign_id: Optional[int] = None
    scan_type: Optional[str] = "standard"
    status: str
    security_score: Optional[float] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class FindingRead(BaseModel):
    id: int
    scan_id: int
    title: Optional[str] = None
    description: str
    severity: str
    location: Optional[str] = None
    status: Optional[str] = "Detected"
    owner: Optional[str] = None
    priority: Optional[str] = "P2"
    evidence: Optional[Dict[str, Any]] = None
    details: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ConnectionTestRequest(BaseModel):
    type: str = Field(..., description="Target type: ollama, openai, custom_rest")
    config: Dict[str, Any] = Field(..., description="Connection config")

class ConnectionTestResponse(BaseModel):
    success: bool
    status_code: Optional[int] = None
    latency_ms: Optional[float] = None
    model: Optional[str] = None
    error: Optional[str] = None
