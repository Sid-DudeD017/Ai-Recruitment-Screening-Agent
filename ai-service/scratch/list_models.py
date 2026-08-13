import requests
import json
import os

api_key = "AQ.Ab8RN6JnodGjLQnkQOeCcrayL_JZOa45vKFYLfHzFSAXpw4Zmw"
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

try:
    response = requests.get(url)
    models = response.json().get("models", [])
    
    print("Available Models:")
    for m in models:
        name = m.get("name")
        if "flash" in name.lower() or "gemini" in name.lower():
            print(name)
except Exception as e:
    print("Error:", str(e))
