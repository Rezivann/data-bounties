from fastapi import FastAPI, File, Form, UploadFile

app = FastAPI()


@app.post("/verify")
async def verify(
    image: UploadFile = File(...),
    prompt: str = Form(...),
):
    # Phase 1 stub for backend integration. We accept the uploaded file and
    # prompt now so the multipart request path works before real ML lands.
    _ = image
    _ = prompt
    return {
        "authentic": True,
        "authenticity_score": 0.97,
        "match_score": 0.83,
        "passed": True,
        "caption": "a red octagonal stop sign on a city street",
    }
