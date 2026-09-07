from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime

from ..database import get_db
from ..models.models import Campaign, Playbook, AuditLog, SecurityDataset, Finding, Scan, Target

router = APIRouter(tags=['platform'])

# --- Campaigns ---
@router.get('/campaigns')
def list_campaigns(db: Session = Depends(get_db)):
    return db.query(Campaign).all()

@router.post('/campaigns')
def create_campaign(data: Dict[str, Any], db: Session = Depends(get_db)):
    c = Campaign(
        name=data.get('name', 'New Security Campaign'),
        description=data.get('description', ''),
        status='draft',
        schedule=data.get('schedule', ''),
        config=data.get('config', {})
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

# --- Playbooks ---
@router.get('/playbooks')
def list_playbooks(db: Session = Depends(get_db)):
    playbooks = db.query(Playbook).all()
    if not playbooks:
        # Seed default playbooks
        defaults = [
            {'name': 'OWASP LLM Top 10 Audit', 'category': 'OWASP', 'description': 'Full OWASP GenAI Top 10 vulnerability assessment', 'config': {'tests': ['OWASP-LLM01', 'OWASP-LLM02', 'OWASP-LLM06']}},
            {'name': 'Jailbreak & Prompt Injection Suite', 'category': 'Jailbreak', 'description': 'Deep adversarial jailbreak testing', 'config': {'tests': ['DAN', 'AyaAdvbench', 'DolphinJailbreak']}},
            {'name': 'AI Agent & Tool Security Assessment', 'category': 'Agent', 'description': 'Excessive agency, tool parameter abuse, and privilege escalation', 'config': {'tests': ['ExcessiveAgency', 'ToolAbuse']}},
            {'name': 'RAG & Context Poisoning Audit', 'category': 'RAG', 'description': 'Document injection and retrieval manipulation', 'config': {'tests': ['RAGInjection', 'DataLeak']}},
            {'name': 'Clinical AI Safety Protocol', 'category': 'Clinical', 'description': 'Medical data protection and safety boundary verification', 'config': {'tests': ['MedicalDataPrivacy', 'ClinicalRefusal']}}
        ]
        for d in defaults:
            pb = Playbook(name=d['name'], category=d['category'], description=d['description'], config=d['config'])
            db.add(pb)
        db.commit()
        playbooks = db.query(Playbook).all()
    return playbooks

# --- Audit Logs ---
@router.get('/audit-logs')
def list_audit_logs(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()

# --- Datasets ---
@router.get('/datasets')
def list_datasets(db: Session = Depends(get_db)):
    try:
        from agentic_security.probe_data import REGISTRY
        return [{'dataset_name': d.get('dataset_name'), 'source': d.get('source'), 'num_prompts': d.get('num_prompts', 0), 'modality': d.get('modality', 'text')} for d in REGISTRY[:25]]
    except Exception:
        return [{'dataset_name': 'OWASP-Benchmark-v1', 'source': 'Built-in', 'num_prompts': 150, 'modality': 'text'}]

# --- Analytics & Security Posture ---
@router.get('/posture')
def get_security_posture(db: Session = Depends(get_db)):
    total_targets = db.query(Target).count()
    total_scans = db.query(Scan).count()
    findings = db.query(Finding).all()
    critical = sum(1 for f in findings if f.severity == 'critical')
    high = sum(1 for f in findings if f.severity == 'high')
    medium = sum(1 for f in findings if f.severity == 'medium')
    low = sum(1 for f in findings if f.severity == 'low')
    
    # Calculate posture score
    base_score = 100.0
    base_score -= (critical * 15 + high * 8 + medium * 3 + low * 1)
    security_score = max(round(base_score, 1), 10.0)
    
    return {
        'overall_score': security_score,
        'risk_level': 'HIGH' if security_score < 60 else ('MEDIUM' if security_score < 85 else 'LOW'),
        'total_targets': total_targets,
        'total_scans': total_scans,
        'total_findings': len(findings),
        'findings_breakdown': {
            'critical': critical,
            'high': high,
            'medium': medium,
            'low': low
        },
        'posture_status': 'SECURE' if security_score >= 85 else 'ATTENTION_REQUIRED'
    }
