from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db, ContactSubmission
from backend.services.email_service import send_contact_notification_email, PRIMARY_NOTIFICATION_EMAIL

router = APIRouter(prefix="/api/contact", tags=["Contact Form"])

class ContactMessagePayload(BaseModel):
    name: str
    email: str
    subject: str
    message: str

@router.post("")
def submit_contact_form(
    payload: ContactMessagePayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    if not payload.name.strip() or not payload.email.strip() or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Name, email, and message are required fields.")

    # 1. Save submission to SQLite Database
    contact_entry = ContactSubmission(
        name=payload.name.strip(),
        email=payload.email.strip(),
        subject=payload.subject.strip() or "General Inquiry",
        message=payload.message.strip()
    )
    db.add(contact_entry)
    db.commit()
    db.refresh(contact_entry)

    # 2. Trigger Notification Email to kunal.madhavai24@sanjivani.edu.in in background task
    contact_dict = {
        "id": contact_entry.id,
        "name": contact_entry.name,
        "email": contact_entry.email,
        "subject": contact_entry.subject,
        "message": contact_entry.message
    }
    background_tasks.add_task(send_contact_notification_email, contact_dict)

    return {
        "message": f"Thank you, {payload.name}! Your message has been saved and dispatched to Kunal Madhavai ({PRIMARY_NOTIFICATION_EMAIL}).",
        "notification_email": PRIMARY_NOTIFICATION_EMAIL
    }

@router.get("/messages")
def get_contact_messages(db: Session = Depends(get_db)):
    """
    Retrieve all submitted contact inquiries from SQLite database for Admin / Author view.
    """
    messages = db.query(ContactSubmission).order_by(ContactSubmission.created_at.desc()).all()
    return {
        "target_email": PRIMARY_NOTIFICATION_EMAIL,
        "total_messages": len(messages),
        "messages": [
            {
                "id": m.id,
                "name": m.name,
                "email": m.email,
                "subject": m.subject,
                "message": m.message,
                "created_at": m.created_at.strftime("%Y-%m-%d %H:%M:%S") if m.created_at else None
            } for m in messages
        ]
    }
