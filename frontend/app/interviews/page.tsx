'use client'

import React, { useState } from 'react'

export default function InterviewsAndEmailsPage() {
  // Scheduling State
  const [candidateName, setCandidateName] = useState('Sarah Jenkins')
  const [jobTitle, setJobTitle] = useState('Senior Frontend Engineer')
  const [scheduledAt, setScheduledAt] = useState('2026-08-15T10:00')
  const [duration, setDuration] = useState(60)
  const [scheduling, setScheduling] = useState(false)
  const [scheduleSuccess, setScheduleSuccess] = useState(false)

  // Email Drafting State
  const [emailType, setEmailType] = useState<'INTERVIEW_INVITE' | 'OFFER' | 'REJECTION'>('INTERVIEW_INVITE')
  const [emailDraft, setEmailDraft] = useState('')
  const [generatingEmail, setGeneratingEmail] = useState(false)

  // 1. Schedule Interview (POST /api/interviews)
  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setScheduling(true)
    setScheduleSuccess(false)

    // Simulate API call to POST /api/interviews
    setTimeout(() => {
      setScheduling(false)
      setScheduleSuccess(true)
    }, 1000)
  }

  // 2. Generate AI Email Draft (POST /api/ai/generate-email)
  const handleGenerateEmail = async () => {
    setGeneratingEmail(true)

    // Simulate API call to POST /api/ai/generate-email
    setTimeout(() => {
      if (emailType === 'INTERVIEW_INVITE') {
        setEmailDraft(
          `Hi ${candidateName},\n\nWe were very impressed by your background and would love to invite you for a 60-minute technical interview for the ${jobTitle} position.\n\nPlease let us know if the scheduled time works for you!\n\nBest regards,\nRecruitment Team`
        )
      } else if (emailType === 'OFFER') {
        setEmailDraft(
          `Dear ${candidateName},\n\nWe are thrilled to offer you the position of ${jobTitle}! We were deeply impressed with your skills and feel you will be a fantastic fit for our team.\n\nBest regards,\nRecruitment Team`
        )
      } else {
        setEmailDraft(
          `Dear ${candidateName},\n\nThank you for taking the time to apply for the ${jobTitle} role. While your background is impressive, we have decided to move forward with other candidates whose experience more closely matches our current needs.\n\nBest regards,\nRecruitment Team`
        )
      }
      setGeneratingEmail(false)
    }, 1000)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Interviews & Communications</h1>
        <p className="text-gray-500">Schedule meetings with calendar links and generate AI-crafted emails.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 5: Schedule Interview */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800">1. Schedule Interview</h2>
          
          <form onSubmit={handleSchedule} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Candidate Name</label>
              <input
                type="text"
                required
                className="mt-1 w-full border rounded-lg p-2 text-sm"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Date & Time</label>
              <input
                type="datetime-local"
                required
                className="mt-1 w-full border rounded-lg p-2 text-sm"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Duration (Minutes)</label>
              <select
                className="mt-1 w-full border rounded-lg p-2 text-sm"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={scheduling}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition"
            >
              {scheduling ? 'Creating Event...' : '📅 Schedule & Create Google Meet'}
            </button>

            {scheduleSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs">
                ✓ Google Calendar event created & Google Meet link generated automatically!
              </div>
            )}
          </form>
        </div>

        {/* Section 6: AI Email Generator */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">2. AI Email Drafter</h2>
            <button
              onClick={handleGenerateEmail}
              disabled={generatingEmail}
              className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-md font-medium transition"
            >
              {generatingEmail ? 'Drafting...' : '✨ Draft Email'}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Type</label>
              <select
                className="w-full border rounded-lg p-2 text-sm"
                value={emailType}
                onChange={(e) => setEmailType(e.target.value as any)}
              >
                <option value="INTERVIEW_INVITE">Interview Invitation</option>
                <option value="OFFER">Job Offer Letter</option>
                <option value="REJECTION">Rejection Notice</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Generated Draft</label>
              <textarea
                rows={7}
                className="w-full border rounded-lg p-3 text-sm font-mono text-gray-800 bg-gray-50"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                placeholder="Click 'Draft Email' above to generate an automated personalized email..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}