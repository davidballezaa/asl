from fastapi import FastAPI
import requests
import uvicorn

app = FastAPI()

LAPTOP_URL = "http://IP_CONF:5000/predict"


@app.get("/")
def home():
    return {"message": "PC backend is alive"}


@app.post("/api/v1/test-connection")
def test_connection(payload: dict):
    response = requests.post(
        LAPTOP_URL,
        json={"data": payload["data"]}
    )

    return {
        "message": "PC successfully talked to laptop",
        "laptop_response": response.json()
    }


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
