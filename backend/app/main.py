from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, templates, training, agent, personality, properties,whisper,tts # Added properties
from .models import create_tables
from app.routers import voice_chat

app = FastAPI()

# Create database tables
create_tables()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(templates.router)
app.include_router(training.router)
app.include_router(agent.router)
app.include_router(personality.router)
app.include_router(properties.router) # Added properties router
app.include_router(whisper.router) # Added whisper router
app.include_router(tts.router) # Added tts router
app.include_router(voice_chat.router)

@app.get("/")
async def root():
    return {"message": "Welcome to AI Real Estate Agent API"}

