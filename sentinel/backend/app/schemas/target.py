from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime

class TargetBase(BaseModel):
    name: str = Field(..., description="Unique name for the target")
    type: str = Field(..., description="Target type e.g. ollama, openai, custom_rest, agent, rag")
    environment: Optional[str] = Field(default="development", description="development, testing, staging, production")
    provider: Optional[str] = None
    health_status: Optional[str] = "HEALTHY"
    last_latency_ms: Optional[float] = 0.0
    config: Dict[str, Any] = Field(..., description="Configuration dict for connection details")
    tags: Optional[List[str]] = None
    description: Optional[str] = None

class TargetCreate(TargetBase):
    pass

class TargetUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    environment: Optional[str] = None
    provider: Optional[str] = None
    health_status: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    description: Optional[str] = None

class TargetRead(TargetBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

