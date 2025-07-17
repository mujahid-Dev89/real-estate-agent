from sqlalchemy import Column, String, Integer, Float, Text, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from enum import Enum as PyEnum
from ..database import Base

class PropertyType(PyEnum):
    sale = "sale"
    rent = "rent"

class Property(Base):
    __tablename__ = "properties"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    property_type = Column(SQLAlchemyEnum(PropertyType), nullable=False, default=PropertyType.rent)
    price = Column(Float, nullable=False)
    currency = Column(String, nullable=False, default="AED")
    area_sqft = Column(Integer, nullable=True)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    location = Column(String, nullable=True, index=True)
    amenities = Column(JSONB, nullable=True) # e.g., {"pool": true, "gym": false, "parking_spots": 1}
    image_url = Column(String, nullable=True)
    is_available = Column(Integer, default=1, nullable=False) # Using Integer for potential future states (1=available, 0=unavailable, 2=pending etc)

    # Add other relevant fields like:
    # created_at = Column(DateTime(timezone=True), server_default=func.now())
    # updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    # user_id = Column(Integer, ForeignKey("users.id")) # If properties are linked to users