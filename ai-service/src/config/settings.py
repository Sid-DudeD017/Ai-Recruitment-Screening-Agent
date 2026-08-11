import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))

settings = Settings()
