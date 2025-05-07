from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/real_estate_agent"
    SECRET_KEY: str = "your-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # AI Model API Keys
    OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY", "")
    DEEPSEEK_API_KEY: str = os.environ.get("DEEPSEEK_API_KEY", "")
    MISTRAL_API_KEY: str = os.environ.get("MISTRAL_API_KEY", "")
    
    # Default AI Model
    DEFAULT_AI_MODEL: str = "deepseek"

    class Config:
        env_file = ".env"

settings = Settings()

