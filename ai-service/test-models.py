import os
import requests
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
api_key = os.getenv("GEMINI_API_KEY")
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
r = requests.get(url)
for m in r.json().get("models", []):
    print(m["name"])
