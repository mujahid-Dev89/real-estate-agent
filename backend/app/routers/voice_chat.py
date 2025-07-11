from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.services.agent_chat import AgentChat

from app.database import get_db
from openai import OpenAI
import tempfile
import subprocess
import os
import io
from app.services.context_helpers import (
    get_current_personality_attributes,
    get_response_templates,
    get_property_context,
)
router = APIRouter(prefix="/api/voice", tags=["voice"])

@router.post("/chat")
async def voice_chat(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        # Save uploaded file to temp
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_in:
            temp_in.write(await file.read())
            temp_in.flush()
            temp_in_path = temp_in.name

        # Convert webm to wav
        temp_out_path = temp_in_path.replace(".webm", ".wav")
        subprocess.run(["ffmpeg", "-y", "-i", temp_in_path, temp_out_path], check=True)

        # Transcribe with Whisper
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        with open(temp_out_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        user_text = transcript.text

        # --- Fetch context ---
        personality_attributes = get_current_personality_attributes(db)
        templates = get_response_templates(db)
        property_context = get_property_context(db, user_text)

        # --- Conversation history (stateless demo: just last user message) ---
        # For real multi-turn, use session/user-based storage
        conversation_history = []

        # --- Generate agent response using OpenAI only ---
        agent = AgentChat(model_type="openai")
        ai_response = await agent.generate_response(
            user_message=user_text,
            conversation_history=conversation_history,
            personality_attributes=personality_attributes,
            templates=templates,
            property_context=property_context
        )
        agent_text = ai_response["response"]

        # Synthesize agent response with OpenAI TTS
        tts_response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=agent_text
        )
        audio_bytes = tts_response.content

        # Clean up
        os.remove(temp_in_path)
        os.remove(temp_out_path)

        return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)