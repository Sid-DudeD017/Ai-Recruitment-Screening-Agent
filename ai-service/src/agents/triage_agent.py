import logging
import re
from src.graph.state import GraphState

logger = logging.getLogger(__name__)

def triage_resume_node(state: GraphState) -> dict:
    """
    A heuristic-based Gatekeeper that filters out invalid or very poor resumes
    before they hit the expensive LLM API.
    """
    logger.info("Agent: Triaging Resume...")
    resume_text = state.get("resume_text", "")
    
    if not resume_text:
        logger.warning("Triage Failed: No resume text provided.")
        return {
            "triage_result": {"passed": False, "reason": "No resume text provided."},
            "recruiter_decision": "REJECT"
        }

    # Rule 1: Length check (e.g. less than 100 characters is too short to be a real resume)
    if len(resume_text.strip()) < 100:
        logger.warning("Triage Failed: Resume is too short.")
        return {
            "triage_result": {"passed": False, "reason": "Resume text is too short or empty. Please upload a valid document."},
            "recruiter_decision": "REJECT"
        }
        
    # Rule 2: Basic structure check (must have enough alphabetical characters)
    # This catches PDFs that are just scanned images where OCR failed to extract any text.
    alpha_chars = sum(c.isalpha() for c in resume_text)
    if alpha_chars < 50:
        logger.warning("Triage Failed: Resume lacks meaningful text content.")
        return {
            "triage_result": {"passed": False, "reason": "Resume lacks meaningful text content. It may be an image-only PDF."},
            "recruiter_decision": "REJECT"
        }
        
    # Passed Triage
    logger.info("Triage Passed.")
    return {
        "triage_result": {"passed": True}
    }
