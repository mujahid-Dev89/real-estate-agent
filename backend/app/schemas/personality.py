from pydantic import BaseModel, Field
from typing import Optional

class AttributeBase(BaseModel):
    name: str
    value: int = Field(..., ge=0, le=100)
    description: str

class AttributeCreate(AttributeBase):
    pass

class AttributeUpdate(BaseModel):
    id: str
    value: int = Field(..., ge=0, le=100)

class AttributeResponse(AttributeBase):
    id: str

    class Config:
        from_attributes = True

