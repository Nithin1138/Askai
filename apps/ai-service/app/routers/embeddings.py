from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from ..services.embeddings import get_embeddings
from ..services.vectorstore import get_vectorstore
from ..config import settings

router = APIRouter()


class EmbedRequest(BaseModel):
    texts: List[str]
    model: str = settings.DEFAULT_EMBEDDING_MODEL


class RetrieveRequest(BaseModel):
    query: str
    topK: int = 5
    documentIds: List[str] = []


@router.post("/texts")
async def embed_texts(req: EmbedRequest):
    """Generate embeddings for a list of texts using Ollama."""
    embeddings = get_embeddings()
    try:
        vecs = embeddings.embed_documents(req.texts)
        return {"embeddings": vecs, "count": len(vecs)}
    except Exception as e:
        return {"error": str(e), "embeddings": [], "count": 0}


@router.post("/retrieve")
async def retrieve(req: RetrieveRequest):
    """Semantic similarity search against the vector store."""
    vs = get_vectorstore()
    try:
        results = vs.similarity_search_with_score(req.query, k=req.topK)
        return {
            "results": [
                {
                    "content": doc.page_content,
                    "score": float(score),
                    "metadata": doc.metadata,
                }
                for doc, score in results
            ]
        }
    except Exception as e:
        return {"results": [], "error": str(e)}
