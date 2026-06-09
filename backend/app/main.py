from fastapi import FastAPI
from app.api.v1 import auth

app = FastAPI(title="Syverro API", version="1.0.0")

app.include_router(auth.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Syverro API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}