import requests
import json
import os

api_key = "AQ.Ab8RN6JnodGjLQnkQOeCcrayL_JZOa45vKFYLfHzFSAXpw4Zmw"

def test_model(model_name):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts":[{"text": "Hi"}]}]
    }
    res = requests.post(url, json=payload)
    if res.status_code == 200:
        print(f"SUCCESS {model_name}")
    else:
        print(f"ERROR {model_name}:", res.status_code, res.text)

test_model("gemini-3.5-flash")
test_model("gemini-2.5-flash")
test_model("gemini-3.7-flash")
