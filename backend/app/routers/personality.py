from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.personality import PersonalityAttribute
from ..schemas.personality import AttributeResponse, AttributeUpdate

router = APIRouter(
    prefix="/api/personality",
    tags=["personality"]
)

@router.get("/attributes", response_model=List[AttributeResponse])
def get_attributes(db: Session = Depends(get_db)):
    """Get all personality attributes"""
    attributes = db.query(PersonalityAttribute).all()
    
    # If no attributes exist, create default ones
    if not attributes:
        default_attributes = [
            PersonalityAttribute(
                name="Professionalism",
                value=85,
                description="Demonstrates expertise and maintains professional standards"
            ),
            PersonalityAttribute(
                name="Empathy",
                value=75,
                description="Shows understanding and compassion for client needs"
            ),
            PersonalityAttribute(
                name="Assertiveness",
                value=65,
                description="Confidently presents information and negotiates effectively"
            ),
            PersonalityAttribute(
                name="Knowledge",
                value=80,
                description="Demonstrates deep understanding of real estate market and processes"
            )
        ]
        db.add_all(default_attributes)
        db.commit()
        attributes = default_attributes
    
    return attributes

@router.put("/attributes", response_model=List[AttributeResponse])
def update_attributes(attributes: List[AttributeUpdate], db: Session = Depends(get_db)):
    """Update personality attributes"""
    updated_attributes = []
    
    for attr_update in attributes:
        db_attr = db.query(PersonalityAttribute).filter(PersonalityAttribute.id == attr_update.id).first()
        if not db_attr:
            raise HTTPException(status_code=404, detail=f"Attribute with ID {attr_update.id} not found")
        
        # Update the attribute
        db_attr.value = attr_update.value
        updated_attributes.append(db_attr)
    
    db.commit()
    return updated_attributes

