from pydantic import BaseModel
from typing import Optional

class TemplateBase(BaseModel):
    title: str
    content: str
    category: str
    situation_type: str

class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(TemplateBase):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    situation_type: Optional[str] = None

class TemplateResponse(TemplateBase):
    id: str

    class Config:
        orm_mode = True

