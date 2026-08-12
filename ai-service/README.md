# AI Recruitment Screening Service

This is the independent AI service for the AI Recruitment Screening Platform.
It uses **LangGraph** to build a genuinely agentic **Hiring Orchestrator** that determines the next logical step in the hiring process based on the current state.

## Architecture & Agentic Behavior
Instead of a linear, hard-coded LLM chain, this service employs a **Hub-and-Spoke architecture**:
- **Hub:** The `Orchestrator` agent reads the `GraphState` and uses deterministic rules + LLM reasoning to output a `next_action`.
- **Spokes:** Specialized nodes/agents (Resume Parser, Job Analyzer, Matcher, Bias Detector, Evaluator, Interviewer, Emailer) process specific tasks and return their results back to the `Orchestrator`.

This allows dynamic resumption, conditional routing, and true state machine behavior.

## Agents
1. **Resume Parser**: Extracts structured candidate info from raw text.
2. **Job Analyzer**: Extracts job requirements and identifies biased language.
3. **Candidate Matching**: Computes match scores and finds missing requirements.
4. **Bias Detection**: Analyzes the matching criteria and job description for systemic bias.
5. **Candidate Evaluation**: Synthesizes the results into a final PROCEED, REVIEW, or REJECT recommendation.
6. **Candidate Ranking**: Compares multiple evaluations to rank candidates.
7. **Interview Agent**: Recommends slots based on requirements.
8. **Email Agent**: Generates drafts for invitations or rejections.

## Human-in-the-Loop
The LangGraph workflow uses SQLite checkpointing to pause execution right before final hiring decisions (`human_review`). 
The Next.js backend provides the recruiter's decision (APPROVE/REJECT), and the workflow resumes dynamically without losing context.

## API Endpoints

### 1. `POST /ai/hiring-workflow`
Starts a new workflow.
**Request**:
```json
{
  "workflow_id": "123",
  "job_id": "job1",
  "candidate_id": "cand1",
  "job_description": "We need a Python developer.",
  "resume_text": "I am a Python dev."
}
```

### 2. `POST /ai/hiring-workflow/{workflow_id}/resume`
Resumes a paused workflow.
**Request**:
```json
{
  "decision": "APPROVE"
}
```

### 3. `POST /ai/rank`
Ranks multiple candidate evaluations.

## How to Run Locally

1. Create a virtual environment and install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Create a `.env` file with your Google Gemini key:
   ```bash
   GEMINI_API_KEY=AIzaSy...
   GEMINI_MODEL=gemini-1.5-flash
   APP_PORT=8000
   ```
3. Run the FastAPI server:
   ```bash
   python main.py
   ```

The Next.js backend interacts directly with this service via HTTP POST requests on port `8000`. The AI service does **not** connect to Prisma, Postgres, or Resend—it simply returns structured JSON for the backend to consume and act upon.
