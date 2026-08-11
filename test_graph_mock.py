from typing import Dict, Any
from ai_recruitment_agent.graph import create_recruitment_graph
from ai_recruitment_agent.state import GraphState, JobRequirements, ResumeData, MatchScore, BiasReport

# Mock the nodes directly to bypass LLM
def mock_parse_jd(state):
    return {"parsed_job": JobRequirements(title="Dev", must_have_skills=[], nice_to_have_skills=[])}

def mock_parse_resume(state):
    return {"parsed_resume": ResumeData(candidate_name="Test", skills=[], education=[])}

def mock_match_candidate(state):
    return {"match_score": MatchScore(skill_score=100, experience_score=100, project_score=100, education_score=100, soft_skill_score=100, score=100, reasoning="Test")}

def mock_detect_bias(state):
    return {"bias_report": BiasReport(bias_detected=False, concerns=[])}

def mock_generate_email(state):
    return {"generated_email": "Mock email"}

import ai_recruitment_agent.graph as graph_module
graph_module.parse_jd = mock_parse_jd
graph_module.parse_resume = mock_parse_resume
graph_module.match_candidate = mock_match_candidate
graph_module.detect_bias = mock_detect_bias
graph_module.generate_email = mock_generate_email

app = graph_module.create_recruitment_graph()

state = {
    "job_description_text": "mock",
    "resume_text": "mock"
}
try:
    final = app.invoke(state, config={"recursion_limit": 25})
    print("Graph execution successful!")
except Exception as e:
    import traceback
    traceback.print_exc()
