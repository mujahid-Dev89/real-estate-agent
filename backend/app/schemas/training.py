from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
from uuid import UUID

class ScenarioResponse(BaseModel):
    scenario_query: str = Field(..., description="The customer's query or scenario question")
    scenario_context: str = Field(..., description="Additional context about the scenario")
    response_text: str = Field(..., description="The agent's response to evaluate")
    scenario_id: Optional[UUID] = Field(None, description="Optional ID of the predefined scenario being responded to")

class PersonalityMatch(BaseModel):
    attribute: str
    score: float
    feedback: str

class ResponseEvaluation(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Overall evaluation score")
    personality_match: Dict[str, float] = Field(
        default_factory=dict,
        description="Scores for each personality attribute"
    )
    strengths: List[str] = Field(
        default_factory=list,
        description="List of identified strengths"
    )
    improvements: List[str] = Field(
        default_factory=list,
        description="List of areas needing improvement"
    )
    suggestions: List[str] = Field(
        default_factory=list,
        description="Specific suggestions for improvement"
    )

class TrainingScenario(BaseModel):
    id: UUID
    title: str
    description: str
    customer_query: str
    context: str
    difficulty_level: str
    category: str
    created_at: datetime

    class Config:
        from_attributes = True

class TrainingScenarioCreate(BaseModel):
    title: str
    description: str
    customer_query: str
    context: str
    difficulty_level: str
    category: str

class TrainingScenarioUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    customer_query: Optional[str] = None
    context: Optional[str] = None
    difficulty_level: Optional[str] = None
    category: Optional[str] = None

class TrainingResponse(BaseModel):
    id: UUID
    scenario_id: UUID
    agent_response: str
    evaluation: Optional[ResponseEvaluation]
    created_at: datetime

    class Config:
        from_attributes = True

class TrainingProgress(BaseModel):
    total_scenarios: int
    completed_scenarios: int
    average_score: float
    recent_responses: List[TrainingResponse]
    strengths: List[str]
    areas_to_improve: List[str]

    class Config:
        from_attributes = True

