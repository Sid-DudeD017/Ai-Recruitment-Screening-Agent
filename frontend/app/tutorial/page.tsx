'use client'

import React from 'react'

const S = {
  card: { 
    backgroundColor: 'var(--card)', 
    border: '1px solid var(--card-border)', 
    borderRadius: '12px', 
    padding: '24px', 
    marginBottom: '24px' 
  } as React.CSSProperties,
  stepNumber: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    marginRight: '12px',
    flexShrink: 0
  } as React.CSSProperties
}

export default function TutorialPage() {
  return (
    <div className="space-y-10 max-w-4xl mx-auto py-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 font-extrabold text-3xl">User Guide and Tutorial</h1>
        <p className="text-gray-500 mt-1.5 text-lg">
          Detailed walkthrough of the recruitment screening workflows and application stages.
        </p>
      </div>

      {/* Usage Guide */}
      <div>
        <h2 className="text-gray-900 font-bold text-xl mb-4 flex items-center gap-2">
          Step-by-Step Recruitment Workflow
        </h2>
        
        <div style={S.card}>
          <div className="space-y-10">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div style={{ ...S.stepNumber, backgroundColor: '#3b82f6' }}>1</div>
              <div>
                <h3 className="text-gray-900 font-bold text-base">Define and Create Job Postings</h3>
                <p className="text-gray-600 text-sm mt-1.5 leading-relaxed">
                  Begin by accessing the Jobs panel. You can inspect active job roles or create a new one using the "+ Create New Job" option. The creation form prompts you for:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-500 text-sm">
                  <li><strong>Job Details</strong>: Job Title, Location, and Job Type (Full-Time, Part-Time, Contract, Remote, or Internship).</li>
                  <li><strong>Compensation Limits</strong>: Minimum and maximum salary ranges to help track salary constraints.</li>
                  <li><strong>Description & Requirements</strong>: A comprehensive summary of responsibilities and a detailed list of mandatory qualifications, skills, and experience levels.</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                  The details you write under the Requirements field serve as the baseline criteria for resume evaluation. Clear, structured lists of tech stacks and experiences yield the highest accuracy from the matching model.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div style={{ ...S.stepNumber, backgroundColor: '#3b82f6' }}>2</div>
              <div>
                <h3 className="text-gray-900 font-bold text-base">Upload and Parse Resumes</h3>
                <p className="text-gray-600 text-sm mt-1.5 leading-relaxed">
                  Access the Candidates directory page to upload resumes and automatically populate candidate profiles:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-3 text-gray-500 text-sm">
                  <li>
                    <strong>Select Job Role</strong>: In the upload section, first select an open position from the dropdown menu under the title "Select Job for Auto-Apply". This step is required before the upload zone becomes active, as the parser automatically applies the candidate to the chosen job role.
                  </li>
                  <li>
                    <strong>Upload Resumes</strong>: Drag and drop or browse to select files. You can upload single PDF/Docx files, select multiple files at once, or upload a single ZIP file containing multiple resumes.
                  </li>
                  <li>
                    <strong>Automatic Unpacking and Queueing</strong>: If a ZIP archive is dropped, the system client-side extracts the PDF/Docx resumes. The files are then processed sequentially, and the UI displays an "AI Parsing Resumes..." loading bar tracking parsing progress.
                  </li>
                  <li>
                    <strong>Monitor Parsing Status</strong>: Real-time progress is visible in the "Resume Parsing History" table. It tracks file names, progress percentages, errors, and parsing statuses (Pending, Parsing, Completed, or Failed).
                  </li>
                  <li>
                    <strong>Inspect Candidates</strong>: Once parsing completes, candidate records are created in the database and shown further down the page in the "All Candidates" list. You can view the candidate's parsed name, email, contact numbers, LinkedIn links, and a green "AI Parsed Resume" badge indicating successful metadata extraction.
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div style={{ ...S.stepNumber, backgroundColor: '#3b82f6' }}>3</div>
              <div>
                <h3 className="text-gray-900 font-bold text-base">Screening & Match Evaluation</h3>
                <p className="text-gray-600 text-sm mt-1.5 leading-relaxed">
                  Navigate to the Pipeline tab. In the upper-right dropdown, select the specific job you want to evaluate candidates for.
                </p>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                  You will see two distinct zones:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-500 text-sm">
                  <li><strong>AI-Controlled Zone</strong>: Displays a table of all newly applied or un-evaluated candidates (statuses set to APPLIED or SCREENING).</li>
                  <li><strong>Human-Controlled Zone</strong>: A Kanban board split into recruitment stages starting from PENDING_REVIEW.</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                  To run the matching model, click the "Process All Candidates" button. The system initiates an evaluation loop for all un-screened profiles, calling the matching model to run semantic matching against job requirements, identify missing keywords, detect systemic bias (such as gender, age, or education-tier bias), and calculate a compatibility score from 0 to 100.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div style={{ ...S.stepNumber, backgroundColor: '#3b82f6' }}>4</div>
              <div>
                <h3 className="text-gray-900 font-bold text-base">Reviewing & Promoting Candidates</h3>
                <p className="text-gray-600 text-sm mt-1.5 leading-relaxed">
                  The application routes candidates automatically based on their compatibility:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-500 text-sm">
                  <li><strong>Score &gt; 75%</strong>: The candidate status is updated to PENDING_REVIEW, and they are automatically moved out of the ingestion table and onto the first column of the Human-Controlled Kanban Board.</li>
                  <li><strong>Score ≤ 75%</strong>: The candidate remains in the AI-Controlled Ingestion Zone with a status of SCREENING, keeping the vetted pipeline clutter-free.</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                  Recruiters can manually review the AI's matching reasoning, view missing requirement summaries, and move cards across column headers (PENDING_REVIEW, SHORTLISTED, INTERVIEW, OFFERED, HIRED) by dragging and dropping them.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4">
              <div style={{ ...S.stepNumber, backgroundColor: '#3b82f6' }}>5</div>
              <div>
                <h3 className="text-gray-900 font-bold text-base">Interviews & Communications</h3>
                <p className="text-gray-600 text-sm mt-1.5 leading-relaxed">
                  Access the Interviews and Email tab to manage scheduling, template customization, and outreach drafts:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-3 text-gray-500 text-sm">
                  <li>
                    <strong>Edit Email Templates</strong>: Click the Edit Email Templates button to customize default message text. You can configure layouts for Acceptance (Interview Invitations), Rejection, Job Offer, and Post-Interview Rejection templates. The templates support placeholders such as candidate_name, job_title, company_name, interview_date, and meeting_link, and are saved directly to local storage.
                  </li>
                  <li>
                    <strong>Grouped Candidates List</strong>: The page groups active applications by job role. You can filter the candidate list using role pills or the role dropdown. The list displays candidate details, applied jobs, current stages, and active interview times.
                  </li>
                  <li>
                    <strong>Schedule or Reschedule Interviews</strong>: If no interview is active, click "Schedule" to configure slot timings. If an interview is already active, click "Edit Date" to open a modal and update the date, duration, interview type (Video Call, Technical Live, Phone Call, or Onsite Office), and the meeting link.
                  </li>
                  <li>
                    <strong>Batch Schedule Role Interviews</strong>: Use the Batch Schedule Form to schedule interview slots for a whole cohort at once. Select a job role, specify a start date and time, duration, spacing interval (e.g. 15, 30, 45, or 60 mins stagger), interview type, and the base meeting link. The scheduler automatically creates staggered, individual slots for all candidate applications assigned to that role.
                  </li>
                  <li>
                    <strong>AI Candidate Email Drafter</strong>: Select a candidate from the dropdown, then select the email type to draft. You can choose Pre-Interview drafts (Interview Invite, Pre-Interview Rejection) or Post-Interview drafts (Offer Letter, Post-Interview Rejection).
                  </li>
                  <li>
                    <strong>Review & Copy Drafts</strong>: The AI fetches template parameters and generates a complete subject line and body text. Recruiters can review and edit this text in the editor, and click the "Copy to Clipboard" button to copy the finished subject and body for external sending.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
