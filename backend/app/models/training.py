from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from ..database import Base

class TrainingScenario(Base):
    __tablename__ = "training_scenarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    customer_query = Column(Text, nullable=False)
    context = Column(Text, nullable=False)
    difficulty_level = Column(String, nullable=False)
    category = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class TrainingResponse(Base):
    __tablename__ = "training_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scenario_id = Column(UUID(as_uuid=True), ForeignKey("training_scenarios.id"))
    agent_response = Column(Text, nullable=False)
    evaluation = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

