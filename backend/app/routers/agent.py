from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.services.agent_chat import AgentChat
from app.services.ai_evaluation import AIModel
from app.models.template import ResponseTemplate
from app.models.personality import PersonalityAttribute
from app.models.property import Property as PropertyModel # Added
from app.config import settings
import logging
from app.models.property import PropertyType  # Make sure this import is at the top


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/agent",
    tags=["agent"]
)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []
    model: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    model: str
    tokens_used: int
    error: Optional[str] = None

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    try:
        # Determine which AI model to use
        model_name = request.model or settings.DEFAULT_AI_MODEL
        try:
            ai_model = AIModel[model_name.upper()] if model_name else AIModel.DEEPSEEK
        except KeyError:
            ai_model = AIModel.DEEPSEEK
        
        # Initialize agent chat
        agent_chat = AgentChat(model_type=ai_model)
        
        # Get personality attributes
        db_personality_attributes = db.query(PersonalityAttribute).all()
        if not db_personality_attributes:
            # Fallback to defaults if none are configured
            # This matches the behavior in personality.py router if no attributes are ever saved/created
            personality_attributes = {
                "Professionalism": 85, "Empathy": 75, "Assertiveness": 65, "Knowledge": 80
            }
        else:
            personality_attributes = {attr.name: attr.value for attr in db_personality_attributes}
        
        # Get response templates
        templates = db.query(ResponseTemplate).limit(5).all()
        template_list = [
            {
                "situation_type": template.situation_type,
                "content": template.content
            }
            for template in templates
        ]

        # --- Fetch relevant properties (simple keyword-based for MVP) ---
        property_context_str = None
        lower_message = request.message.lower()
        property_query = db.query(PropertyModel).filter(PropertyModel.is_available == 1)
        
        # Example: Very basic keyword matching
        keywords_location = ["ajman", "dubai", "sharjah", "downtown", "marina"] # Add more common locations
        keywords_type = {"studio": 0, "1 bedroom": 1, "2 bedroom": 2, "3 bedroom": 3, "villa": None} # Example mapping
        
        found_location = None
        for loc in keywords_location:
            if loc in lower_message:
                property_query = property_query.filter(PropertyModel.location.ilike(f"%{loc}%"))
                found_location = loc
                break # Take first found location for simplicity

        found_bedrooms = None
        for type_keyword, num_bedrooms in keywords_type.items():
            if type_keyword in lower_message:
                if num_bedrooms is not None:
                    property_query = property_query.filter(PropertyModel.bedrooms == num_bedrooms)
                # If "villa" or other types without specific bedroom count, could add other filters
                found_bedrooms = type_keyword
                break
        
        if "rent" in lower_message:
            property_query = property_query.filter(PropertyModel.property_type == PropertyType.RENT)
        elif "sale" in lower_message or "buy" in lower_message:
            property_query = property_query.filter(PropertyModel.property_type == PropertyType.SALE)

        relevant_properties = property_query.limit(3).all() # Get top 3 matches

        if relevant_properties:
            property_details_list = []
            for prop in relevant_properties:
                details = f"Title: {prop.title}, Type: {prop.property_type.value}, Price: {prop.price} {prop.currency}, Location: {prop.location}"
                if prop.bedrooms is not None: details += f", Bedrooms: {prop.bedrooms}"
                if prop.area_sqft is not None: details += f", Area: {prop.area_sqft} sqft"
                property_details_list.append(details)
            property_context_str = "Here are some properties that might match:\n" + "\n".join(property_details_list)
        elif found_location or found_bedrooms : # If keywords were found but no properties
             property_context_str = f"I searched for {found_bedrooms or ''} properties in {found_location or 'the specified area'} but couldn't find an exact match with current listings."


        # Generate response
        response = await agent_chat.generate_response(
            user_message=request.message,
            conversation_history=[{"role": msg.role, "content": msg.content} for msg in request.history],
            personality_attributes=personality_attributes,
            templates=template_list,
            property_context=property_context_str # Pass property context
        )
        
        # If there's an error field in the response, log it but still return the response
        if "error" in response:
            logger.error(f"Agent chat error: {response['error']}")
        
        return response
        
    except Exception as e:
        logger.exception(f"Unhandled exception in chat_with_agent: {str(e)}")
        # Return a fallback response instead of raising an HTTP exception
        return {
            "response": "I'm sorry, I'm having trouble connecting to my AI services right now. Please try again later.",
            "model": "fallback",
            "tokens_used": 0,
            "error": str(e)
        }

