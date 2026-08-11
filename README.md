# 🤖 AI Recruitment Screening Agent (Full Stack)

An intelligent, multi-stage AI platform that automates candidate screening. The platform features a **Next.js Frontend UI**, a **Next.js Backend API** powered by a Neon Postgres Database and Clerk Authentication, and a **Python FastAPI Agent** built with LangGraph, LangChain, and OpenAI to handle intelligent PDF parsing, candidate matching, and email generation.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔒 **Authentication** | Secure user login and management via **Clerk**. |
| 🗄️ **Database** | Fully typed schema with **Prisma** and **Neon Database (Postgres)**. |
| 📄 **Resume PDF Uploads** | Upload real PDF resumes from the UI. The Backend forwards the files to the Python API where they are processed via OCR (`pdfplumber`). |
| 📝 **Intelligent Resume Parsing** | Identifies candidate name, skills, years of experience, and education from raw resume text using OpenAI LLMs. |
| 🎯 **Candidate Matching (FAISS Vector Store)** | Scores each candidate (0–100) based on how well they fit the job requirements, leveraging an integrated scoring system and semantic search. |
| ⚖️ **Bias Detection** | AI reviews match reasoning for potential bias (gender, race, age, education-tier bias, etc.). |
| ✉️ **Email Generation** | Auto-drafts a professional outreach or rejection email based on the match outcome. |

---

## 🏗️ Architecture

The platform is split into three main components that run concurrently:

1. **Frontend (Next.js 16.3+ - Port 3000)**: Displays candidate lists, job matching UI, and a drag-and-drop file uploader for resumes.
2. **Backend (Next.js 16.3+ - Port 3001)**: Handles authentication validation, Prisma database connections using the `@neondatabase/serverless` and `@prisma/adapter-neon` drivers, optionally Vercel Blob Storage for files, and forwards AI tasks to the Python Agent.
3. **AI Agent (Python FastAPI - Port 8000)**: Runs the LangGraph state machine. It accepts uploaded PDFs, extracts text, runs the LLM screening pipeline, and returns structured JSON (Pydantic models) back to the Backend.

---

## 🚀 Getting Started Locally

### Prerequisites

- **Node.js** (v18+)
- **Python** (3.9+)
- **Keys**: You will need an OpenAI API key, a Clerk account (Publishable/Secret keys), and a Postgres connection string (e.g., from Neon).

### 1. Installation

Clone the repository and install all dependencies for the 3 services:

```bash
# 1. Setup Python Agent
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
pip install -r requirements.txt

# 2. Setup Next.js Backend
cd Backend
npm install

# 3. Setup Next.js Frontend
cd ../frontend
npm install
cd ..
```

### 2. Environment Variables

You need to set up three environment files.

**1. Root Directory (`.env`)**
Create a `.env` file in the root for the Python Agent:
```env
OPENAI_API_KEY=sk-proj-...
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
# (Optional) BLOB_READ_WRITE_TOKEN=...
```

**3. Frontend Directory (`frontend/.env.local`)**
Create a `.env.local` file in the `frontend` folder:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Generate and Seed the Database

Before starting the server for the first time, generate the Prisma Client and seed your Neon Database with dummy data (Candidates, Jobs, Applications) so the UI displays correctly:

```bash
cd Backend
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
cd ..
```

### 4. Start the Platform

A unified startup script `start.sh` is provided in the root directory to boot all 3 services at once.

```bash
chmod +x start.sh
./start.sh
```

**What this does:**
1. Starts the **Python API** on `http://localhost:8000`
2. Runs `npx prisma db push` and starts the **Next.js Backend** on `http://localhost:3001`
3. Starts the **Next.js Frontend** on `http://localhost:3000`

You can now open your browser to `http://localhost:3000` and test out the platform! Upload a real PDF resume on the Candidates page to watch the end-to-end extraction and database syncing in action.

---

## ⚠️ Important Configuration Notes

### 1. Prisma Neon Adapter (WebSockets)
When running the Backend via Node.js locally (instead of Edge), the Neon Serverless driver requires an explicit `ws` polyfill to function. This has already been patched in `prisma.client.ts`:
```typescript
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
neonConfig.webSocketConstructor = ws;
```

### 2. Next.js 16.3 Middleware vs Proxy
As of Next.js 16.3, `middleware.ts` is deprecated in favor of `proxy.ts`. Ensure you **do not** have both files in your `Backend/src` directory, as having both will cause the server to crash instantly with an Unhandled Rejection.

---

## 🛠️ Tech Stack

| Library | Purpose |
|---|---|
| **Next.js / React** | Full-stack web framework |
| **Prisma & Neon** | Database ORM and Serverless Postgres |
| **Clerk** | Authentication & User Management |
| **FastAPI** | High-performance Python API Server |
| **LangGraph / LangChain** | Stateful, graph-based agent orchestration |
| **OpenAI / FAISS** | LLM inference and Vector Store semantic search |
| **pdfplumber / python-multipart** | Raw file upload handling and OCR text extraction |
| **Pydantic** | Data validation and structured output schemas |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
