import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

class AnalysisReport(Base):
    __tablename__ = "analysis_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_id = Column(Integer, ForeignKey("uploaded_files.id"), nullable=True)
    title = Column(String, nullable=False)
    report_type = Column(String, default="pdf")  # 'pdf', 'docx', 'html', 'md', 'pptx'
    report_path = Column(String, nullable=False)
    download_count = Column(Integer, default=0)
    summary = Column(Text, nullable=True)
    generated_date = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="reports")
    file = relationship("UploadedFile", back_populates="reports")
