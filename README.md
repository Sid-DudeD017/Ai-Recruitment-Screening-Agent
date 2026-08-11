# 🤖 AI Recruitment Screening Agent

An intelligent, multi-stage AI pipeline that automates candidate screening — from parsing job descriptions and resumes to matching, bias detection, and email generation. Built with **LangGraph**, **LangChain**, and **Ollama (local LLMs)**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **JD Parsing** | Extracts must-have skills, nice-to-have skills, experience requirements, and job title from any job description |
| 📝 **Resume Parsing** | Identifies candidate name, skills, years of experience, and education from raw resume text |
| 🎯 **Candidate Matching** | Scores each candidate 0–100 based on how well they fit the job requirements, with qualitative reasoning |
| ⚖️ **Bias Detection** | Reviews match reasoning for potential bias (gender, race, age, education-tier bias, etc.) |
| ✉️ **Email Generation** | Auto-drafts a professional outreach or rejection email based on the match outcome |
| 🏆 **Candidate Ranking** | Ranks all processed candidates by score for easy shortlisting |

---

## 🏗️ Architecture

The agent is implemented as a **LangGraph state machine** where each stage is a dedicated node. The graph processes one candidate at a time through a sequential pipeline, with the final two steps (bias detection and email generation) running after matching.

```
                  ┌─────────────────┐
                  │   START (Input) │
                  └────────┬────────┘
                           │
                    ┌──────▼──────┐
                    │  parse_jd   │  ← Extracts structured data from Job Description
                    └──────┬──────┘
                           │
                   ┌───────▼───────┐
                   │ parse_resume  │  ← Extracts structured data from Resume
                   └───────┬───────┘
                           │
                  ┌────────▼────────┐
                  │ match_candidate │  ← Scores candidate fit (0–100) with reasoning
                  └────────┬────────┘
                      ┌────┴────┐
                      │        │
               ┌──────▼──┐ ┌───▼──────────┐
               │detect_  │ │  generate_   │
               │  bias   │ │    email     │
               └──────┬──┘ └───┬──────────┘
                      │        │
                      └───┬────┘
                      ┌───▼───┐
                      │  END  │
                      └───────┘
```

### Graph State

Each node reads from and writes to a shared `GraphState` object:

| Field | Type | Description |
|---|---|---|
| `job_description_text` | `str` | Raw job description input |
| `resume_text` | `str` | Raw resume input |
| `parsed_job` | `JobRequirements` | Structured job data (title, skills, experience) |
| `parsed_resume` | `ResumeData` | Structured resume data (name, skills, experience, education) |
| `match_score` | `MatchScore` | Score (0–100) + reasoning |
| `bias_report` | `BiasReport` | Bias detected flag + list of concerns |
| `generated_email` | `str` | Draft outreach/rejection email |

---

## 📁 Project Structure

```
Ai-Recruitment-Screening-Agent/
├── main.py                          # Entry point: batch processes candidates & ranks results
├── requirements.txt                 # Python dependencies
├── .env                             # Environment variables (Ollama model, base URL)
├── pyrightconfig.json               # Pyright / VS Code type-checking config
│
└── ai_recruitment_agent/
    ├── __init__.py
    ├── graph.py                     # Builds & compiles the LangGraph workflow
    ├── llm.py                       # Ollama LLM factory (model & base URL config)
    ├── state.py                     # Pydantic models & GraphState TypedDict
    │
    └── nodes/
        ├── __init__.py
        ├── jd_parser.py             # Node: parse job description → JobRequirements
        ├── resume_parser.py         # Node: parse resume → ResumeData
        ├── matcher.py               # Node: score candidate fit → MatchScore
        ├── bias_detector.py         # Node: audit reasoning for bias → BiasReport
        └── email_generator.py       # Node: draft candidate email → str
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- [Ollama](https://ollama.com/) installed and running locally
- A pulled Ollama model (default: `llama3`)

```bash
# Pull the default model
ollama pull llama3

# Verify Ollama is running
ollama serve
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Ai-Recruitment-Screening-Agent.git
cd Ai-Recruitment-Screening-Agent

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# 3. Install dependencies
pip install -r requirements.txt
```

### Configuration

Create a `.env` file in the project root (one is already included):

```env
# Ollama model to use (default: llama3)
OLLAMA_MODEL=llama3

# Ollama server URL (default: http://localhost:11434)
OLLAMA_BASE_URL=http://localhost:11434
```

### Run

```bash
python main.py
```

The script will process the sample candidates defined in `main.py` and print a ranked leaderboard with scores, reasoning, bias concerns, and email drafts.

---

## 📊 Example Output

```
========== STARTING BATCH PROCESSING ==========

--- Processing Candidate 1 ---
--- PARSING JOB DESCRIPTION ---
--- PARSING RESUME ---
--- MATCHING CANDIDATE: Alice Smith ---
--- DETECTING BIAS FOR: Alice Smith ---
--- GENERATING EMAIL FOR: Alice Smith ---
Finished processing Alice Smith

...

========== AGGREGATION & RANKING ==========

Rank 1: Carol White - Score: 92/100
Reasoning: Strong match across must-have and nice-to-have skills...
Email Draft Preview:
  Dear Carol, We are pleased to invite you for an interview...

----------------------------------------

Rank 2: Alice Smith - Score: 78/100
...
```

---

## 🔧 Customisation

### Use a Different LLM

Change the model in your `.env` or pass it explicitly:

```python
from ai_recruitment_agent.llm import get_llm

llm = get_llm(model="mistral", temperature=0.2)
```

Any model available via `ollama list` can be used.

### Add Your Own Job Description & Resumes

Edit `main.py` and replace `SAMPLE_JD` and `SAMPLE_RESUMES` with your own data, or load them from files:

```python
with open("job_description.txt") as f:
    SAMPLE_JD = f.read()

import glob
SAMPLE_RESUMES = [open(p).read() for p in glob.glob("resumes/*.txt")]
```

### Extend the Pipeline

Add a new node by:
1. Creating a new file in `ai_recruitment_agent/nodes/`
2. Adding the node to the graph in `graph.py`
3. Adding the relevant field(s) to `GraphState` in `state.py`

---

## 🛠️ Tech Stack

| Library | Purpose |
|---|---|
| [LangGraph](https://github.com/langchain-ai/langgraph) | Stateful, graph-based agent orchestration |
| [LangChain](https://github.com/langchain-ai/langchain) | LLM abstraction, prompt templates, structured output |
| [langchain-ollama](https://github.com/langchain-ai/langchain-ollama) | Ollama integration for local LLM inference |
| [Pydantic](https://docs.pydantic.dev/) | Data validation and structured output schemas |
| [python-dotenv](https://github.com/theskumar/python-dotenv) | Environment variable management |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
