from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class SyncState(Base):
    __tablename__ = "sync_state"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    last_sync_cursor = Column(String, nullable=True)
    device_id = Column(String, nullable=True)
    last_sync_status = Column(String, default="success")
    last_sync_error = Column(Text, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="sync_state")