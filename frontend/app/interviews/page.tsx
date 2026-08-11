'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'

interface Application {
  id: string
  candidateId: string
  jobId: string
  candidate?: {
    firstName: string
    lastName: string
    email: string
  }
  job?: {
    title: string
    company?: {
      name: string
    }
  }
}

interface Interview {
  id: string
  scheduledAt: string
  durationMinutes: number
  type: string
  status: string
  application?: Application
}

export default function InterviewsAndEmailsPage() {
  const { getToken, userId } = useAuth()
  
  // Data
  const [applications, setApplications] = useState<Application[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Scheduling State
  const [selectedAppId, setSelectedAppId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('2026-08-15T10:00')
  const [duration, setDuration] = useState(60)
  const [type, setType] = useState('VIDEO')
  const [scheduling, setScheduling] = useState(false)
  const [scheduleSuccess, setScheduleSuccess] = useState(false)
  const [interviewerIds, setInterviewerIds] = useState<string[]>([])

  // Email Drafting State
  const [emailType, setEmailType] = useState<'interview_invite' | 'offer' | 'rejection' | 'status_update'>('interview_invite')
  const [emailDraft, setEmailDraft] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [generatingEmail, setGeneratingEmail] = useState(false)
  const [emailAppId, setEmailAppId] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingData(true)
        const token = await getToken()
        if (!token) return

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        
        // Fetch applications for dropdowns
        const appsRes = await fetch(`${baseUrl}/applications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (appsRes.ok) {
          const json = await appsRes.json()
          setApplications(json.data || [])
        }
        
        // Fetch interviews
        const intRes = await fetch(`${baseUrl}/interviews`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (intRes.ok) {
          const json = await intRes.json()
          setInterviews(json.data || [])
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load data')
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [getToken])
  
  useEffect(() => {
    if (userId && interviewerIds.length === 0) {
      setInterviewerIds([userId])
    }
  }, [userId, interviewerIds.length])

  // 1. Schedule Interview (POST /api/interviews)
  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppId) return
    
    setScheduling(true)
    setScheduleSuccess(false)
    setError(null)

    try {
      const token = await getToken()
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      
      const payload = {
        applicationId: selectedAppId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: duration,
        type,
        interviewerIds
      }
      
      const res = await fetch(`${baseUrl}/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error?.message || 'Failed to schedule interview')
      }
      
      const json = await res.json()
      setInterviews((prev) => [json.data, ...prev])
      setScheduleSuccess(true)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Scheduling failed')
    } finally {
      setScheduling(false)
    }
  }

  // 2. Generate AI Email Draft (POST /api/ai/generate-email)
  const handleGenerateEmail = async () => {
    if (!emailAppId) {
      alert("Please select a candidate first")
      return
    }
    
    const app = applications.find(a => a.id === emailAppId)
    if (!app) return
    
    setGeneratingEmail(true)
    setError(null)

    try {
      const token = await getToken()
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      
      const payload = {
        type: emailType,
        candidateName: `${app.candidate?.firstName} ${app.candidate?.lastName}`,
        jobTitle: app.job?.title || 'the position',
        companyName: app.job?.company?.name || 'our company'
      }
      
      const res = await fetch(`${baseUrl}/ai/generate-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error?.message || 'Failed to generate email')
      }
      
      const json = await res.json()
      setEmailSubject(json.data.subject)
      setEmailDraft(json.data.body)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to generate email')
    } finally {
      setGeneratingEmail(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Interviews & Communications</h1>
        <p className="text-gray-500">Schedule meetings with calendar links and generate AI-crafted emails.</p>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          <p>{error}</p>
        </div>
      )}

      {/* Scheduled Interviews List */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-800">Scheduled Interviews</h2>
        </div>
        
        {loadingData ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Loading interviews...</div>
        ) : interviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No scheduled interviews found.</div>
        ) : (
          <div className="divide-y text-sm">
            {interviews.map(inv => (
              <div key={inv.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-50">
                <div>
                  <p className="font-semibold text-gray-900">
                    {inv.application?.candidate?.firstName} {inv.application?.candidate?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">for {inv.application?.job?.title}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">
                    {new Date(inv.scheduledAt).toLocaleString()} ({inv.durationMinutes}m)
                  </p>
                  <p className="text-xs text-gray-500">{inv.type} • {inv.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 5: Schedule Interview */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800">1. Schedule Interview</h2>
          
          <form onSubmit={handleSchedule} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Select Application</label>
              <select
                required
                className="mt-1 w-full border rounded-lg p-2 text-sm bg-white"
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
              >
                <option value="" disabled>Choose candidate application...</option>
                {applications.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.candidate?.firstName} {app.candidate?.lastName} - {app.job?.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  className="mt-1 w-full border rounded-lg p-2 text-sm bg-white"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Interview Type</label>
              <select
                className="mt-1 w-full border rounded-lg p-2 text-sm bg-white"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="VIDEO">Video</option>
                <option value="PHONE">Phone</option>
                <option value="ONSITE">Onsite</option>
                <option value="TECHNICAL">Technical</option>
              </select>
            </div>
            
            {/* Interviewer multi-select can just be a text note for now or disabled input since we default to self */}
            <div>
              <label className="block text-xs font-medium text-gray-700">Interviewers</label>
              <input
                type="text"
                disabled
                className="mt-1 w-full border rounded-lg p-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                value="You (Default)"
              />
            </div>

            <button
              type="submit"
              disabled={scheduling || !selectedAppId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              {scheduling ? 'Creating Event...' : '📅 Schedule Interview'}
            </button>

            {scheduleSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs">
                ✓ Interview scheduled successfully!
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
              disabled={generatingEmail || !emailAppId}
              className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-md font-medium transition disabled:opacity-50"
            >
              {generatingEmail ? 'Drafting...' : '✨ Draft Email'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Select Candidate</label>
              <select
                className="w-full border rounded-lg p-2 text-sm bg-white"
                value={emailAppId}
                onChange={(e) => setEmailAppId(e.target.value)}
              >
                <option value="" disabled>Choose candidate...</option>
                {applications.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.candidate?.firstName} {app.candidate?.lastName} - {app.job?.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Type</label>
              <select
                className="w-full border rounded-lg p-2 text-sm bg-white"
                value={emailType}
                onChange={(e) => setEmailType(e.target.value as any)}
              >
                <option value="interview_invite">Interview Invitation</option>
                <option value="offer">Job Offer Letter</option>
                <option value="rejection">Rejection Notice</option>
                <option value="status_update">Status Update</option>
              </select>
            </div>

            {emailSubject && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                <input 
                  type="text" 
                  readOnly 
                  className="w-full border rounded-lg p-2 text-sm bg-gray-50"
                  value={emailSubject}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Generated Draft</label>
              <textarea
                rows={7}
                className="w-full border rounded-lg p-3 text-sm font-mono text-gray-800 bg-gray-50"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                placeholder="Select a candidate and click 'Draft Email' above to generate an automated personalized email..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}