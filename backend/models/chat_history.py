import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

class ChatHistory(Base):
    __tablename__ = "chat_histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id"), nullable=True)
    conversation = Column(Text, nullable=False)
    commands_used = Column(String, nullable=True)
    edited_file = Column(String, nullable=True)
    generated_report = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="chat_histories")
    file = relationship("UploadedFile", back_populates="chat_histories")
