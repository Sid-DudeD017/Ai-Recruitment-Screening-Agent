#!/bin/bash

# Trap SIGINT (Ctrl+C) and kill all child processes
trap 'kill 0' SIGINT

echo "Starting AI Recruitment Platform..."

# 1. Start Python AI Agent (Port 8000)
echo "[1/3] Starting Python AI Agent on port 8000..."
cd /Users/siddharthbhakta/Ai-Recruitment-Screening-Agent/ai-service
source ../venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 &

# 2. Start Next.js Backend (Port 3001)
echo "[2/3] Starting Next.js Backend on port 3001..."
cd /Users/siddharthbhakta/Ai-Recruitment-Screening-Agent/Backend
# Ensure db is pushed
npx prisma db push
npm run dev &

# 3. Start Next.js Frontend (Port 3000)
echo "[3/3] Starting Next.js Frontend on port 3000..."
cd /Users/siddharthbhakta/Ai-Recruitment-Screening-Agent/frontend
npm run dev &

echo "========================================================"
echo "All services are starting up!"
echo "Frontend UI   -> http://localhost:3000"
echo "Backend API   -> http://localhost:3001"
echo "Python AI API -> http://localhost:8000"
echo "Press Ctrl+C to stop all services."
echo "========================================================"

wait
