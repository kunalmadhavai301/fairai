import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, BigInteger
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, nullable=True)
    country = Column(String, nullable=True)
    profile_photo = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")  # 'user' or 'admin'
    status = Column(String, default="active")  # 'active' or 'suspended'
    subscription_plan = Column(String, default="free")  # 'free', 'pro', 'enterprise'
    storage_used = Column(BigInteger, default=0)
    email_verified = Column(Boolean, default=False)
    login_count = Column(Integer, default=0)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    files = relationship("UploadedFile", back_populates="owner", cascade="all, delete-orphan")
    reports = relationship("AnalysisReport", back_populates="owner", cascade="all, delete-orphan")
    chat_histories = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")
    login_histories = relationship("LoginHistory", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
