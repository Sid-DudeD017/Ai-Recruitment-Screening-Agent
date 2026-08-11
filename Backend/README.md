# AI Recruitment Agent - Backend

This is the Node.js / Next.js backend for the AI Recruitment Platform. It acts as the orchestration layer between the user-facing frontend and the Python-based AI Agent.

## Tech Stack
- **Framework**: Next.js 16.3+ (API Routes only)
- **Database**: Prisma + Neon (Serverless Postgres)
- **Auth**: Clerk (`@clerk/nextjs`)
- **Validation**: Zod
- **Logging**: Pino

## Key Directories
- `/prisma`: Contains the `schema.prisma` file and the `seed.ts` script for generating dummy data.
- `/src/app/api`: Contains the Next.js App Router API endpoints that the frontend calls.
- `/src/modules`: Contains the business logic (e.g. `jobs.service.ts`, `candidates.service.ts`).
- `/src/infrastructure`: Contains the Prisma client, Redis client, and AI agent HTTP client configurations.

## Setup
Please refer to the root `README.md` for full installation and environment variable setup instructions.
