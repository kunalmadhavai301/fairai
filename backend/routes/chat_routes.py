from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from backend.database import get_db, UploadedFile, ChatMessage, ActivityLog, User
from backend.auth import get_current_user_optional
from backend.services.ai_agent_service import process_agent_command
from backend.services.version_service import create_version_snapshot

router = APIRouter(prefix="/api/chat", tags=["AI Agent Chatbot"])

class ChatMessagePayload(BaseModel):
    message: str
    file_id: Optional[int] = None
    compare_file_id: Optional[int] = None

@router.post("")
def chat_with_agent(
    payload: ChatMessagePayload,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    file_info = None
    if payload.file_id:
        file_record = db.query(UploadedFile).filter(UploadedFile.id == payload.file_id).first()
        if file_record:
            file_info = {
                "file_path": file_record.file_path,
                "file_type": file_record.file_type,
                "original_name": file_record.original_name,
                "file_id": file_record.id
            }

    compare_file_info = None
    if payload.compare_file_id:
        c_record = db.query(UploadedFile).filter(UploadedFile.id == payload.compare_file_id).first()
        if c_record:
            compare_file_info = {
                "file_path": c_record.file_path,
                "file_type": c_record.file_type,
                "original_name": c_record.original_name
            }

    agent_result = process_agent_command(
        user_message=payload.message,
        file_info=file_info,
        db_session=db,
        compare_file_info=compare_file_info
    )

    # Save to chat history table
    msg_entry = ChatMessage(
        user_id=current_user.id if current_user else None,
        file_id=payload.file_id,
        role="user",
        content=payload.message
    )
    db.add(msg_entry)
    
    reply_entry = ChatMessage(
        user_id=current_user.id if current_user else None,
        file_id=payload.file_id,
        role="assistant",
        content=agent_result["response"],
        action_taken=agent_result.get("action_taken")
    )
    db.add(reply_entry)
    db.commit()

    # If live modification occurred, automatically save a version snapshot!
    if agent_result.get("modified_content") and payload.file_id:
        create_version_snapshot(db, payload.file_id, f"AI Agent Action: {agent_result.get('action_taken')}")

    return {
        "reply": agent_result["response"],
        "action_taken": agent_result["action_taken"],
        "modified_content": agent_result["modified_content"],
        "action_result": agent_result["action_result"]
    }
