# 🤖 AI Recruitment Screening Agent (Full Stack)

## Overview
An intelligent, multi-stage AI platform that automates candidate screening. The platform seamlessly handles real-time PDF resume uploads, parses them intelligently, and semantically scores each candidate against job requirements. Finally, it detects bias and automatically drafts professional outreach or rejection emails based on the match outcome.

**🔗 Links**
- **Live Deployment:** [Ai-Recruitment-Screening-Agent](https://ai-recruitment-screening-agent-m8kq.vercel.app/)
- **Demo Video:** [Insert Demo Video Link Here]

---

## Tech Stack
| Component | Technology |
|---|---|
| **Frontend UI** | Next.js 16.3+, React, Tailwind CSS |
| **Backend API** | Next.js 16.3+ (API Routes) |
| **Database** | Neon Serverless Postgres, Prisma ORM |
| **Authentication** | Clerk |
| **AI Agent Service** | Python, FastAPI |
| **AI Orchestration** | LangGraph, LangChain |
| **LLM Inference** | Google Gemini (gemini-3.5-flash) |
| **Vector Search** | FAISS |
| **OCR/Parsing** | pdfplumber, python-multipart |
| **Data Validation** | Pydantic |

---

## Setup

### Prerequisites
- **Node.js** (v18+)
- **Python** (3.9+)
- **API Keys**: Google Studio Gemini API key, Clerk (Publishable/Secret keys), and a Postgres connection string (e.g., Neon).

### 1. Installation
Clone the repository and install all dependencies for the 3 services:

```bash
# 1. Setup Python Agent
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
pip install -r ai-service/requirements.txt

# 2. Setup Next.js Backend
cd Backend
npm install
cd ..

# 3. Setup Next.js Frontend
cd frontend
npm install
cd ..
```

### 2. Environment Variables
You need to set up three environment files.

**1. Root Directory (`.env`)**
Create a `.env` file in the root for the Python Agent:
```env
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-3.5-flash
APP_PORT=8000
```

**2. Backend Directory (`Backend/.env`)**
Create a `.env` file in the `Backend` folder:
```env
NODE_ENV=development
DATABASE_URL=postgres://your-neon-url...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
AI_SERVICE_URL=http://localhost:8000
```

**3. Frontend Directory (`frontend/.env.local`)**
Create a `.env.local` file in the `frontend` folder:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Generate and Seed the Database
Generate the Prisma Client and seed your Neon Database with dummy data so the UI displays correctly:
```bash
cd Backend
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
cd ..
```

### 4. Start the Platform
You will need to open three separate terminal windows to run the three services concurrently:

**Terminal 1: Start the Python AI Agent (Port 8000)**
```bash
cd ai-service
source ../venv/bin/activate  # Or your virtual environment
uvicorn src.main:app --reload --port 8000
```

**Terminal 2: Start the Next.js Backend (Port 3001)**
```bash
cd Backend
npm run dev
```

**Terminal 3: Start the Next.js Frontend (Port 3000)**
```bash
cd frontend
npm run dev
```

You can now open your browser to `http://localhost:3000` and test out the platform!

---

## Features
* 🔒 **Authentication:** Secure user login and management via Clerk.
* 🗄️ **Database:** Fully typed schema with Prisma and Neon Database.
* 📄 **Resume PDF Uploads:** Drag-and-drop UI to upload raw PDF files which are processed concurrently via OCR.
* 📝 **Intelligent Resume Parsing:** Identifies candidate name, skills, years of experience, and education from unstructured text using Gemini LLMs.
* 🎯 **Candidate Matching:** Scores candidates (0–100) based on how well their parsed profile matches the target job requirements using an integrated FAISS Vector Store scoring system.
* ⚖️ **Bias Detection:** AI automatically reviews match reasoning for potential bias across gender, race, age, and education tiers.
* ✉️ **Email Generation:** Auto-drafts a professional outreach or rejection email based on the candidate's final screening status.

---

## Technical Workflow

The platform operates across three main distributed components that work concurrently to process data:

1. **Frontend (Next.js - Port 3000):**
   Provides the interactive UI. When a recruiter drops a batch of PDF resumes into the uploader, the Frontend manages concurrency limits and token refreshing before streaming the files directly to the Backend API.

2. **Backend (Next.js - Port 3001):**
   Acts as the central router and database controller. 
   - It intercepts the file streams, creates `ParsingJob` records in the Neon database to track progress, and acts as a proxy to securely forward the files to the Python Agent.
   - It utilizes the `@neondatabase/serverless` WebSockets driver for Edge compatibility.
   - Upon receiving the structured data back from the Agent, it populates the `Candidate` and `Resume` models and performs auto-application associations.

3. **AI Agent (Python FastAPI - Port 8000):**
   Handles all machine-learning and heavy processing. 
   - Exposes REST endpoints to receive the raw PDFs.
   - Uses `pdfplumber` to extract text and `LangGraph` + `LangChain` to route the data through an intelligent workflow.
   - Uses `gemini-3.5-flash` with exponential backoff to navigate rate limits, extracts structured JSON representations via `Pydantic` schemas, computes FAISS embedding scores, and returns the strictly-typed response payload.
