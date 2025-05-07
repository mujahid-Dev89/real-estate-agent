from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, List
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.services.ai_evaluation import AIEvaluator, AIModel
from app.schemas.training import (
    ResponseEvaluation,
    TrainingResponse,
    ScenarioResponse,
    TrainingScenario,
    TrainingProgress
)
from app.models.training import TrainingScenario as TrainingScenarioModel
from app.models.training import TrainingResponse as TrainingResponseModel

router = APIRouter(
    prefix="/api/training",
    tags=["training"]
)

@router.post("/evaluate", response_model=ResponseEvaluation)
async def evaluate_response(
    response: ScenarioResponse,
    model: str = Query(default=None, description="AI model to use (deepseek, mistral, or openai)"),
    db: Session = Depends(get_db)
):
    try:
        # Determine which AI model to use
        try:
            ai_model = AIModel[model.upper()] if model else AIModel.DEEPSEEK
        except KeyError:
            ai_model = AIModel.DEEPSEEK
            
        ai_evaluator = AIEvaluator(model_type=ai_model)

        # Get the scenario details
        scenario = {
            "customer_query": response.scenario_query,
            "context": response.scenario_context
        }

        # Get personality attributes
        # In a real implementation, you'd fetch this from the database
        personality_attributes = {
            "Professionalism": 85,
            "Empathy": 75,
            "Assertiveness": 65,
            "Knowledge": 80
        }

        # Evaluate the response
        evaluation = await ai_evaluator.evaluate_response(
            response.response_text,
            scenario,
            personality_attributes
        )

        # Save the evaluation to the database
        db_response = TrainingResponseModel(
            agent_response=response.response_text,
            evaluation=evaluation
        )
        db.add(db_response)
        db.commit()

        return evaluation

    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model specified. Choose from: {', '.join([m.value for m in AIModel])}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scenarios", response_model=List[TrainingScenario])
def get_scenarios(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    scenarios = db.query(TrainingScenarioModel).offset(skip).limit(limit).all()
    return scenarios

@router.get("/progress", response_model=TrainingProgress)
def get_training_progress(db: Session = Depends(get_db)):
    # Get all responses for the current user
    responses = db.query(TrainingResponseModel).all()
    
    # Calculate progress metrics
    total_scenarios = db.query(TrainingScenarioModel).count()
    completed_scenarios = len(responses)
    
    # Calculate average score
    if completed_scenarios > 0:
        total_score = sum(
            response.evaluation.get("score", 0) 
            for response in responses 
            if response.evaluation
        )
        average_score = total_score / completed_scenarios
    else:
        average_score = 0.0

    # Get recent responses
    recent_responses = responses[-5:] if responses else []

    # Aggregate strengths and areas to improve
    strengths = []
    areas_to_improve = []
    for response in responses:
        if response.evaluation:
            strengths.extend(response.evaluation.get("strengths", []))
            areas_to_improve.extend(response.evaluation.get("improvements", []))

    # Remove duplicates and get top 5
    strengths = list(set(strengths))[:5]
    areas_to_improve = list(set(areas_to_improve))[:5]

    return TrainingProgress(
        total_scenarios=total_scenarios,
        completed_scenarios=completed_scenarios,
        average_score=average_score,
        recent_responses=recent_responses,
        strengths=strengths,
        areas_to_improve=areas_to_improve
    )

