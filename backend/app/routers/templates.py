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
    if not templates:
        default_templates_data = [
            {
                "title": "Greeting",
                "content": "Hi, my name is [Agent Name], your AI Real Estate assistant. How can I help you today?",
                "category": "general",
                "situation_type": "inquiry"
            },
            {
                "title": "Studio Apartment Inquiry (Ajman)",
                "content": "Certainly! We have several studio apartments available in Ajman. Could you please provide more details about your preferences, such as budget and desired amenities, so I can find the best options for you?",
                "category": "property-info",
                "situation_type": "inquiry"
            },
            {
                "title": "Follow-up After Showing",
                "content": "Hello [Client Name], I hope you found the property showing useful. Do you have any further questions or feedback regarding the [Property Address] we visited?",
                "category": "follow-up",
                "situation_type": "showing"
            }
        ]
        new_templates = []
        for temp_data in default_templates_data:
            # The model uses UUIDs as primary keys which are auto-generated.
            # We pass the data directly to the model constructor.
            db_template = ResponseTemplate(**temp_data)
            db.add(db_template)
            new_templates.append(db_template)
        db.commit()
        for temp in new_templates: # Refresh each new template to get its ID and other db-generated fields
            db.refresh(temp)
        return new_templates
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