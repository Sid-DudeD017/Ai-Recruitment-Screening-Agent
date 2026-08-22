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
        "Candidate Profile:\n{candidate}\n"
        "Context/Instructions: {context}\n\n"
        "If the decision is APPROVE, generate an interview invitation or shortlist notification.\n"
        "CRITICAL: If the Context/Instructions specify a Meeting Link or Interview Date, you MUST use them EXACTLY as provided. Do not hallucinate Google Meet links or fake dates.\n"
        "If the decision is REJECT, generate a polite rejection email. If the context indicates the resume was invalid or unreadable, explicitly mention that they should reapply with a valid PDF format.\n"
        "Return the email type, subject, and body."
    )
    
    chain = prompt | structured_llm
    
    context = state.get("additional_context", "")
    triage_result = state.get("triage_result")
    if triage_result and not triage_result.get("passed"):
        context += f"\nNote: Candidate was auto-rejected because: {triage_result.get('reason')}"
        
    result = chain.invoke({
        "decision": decision,
        "interview": json.dumps(interview_rec) if interview_rec else "None",
        "candidate": json.dumps(state.get("parsed_resume", {}), indent=2),
        "context": context if context else "None"
    })
    
    return {"email_draft": result.model_dump()}
