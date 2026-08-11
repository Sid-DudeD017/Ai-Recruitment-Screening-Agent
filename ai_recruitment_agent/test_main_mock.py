import os
import test_graph_mock
import ai_recruitment_agent.main

# Override the app in main.py
main.create_recruitment_graph = lambda: test_graph_mock.app

# Try running main.py
try:
    main.main()
    print("main.py execution successful!")
except Exception as e:
    import traceback
    traceback.print_exc()
