from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from ..config import settings
import os

_vectorstore = None


def get_embeddings() -> OllamaEmbeddings:
    return OllamaEmbeddings(
        base_url=settings.OLLAMA_URL,
        model=settings.DEFAULT_EMBEDDING_MODEL,
    )


def get_vectorstore() -> Chroma:
    global _vectorstore
    if _vectorstore is None:
        os.makedirs(settings.CHROMA_DIR, exist_ok=True)
        _vectorstore = Chroma(
            collection_name="askai_documents",
            embedding_function=get_embeddings(),
            persist_directory=settings.CHROMA_DIR,
        )
    return _vectorstore
