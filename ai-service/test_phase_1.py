from src.graph.workflow import create_workflow

def test_workflow():
    workflow = create_workflow().compile()
    
    # Test 1: Just job description
    initial_state = {
        "job_description": "We need a Python developer.",
        "resume_text": "I am a Python developer with 5 years of experience.",
        "current_step": "orchestrator",
        "workflow_status": "IN_PROGRESS"
    }
    
    print("Running with job_description only...")
    config = {"configurable": {"thread_id": "test_1"}}
    # Since nodes are mock, it will rapidly flow through all nodes deterministically
    # because the orchestrator logic will see job_desc -> analyze_job -> return -> 
    # mock job returns parsed_job -> orchestrator sees it needs resume -> parse_resume (if text is there)
    # wait, the first state doesn't have resume_text. Let's see what happens.
    
    try:
        final_state = workflow.invoke(initial_state, config=config)
        print("Final Next Action:", final_state.get("next_action"))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_workflow()
