# Frontend Architecture & Functionality Analysis

Based on the analysis of the `frontend` folder, here is a complete breakdown of its functionalities, the UI displayed to users (recruiters), and the backend API calls it triggers.

## 🏗️ Tech Stack & Architecture
The frontend is built using **Next.js (App Router)** with **React 19**, **Tailwind CSS v4** for styling, and **Clerk** for authentication.

---

## 📱 Functionalities and What is Displayed to the User

The UI features a top Navigation Bar (`components/navbar.tsx`) showing standard links and a Clerk User Profile/Sign-in button. It is broken down into 5 main tabs:

### 1. Dashboard (`/app/page.tsx`)
- **What is displayed**: A real-time overview of the recruitment process.
  - **Stats Grid**: Displays numerical cards for Total Jobs, Total Candidates, Applications Received, Upcoming Interviews, Hired Candidates, and Active Openings.
  - **Application Pipeline Funnel**: A visual bar chart representing candidates across different pipeline stages (Applied, Shortlisted, Interview, Offer, Hired).
  - **Recent Activity Stream**: A timeline of actions (e.g., "Uploaded resume for John Doe", "Ran AI Bias Check").
- **Backend API Calls**: Currently mocked in local state, but built to `fetch` from `/api/dashboard/stats`.

### 2. Jobs Management (`/app/jobs/page.tsx`)
- **What is displayed**: 
  - A comprehensive table listing all open job positions (Job Title, Department, Location, Status).
  - A `+ Create New Job` CTA button to create a new job listing.
- **Backend API Calls**: Uses local state array holding mocked Job data.

### 3. Candidate Directory (`/app/candidates/page.tsx`)
- **What is displayed**:
  - **Add Candidate Form**: Inputs to manually add a candidate's First Name, Last Name, and Email Address.
  - **Candidate List**: A table of all candidates.
  - **Resume Drag-and-Drop**: If no resume is uploaded, the recruiter sees a `+ Upload Resume` button. Once clicked, it opens a file selector. It shows an "AI Parsing..." loading state, and upon completion, displays a green `✓ AI Parsed Resume` badge.
- **Backend API Calls**: 
  - Submitting the resume uses a `fetch` `POST` request to `[NEXT_PUBLIC_API_URL]/candidates/[candidateId]/resume`.
  - It sends the file as `FormData` and includes the Clerk Authentication Bearer Token in the headers.

### 4. Application Pipeline (`/app/applications/page.tsx`)
- **What is displayed**: 
  - A **Kanban Board** with columns: `APPLIED`, `SCREENING`, `INTERVIEW`, `HIRED`.
  - Each card represents a candidate applying for a job.
  - **Individual AI Match**: A `✨ Run AI Match` button on each card. Once clicked, it evaluates the candidate and updates the card with a green badge showing the **AI Match Score (e.g., 92%)** and a text snippet of the **Match Analysis** (why they are a good fit).
  - **Global AI Rank**: A global `✨ AI Rank All Candidates` button to rank the entire column automatically.
- **Backend API Calls**: Features mock functions mapped to simulate `POST /api/ai/match` and `POST /api/ai/rank`.

### 5. Interviews & Communications (`/app/interviews/page.tsx`)
- **What is displayed**:
  - **Schedule Interview Form**: Inputs for Candidate Name, Date & Time, and Duration (30, 45, 60 mins). Clicking schedule shows a success banner that a Google Meet link was created.
  - **AI Email Drafter**: A UI block where the recruiter can select an Email Type (`Interview Invitation`, `Job Offer Letter`, or `Rejection Notice`). Clicking `✨ Draft Email` loads a fully written email into a text area. 
- **Backend API Calls**: Features mock functions mapped to simulate `POST /api/interviews` (scheduling) and `POST /api/ai/generate-email` (email drafting).

---

## 📝 Summary
Currently, the frontend is heavily focused on the UI/UX layout. With the exception of the **Resume Upload feature** (which is fully wired to `POST /api/candidates/:id/resume`), the other Next.js API endpoints (`/api/ai/match`, `/api/ai/generate-email`, etc.) are structured with mocked `setTimeout` promises in the React components, ready to be wired directly to the backend.
