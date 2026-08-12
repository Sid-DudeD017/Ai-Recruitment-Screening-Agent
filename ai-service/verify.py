import pydantic
import langchain
import langchain_core
import langgraph

print("pydantic:", pydantic.__version__)
print("langchain:", langchain.__version__)
print("langchain_core:", langchain_core.__version__)
try:
    print("langgraph:", langgraph.__version__)
except AttributeError:
    import importlib.metadata
    print("langgraph:", importlib.metadata.version('langgraph'))

from langchain_google_genai import ChatGoogleGenerativeAI
print('Google integration OK')

from src.schemas.data_schemas import ParsedResume
try:
    schema = ParsedResume.model_json_schema()
    print("Schema OK")
except Exception as e:
    print("Schema error:", e)

from src.agents.orchestrator import get_llm
try:
    llm = get_llm()
    structured_llm = llm.with_structured_output(ParsedResume)
    print("STRUCTURED OUTPUT OK")
except Exception as e:
    print("Structured output error:", e)
