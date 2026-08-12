import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))

settings = Settings()
