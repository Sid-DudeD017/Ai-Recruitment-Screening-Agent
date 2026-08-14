import os
import sys

# The user's key from .env
API_KEY = "AQ.Ab8RN6JnodGjLQnkQOeCcrayL_JZOa45vKFYLfHzFSAXpw4Zmw"

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=API_KEY
    )
    res = llm.invoke("Hi")
    print("SUCCESS:", res.content)
except Exception as e:
    print("ERROR:", str(e))
