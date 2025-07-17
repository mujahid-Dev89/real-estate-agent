from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ..database import get_db
from ..models.property import Property as PropertyModel
from ..schemas.property import PropertyCreate, PropertyUpdate, PropertyResponse
from ..models.property import PropertyType
import traceback

router = APIRouter(
    prefix="/api/properties",
    tags=["properties"],
    # Note: Trailing slashes are generally handled by FastAPI itself.
    # If strict trailing slash behavior is needed, it's often configured at the FastAPI app level
    # or by ensuring client requests are consistent.
    # However, for individual routers, this isn't a standard APIRouter parameter.
    # The redirect behavior is more likely the cause if CORS is an issue.
    # Let's ensure the client calls /api/properties/ for POST if the server expects it.
    # For now, no change here, will re-evaluate if client-side slash addition (denied previously) is needed.
)

@router.post("/", response_model=PropertyResponse, status_code=201)
def create_property(property_data: PropertyCreate, db: Session = Depends(get_db)):
    try:
        # Don't use .model_dump() to create the SQLAlchemy model
        db_property = PropertyModel(**property_data.dict())
        db.add(db_property)
        db.commit()
        db.refresh(db_property)
        return db_property
    except Exception as e:
        import traceback
        print("CREATE PROPERTY ERROR:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


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
        try:
            property_type_enum = PropertyType(property_type.lower())
            query = query.filter(PropertyModel.property_type == property_type_enum)
        except ValueError:
        # Invalid enum value, return empty or raise HTTPException
            return []
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
    # Convert property_type enum to string if needed
    if "property_type" in update_data and hasattr(update_data["property_type"], "value"):
        update_data["property_type"] = update_data["property_type"].value
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