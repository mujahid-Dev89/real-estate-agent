from typing import Dict, List
import openai
import requests
from app.config import settings
from enum import Enum
from openai import AsyncOpenAI

class AIModel(Enum):
    DEEPSEEK = "deepseek"
    OPENAI = "openai"
    MISTRAL = "mistral"

class AIEvaluator:
    def __init__(self, model_type: AIModel = AIModel.OPENAI):
        self.model_type = model_type
        self.openai_api_key = settings.OPENAI_API_KEY
        self.deepseek_api_key = settings.DEEPSEEK_API_KEY
        self.mistral_api_key = settings.MISTRAL_API_KEY

    async def evaluate_response(
        self,
        agent_response: str,
        scenario: Dict,
        personality_attributes: Dict[str, float]
    ) -> Dict:
        prompt = self._create_evaluation_prompt(
            agent_response,
            scenario,
            personality_attributes
        )

        try:
            if self.model_type == AIModel.DEEPSEEK:
                return await self._evaluate_with_deepseek(prompt)
            elif self.model_type == AIModel.MISTRAL:
                return await self._evaluate_with_mistral(prompt)
            elif self.model_type == AIModel.OPENAI:
                return await self._evaluate_with_openai(prompt)
            else:
                raise ValueError(f"Unsupported AI model: {self.model_type}")

        except Exception as e:
            raise Exception(f"AI evaluation failed: {str(e)}")

    async def _evaluate_with_deepseek(self, prompt: str) -> Dict:
        url = "https://api.deepseek.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.deepseek_api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "system",
                    "content": """You are an expert real estate training evaluator. 
                    Evaluate agent responses based on scenario context and desired personality attributes.
                    Provide specific feedback and suggestions for improvement."""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            result = response.json()
            raw_llm_text = result['choices'][0]['message']['content']
            print(f"RAW LLM EVALUATION TEXT (DeepSeek):\n{raw_llm_text}\n")
            evaluation = self._parse_evaluation(raw_llm_text)
            return evaluation
        else:
            raise Exception(f"DeepSeek API error: {response.text}")

    async def _evaluate_with_mistral(self, prompt: str) -> Dict:
        url = "https://api.mistral.ai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.mistral_api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "mistral-medium",
            "messages": [
                {
                    "role": "system",
                    "content": """You are an expert real estate training evaluator. 
                    Evaluate agent responses based on scenario context and desired personality attributes.
                    Provide specific feedback and suggestions for improvement."""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            result = response.json()
            raw_llm_text = result['choices'][0]['message']['content']
            print(f"RAW LLM EVALUATION TEXT (Mistral):\n{raw_llm_text}\n")
            evaluation = self._parse_evaluation(raw_llm_text)
            return evaluation
        else:
            raise Exception(f"Mistral API error: {response.text}")

    async def _evaluate_with_openai(self, prompt: str) -> Dict:
        client = AsyncOpenAI(api_key = self.openai_api_key)
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",  # Using GPT-3.5 instead of GPT-4 to reduce costs
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert real estate training evaluator. 
                    Evaluate agent responses based on scenario context and desired personality attributes.
                    Provide specific feedback and suggestions for improvement."""
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        raw_llm_text = response.choices[0].message.content
        print(f"RAW LLM EVALUATION TEXT (OpenAI):\n{raw_llm_text}\n")
        evaluation = self._parse_evaluation(raw_llm_text)
        return evaluation

    def _create_evaluation_prompt(
        self,
        response: str,
        scenario: Dict,
        personality_attributes: Dict[str, float]
    ) -> str:
        return f"""
        Evaluate this real estate agent's response based on the following:

        SCENARIO:
        Customer Query: {scenario['customer_query']}
        Context: {scenario['context']}

        DESIRED PERSONALITY ATTRIBUTES:
        {self._format_personality_attributes(personality_attributes)}

        AGENT'S RESPONSE:
        {response}

        Provide evaluation in the following format:
        1. Overall Score (1-100)
        2. Personality Match Analysis
        3. Strengths
        4. Areas for Improvement
        5. Specific Suggestions
        """

    def _format_personality_attributes(self, attributes: Dict[str, float]) -> str:
        return "\n".join([f"- {key}: {value}%" for key, value in attributes.items()])

    def _parse_evaluation(self, ai_response: str) -> Dict:
        # Same parsing logic as before
        sections = ai_response.split("\n")
        
        evaluation = {
            "score": 0,
            "personality_match": {},
            "strengths": [],
            "improvements": [],
            "suggestions": []
        }

        current_section = None
        for line in sections:
            line = line.strip()
            if line.startswith("1. Overall Score"):
                current_section = "score"
                try:
                    evaluation["score"] = int(line.split(":")[-1].strip().split("/")[0])
                except:
                    pass
            elif line.startswith("2. Personality Match"):
                current_section = "personality_match"
            elif line.startswith("3. Strengths"):
                current_section = "strengths"
            elif line.startswith("4. Areas for Improvement"):
                current_section = "improvements"
            elif line.startswith("5. Specific Suggestions"):
                current_section = "suggestions"
            elif line and current_section:
                if current_section in ["strengths", "improvements", "suggestions"]:
                    if line.startswith("-"):
                        evaluation[current_section].append(line[1:].strip())

        return evaluation

