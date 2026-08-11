from fastapi import FastAPI
from src.routes.api import router
from src.config.settings import settings

app = FastAPI(
    title="AI Recruitment Screening Service",
    description="Agentic LangGraph service for recruiting",
    version="1.0.0"
)

app.include_router(router, prefix="/ai")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.APP_PORT, reload=True)
