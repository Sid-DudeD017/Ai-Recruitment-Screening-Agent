import os
from dotenv import load_dotenv
from ai_recruitment_agent.graph import create_recruitment_graph, GraphState
from typing import Any

load_dotenv()

# Example Job Description
SAMPLE_JD = """
Software Engineer (Backend)
We are looking for a backend engineer to join our core API team.
Must-have skills: Python, Django, REST APIs, PostgreSQL, Git.
Nice-to-have skills: AWS, Docker, Kubernetes, GraphQL.
Experience required: Minimum 3 years of professional software development experience.
"""

# Example Resumes
SAMPLE_RESUMES = [
    """
    Alice Smith
    Backend Developer
    Experience: 4 years
    Skills: Python, Django, FastAPI, PostgreSQL, AWS, Docker, Git.
    Education: B.S. in Computer Science from State University.
    """,
    """
    Bob Jones
    Junior Web Developer
    Experience: 1 year
    Skills: HTML, CSS, JavaScript, React, a little bit of Node.js.
    Education: Coding Bootcamp Graduate.
    """,
    """
    Carol White
    Senior Software Engineer
    Experience: 10 years
    Skills: Java, Spring Boot, Microservices, Oracle DB, Python, Django, Kubernetes, AWS.
    Education: M.S. in Software Engineering from Elite Tech Institute.
    """
]

def main():
    # Compile the graph
    app = create_recruitment_graph()
    
    results = []
    
    # Process each candidate through the graph
    print("========== STARTING BATCH PROCESSING ==========\n")
    for idx, resume_text in enumerate(SAMPLE_RESUMES):
        print(f"--- Processing Candidate {idx + 1} ---")
        
        # Initial state for the candidate
        initial_state: GraphState = {
            "job_description_text": SAMPLE_JD,
            "resume_text": resume_text,
            # Outputs to be populated by the graph
            "parsed_job": None,
            "parsed_resume": None,
            "match_score": None,
            "bias_report": None,
            "generated_email": None
        }
        
        # Invoke the graph
        final_state = app.invoke(initial_state, config={"recursion_limit": 25})
        
        # Helper to safely extract attributes whether it's a Pydantic model or a dictionary
        def get_val(obj, key, default=None):
            if not obj: 
                return default
            # Check if it's a Pydantic model by checking for common attributes
            if hasattr(obj, 'model_dump') or hasattr(obj, 'dict'):
                val = getattr(obj, key, default)
                # Handle cases where the LLM returns an AIMessage instead of the schema
                if val == default and hasattr(obj, 'tool_calls') and obj.tool_calls:
                    # Sometimes the tool call args are inside the AIMessage
                    return obj.tool_calls[0].get('args', {}).get(key, default)
                return val
            elif isinstance(obj, dict):
                return obj.get(key, default)
            return default

        # Store result for ranking
        parsed_resume = final_state.get("parsed_resume")
        match_score = final_state.get("match_score")
        bias_report = final_state.get("bias_report")
        email_draft = final_state.get("generated_email", "Failed to generate email")
        interview_schedule = final_state.get("interview_schedule")

        name = get_val(parsed_resume, "candidate_name", "Unknown Candidate")
        
        # Ensure score is an integer for sorting
        raw_score = get_val(match_score, "score", 0)
        try:
            score = int(float(raw_score)) if raw_score is not None else 0
        except (ValueError, TypeError):
            score = 0
            
        reasoning = get_val(match_score, "reasoning", "No reasoning provided")
        
        # Ensure bias detection is a boolean
        bias_detected_raw = get_val(bias_report, "bias_detected", False)
        bias_detected = bool(bias_detected_raw) if bias_detected_raw is not None else False
        
        bias_concerns = get_val(bias_report, "concerns", []) if bias_detected else []

        results.append({
            "name": str(name),
            "score": score,
            "reasoning": str(reasoning),
            "bias_concerns": list(bias_concerns) if isinstance(bias_concerns, list) else [],
            "email_draft": str(email_draft),
            "interview_schedule": interview_schedule
        })
        
        print(f"Finished processing {name}\n")
        
    print("========== AGGREGATION & RANKING ==========\n")
    
    # Rank candidates by score (descending)
    results.sort(key=lambda x: int(x["score"]), reverse=True)
    
    for rank, res in enumerate(results, 1):
        print(f"Rank {rank}: {res['name']} - Score: {res['score']}/100")
        print(f"Reasoning: {res['reasoning']}")
        if res['bias_concerns']:
            print(f"Bias Concerns: {', '.join(res['bias_concerns'])}")
        if res['interview_schedule']:
            print(f"Interview Scheduled: {res['interview_schedule']['time']} | Link: {res['interview_schedule']['link']}")
        print(f"Email Draft Preview:\n{res['email_draft']}\n")
        print("-" * 40 + "\n")

if __name__ == "__main__":
    main()
