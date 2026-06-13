import io
import logging
import os

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from PIL import Image, UnidentifiedImageError

load_dotenv()

app = FastAPI()
logger = logging.getLogger("ml-service")

MAX_IMAGE_BYTES = 10 * 1024 * 1024
MATCH_THRESHOLD = float(os.getenv("MATCH_THRESHOLD", "0.65"))
AI_GENERATED_THRESHOLD = float(os.getenv("AI_GENERATED_THRESHOLD", "0.5"))
SIGHTENGINE_API_URL = "https://api.sightengine.com/1.0/check.json"
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jfif"}


def failure_response() -> dict:
    return {
        "authentic": False,
        "authenticity_score": 0.0,
        "match_score": 0.0,
        "passed": False,
        "caption": "",
    }


def validate_prompt(prompt: str) -> str:
    cleaned = prompt.strip()
    if not cleaned:
        raise ValueError("Prompt is empty.")
    return cleaned


def validate_image_bytes(image_bytes: bytes, content_type: str | None) -> None:
    if not image_bytes:
        raise ValueError("Image file is empty.")

    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise ValueError("Image exceeds 10MB limit.")

    if content_type and content_type.lower() not in ALLOWED_CONTENT_TYPES:
        raise ValueError(f"Unsupported content type: {content_type}")

    try:
        with Image.open(io.BytesIO(image_bytes)) as image:
            image.verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError("Uploaded file is not a valid image.") from exc


def check_authenticity(image_bytes: bytes) -> dict:
    api_user = os.getenv("SIGHTENGINE_API_USER")
    api_secret = os.getenv("SIGHTENGINE_API_SECRET")

    if not api_user or not api_secret:
        raise RuntimeError("SightEngine credentials are missing.")

    files = {
        "media": ("upload.jpg", image_bytes, "image/jpeg"),
    }
    data = {
        "models": "genai",
        "api_user": api_user,
        "api_secret": api_secret,
    }

    response = requests.post(
        SIGHTENGINE_API_URL,
        data=data,
        files=files,
        timeout=20,
    )
    response.raise_for_status()

    payload = response.json()
    if payload.get("status") == "failure":
        raise RuntimeError(payload.get("error", {}).get("message", "SightEngine request failed."))

    ai_generated_score = float(payload.get("type", {}).get("ai_generated", 1.0))
    authenticity_score = round(1.0 - ai_generated_score, 4)

    return {
        "authentic": ai_generated_score < AI_GENERATED_THRESHOLD,
        "authenticity_score": authenticity_score,
    }


def check_match(image_bytes: bytes, prompt: str) -> float:
    # Temporary Phase 2 placeholder. We'll replace this with hosted CLIP next.
    _ = image_bytes
    _ = prompt
    return 0.83


def generate_caption(image_bytes: bytes) -> str:
    # Temporary Phase 2 placeholder. We'll replace this with hosted captioning next.
    _ = image_bytes
    return "caption pending real caption model"


@app.get("/")
def healthcheck() -> dict:
    return {"status": "ok", "service": "ml-service"}


@app.post("/verify")
async def verify(
    image: UploadFile = File(...),
    prompt: str = Form(...),
):
    try:
        cleaned_prompt = validate_prompt(prompt)
        image_bytes = await image.read()
        validate_image_bytes(image_bytes, image.content_type)

        authenticity = check_authenticity(image_bytes)
        match_score = check_match(image_bytes, cleaned_prompt)
        caption = generate_caption(image_bytes)
        passed = authenticity["authentic"] and (match_score >= MATCH_THRESHOLD)

        return {
            "authentic": authenticity["authentic"],
            "authenticity_score": authenticity["authenticity_score"],
            "match_score": match_score,
            "passed": passed,
            "caption": caption,
        }
    except Exception as exc:
        logger.exception("Verification failed: %s", exc)
        return failure_response()
