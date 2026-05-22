from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import httpx
import json

from ..config import settings

router = APIRouter()


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = None
    stream: bool = True
    temperature: float = 0.7


@router.post("")
async def chat(req: ChatRequest):
    model = req.model or settings.DEFAULT_CHAT_MODEL

    payload = {
        "model": model,
        "messages": [{"role": m.role, "content": m.content} for m in req.messages],
        "stream": req.stream,
        "options": {"temperature": req.temperature},
    }

    async def event_generator():
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{settings.OLLAMA_URL}/api/chat",
                json=payload,
            ) as resp:
                async for line in resp.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        data = json.loads(line)
                        if data.get("message", {}).get("content"):
                            chunk = data["message"]["content"]
                            yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
                        if data.get("done"):
                            yield f"data: {json.dumps({'type': 'done'})}\n\n"
                            return
                    except json.JSONDecodeError:
                        continue

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
