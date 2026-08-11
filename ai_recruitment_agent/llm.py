import os
from typing import Optional
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

def get_llm(model: Optional[str] = None, temperature: float = 0.0) -> ChatOpenAI:
    """Returns the configured OpenAI LLM instance."""
    
    # Default to gpt-4o-mini
    selected_model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set in the environment.")
    
    return ChatOpenAI(
        model=selected_model,
        temperature=temperature,
        openai_api_key=api_key
    )