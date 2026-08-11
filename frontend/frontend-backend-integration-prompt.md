# Wire Recruitment App Frontend to Live Backend

## Context

You're working in the `frontend` folder of a Next.js (App Router, React 19, Tailwind v4, Clerk auth) recruitment screening app. The backend (also Next.js API routes, Prisma/Neon, Zod-validated, RBAC-enforced) already implements every endpoint the UI needs. Right now most of the frontend is built against mocked local state or `setTimeout` promises instead of the real API. Resume upload is the one feature already fully wired — use it as the reference pattern for auth headers and request shape.

Your job: replace the mocks with real `fetch` calls to the backend, and resolve or flag the mismatches listed below. Don't modify the backend.

## Before you start

Some backend details are described only by example in the architecture docs (e.g. "APPLIED -> INTERVIEW -> HIRED"), not as exhaustive enums. Before wiring anything that depends on these, check the actual source (Prisma schema, Zod schemas under `src/modules/*/`) for:

- The full `Application` status enum — blocks Task 4 and part of Task 1.
- The exact `context` values `POST /api/ai/generate-email` accepts.
- Whether `Job` has a `department` field at all — see Mismatch 2.

## Task 1 — Dashboard (`/app/page.tsx`)

Replace the mocked stats grid, pipeline funnel, and activity stream with real data:

- Stats grid → `GET /api/dashboard/stats`
- Pipeline funnel → `GET /api/dashboard/pipeline` — the backend has a dedicated endpoint for exactly this chart, so use it directly rather than deriving funnel data from `/stats`.
- Activity stream → `GET /api/dashboard/activity`

Drop the "Ran AI Bias Check" example activity item unless that feature actually exists — see Mismatch 3.

## Task 2 — Jobs (`/app/jobs/page.tsx`)

Wire the table and create form to `GET /api/jobs` and `POST /api/jobs`. Support the existing query params (`status`, `type`, `search`, `page`, `limit`, `sortBy`, `sortOrder`) if the table has any filter, sort, or pagination UI. The create form's fields should match the POST body exactly: `title`, `description`, `requirements`, `location`, `type`, `salaryMin`, `salaryMax`. Hold off on the `Department` column until Mismatch 2 is resolved.

## Task 3 — Candidates (`/app/candidates/page.tsx`)

First confirm whether the Add Candidate form and candidate list are already hitting `/api/candidates` or are still mocked like Jobs — this wasn't clear from the architecture docs. If mocked, wire:

- List → `GET /api/candidates`
- Create → `POST /api/candidates`

The form currently only collects First Name / Last Name / Email; the backend also accepts `phone` and `linkedinUrl`. Add those fields unless there's a reason they're intentionally deferred.

Leave the resume upload flow alone — it's already correctly wired to `POST /api/candidates/[id]/resume` with `FormData` and a Clerk Bearer token. Reuse that exact auth-header pattern for every other call in this brief.

## Task 4 — Applications / Kanban (`/app/applications/page.tsx`)

Populate the board itself via `GET /api/applications` (filtered by the active job) instead of local mock data, then wire:

- Per-card "Run AI Match" → `POST /api/ai/match` with `candidateId` + `jobId`; render the returned score and reasoning in place of the mock.
- "AI Rank All Candidates" → `POST /api/ai/rank` with `jobId` + the column's `candidateIds`; re-sort the column by the returned ranking.
- Card drag-and-drop between columns → `PATCH /api/applications/[id]/status`.

Don't wire the columns themselves until Mismatch 1 (status naming) is resolved — the column values need to match the backend's real enum, not be guessed from the current mock.

Separately: the backend has a `PATCH /api/applications/[id]/shortlist` endpoint, but the current Kanban has no shortlist column or action. Don't drop this capability silently — either add a UI affordance for it or confirm with whoever owns product scope that it's intentionally out for this pass.

## Task 5 — Interviews (`/app/interviews/page.tsx`)

The scheduling form is missing fields the backend requires. `POST /api/interviews` needs `applicationId`, `scheduledAt`, `durationMinutes`, `type` (`VIDEO`/`PHONE`/`ONSITE`), and `interviewerIds`. The current form only has candidate name, date/time, and duration. Add:

- A way to resolve `applicationId` — candidate name alone is ambiguous if one candidate has multiple applications, so search/select from actual applications rather than free text.
- An interview type selector — the current "Google Meet link" success banner implies VIDEO is hardcoded; decide if PHONE/ONSITE should be selectable now or later.
- An interviewer picker (multi-select from the company's users).

For the AI Email Drafter, wire the type dropdown (`Interview Invitation` / `Job Offer Letter` / `Rejection Notice`) to `POST /api/ai/generate-email`. Confirm the exact `context` string each option should send from the backend source — don't guess the mapping.

## Known mismatches to resolve (flag, don't silently guess)

1. **Status/stage naming is inconsistent across three places** and needs one source of truth before Kanban or dashboard-funnel wiring can be correct:
   - Backend doc (by example): `APPLIED -> INTERVIEW -> HIRED`
   - Kanban columns: `APPLIED`, `SCREENING`, `INTERVIEW`, `HIRED`
   - Dashboard funnel stages: `Applied`, `Shortlisted`, `Interview`, `Offer`, `Hired`

   Pull the real enum from the Prisma schema and reconcile all three UI surfaces to it.

2. **`Department` may not be a real `Job` field.** The Jobs table displays a Department column, but the job-creation body only lists `title`, `description`, `requirements`, `location`, `type`, `salaryMin`, `salaryMax`. Check the Prisma schema — if there's no `department` field, either drop the column or flag it as a backend schema change rather than inventing one from the frontend.

3. **"Ran AI Bias Check" has no matching backend endpoint.** The AI Teammate list is `analyze-job`, `parse-resume`, `match`, `rank`, `schedule-interview`, `generate-email` — nothing about bias checking. Treat this dashboard activity example as placeholder copy, not a real feature, unless told otherwise.

4. **The Interviews page doesn't appear to show a list of already-scheduled interviews or allow canceling one**, even though the backend supports `GET /api/interviews` and `PATCH /[id]/cancel`. Confirm whether that's an intentional phase-1 scope cut or a gap to fill in this pass.

5. **Two backend AI endpoints have no frontend home:** `POST /api/ai/analyze-job` and `POST /api/ai/schedule-interview` aren't used anywhere in the current UI. Not blocking for this pass, but worth a note back to whoever owns product scope.

## Non-functional requirements

- Every authenticated call needs the Clerk Bearer token in headers, exactly as the resume upload already does it.
- Preserve the existing loading-state pattern (the "AI Parsing…" spinner → checkmark badge used for resumes) for the other async AI actions — match, rank, email draft — instead of inventing a new one.
- Add real error handling (failed fetch, non-2xx response) everywhere a mock is removed; none of the current mocks model a failure state.
- Use `NEXT_PUBLIC_API_URL` consistently, matching how it's used in the resume upload call.

## Out of scope

- Don't modify backend code or the Prisma schema — flag schema-level issues (like Mismatch 2) instead of fixing them from here.
- Don't touch the resume upload implementation; it's the reference pattern, not something to refactor.
