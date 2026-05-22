from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from .routers import chat, documents, embeddings
from .config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure uploads dir exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.CHROMA_DIR, exist_ok=True)
    print(f"ASKAI AI Service started | Ollama: {settings.OLLAMA_URL}")
    yield
    # Shutdown
    print("ASKAI AI Service stopped")


app = FastAPI(
    title="ASKAI AI Service",
    description="Local AI orchestration service for ASKAI",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # LAN — all local origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(documents.router, prefix="/ingest", tags=["documents"])
app.include_router(embeddings.router, prefix="/embed", tags=["embeddings"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "askai-ai"}


@app.get("/")
async def root():
    return {"service": "ASKAI AI Service", "version": "0.1.0"}
