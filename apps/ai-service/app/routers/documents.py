from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import re

from ..config import settings
from ..services.vectorstore import get_vectorstore
from ..services.embeddings import get_embeddings

router = APIRouter()


class IngestRequest(BaseModel):
    documentId: str
    filePath: str
    mimeType: Optional[str] = None


class IngestStatus(BaseModel):
    documentId: str
    status: str
    chunkCount: int = 0
    error: Optional[str] = None


@router.post("")
async def ingest_document(req: IngestRequest, background_tasks: BackgroundTasks):
    """
    Queue a document for ingestion into the vector store.
    Returns immediately and processes in background.
    """
    if not os.path.exists(req.filePath):
        raise HTTPException(status_code=404, detail=f"File not found: {req.filePath}")

    background_tasks.add_task(process_document, req.documentId, req.filePath, req.mimeType)
    return {"status": "queued", "documentId": req.documentId}


async def process_document(document_id: str, file_path: str, mime_type: Optional[str]):
    """Background task: parse → chunk → embed → store."""
    try:
        # Extract text based on file type
        ext = os.path.splitext(file_path)[1].lower()
        text = extract_text(file_path, ext)

        if not text.strip():
            await update_document_status(document_id, "error", "No text content found")
            return

        # Chunk the text
        chunks = chunk_text(text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)

        # Generate embeddings and store
        vs = get_vectorstore()
        embeddings = get_embeddings()

        chunk_texts = [c["content"] for c in chunks]
        chunk_ids = [f"{document_id}_{i}" for i in range(len(chunks))]
        metadatas = [
            {"document_id": document_id, "chunk_index": c["index"], "source": os.path.basename(file_path)}
            for c in chunks
        ]

        vs.add_texts(texts=chunk_texts, ids=chunk_ids, metadatas=metadatas)

        # Notify Next.js app to update document status
        await update_document_status(document_id, "ready", None, len(chunks), chunks)

    except Exception as e:
        await update_document_status(document_id, "error", str(e))


def extract_text(file_path: str, ext: str) -> str:
    """Extract plain text from PDF, TXT, or Markdown files."""
    if ext == ".pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            return "\n\n".join(
                page.extract_text() or "" for page in reader.pages
            )
        except ImportError:
            # Fallback if pypdf not available
            return f"[PDF file: {os.path.basename(file_path)}]"

    elif ext in (".txt", ".md", ".markdown"):
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()

    return ""


def chunk_text(text: str, chunk_size: int, overlap: int) -> list[dict]:
    """Simple recursive character text splitter."""
    chunks = []
    text = re.sub(r'\n{3,}', '\n\n', text.strip())  # Normalize whitespace

    if len(text) <= chunk_size:
        return [{"content": text, "index": 0}]

    start = 0
    i = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))

        # Try to break at paragraph, then sentence, then word
        if end < len(text):
            para_break = text.rfind('\n\n', start, end)
            sentence_break = text.rfind('. ', start, end)
            word_break = text.rfind(' ', start, end)

            if para_break > start + chunk_size // 2:
                end = para_break
            elif sentence_break > start + chunk_size // 2:
                end = sentence_break + 1
            elif word_break > start:
                end = word_break

        chunk_content = text[start:end].strip()
        if chunk_content:
            chunks.append({"content": chunk_content, "index": i})
            i += 1

        start = end - overlap if end - overlap > start else end

    return chunks


async def update_document_status(
    document_id: str,
    status: str,
    error: Optional[str] = None,
    chunk_count: int = 0,
    chunks: Optional[list] = None,
):
    """Notify the Next.js app about document status change."""
    import httpx
    try:
        payload = {"status": status, "error": error, "chunkCount": chunk_count}
        if chunks is not None:
            payload["chunks"] = chunks
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.patch(
                f"{settings.NEXT_APP_URL}/api/admin/documents/{document_id}/status",
                json=payload,
            )
    except Exception:
        pass  # Best-effort notification
