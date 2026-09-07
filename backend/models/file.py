import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, BigInteger
from sqlalchemy.orm import relationship
from backend.database import Base

class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_filename = Column(String, nullable=False)
    edited_filename = Column(String, nullable=True)
    file_size = Column(BigInteger, nullable=False)
    file_type = Column(String, nullable=False)
    storage_location = Column(String, nullable=False)
    original_storage_location = Column(String, nullable=False)
    encryption_status = Column(Boolean, default=False)
    password_protected = Column(Boolean, default=False)
    password_hash = Column(String, nullable=True)
    version = Column(Integer, default=1)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    modification_date = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="files")
    reports = relationship("AnalysisReport", back_populates="file", cascade="all, delete-orphan")
    chat_histories = relationship("ChatHistory", back_populates="file", cascade="all, delete-orphan")
    versions = relationship("FileVersion", back_populates="file", cascade="all, delete-orphan")


class FileVersion(Base):
    __tablename__ = "file_versions"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    storage_path = Column(String, nullable=False)
    change_summary = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    file = relationship("UploadedFile", back_populates="versions")
