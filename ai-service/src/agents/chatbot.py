import json
import logging
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from langchain_core.prompts import PromptTemplate
from src.agents.orchestrator import get_llm
from src.schemas.chat_schemas import ChatRequest

logger = logging.getLogger(__name__)

class AgentAction(BaseModel):
    action_type: str = Field(description="Must be one of: 'RESPOND', 'FETCH_CANDIDATES', 'UPDATE_STATUS', 'BULK_UPDATE_STATUS', 'SEND_BULK_EMAILS'")
    response_text: Optional[str] = Field(None, description="The text response to show the user if action_type is RESPOND")
    tool_args: Optional[Dict[str, Any]] = Field(None, description="Arguments for the tool if action_type is a tool.")

def get_chatbot_response(request: ChatRequest) -> dict:
    llm = get_llm()
    structured_llm = llm.with_structured_output(AgentAction)
    
    history_text = ""
    recent_history = request.history[-4:] if len(request.history) > 4 else request.history
    for msg in recent_history:
        history_text += f"{msg.role.upper()}: {msg.content}\n"
        
    prompt = PromptTemplate.from_template(
        "You are an AI Assistant for a Recruitment Platform.\n"
        "Your goal is to help the user. The user is currently on this page URL: {current_url}\n\n"
        "You have the following tools available. If the user's request requires a tool, output the corresponding action_type and tool_args.\n"
        "1. FETCH_CANDIDATES: Use when the user asks to see candidates for a role. Args: {{'role': str}}.\n"
        "2. UPDATE_STATUS: Use when the user wants to change ONE candidate's status. Args: {{'candidate_name': str, 'new_status': str}}.\n"
        "3. BULK_UPDATE_STATUS: Use when the user wants to move ALL candidates from one stage to another for a specific role (e.g., 'shift all interview candidates to offered'). Args: {{'role': str, 'current_status': str, 'new_status': str}}.\n"
        "4. SEND_BULK_EMAILS: Use when the user asks you to send emails, mails, invites, or rejections to candidates. IMPORTANT: You CAN and MUST use this tool to send emails. Do NOT say you cannot send emails. Args: {{'role': str, 'email_type': str (e.g. 'interview_invite', 'rejection')}}.\n"
        "If you absolutely cannot use a tool, use action_type='RESPOND' and provide 'response_text'.\n\n"
        "Conversation History:\n{history}\n"
        "Current User Message: {message}\n"
    )
    
    chain = prompt | structured_llm
    
    result = chain.invoke({
        "current_url": request.currentUrl or "Unknown",
        "history": history_text,
        "message": request.message
    })
    
    if not result:
        return {"action_type": "RESPOND", "response_text": "I encountered an error trying to formulate a plan."}
        
    return result.model_dump()
