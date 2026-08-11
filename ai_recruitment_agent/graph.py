from langgraph.graph import StateGraph, END
from ai_recruitment_agent.state import GraphState
from ai_recruitment_agent.nodes.jd_parser import parse_jd
from ai_recruitment_agent.nodes.resume_parser import parse_resume
from ai_recruitment_agent.nodes.matcher import match_candidate
from ai_recruitment_agent.nodes.bias_detector import detect_bias
from ai_recruitment_agent.nodes.email_generator import generate_email
from ai_recruitment_agent.nodes.interview_agent import schedule_interview

def create_recruitment_graph():
    """Builds and returns the LangGraph workflow."""
    
    # 1. Initialize StateGraph
    workflow = StateGraph(GraphState)
    
    # 2. Add Nodes
    workflow.add_node("parse_jd", parse_jd)
    workflow.add_node("parse_resume", parse_resume)
    workflow.add_node("match_candidate", match_candidate)
    workflow.add_node("detect_bias", detect_bias)
    workflow.add_node("generate_email", generate_email)
    workflow.add_node("schedule_interview", schedule_interview)
    
    # 3. Define Edges (The Flow)
    
    # Start by parsing the job description
    workflow.set_entry_point("parse_jd")
    
    # After JD is parsed, parse the resume
    workflow.add_edge("parse_jd", "parse_resume")
    
    # After resume is parsed, match candidate against JD
    workflow.add_edge("parse_resume", "match_candidate")
    
    # After matching is done, do three things in parallel:
    #   a. Detect Bias
    #   b. Generate Email
    #   c. Schedule Interview (mock)
    workflow.add_edge("match_candidate", "detect_bias")
    workflow.add_edge("match_candidate", "generate_email")
    workflow.add_edge("match_candidate", "schedule_interview")
    
    # End the workflow after the parallel tasks finish
    workflow.add_edge("detect_bias", END)
    workflow.add_edge("generate_email", END)
    workflow.add_edge("schedule_interview", END)
    
    # 4. Compile Graph
    return workflow.compile()
