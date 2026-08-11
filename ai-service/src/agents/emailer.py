import json
import logging
from langchain_core.prompts import PromptTemplate
from src.graph.state import GraphState
from src.schemas.data_schemas import EmailDraft
from src.agents.orchestrator import get_llm

logger = logging.getLogger(__name__)

def generate_email_node(state: GraphState) -> dict:
    """Generates email drafts based on the workflow state and recruiter decision."""
    logger.info("Agent: Generating Email Draft...")
    
    llm = get_llm()
    structured_llm = llm.with_structured_output(EmailDraft)
    
    decision = state.get("recruiter_decision", "UNKNOWN")
    interview_rec = state.get("interview_recommendation")
    
    prompt = PromptTemplate.from_template(
        "You are an AI Recruitment Communicator.\n"
        "Generate a professional recruitment email based on the following context.\n"
        "Recruiter Decision: {decision}\n"
        "Interview Recommendation Details (if any): {interview}\n"
        "Candidate Profile:\n{candidate}\n\n"
        "If the decision is APPROVE, generate an interview invitation or shortlist notification.\n"
        "If the decision is REJECT, generate a polite rejection email.\n"
        "Return the email type, subject, and body."
    )
    
    chain = prompt | structured_llm
    
    result = chain.invoke({
        "decision": decision,
        "interview": json.dumps(interview_rec) if interview_rec else "None",
        "candidate": json.dumps(state.get("parsed_resume", {}), indent=2)
    })
    
    return {"email_draft": result.model_dump()}
