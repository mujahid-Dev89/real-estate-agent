from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ..database import get_db
from ..models.property import Property as PropertyModel
from ..schemas.property import PropertyCreate, PropertyUpdate, PropertyResponse

router = APIRouter(
    prefix="/api/properties",
    tags=["properties"]
)

@router.post("/", response_model=PropertyResponse, status_code=201)
def create_property(property_data: PropertyCreate, db: Session = Depends(get_db)):
    db_property = PropertyModel(**property_data.model_dump())
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property

@router.get("/", response_model=List[PropertyResponse])
def get_properties(
    skip: int = 0, 
    limit: int = 100, 
    property_type: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_bedrooms: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PropertyModel)
    if property_type:
        query = query.filter(PropertyModel.property_type == property_type)
    if location:
        query = query.filter(PropertyModel.location.ilike(f"%{location}%")) # case-insensitive search
    if min_price is not None:
        query = query.filter(PropertyModel.price >= min_price)
    if max_price is not None:
        query = query.filter(PropertyModel.price <= max_price)
    if min_bedrooms is not None:
        query = query.filter(PropertyModel.bedrooms >= min_bedrooms)
        
    properties = query.offset(skip).limit(limit).all()
    return properties

@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: UUID, db: Session = Depends(get_db)):
    db_property = db.query(PropertyModel).filter(PropertyModel.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return db_property

@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(property_id: UUID, property_data: PropertyUpdate, db: Session = Depends(get_db)):
    db_property = db.query(PropertyModel).filter(PropertyModel.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    update_data = property_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_property, key, value)
        
    db.commit()
    db.refresh(db_property)
    return db_property

@router.delete("/{property_id}", status_code=204)
def delete_property(property_id: UUID, db: Session = Depends(get_db)):
    db_property = db.query(PropertyModel).filter(PropertyModel.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db.delete(db_property)
    db.commit()
    return None # No content for 204