from sqlalchemy import Column, String, DateTime, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)  # ✅ email обязателен
    phone = Column(String, unique=True, nullable=True, index=True)   # ✅ телефон опционален
    password_hash = Column(String, nullable=True)
    role = Column(String, default="user")
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_moderator = Column(Boolean, default=False)
    last_active = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    user_books = relationship("UserBook", back_populates="user", cascade="all, delete-orphan")
    sync_state = relationship("SyncState", back_populates="user", uselist=False, cascade="all, delete-orphan")
