import sys
import os

from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.agents.resume_parser import parse_resume_node

try:
    res = parse_resume_node({"resume_text": "Siddharth Bhakta\nMachine Learning Engineer\nSkills: Python, React\n", "candidate_metadata": {"fileName": "test.pdf"}})
    print(res)
except Exception as e:
    print("FAILED:", str(e))
