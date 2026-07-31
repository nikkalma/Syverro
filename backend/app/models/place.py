from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class Place(Base):
    __tablename__ = "places"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    name_native = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    country = Column(String, nullable=True)
    region = Column(String, nullable=True)
    place_type = Column(String, nullable=True)
    wikidata_id = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    knowledge_nodes = relationship("KnowledgeNode", back_populates="place")
