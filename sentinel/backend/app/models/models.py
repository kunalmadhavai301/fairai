# SQLAlchemy models for Sentinel AI backend
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Float, Boolean
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Target(Base):
    __tablename__ = 'targets'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    type = Column(String, nullable=False)  # 'ollama', 'openai', 'custom_rest', 'agent', 'rag'
    environment = Column(String, default='development')  # development, testing, staging, production
    provider = Column(String, nullable=True)
    health_status = Column(String, default='HEALTHY')  # HEALTHY, DEGRADED, OFFLINE
    last_latency_ms = Column(Float, default=0.0)
    config = Column(JSON, nullable=False)  # connection configuration
    tags = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    scans = relationship('Scan', back_populates='target', cascade='all, delete-orphan')

class Campaign(Base):
    __tablename__ = 'campaigns'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default='draft')  # draft, queued, running, completed, paused
    schedule = Column(String, nullable=True)  # cron expression or interval
    config = Column(JSON, nullable=True)  # stages and playbook refs
    created_at = Column(DateTime, default=datetime.utcnow)
    
    scans = relationship('Scan', back_populates='campaign')

class Playbook(Base):
    __tablename__ = 'playbooks'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # OWASP, Jailbreak, Agent, RAG, Clinical
    description = Column(Text, nullable=True)
    config = Column(JSON, nullable=False)  # tests, order, timeout, severity
    created_at = Column(DateTime, default=datetime.utcnow)

class Scan(Base):
    __tablename__ = 'scans'
    id = Column(Integer, primary_key=True, index=True)
    target_id = Column(Integer, ForeignKey('targets.id'), nullable=False)
    campaign_id = Column(Integer, ForeignKey('campaigns.id'), nullable=True)
    scan_type = Column(String, default='standard')  # standard, campaign, regression, comparative
    status = Column(String, default='pending')  # pending, running, completed, failed
    security_score = Column(Float, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    result = Column(JSON, nullable=True)  # summary metrics
    
    target = relationship('Target', back_populates='scans')
    campaign = relationship('Campaign', back_populates='scans')
    findings = relationship('Finding', back_populates='scan', cascade='all, delete-orphan')

class Finding(Base):
    __tablename__ = 'findings'
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey('scans.id'), nullable=False)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    severity = Column(String, nullable=False)  # low, medium, high, critical
    location = Column(String, nullable=True)  # OWASP category / framework ref
    status = Column(String, default='Detected')  # Detected, Triaged, Confirmed, Mitigated, Resolved, False Positive
    owner = Column(String, nullable=True)
    priority = Column(String, default='P2')
    evidence = Column(JSON, nullable=True)  # attack prompt, target response, evaluation details
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    scan = relationship('Scan', back_populates='findings')

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)  # TARGET_CREATED, SCAN_STARTED, FINDING_UPDATED, etc.
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class SecurityDataset(Base):
    __tablename__ = 'security_datasets'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    source = Column(String, nullable=False)
    framework = Column(String, nullable=True)
    category = Column(String, nullable=True)
    num_tests = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    metadata_json = Column(JSON, nullable=True)

