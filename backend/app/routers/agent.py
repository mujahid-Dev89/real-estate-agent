from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.services.agent_chat import AgentChat
from app.services.ai_evaluation import AIModel
from app.models.template import ResponseTemplate
from app.config import settings
import logging

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
        # In a real implementation, you'd fetch this from the database
        personality_attributes = {
            "Professionalism": 85,
            "Empathy": 75,
            "Assertiveness": 65,
            "Knowledge": 80
        }
        
        # Get response templates
        templates = db.query(ResponseTemplate).limit(5).all()
        template_list = [
            {
                "situation_type": template.situation_type,
                "content": template.content
            }
            for template in templates
        ]
        
        # Generate response
        response = await agent_chat.generate_response(
            user_message=request.message,
            conversation_history=[{"role": msg.role, "content": msg.content} for msg in request.history],
            personality_attributes=personality_attributes,
            templates=template_list
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

