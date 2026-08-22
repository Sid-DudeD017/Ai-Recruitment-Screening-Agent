from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    message: str = Field(description="The user's new message")
    history: List[ChatMessage] = Field(default_factory=list, description="Previous messages")
    currentUrl: Optional[str] = Field(None, description="The URL the user is currently on")

class ChatResponse(BaseModel):
    reply: str = Field(description="The bot's response")
