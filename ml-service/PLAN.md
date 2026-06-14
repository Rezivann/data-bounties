# ML Service Plan

This document captures the original intended plan for the ML verification service in Data Bounties. It reflects the handoff design for the service and is intended as documentation of the original idea.

## Purpose

The ML service is the verification gatekeeper for Data Bounties. It decides whether an uploaded image is a real photo, whether it matches the bounty prompt, and what caption should be shown to the user if the submission succeeds.

The backend depends on this service for the verification verdict that controls NFT minting, HCS logging, and payout.

## Public Contract

### Endpoint

- `POST /verify`

Expected multipart form data:

- `image`: uploaded image bytes
- `prompt`: bounty prompt string such as `"stop sign"`

Expected response shape:

```json
{
  "authentic": true,
  "authenticity_score": 0.97,
  "match_score": 0.83,
  "passed": true,
  "caption": "a red octagonal stop sign on a city street",
  "perceptual_hash": "f8e4c2a1b3d5e7f9"
}
```

Field meanings:

- `authentic`: whether the image is judged to be a real photo rather than AI-generated
- `authenticity_score`: confidence score for authenticity
- `match_score`: similarity between the uploaded image and the bounty prompt
- `passed`: final gate used by the backend
- `caption`: short natural-language description for the UI
- `perceptual_hash`: reusable duplicate-detection fingerprint

Final decision rule:

```python
passed = authentic and (match_score >= MATCH_THRESHOLD)
```

## Intended Architecture

The service was originally planned around three independent ML checks plus one duplicate-detection helper:

1. Authenticity detection
2. Image-text matching
3. Caption generation
4. Perceptual hashing

Each capability should live behind its own wrapper function so implementations can be swapped later without changing the route contract.

## Planned Capability Breakdown

### 1. Authenticity detection

Primary provider:

- SightEngine `genai` model

Intended wrapper:

```python
def check_authenticity(image_bytes: bytes) -> dict:
    ...
```

Expected return:

```python
{
    "authentic": True,
    "authenticity_score": 0.97
}
```

Planned rule:

- Treat images as inauthentic when AI-generation confidence crosses a configurable threshold.

### 2. Image-text matching

Primary idea:

- Hosted CLIP-style similarity service

Preferred hosted options in the original plan:

- Replicate-hosted CLIP
- Hugging Face Inference API for CLIP

Intended wrapper:

```python
def check_match(image_bytes: bytes, prompt: str) -> float:
    ...
```

Planned behavior:

- Return a normalized score from `0.0` to `1.0`
- Start with `MATCH_THRESHOLD = 0.65`
- Tune using real matching and non-matching examples

### 3. Caption generation

Primary idea:

- Hosted BLIP captioning model

Preferred hosted options in the original plan:

- Hugging Face `Salesforce/blip-image-captioning-base`
- Replicate-hosted BLIP

Intended wrapper:

```python
def generate_caption(image_bytes: bytes) -> str:
    ...
```

Planned behavior:

- Return a short descriptive sentence for successful or inspectable submissions

### 4. Perceptual hashing

Purpose:

- Support duplicate and near-duplicate detection

Intended helpers:

```python
def compute_perceptual_hash(image_bytes: bytes) -> str:
    ...

def is_too_similar(hash1: str, hash2: str, threshold: int = 5) -> bool:
    ...
```

Planned note:

- The perceptual hash should be returned so the backend can store it for future duplicate checks.

## Planned Build Phases

### Phase 1: Stub first

Stand up `/verify` immediately with hardcoded passing output so the backend can integrate early.

### Phase 2: Authenticity

Replace the stub authenticity field with a real SightEngine-backed check.

### Phase 3: Matching

Add hosted CLIP-style prompt matching and tune threshold.

### Phase 4: Captioning

Add natural-language caption generation.

### Phase 5: Full assembly

Run all checks in one `/verify` request and return the final verdict JSON.

### Phase 6: Duplicate support

Add perceptual hashing support to the response contract.

### Phase 7: Optional self-hosted upgrade

Only if time permits, replace hosted prompt matching with self-hosted CLIP while preserving the same wrapper interface.

## Validation and Failure Rules

The service should fail safe. If any required check fails, the endpoint should return a clean failure verdict instead of a server crash.

Planned invalid-input handling:

- empty prompt
- corrupt image
- non-image upload
- image larger than configured limit
- provider timeouts
- provider rate limits

Safe failure shape:

```json
{
  "authentic": false,
  "authenticity_score": 0.0,
  "match_score": 0.0,
  "passed": false,
  "caption": "",
  "perceptual_hash": ""
}
```

## Success Criteria

- `/verify` always returns the agreed JSON keys.
- `passed` is only `true` when authenticity and prompt match both clear threshold.
- AI-generated images are rejected.
- Off-prompt real photos are rejected.
- Successful submissions provide a user-facing caption.
- Duplicate detection data is available for backend storage and comparison.
