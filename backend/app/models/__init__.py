from .template import ResponseTemplate
from .user import User
from .training import TrainingScenario, TrainingResponse
from .personality import PersonalityAttribute
from ..database import Base, engine

def create_tables():
    Base.metadata.create_all(bind=engine)

