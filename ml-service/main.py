from fastapi import FastAPI

app = FastAPI()

@app.post("/verify")
def verify():
    # stub — returns the agreed format with fake data for now
    return {
        "authentic": True,
        "authenticity_score": 0.97,
        "match_score": 0.83,
        "passed": True,
        "caption": "a red octagonal stop sign on a city street",
    }