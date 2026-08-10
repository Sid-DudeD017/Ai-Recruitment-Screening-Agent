from typing import Dict, Any
from datetime import datetime, timedelta
import random

from ai_recruitment_agent.state import GraphState

def schedule_interview(state: GraphState) -> Dict[str, Any]:
    """
    Mock mode: Instead of calling the real Google Calendar API (which requires GCP OAuth credentials),
    this generates a mock Google Meet link and interview time.
    Only schedules an interview if the candidate's score is >= 75.
    """
    match_score = state.get("match_score")
    if not match_score or match_score.score < 75:
        # Don't schedule for low scoring candidates
        return {"interview_schedule": None}
    
    # In a real implementation, you would:
    # 1. Load credentials from `credentials.json`
    # 2. Build the google calendar service: `build('calendar', 'v3', credentials=creds)`
    # 3. Use `events().insert()` to create a calendar event with conferenceData for Google Meet.
    
    # Mocking the next available slot (randomly 1 to 5 days from now at 10 AM or 2 PM)
    days_ahead = random.randint(1, 5)
    hour = random.choice([10, 14])
    interview_time = datetime.now() + timedelta(days=days_ahead)
    interview_time = interview_time.replace(hour=hour, minute=0, second=0, microsecond=0)
    
    time_str = interview_time.strftime("%A, %B %d, %Y at %I:%M %p")
    mock_meet_link = f"https://meet.google.com/mock-{random.randint(100,999)}-{random.randint(100,999)}"
    
    schedule_details = {
        "status": "Scheduled",
        "time": time_str,
        "link": mock_meet_link,
        "message": f"An interview has been automatically scheduled for {time_str} via Google Meet: {mock_meet_link}"
    }
    
    return {"interview_schedule": schedule_details}
