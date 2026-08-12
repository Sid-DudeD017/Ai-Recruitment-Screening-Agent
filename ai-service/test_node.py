from src.agents.resume_parser import parse_resume_node

def test_resume_parser():
    print("Testing parse_resume_node directly...")
    try:
        # Mock state
        state = {
            "resume_text": "Software Engineer with 10 years of experience in Python and FastAPI.",
            "candidate_metadata": {"fileName": "resume.pdf"}
        }
        res = parse_resume_node(state)
        print("Success!")
        print("Result:", res)
    except Exception as e:
        print("Error during execution:", repr(e))

if __name__ == "__main__":
    test_resume_parser()
