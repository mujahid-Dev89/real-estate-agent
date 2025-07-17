from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID
from enum import Enum as PyEnum

# Re-define PropertyType Enum for Pydantic, matching the model's Enum
class PropertyTypeEnum(str, PyEnum):
    rent = "rent"
    sale = "sale"

class PropertyBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    property_type: PropertyTypeEnum = PropertyTypeEnum.rent
    price: float = Field(..., gt=0)
    currency: str = Field(default="AED", max_length=5)
    area_sqft: Optional[int] = Field(None, gt=0)
    bedrooms: Optional[int] = Field(None, ge=0)
    bathrooms: Optional[int] = Field(None, ge=0)
    location: Optional[str] = None
    amenities: Optional[Dict[str, Any]] = None # Flexible dictionary for amenities
    image_url: Optional[str] = None
    is_available: Optional[int] = 1

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(PropertyBase):
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    price: Optional[float] = Field(None, gt=0)
    # Allow all fields to be optional on update
    property_type: Optional[PropertyTypeEnum] = None
    currency: Optional[str] = Field(None, max_length=5)


class PropertyResponse(PropertyBase):
    id: UUID

    class Config:
        from_attributes = True # Replaces orm_mode = True in Pydantic v2