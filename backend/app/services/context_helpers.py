from sqlalchemy.orm import Session
from app.models.personality import PersonalityAttribute
from app.models.property import Property
from app.models.template import ResponseTemplate  # <-- FIXED

def get_current_personality_attributes(db: Session) -> dict:
    attributes = db.query(PersonalityAttribute).all()
    return {attr.name: attr.value for attr in attributes}

def get_response_templates(db: Session) -> list:
    templates = db.query(ResponseTemplate).all()  # <-- FIXED
    return [
        {
            "situation_type": t.situation_type,
            "content": t.content,
            "title": t.title,
            "category": t.category,
        }
        for t in templates
    ]

def get_property_context(db: Session, user_text: str = "") -> str:
    properties = db.query(Property).all()
    return "\n".join([
        f"{p.title}: {p.description or ''} | Price: {p.price} {p.currency} | Location: {p.location or ''}"
        for p in properties
    ])