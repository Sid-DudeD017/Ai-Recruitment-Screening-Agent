from typing import Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from ai_recruitment_agent.state import GraphState, MatchScore
from ai_recruitment_agent.llm import get_llm
from ai_recruitment_agent.nodes.vector_store import create_resume_vectorstore, semantic_search_resume

# Internal schema for the LLM to output just the category scores
class LLMCategoryScores(BaseModel):
    skill_score: int = Field(description="Score out of 100 based strictly on technical skill overlap")
    experience_score: int = Field(description="Score out of 100 based on years and relevance of experience")
    project_score: int = Field(description="Score out of 100 based on relevant projects")
    education_score: int = Field(description="Score out of 100 based on education and certifications")
    soft_skill_score: int = Field(description="Score out of 100 based on communication and soft skills")
    reasoning: str = Field(description="Brief explanation of the scores and overall fit")

def match_candidate(state: GraphState) -> Dict[str, Any]:
    llm = get_llm()
    structured_llm = llm.with_structured_output(LLMCategoryScores)
    
    # Generate embeddings & FAISS vectorstore for the resume text
    resume_text = state.get("resume_text", "")
    if not resume_text:
        raise ValueError("Resume text is empty, cannot perform semantic search.")
        
    vectorstore = create_resume_vectorstore(resume_text)
    
    # Create semantic queries from the parsed job description
    job = state.get("parsed_job")
    if not job:
        raise ValueError("Parsed job requirements are missing.")
        
    queries = job.required_skills + [job.job_title, "projects", "education", "soft skills"]
    
    # Retrieve relevant resume chunks
    relevant_resume_context = semantic_search_resume(vectorstore, queries)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert technical recruiter AI. Grade the candidate strictly out of 100 on the 5 given categories based ONLY on the provided relevant resume excerpts. If an excerpt lacks evidence for a category, score it low."),
        ("user", "Job Requirements:\n{job_reqs}\n\nRelevant Resume Excerpts (Semantic Search):\n{resume_context}")
    ])
    
    chain = prompt | structured_llm
    
    result: LLMCategoryScores = chain.invoke({
        "job_reqs": str(job.model_dump()),
        "resume_context": relevant_resume_context
    })
    
    # Apply strict weighting formula: 
    # 40% Skills + 25% Experience + 15% Projects + 10% Education + 10% Soft Skills
    final_score = (
        (0.40 * result.skill_score) +
        (0.25 * result.experience_score) +
        (0.15 * result.project_score) +
        (0.10 * result.education_score) +
        (0.10 * result.soft_skill_score)
    )
    
    final_match_score = MatchScore(
        skill_score=result.skill_score,
        experience_score=result.experience_score,
        project_score=result.project_score,
        education_score=result.education_score,
        soft_skill_score=result.soft_skill_score,
        score=round(final_score, 2),
        reasoning=result.reasoning
    )
    
    return {"match_score": final_match_score}
