# AI Recruitment Agent - Frontend

This is the Next.js React frontend for the AI Recruitment Platform. It provides the user interface for recruiters and hiring managers to manage jobs, candidates, and AI-driven workflows.

## Tech Stack
- **Framework**: Next.js 16.3+ (App Router)
- **Styling**: Tailwind CSS
- **Auth**: Clerk (`@clerk/nextjs`)
- **Icons**: Lucide React

## Key Pages
- `/`: The main Dashboard displaying pipeline stats and activity.
- `/jobs`: The Job board, displaying all created jobs.
- `/jobs/create`: The form to create and publish a new job.
- `/candidates`: The candidate pool, featuring a drag-and-drop resume upload that triggers the AI extraction workflow.
- `/applications`: A Kanban-style board to track candidates through the hiring pipeline.

## Setup
Please refer to the root `README.md` for full installation and environment variable setup instructions.
