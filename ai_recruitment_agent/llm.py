import os
from typing import Optional
from dotenv import load_dotenv
from langchain_ollama import ChatOllama

load_dotenv()

def get_llm(model: Optional[str] = None, temperature: float = 0.0) -> ChatOllama:
    """Returns the configured Ollama LLM instance."""
    
    # Default to llama3
    selected_model = model or os.getenv("OLLAMA_MODEL", "llama3")
    
    # Optional: allow configuring the base URL if Ollama is not on localhost:11434
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    return ChatOllama(
        model=selected_model,
        temperature=temperature,
        base_url=base_url
    )