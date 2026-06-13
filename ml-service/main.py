import io
import logging
import os
import re

import imagehash
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from PIL import Image, UnidentifiedImageError

load_dotenv(override=True)

app = FastAPI()
logger = logging.getLogger("ml-service")
logging.basicConfig(level=logging.INFO)

MAX_IMAGE_BYTES = 10 * 1024 * 1024
MATCH_THRESHOLD = float(os.getenv("MATCH_THRESHOLD", "0.65"))
AI_GENERATED_THRESHOLD = float(os.getenv("AI_GENERATED_THRESHOLD", "0.5"))
SIGHTENGINE_API_URL = "https://api.sightengine.com/1.0/check.json"
GOOGLE_VISION_MAX_RESULTS = int(os.getenv("GOOGLE_VISION_MAX_RESULTS", "10"))
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jfif"}


def failure_response() -> dict:
    return {
        "authentic": False,
        "authenticity_score": 0.0,
        "match_score": 0.0,
        "passed": False,
        "caption": "",
        "perceptual_hash": "",
        "debug": {},
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


def normalize_text(value: str) -> str:
    return re.sub(r"[^a-z0-9 ]+", " ", value.lower()).strip()


def score_label_match(prompt: str, label_description: str, vision_score: float) -> float:
    prompt_norm = normalize_text(prompt)
    label_norm = normalize_text(label_description)
    prompt_tokens = {token for token in prompt_norm.split() if token}
    label_tokens = {token for token in label_norm.split() if token}

    if not prompt_tokens or not label_tokens:
        return 0.0

    if prompt_norm == label_norm:
        return vision_score

    if prompt_norm in label_norm or label_norm in prompt_norm:
        return min(1.0, vision_score * 0.95)

    overlap = len(prompt_tokens & label_tokens)
    if overlap == 0:
        return 0.0

    overlap_ratio = overlap / len(prompt_tokens)
    return round(min(1.0, vision_score * overlap_ratio * 0.9), 4)


def check_match(image_bytes: bytes, prompt: str) -> float:
    try:
        from google.cloud import vision
    except ImportError as exc:
        raise RuntimeError(
            "google-cloud-vision is not installed. Install it in the ml-service venv first."
        ) from exc

    client = vision.ImageAnnotatorClient()
    image = vision.Image(content=image_bytes)
    response = client.label_detection(image=image, max_results=GOOGLE_VISION_MAX_RESULTS)

    if response.error.message:
        raise RuntimeError(response.error.message)

    labels = response.label_annotations
    if not labels:
        check_match.last_debug = []
        return 0.0

    scored_labels = []
    best_score = 0.0
    for label in labels:
        label_score = round(float(label.score), 4)
        match_score = score_label_match(prompt, label.description, label_score)
        scored_labels.append(
            {
                "label": label.description,
                "vision_score": label_score,
                "match_score": round(match_score, 4),
            }
        )
        best_score = max(best_score, match_score)

    check_match.last_debug = scored_labels
    return round(best_score, 4)


check_match.last_debug = []


def generate_caption(image_bytes: bytes) -> str:
    try:
        from google.cloud import vision
    except ImportError as exc:
        raise RuntimeError(
            "google-cloud-vision is not installed. Install it in the ml-service venv first."
        ) from exc

    client = vision.ImageAnnotatorClient()
    image = vision.Image(content=image_bytes)
    response = client.label_detection(image=image, max_results=5)

    if response.error.message:
        raise RuntimeError(response.error.message)

    labels = [label.description.lower() for label in response.label_annotations if label.description]
    if not labels:
        return ""

    primary_labels = labels[:3]
    if len(primary_labels) == 1:
        return f"photo of {primary_labels[0]}"
    if len(primary_labels) == 2:
        return f"photo of {primary_labels[0]} and {primary_labels[1]}"
    return f"photo of {primary_labels[0]}, {primary_labels[1]}, and {primary_labels[2]}"


def compute_perceptual_hash(image_bytes: bytes) -> str:
    try:
        with Image.open(io.BytesIO(image_bytes)) as image:
            return str(imagehash.phash(image.convert("RGB")))
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ValueError("Unable to compute perceptual hash for uploaded image.") from exc


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
    except Exception as exc:
        logger.exception("Input validation failed: %s", exc)
        return failure_response()

    authenticity = {"authentic": False, "authenticity_score": 0.0}
    match_score = 0.0
    caption = ""
    perceptual_hash = ""
    debug = {
        "match_provider": "google-cloud-vision",
        "caption_provider": "google-cloud-vision",
        "google_vision_max_results": GOOGLE_VISION_MAX_RESULTS,
        "authenticity_error": "",
        "match_error": "",
        "match_results": [],
        "caption_error": "",
        "perceptual_hash_error": "",
    }

    try:
        authenticity = check_authenticity(image_bytes)
    except Exception as exc:
        debug["authenticity_error"] = str(exc)
        logger.exception("Authenticity check failed: %s", exc)

    try:
        match_score = check_match(image_bytes, cleaned_prompt)
        debug["match_results"] = check_match.last_debug
    except Exception as exc:
        debug["match_error"] = str(exc)
        debug["match_results"] = check_match.last_debug
        logger.exception(
            "Match check failed for prompt '%s' using Google Cloud Vision: %s",
            cleaned_prompt,
            exc,
        )

    try:
        caption = generate_caption(image_bytes)
    except Exception as exc:
        debug["caption_error"] = str(exc)
        logger.exception("Caption generation failed: %s", exc)

    try:
        perceptual_hash = compute_perceptual_hash(image_bytes)
    except Exception as exc:
        debug["perceptual_hash_error"] = str(exc)
        logger.exception("Perceptual hash generation failed: %s", exc)

    passed = authenticity["authentic"] and (match_score >= MATCH_THRESHOLD)

    return {
        "authentic": authenticity["authentic"],
        "authenticity_score": authenticity["authenticity_score"],
        "match_score": match_score,
        "passed": passed,
        "caption": caption,
        "perceptual_hash": perceptual_hash,
        "debug": debug,
    }
