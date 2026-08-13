import sys
import os
sys.path.append(os.getcwd())

from src.agents.resume_parser import parse_resume_node

state = {
    "resume_text": "John Doe. Experienced Software Engineer with 5 years of Python and React. Email: john@example.com",
    "candidate_metadata": {"fileName": "john_doe.pdf"}
}

try:
    print("Running parse_resume_node...")
    res = parse_resume_node(state)
    print("Result:")
    print(res)
except Exception as e:
    print("Error:", str(e))
