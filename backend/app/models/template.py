from sqlalchemy import Column, String, Text
from ..database import Base
import uuid

class ResponseTemplate(Base):
    __tablename__ = "response_templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    situation_type = Column(String, nullable=False)

