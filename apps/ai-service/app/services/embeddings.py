from langchain_community.embeddings import OllamaEmbeddings
from ..config import settings

_embeddings = None


def get_embeddings() -> OllamaEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = OllamaEmbeddings(
            base_url=settings.OLLAMA_URL,
            model=settings.DEFAULT_EMBEDDING_MODEL,
        )
    return _embeddings
