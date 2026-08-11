from langgraph.graph import StateGraph, END
from src.graph.state import GraphState
from src.agents.orchestrator import orchestrate

from src.agents.resume_parser import parse_resume_node
from src.agents.job_analyzer import analyze_job_node
from src.agents.matcher import match_candidate_node
from src.agents.bias_detector import detect_bias_node
from src.agents.evaluator import evaluate_candidate_node
from src.agents.interviewer import schedule_interview_node
from src.agents.emailer import generate_email_node

def human_review_node(state: GraphState) -> dict:
    # This node acts as the interruption point.
    # It does nothing but provide a breakpoint for LangGraph.
    return {}


def orchestrator_router(state: GraphState) -> str:
    """
    Reads the `next_action` decided by the orchestrator 
    and routes to the appropriate node.
    """
    next_action = state.get("next_action", "end")
    if next_action == "end":
        return END
    return next_action

from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3

def get_checkpointer():
    # Use a persistent SQLite database for checkpointing
    conn = sqlite3.connect("checkpoints.sqlite", check_same_thread=False)
    return SqliteSaver(conn)

def create_workflow():
    workflow = StateGraph(GraphState)
    
    # Add Nodes
    workflow.add_node("orchestrator", orchestrate)
    workflow.add_node("parse_resume", parse_resume_node)
    workflow.add_node("analyze_job", analyze_job_node)
    workflow.add_node("match_candidate", match_candidate_node)
    workflow.add_node("detect_bias", detect_bias_node)
    workflow.add_node("evaluate_candidate", evaluate_candidate_node)
    workflow.add_node("human_review", human_review_node)
    workflow.add_node("schedule_interview", schedule_interview_node)
    workflow.add_node("generate_email", generate_email_node)
    
    # Add Edges (Hub and Spoke)
    workflow.set_entry_point("orchestrator")
    
    workflow.add_conditional_edges(
        "orchestrator",
        orchestrator_router,
        {
            "parse_resume": "parse_resume",
            "analyze_job": "analyze_job",
            "match_candidate": "match_candidate",
            "detect_bias": "detect_bias",
            "evaluate_candidate": "evaluate_candidate",
            "human_review": "human_review",
            "schedule_interview": "schedule_interview",
            "generate_email": "generate_email",
            END: END
        }
    )
    
    # All spoke nodes return back to orchestrator
    for node in [
        "parse_resume", "analyze_job", "match_candidate",
        "detect_bias", "evaluate_candidate", "human_review",
        "schedule_interview", "generate_email"
    ]:
        workflow.add_edge(node, "orchestrator")
        
    return workflow.compile(
        checkpointer=get_checkpointer(),
        interrupt_before=["human_review"]
    )
