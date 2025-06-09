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
    TrainingProgress,
    TrainingScenarioCreate, # Added
    TrainingScenarioUpdate  # Added
)
from app.models.training import TrainingScenario as TrainingScenarioModel
from app.models.training import TrainingResponse as TrainingResponseModel
from app.models.personality import PersonalityAttribute # Added

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
        db_personality_attributes = db.query(PersonalityAttribute).all()
        if not db_personality_attributes:
            # Fallback to defaults if none are configured, or raise error
            # For now, let's use a simple default if none found
            # This matches the behavior in personality.py router if no attributes are ever saved
             personality_attributes = {
                "Professionalism": 85, "Empathy": 75, "Assertiveness": 65, "Knowledge": 80
            }
        else:
            personality_attributes = {attr.name: attr.value for attr in db_personality_attributes}

        # Evaluate the response
        evaluation = await ai_evaluator.evaluate_response(
            response.response_text,
            scenario,
            personality_attributes # Use fetched/default attributes
        )

        # Save the evaluation to the database
        db_response_data = {
            "agent_response": response.response_text,
            "evaluation": evaluation
        }
        if response.scenario_id:
            # Check if the scenario exists
            db_scenario = db.query(TrainingScenarioModel).filter(TrainingScenarioModel.id == response.scenario_id).first()
            if not db_scenario:
                raise HTTPException(status_code=404, detail=f"Scenario with ID {response.scenario_id} not found")
            db_response_data["scenario_id"] = response.scenario_id
        
        db_response = TrainingResponseModel(**db_response_data)
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
    limit: int = 100 # Increased limit to fetch more scenarios by default for the dropdown
):
    scenarios = db.query(TrainingScenarioModel).order_by(TrainingScenarioModel.created_at.desc()).offset(skip).limit(limit).all()
    if not scenarios and skip == 0: # Only add defaults if the table is truly empty
        default_scenarios_data = [
            {
                "title": "Basic Studio Inquiry (Ajman)",
                "description": "A customer asks for basic information about studio apartments in Ajman.",
                "customer_query": "Hi, I'm looking for a studio apartment in Ajman. Can you tell me what's available?",
                "context": "The agent has access to current listings. Ajman is known for affordable studios. Key areas: Al Rashidiya, Al Nuaimiya.",
                "difficulty_level": "Easy",
                "category": "Property Inquiry"
            },
            {
                "title": "Budget Constraint Inquiry",
                "description": "A customer has a specific, potentially tight budget for a 2-bedroom apartment.",
                "customer_query": "I need a 2-bedroom apartment, but my budget is strictly AED 30,000 per year. Is that possible in Sharjah?",
                "context": "Sharjah has varied pricing. Some areas might meet this, others won't. Agent should manage expectations and offer solutions.",
                "difficulty_level": "Medium",
                "category": "Budget Discussion"
            },
            {
                "title": "Handling Objection: Price Too High",
                "description": "A customer objects to the price of a listed property.",
                "customer_query": "That villa is beautiful, but the price seems a bit high compared to others I've seen.",
                "context": "The villa has unique features: premium finishing, large plot, recent renovation. Market comparables might not reflect these.",
                "difficulty_level": "Hard",
                "category": "Objection Handling"
            }
        ]
        new_scenarios = []
        for scen_data in default_scenarios_data:
            db_scenario = TrainingScenarioModel(**scen_data)
            db.add(db_scenario)
            new_scenarios.append(db_scenario)
        db.commit()
        for scen in new_scenarios:
            db.refresh(scen) # Refresh to get DB-generated fields like ID and created_at
        return new_scenarios
    return scenarios

@router.post("/scenarios", response_model=TrainingScenario, status_code=201)
def create_scenario(scenario: TrainingScenarioCreate, db: Session = Depends(get_db)):
    """Create a new training scenario."""
    db_scenario = TrainingScenarioModel(**scenario.model_dump())
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return db_scenario

@router.get("/scenarios/{scenario_id}", response_model=TrainingScenario)
def get_scenario(scenario_id: UUID, db: Session = Depends(get_db)):
    """Get a specific training scenario by its ID."""
    db_scenario = db.query(TrainingScenarioModel).filter(TrainingScenarioModel.id == scenario_id).first()
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return db_scenario

@router.put("/scenarios/{scenario_id}", response_model=TrainingScenario)
def update_scenario(scenario_id: UUID, scenario_update: TrainingScenarioUpdate, db: Session = Depends(get_db)):
    """Update an existing training scenario."""
    db_scenario = db.query(TrainingScenarioModel).filter(TrainingScenarioModel.id == scenario_id).first()
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    update_data = scenario_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_scenario, key, value)
        
    db.commit()
    db.refresh(db_scenario)
    return db_scenario

@router.delete("/scenarios/{scenario_id}", status_code=204)
def delete_scenario(scenario_id: UUID, db: Session = Depends(get_db)):
    """Delete a training scenario."""
    db_scenario = db.query(TrainingScenarioModel).filter(TrainingScenarioModel.id == scenario_id).first()
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    # Optional: Check for and handle related TrainingResponses if necessary
    # For now, we'll just delete the scenario.
    # If foreign key constraints are set up with cascade delete, responses might be deleted automatically.
    # Otherwise, you might want to prevent deletion if responses exist, or delete them manually.

    db.delete(db_scenario)
    db.commit()
    return None

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

