import pytest
from src.agents.orchestrator import orchestrate
from src.graph.state import GraphState

def test_rule_1_parse_job():
    state = GraphState(job_description="We need a Python developer.", parsed_job=None)
    result = orchestrate(state)
    assert result["next_action"] == "analyze_job"

def test_rule_2_parse_resume():
    state = GraphState(resume_text="I know Python.", parsed_resume=None)
    result = orchestrate(state)
    assert result["next_action"] == "parse_resume"

def test_rule_3_match():
    state = GraphState(
        parsed_job={"skills": ["Python"]}, 
        parsed_resume={"skills": ["Python"]}, 
        match_result=None
    )
    result = orchestrate(state)
    assert result["next_action"] == "match_candidate"

def test_rule_4_bias():
    state = GraphState(
        match_result={"score": 100}, 
        bias_result=None
    )
    result = orchestrate(state)
    assert result["next_action"] == "detect_bias"

def test_rule_5_evaluate():
    state = GraphState(
        match_result={"score": 100}, 
        bias_result={"bias_detected": False}, 
        candidate_evaluation=None
    )
    result = orchestrate(state)
    assert result["next_action"] == "evaluate_candidate"

def test_rule_6_human_review():
    state = GraphState(
        candidate_evaluation={"recommendation": "PROCEED"},
        recruiter_decision=None
    )
    result = orchestrate(state)
    assert result["next_action"] == "human_review"
    assert result.get("requires_human_review") is True
    assert result.get("workflow_status") == "WAITING_FOR_HUMAN"

def test_rule_7_approve_schedule_interview():
    state = GraphState(
        recruiter_decision="APPROVE",
        interview_recommendation=None,
        email_draft=None
    )
    result = orchestrate(state)
    assert result["next_action"] == "schedule_interview"

def test_rule_7_approve_generate_email():
    state = GraphState(
        recruiter_decision="APPROVE",
        interview_recommendation={"slots": []},
        email_draft=None
    )
    result = orchestrate(state)
    assert result["next_action"] == "generate_email"

def test_rule_8_reject_generate_email():
    state = GraphState(
        recruiter_decision="REJECT",
        email_draft=None
    )
    result = orchestrate(state)
    assert result["next_action"] == "generate_email"

def test_rule_9_end():
    state = GraphState(
        recruiter_decision="REJECT",
        email_draft={"subject": "Rejection"}
    )
    result = orchestrate(state)
    assert result["next_action"] == "end"
    assert result.get("workflow_status") == "COMPLETED"
