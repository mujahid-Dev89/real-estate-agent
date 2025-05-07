from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.template import ResponseTemplate
from app.schemas.template import TemplateCreate, TemplateUpdate, TemplateResponse

router = APIRouter(
    prefix="/api/templates",
    tags=["templates"]
)

@router.get("/", response_model=List[TemplateResponse])
def get_templates(db: Session = Depends(get_db)):
    templates = db.query(ResponseTemplate).all()
    return templates

@router.post("/", response_model=TemplateResponse)
def create_template(template: TemplateCreate, db: Session = Depends(get_db)):
    db_template = ResponseTemplate(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(template_id: str, template: TemplateUpdate, db: Session = Depends(get_db)):
    db_template = db.query(ResponseTemplate).filter(ResponseTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    for key, value in template.dict(exclude_unset=True).items():
        setattr(db_template, key, value)
    
    db.commit()
    db.refresh(db_template)
    return db_template

@router.delete("/{template_id}")
def delete_template(template_id: str, db: Session = Depends(get_db)):
    db_template = db.query(ResponseTemplate).filter(ResponseTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(db_template)
    db.commit()
    return {"message": "Template deleted successfully"}