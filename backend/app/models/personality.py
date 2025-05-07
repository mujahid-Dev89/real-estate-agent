from sqlalchemy import Column, String, Integer, Text
from ..database import Base
import uuid

class PersonalityAttribute(Base):
    __tablename__ = "personality_attributes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    value = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)

