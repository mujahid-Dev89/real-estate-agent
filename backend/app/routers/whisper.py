from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from app.config import settings
from openai import OpenAI
import os
import tempfile
import subprocess
import logging

router = APIRouter(prefix="/api/whisper", tags=["whisper"])

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        logging.info("Received file: %s", file.filename)
        # Save uploaded file to a temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_in:
            data = await file.read()
            temp_in.write(data)
            temp_in.flush()
            temp_in_path = temp_in.name
        logging.info(f"Saved webm to {temp_in_path}, size: {os.path.getsize(temp_in_path)} bytes")

        # Convert webm to wav using ffmpeg
        temp_out_path = temp_in_path.replace(".webm", ".wav")
        ffmpeg_cmd = ["ffmpeg", "-y", "-i", temp_in_path, temp_out_path]
        logging.info(f"Running ffmpeg: {' '.join(ffmpeg_cmd)}")
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
        logging.info(f"ffmpeg stdout: {result.stdout}")
        logging.info(f"ffmpeg stderr: {result.stderr}")
        if result.returncode != 0:
            logging.error(f"ffmpeg failed with code {result.returncode}")
            return JSONResponse({"error": "ffmpeg failed", "details": result.stderr}, status_code=500)
        logging.info(f"Converted wav to {temp_out_path}, size: {os.path.getsize(temp_out_path)} bytes")

        # Send wav file to OpenAI Whisper
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        with open(temp_out_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        logging.info(f"Transcription result: {transcript.text}")

        # Clean up temp files
        os.remove(temp_in_path)
        os.remove(temp_out_path)
        return JSONResponse({"text": transcript.text})
    except Exception as e:
        logging.exception("Error in Whisper transcription")
        return JSONResponse({"error": str(e)}, status_code=500)