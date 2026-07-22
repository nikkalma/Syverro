from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class UserBookExperience(Base):
    __tablename__ = "user_book_experiences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    atmosphere_node_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_nodes.id", ondelete="SET NULL"), nullable=True)
    mood_node_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_nodes.id", ondelete="SET NULL"), nullable=True)
    intensity = Column(Float, server_default="0.5", nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "book_id", "atmosphere_node_id", name="uq_user_book_experiences"),
    )
