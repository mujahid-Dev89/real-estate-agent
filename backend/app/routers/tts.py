from fastapi import APIRouter
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from app.config import settings
from openai import OpenAI
import io

router = APIRouter(prefix="/api/tts", tags=["tts"])

class TTSRequest(BaseModel):
    text: str

@router.post("/speak")
async def speak_text(body: TTSRequest):
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.audio.speech.create(
        model="tts-1",
        voice="alloy",
        input=body.text
    )
    audio_bytes = response.content
    return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")