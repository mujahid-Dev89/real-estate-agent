from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, templates, training, agent, personality
from .models import create_tables

app = FastAPI()

# Create database tables
create_tables()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

@app.get("/")
async def root():
    return {"message": "Welcome to AI Real Estate Agent API"}

