import pytest
from src.schemas.data_schemas import (
    CandidateEvaluation,
    InterviewRecommendation,
    EmailDraft,
    CandidateRanking,
    MatchResult,
    BiasResult
)

def test_candidate_evaluation_schema():
    eval_data = CandidateEvaluation(
        recommendation="PROCEED",
        confidence=0.95,
        strengths=["Python", "System Design"],
        concerns=["No experience with Next.js"],
        explanation="Strong candidate with matching backend skills."
    )
    assert eval_data.recommendation == "PROCEED"
    assert eval_data.confidence == 0.95

def test_interview_recommendation_schema():
    rec = InterviewRecommendation(
        recommendedSlots=["2026-10-10T10:00:00Z"],
        durationMinutes=45,
        reason="Good time for technical rounds."
    )
    assert rec.durationMinutes == 45
    assert len(rec.recommendedSlots) == 1

def test_email_draft_schema():
    email = EmailDraft(
        emailType="Interview Invitation",
        subject="Interview at Acme Corp",
        body="Dear Candidate, ..."
    )
    assert email.emailType == "Interview Invitation"

def test_candidate_ranking_schema():
    rank = CandidateRanking(
        ranked_candidates=["Candidate A", "Candidate B"],
        ranking_explanation="A is better than B."
    )
    assert rank.ranked_candidates[0] == "Candidate A"
    
def test_match_result_schema():
    match = MatchResult(
        overallScore=85,
        skillScore=90,
        experienceScore=80,
        educationScore=100,
        projectScore=70,
        strengths=["Python", "FastAPI"],
        missingRequirements=["GraphQL"],
        explanation="Good match."
    )
    assert match.overallScore == 85

def test_bias_result_schema():
    bias = BiasResult(
        bias_detected=True,
        warnings=["Ageist language found"],
        recommendations=["Remove 'young and energetic' from JD"]
    )
    assert bias.bias_detected is True
