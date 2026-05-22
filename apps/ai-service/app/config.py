import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OLLAMA_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    DEFAULT_CHAT_MODEL: str = os.getenv("DEFAULT_CHAT_MODEL", "gemma3:1b")
    DEFAULT_EMBEDDING_MODEL: str = os.getenv("DEFAULT_EMBEDDING_MODEL", "nomic-embed-text")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(os.getcwd(), "..", "web", "uploads"))
    CHROMA_DIR: str = os.getenv("CHROMA_DIR", os.path.join(os.getcwd(), "chroma_db"))
    NEXT_APP_URL: str = os.getenv("NEXT_APP_URL", "http://localhost:3000")
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 100
    TOP_K_RESULTS: int = 5

    class Config:
        env_file = "../../.env"
        extra = "ignore"


settings = Settings()
