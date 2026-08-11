from pydantic import BaseModel, Field
from typing import Literal

# Orchestrator schema
NextActionType = Literal[
    "analyze_job",
    "parse_resume",
    "match_candidate",
    "detect_bias",
    "evaluate_candidate",
    "human_review",
    "schedule_interview",
    "generate_email",
    "end"
]

class OrchestratorDecision(BaseModel):
    next_action: NextActionType = Field(
        description="The next node to execute based on the current state."
    )
    decision_reason: str = Field(
        description="A short, concise explanation of why this routing decision was made."
    )
