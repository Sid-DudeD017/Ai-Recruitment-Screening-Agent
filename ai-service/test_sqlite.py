from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3

def test_sqlite():
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    saver = SqliteSaver(conn)
    print("SqliteSaver loaded successfully")

if __name__ == "__main__":
    test_sqlite()
