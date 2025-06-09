from typing import Dict, List, Optional
import requests
import json
from app.config import settings
from app.services.ai_evaluation import AIModel
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgentChat:
    def __init__(self, model_type: AIModel = AIModel.DEEPSEEK):
        self.model_type = model_type
        self.openai_api_key = settings.OPENAI_API_KEY
        self.deepseek_api_key = settings.DEEPSEEK_API_KEY
        self.mistral_api_key = settings.MISTRAL_API_KEY
    
    async def generate_response(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        personality_attributes: Dict[str, float],
        templates: List[Dict] = None,
        property_context: Optional[str] = None # Added property_context
    ) -> Dict:
        """
        Generate a response from the AI agent based on personality attributes, training, and property context.
        
        Args:
            user_message: The user's message
            conversation_history: Previous messages in the conversation
            personality_attributes: The agent's personality attributes
            templates: Optional response templates to guide the agent
            
        Returns:
            Dict containing the agent's response and metadata
        """
        # Create system prompt based on personality attributes
        system_prompt = self._create_system_prompt(personality_attributes, templates, property_context) # Pass property_context
        
        # Format conversation history
        formatted_history = self._format_conversation_history(conversation_history)
        
        # Add user's current message
        formatted_history.append({"role": "user", "content": user_message})
        
        # Try the primary model first, then fall back to alternatives if it fails
        models_to_try = [self.model_type]
        
        # Add fallback models (different from the primary)
        for model in [AIModel.MISTRAL, AIModel.OPENAI, AIModel.DEEPSEEK]:
            if model != self.model_type:
                models_to_try.append(model)
        
        last_error = None
        for model in models_to_try:
            try:
                logger.info(f"Attempting to generate response with {model.value} model")
                if model == AIModel.DEEPSEEK:
                    return await self._generate_with_deepseek(system_prompt, formatted_history)
                elif model == AIModel.MISTRAL:
                    return await self._generate_with_mistral(system_prompt, formatted_history)
                elif model == AIModel.OPENAI:
                    return await self._generate_with_openai(system_prompt, formatted_history)
            except Exception as e:
                last_error = e
                logger.error(f"Error with {model.value} model: {str(e)}")
                continue  # Try the next model
        
        # If we get here, all models failed
        error_msg = str(last_error) if last_error else "All AI models failed to generate a response"
        logger.error(f"All models failed: {error_msg}")
        
        # Return a fallback response
        return {
            "response": "I'm sorry, I'm having trouble connecting to my AI services right now. Please try again later.",
            "model": "fallback",
            "tokens_used": 0,
            "error": error_msg
        }
    
    def _create_system_prompt(
        self,
        personality_attributes: Dict[str, float],
        templates: Optional[List[Dict]] = None,
        property_context: Optional[str] = None # Added property_context
    ) -> str:
        """Create a system prompt based on personality attributes, templates, and property context"""
        
        # Format personality attributes
        personality_desc = "\n".join([
            f"- {attr}: {value}%" for attr, value in personality_attributes.items()
        ])
        
        # Format templates if provided
        template_examples = ""
        if templates and len(templates) > 0:
            template_examples = "\nReference these response templates when appropriate:\n"
            for template in templates[:3]:  # Limit to 3 templates to avoid token limits
                template_examples += f"\nSituation: {template['situation_type']}\n"
                template_examples += f"Response: {template['content']}\n"
        
        # Create the system prompt
        system_prompt = f"""You are an AI-powered real estate agent assistant. 
        
Your personality attributes are:
{personality_desc}

Your goal is to assist potential clients with their real estate needs, providing helpful,
accurate information while maintaining your personality attributes.

{template_examples}

{("Consider the following property information if relevant to the user's query:\n" + property_context) if property_context else ""}

Always be professional, honest, and helpful. Avoid making up specific property details
unless they are mentioned in the conversation or provided in the property information context.
If you don't know something, acknowledge it and offer to find out more information.
"""
        return system_prompt
    
    def _format_conversation_history(self, history: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Format conversation history for the AI model"""
        formatted_history = []
        for message in history:
            if message["role"] in ["user", "assistant", "system"]:
                formatted_history.append({
                    "role": message["role"],
                    "content": message["content"]
                })
        return formatted_history
    
    async def _generate_with_deepseek(
        self, 
        system_prompt: str, 
        messages: List[Dict[str, str]]
    ) -> Dict:
        """Generate response using DeepSeek API"""
        if not self.deepseek_api_key:
            raise ValueError("DeepSeek API key is not configured")
            
        url = "https://api.deepseek.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.deepseek_api_key}",
            "Content-Type": "application/json"
        }
        
        # Add system prompt to messages
        full_messages = [{"role": "system", "content": system_prompt}] + messages
        
        data = {
            "model": "deepseek-chat",
            "messages": full_messages,
            "temperature": 0.7,
            "max_tokens": 800
        }
        
        try:
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()  # Raise exception for 4XX/5XX responses
            
            result = response.json()
            return {
                "response": result['choices'][0]['message']['content'],
                "model": "deepseek",
                "tokens_used": result.get('usage', {}).get('total_tokens', 0)
            }
        except requests.exceptions.HTTPError as e:
            error_detail = "Unknown error"
            try:
                error_json = response.json()
                error_detail = json.dumps(error_json)
            except:
                error_detail = response.text
                
            raise Exception(f"DeepSeek API error: {error_detail}")
    
    async def _generate_with_mistral(
        self, 
        system_prompt: str, 
        messages: List[Dict[str, str]]
    ) -> Dict:
        """Generate response using Mistral API"""
        if not self.mistral_api_key:
            raise ValueError("Mistral API key is not configured")
            
        url = "https://api.mistral.ai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.mistral_api_key}",
            "Content-Type": "application/json"
        }
        
        # Add system prompt to messages
        full_messages = [{"role": "system", "content": system_prompt}] + messages
        
        data = {
            "model": "mistral-medium",
            "messages": full_messages,
            "temperature": 0.7,
            "max_tokens": 800
        }
        
        try:
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()  # Raise exception for 4XX/5XX responses
            
            result = response.json()
            return {
                "response": result['choices'][0]['message']['content'],
                "model": "mistral",
                "tokens_used": result.get('usage', {}).get('total_tokens', 0)
            }
        except requests.exceptions.HTTPError as e:
            error_detail = "Unknown error"
            try:
                error_json = response.json()
                error_detail = json.dumps(error_json)
            except:
                error_detail = response.text
                
            raise Exception(f"Mistral API error: {error_detail}")
    
    async def _generate_with_openai(
        self, 
        system_prompt: str, 
        messages: List[Dict[str, str]]
    ) -> Dict:
        """Generate response using OpenAI API"""
        if not self.openai_api_key:
            raise ValueError("OpenAI API key is not configured")
            
        import openai
        openai.api_key = self.openai_api_key
        
        # Add system prompt to messages
        full_messages = [{"role": "system", "content": system_prompt}] + messages
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=full_messages,
                temperature=0.7,
                max_tokens=800
            )
            
            return {
                "response": response.choices[0].message.content,
                "model": "openai",
                "tokens_used": response.usage.total_tokens
            }
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")

