'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
}

interface Job {
  id: string
  title: string
  location?: string
  company?: {
    name: string
  }
}

interface Application {
  id: string
  candidateId: string
  jobId: string
  status: string
  matchScore?: number
  candidate?: Candidate
  job?: Job
}

interface Interview {
  id: string
  applicationId: string
  scheduledAt: string
  durationMinutes: number
  type: string
  status: string
  meetingLink?: string
  location?: string
  notes?: string
  application?: Application
}

// Default structural templates with tags
// --- Pre-Interview ---
const DEFAULT_ACCEPTANCE_TEMPLATE_SUBJECT = "Interview Invitation for {job_title} at {company_name}"
const DEFAULT_ACCEPTANCE_TEMPLATE_BODY = `Dear {candidate_name},

Thank you for your interest in the {job_title} role at {company_name}. We were very impressed with your application and background.

We would like to invite you for an interview! Below are the details:

📅 Date & Time: {interview_date}
⏱️ Duration: 60 minutes
🔗 Meeting Link / Location: {meeting_link}

Please confirm if this time works for you. If you need to reschedule, reply to this email as soon as possible.

Best regards,
Recruitment Team
{company_name}`

const DEFAULT_REJECTION_TEMPLATE_SUBJECT = "Update on your application for {job_title} - {company_name}"
const DEFAULT_REJECTION_TEMPLATE_BODY = `Dear {candidate_name},

Thank you for taking the time to apply for the {job_title} position at {company_name}. 

After careful review of your application and background, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely align with our current needs for this role.

We truly appreciate your interest in {company_name} and wish you the very best in your job search and professional endeavors.

Sincerely,
Recruitment Team
{company_name}`

// --- Post-Interview ---
const DEFAULT_OFFER_TEMPLATE_SUBJECT = "Congratulations! Job Offer for {job_title} at {company_name}"
const DEFAULT_OFFER_TEMPLATE_BODY = `Dear {candidate_name},

We are absolutely delighted to extend to you a formal offer for the position of {job_title} at {company_name}!

You demonstrated exceptional skills and enthusiasm throughout the interview process, and we are thrilled to welcome you to our team.

🎉 Position: {job_title}
🏢 Company: {company_name}

We will be sending a formal offer letter with full details of your compensation, benefits, and start date shortly.

Please feel free to reach out with any questions. We look forward to having you with us!

Warm regards,
Recruitment Team
{company_name}`

const DEFAULT_POST_REJECTION_TEMPLATE_SUBJECT = "Your Interview Outcome - {job_title} at {company_name}"
const DEFAULT_POST_REJECTION_TEMPLATE_BODY = `Dear {candidate_name},

Thank you so much for taking the time to interview for the {job_title} position at {company_name}. It was a genuine pleasure getting to know you and learning about your experience.

After careful deliberation, we have decided to move forward with another candidate whose experience more closely aligns with our specific requirements at this time.

This was a very difficult decision given the strong pool of candidates, and we encourage you to apply again in the future as new opportunities arise.

We wish you every success in your career journey, and thank you again for your time and interest in {company_name}.

Kind regards,
Recruitment Team
{company_name}`

export default function InterviewsAndEmailsPage() {
  const { getToken, userId } = useAuth()
  
  // Base Data State
  const [applications, setApplications] = useState<Application[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filter & Role Grouping State
  const [selectedRoleTitle, setSelectedRoleTitle] = useState<string>('ALL')

  // Batch Scheduling State
  const [batchRoleTitle, setBatchRoleTitle] = useState<string>('')
  const [batchBaseScheduledAt, setBatchBaseScheduledAt] = useState<string>('2026-08-20T10:00')
  const [batchDuration, setBatchDuration] = useState<number>(60)
  const [batchType, setBatchType] = useState<string>('VIDEO')
  const [batchStaggerMinutes, setBatchStaggerMinutes] = useState<number>(30)
  const [batchMeetingLink, setBatchMeetingLink] = useState<string>('https://meet.google.com/recruitment-interview')
  const [isBatchScheduling, setIsBatchScheduling] = useState<boolean>(false)

  // Single Interview Reschedule Modal / State
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null)
  const [editScheduledAt, setEditScheduledAt] = useState<string>('')
  const [editDuration, setEditDuration] = useState<number>(60)
  const [editType, setEditType] = useState<string>('VIDEO')
  const [editMeetingLink, setEditMeetingLink] = useState<string>('')
  const [isUpdatingInterview, setIsUpdatingInterview] = useState<boolean>(false)

  // Automated Email Generation State
  const [selectedAppIdForEmail, setSelectedAppIdForEmail] = useState<string>('')
  const [emailSubject, setEmailSubject] = useState<string>('')
  const [emailBody, setEmailBody] = useState<string>('')
  const [isGeneratingEmail, setIsGeneratingEmail] = useState<boolean>(false)

  // Email Template Customization State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false)
  const [acceptanceSubjectTemplate, setAcceptanceSubjectTemplate] = useState<string>(DEFAULT_ACCEPTANCE_TEMPLATE_SUBJECT)
  const [acceptanceBodyTemplate, setAcceptanceBodyTemplate] = useState<string>(DEFAULT_ACCEPTANCE_TEMPLATE_BODY)
  const [rejectionSubjectTemplate, setRejectionSubjectTemplate] = useState<string>(DEFAULT_REJECTION_TEMPLATE_SUBJECT)
  const [rejectionBodyTemplate, setRejectionBodyTemplate] = useState<string>(DEFAULT_REJECTION_TEMPLATE_BODY)
  const [offerSubjectTemplate, setOfferSubjectTemplate] = useState<string>(DEFAULT_OFFER_TEMPLATE_SUBJECT)
  const [offerBodyTemplate, setOfferBodyTemplate] = useState<string>(DEFAULT_OFFER_TEMPLATE_BODY)
  const [postRejectionSubjectTemplate, setPostRejectionSubjectTemplate] = useState<string>(DEFAULT_POST_REJECTION_TEMPLATE_SUBJECT)
  const [postRejectionBodyTemplate, setPostRejectionBodyTemplate] = useState<string>(DEFAULT_POST_REJECTION_TEMPLATE_BODY)
  const [activeTemplateTab, setActiveTemplateTab] = useState<'acceptance' | 'rejection' | 'offer' | 'post_rejection'>('acceptance')

  // Load saved templates from localStorage on mount
  useEffect(() => {
    try {
      const savedAccSub = localStorage.getItem('tmpl_acc_sub')
      const savedAccBody = localStorage.getItem('tmpl_acc_body')
      const savedRejSub = localStorage.getItem('tmpl_rej_sub')
      const savedRejBody = localStorage.getItem('tmpl_rej_body')
      const savedOffSub = localStorage.getItem('tmpl_off_sub')
      const savedOffBody = localStorage.getItem('tmpl_off_body')
      const savedPRejSub = localStorage.getItem('tmpl_prej_sub')
      const savedPRejBody = localStorage.getItem('tmpl_prej_body')

      if (savedAccSub) setAcceptanceSubjectTemplate(savedAccSub)
      if (savedAccBody) setAcceptanceBodyTemplate(savedAccBody)
      if (savedRejSub) setRejectionSubjectTemplate(savedRejSub)
      if (savedRejBody) setRejectionBodyTemplate(savedRejBody)
      if (savedOffSub) setOfferSubjectTemplate(savedOffSub)
      if (savedOffBody) setOfferBodyTemplate(savedOffBody)
      if (savedPRejSub) setPostRejectionSubjectTemplate(savedPRejSub)
      if (savedPRejBody) setPostRejectionBodyTemplate(savedPRejBody)
    } catch (e) {
      console.error('Failed to load email templates from local storage', e)
    }
  }, [])

  // Save templates to localStorage
  const handleSaveTemplates = () => {
    try {
      localStorage.setItem('tmpl_acc_sub', acceptanceSubjectTemplate)
      localStorage.setItem('tmpl_acc_body', acceptanceBodyTemplate)
      localStorage.setItem('tmpl_rej_sub', rejectionSubjectTemplate)
      localStorage.setItem('tmpl_rej_body', rejectionBodyTemplate)
      localStorage.setItem('tmpl_off_sub', offerSubjectTemplate)
      localStorage.setItem('tmpl_off_body', offerBodyTemplate)
      localStorage.setItem('tmpl_prej_sub', postRejectionSubjectTemplate)
      localStorage.setItem('tmpl_prej_body', postRejectionBodyTemplate)
      setSuccessMsg('Email templates saved successfully!')
      setIsTemplateModalOpen(false)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (e) {
      setError('Failed to save email templates')
    }
  }

  // Fetch Applications & Scheduled Interviews
  const fetchData = async () => {
    try {
      setLoadingData(true)
      setError(null)
      const token = await getToken()
      if (!token) return

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      
      // Fetch applications
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
      setError('Failed to load applications and interviews data')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [getToken])

  // Group applications by Job Role (Title)
  const roleGroups = useMemo(() => {
    const groups: { [roleTitle: string]: Application[] } = {}
    applications.forEach(app => {
      const title = app.job?.title || 'Unassigned Role'
      if (!groups[title]) {
        groups[title] = []
      }
      groups[title].push(app)
    })
    return groups
  }, [applications])

  const uniqueRoleTitles = useMemo(() => {
    return Object.keys(roleGroups)
  }, [roleGroups])

  // Filtered applications based on selected role
  const displayedApplications = useMemo(() => {
    if (selectedRoleTitle === 'ALL') return applications
    return roleGroups[selectedRoleTitle] || []
  }, [applications, roleGroups, selectedRoleTitle])

  // Map application IDs to scheduled interviews
  const interviewMapByAppId = useMemo(() => {
    const map: { [appId: string]: Interview } = {}
    interviews.forEach(inv => {
      if (inv.applicationId) {
        map[inv.applicationId] = inv
      }
    })
    return map
  }, [interviews])

  // 1. Batch Schedule Interviews for a selected Job Role
  const handleBatchSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchRoleTitle) {
      setError('Please select a Job Role to schedule interviews for.')
      return
    }

    const appsInRole = roleGroups[batchRoleTitle] || []
    if (appsInRole.length === 0) {
      setError(`No candidates found for role "${batchRoleTitle}"`)
      return
    }

    setIsBatchScheduling(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const token = await getToken()
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

      const appIds = appsInRole.map(a => a.id)

      const payload = {
        applicationIds: appIds,
        baseScheduledAt: new Date(batchBaseScheduledAt).toISOString(),
        staggerMinutes: batchStaggerMinutes,
        durationMinutes: batchDuration,
        type: batchType,
        interviewerIds: [userId || 'default-interviewer'],
        meetingLink: batchMeetingLink,
        notes: `Group scheduled interview session for ${batchRoleTitle}`
      }

      const res = await fetch(`${baseUrl}/interviews/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error?.message || 'Batch scheduling failed')
      }

      const json = await res.json()
      setSuccessMsg(`🎉 Successfully scheduled interviews for ${appsInRole.length} candidate(s) for "${batchRoleTitle}"!`)
      await fetchData()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Batch scheduling failed')
    } finally {
      setIsBatchScheduling(false)
    }
  }

  // 2. Reschedule / Update Individual Candidate Interview
  const handleOpenEditModal = (interview: Interview) => {
    setEditingInterview(interview)
    setEditScheduledAt(interview.scheduledAt ? new Date(interview.scheduledAt).toISOString().slice(0, 16) : '')
    setEditDuration(interview.durationMinutes || 60)
    setEditType(interview.type || 'VIDEO')
    setEditMeetingLink(interview.meetingLink || '')
  }

  const handleUpdateInterview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingInterview) return

    setIsUpdatingInterview(true)
    setError(null)

    try {
      const token = await getToken()
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

      const payload = {
        scheduledAt: new Date(editScheduledAt).toISOString(),
        durationMinutes: editDuration,
        type: editType,
        meetingLink: editMeetingLink
      }

      const res = await fetch(`${baseUrl}/interviews/${editingInterview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error?.message || 'Failed to update interview date')
      }

      setSuccessMsg(`✓ Interview schedule updated for candidate successfully.`)
      setEditingInterview(null)
      await fetchData()
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Reschedule failed')
    } finally {
      setIsUpdatingInterview(false)
    }
  }

  // 3. Draft Email — auto-detects the right template based on candidate status
  const handleDraftEmail = async (explicitType?: 'acceptance' | 'rejection' | 'offer' | 'post_rejection') => {
    if (!selectedAppIdForEmail) {
      setError('Please select a candidate application first.')
      return
    }

    const app = applications.find(a => a.id === selectedAppIdForEmail)
    if (!app) return

    // Auto-detect email type from candidate status if not explicitly set
    const autoType = (): 'acceptance' | 'rejection' | 'offer' | 'post_rejection' => {
      if (app.status === 'OFFERED') return 'offer'
      if (app.status === 'REJECTED') return 'post_rejection'
      return 'acceptance'
    }
    const type = explicitType ?? autoType()

    const inv = interviewMapByAppId[app.id]
    setIsGeneratingEmail(true)
    setError(null)

    try {
      const token = await getToken()
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

      const candidateName = `${app.candidate?.firstName || ''} ${app.candidate?.lastName || ''}`.trim() || 'Candidate'
      const jobTitle = app.job?.title || 'Position'
      const companyName = app.job?.company?.name || 'Our Company'
      const interviewDate = inv?.scheduledAt 
        ? new Date(inv.scheduledAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
        : 'To be scheduled'
      const meetingLink = inv?.meetingLink || 'https://meet.google.com/interview-link'

      const templateMap = {
        acceptance: { body: acceptanceBodyTemplate, subject: acceptanceSubjectTemplate, apiType: 'interview_invite' },
        rejection: { body: rejectionBodyTemplate, subject: rejectionSubjectTemplate, apiType: 'rejection' },
        offer: { body: offerBodyTemplate, subject: offerSubjectTemplate, apiType: 'offer' },
        post_rejection: { body: postRejectionBodyTemplate, subject: postRejectionSubjectTemplate, apiType: 'rejection' },
      }
      const { body: templateStructure, subject: templateSubject, apiType } = templateMap[type]

      const payload = {
        type: apiType,
        candidateName,
        jobTitle,
        companyName,
        interviewDate,
        meetingLink,
        templateStructure,
        templateSubject
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
        throw new Error(errData?.error?.message || 'Failed to draft email')
      }

      const json = await res.json()
      setEmailSubject(json.data.subject)
      setEmailBody(json.data.body)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Email drafting failed')
    } finally {
      setIsGeneratingEmail(false)
    }
  }

  // Helper: get status color style for the Actions column badge
  const getStatusBadgeStyle = (status: string): React.CSSProperties => {
    if (status === 'OFFERED') return { backgroundColor: '#052e16', color: '#4ade80', border: '1px solid #16a34a', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: 700 }
    if (status === 'REJECTED') return { backgroundColor: '#450a0a', color: '#f87171', border: '1px solid #dc2626', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: 700 }
    return {}
  }

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Interviews & Communications
          </h1>
          <p className="text-gray-600 mt-1">
            Group candidate interviews by role (MLE, SDE), edit individual interview dates, and auto-draft customized emails.
          </p>
        </div>
        <div>
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            ⚙️ Edit Email Templates
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center justify-between">
          <p className="font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-sm">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center justify-between">
          <p className="font-medium">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 text-sm">✕</button>
        </div>
      )}

      {/* Section 1: Role-Based Grouped Interviews Overview */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">1. Grouped Candidate Applications by Role</h2>
            <p className="text-xs text-gray-500">Filter and manage candidates applying for the same role.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">Filter Role:</label>
            <select
              className="border rounded-lg px-3 py-1.5 text-sm bg-gray-50 font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500"
              value={selectedRoleTitle}
              onChange={(e) => setSelectedRoleTitle(e.target.value)}
            >
              <option value="ALL">All Roles ({applications.length})</option>
              {uniqueRoleTitles.map(role => (
                <option key={role} value={role}>
                  {role} ({roleGroups[role].length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Role Pills / Quick Selection */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedRoleTitle('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedRoleTitle === 'ALL'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Roles ({applications.length})
          </button>
          {uniqueRoleTitles.map(role => (
            <button
              key={role}
              onClick={() => setSelectedRoleTitle(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedRoleTitle === role
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {role} ({roleGroups[role].length})
            </button>
          ))}
        </div>

        {/* Candidates Table under Selected Role */}
        {loadingData ? (
          <div className="p-8 text-center text-gray-400 animate-pulse">Loading candidates...</div>
        ) : displayedApplications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">
            No candidates found for this role filter.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-700 rounded-xl">
            <table className="w-full text-left text-sm" style={{color: '#f8fafc'}}>
              <thead style={{backgroundColor: '#1e293b', color: '#e2e8f0'}} className="font-semibold text-xs">
                <tr>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Role / Job</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Interview Scheduled</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody style={{color: '#f8fafc'}}>
                {displayedApplications.map(app => {
                  const inv = interviewMapByAppId[app.id]
                  return (
                    <tr key={app.id} style={{borderColor: '#334155'}} className="transition hover:brightness-110">
                      <td className="p-3 font-medium">
                        <div>
                          <p style={{color: '#ffffff'}} className="font-bold">
                            {app.candidate?.firstName} {app.candidate?.lastName}
                          </p>
                          <p style={{color: '#94a3b8'}} className="text-xs">{app.candidate?.email}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span style={{backgroundColor: '#1e3a5f', color: '#93c5fd', border: '1px solid #3b82f6'}} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold">
                          {app.job?.title || 'Unassigned'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span style={{backgroundColor: '#451a03', color: '#fde68a', border: '1px solid #d97706'}} className="inline-block px-3 py-0.5 rounded-full text-xs font-bold">
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {inv ? (
                          <div>
                            <p className="font-bold text-indigo-300">
                              📅 {new Date(inv.scheduledAt).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-400">{inv.durationMinutes}m • {inv.type}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not scheduled</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {/* OFFERED or REJECTED: show a finalised badge — no editing */}
                        {(app.status === 'OFFERED' || app.status === 'REJECTED') ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                            <span style={getStatusBadgeStyle(app.status)}>
                              {app.status === 'OFFERED' ? '🎉 Offered' : '❌ Rejected'}
                            </span>
                            <button
                              onClick={() => { setSelectedAppIdForEmail(app.id); handleDraftEmail(app.status === 'OFFERED' ? 'offer' : 'post_rejection') }}
                              style={{ backgroundColor: app.status === 'OFFERED' ? '#065f46' : '#450a0a', color: app.status === 'OFFERED' ? '#6ee7b7' : '#fca5a5', border: `1px solid ${app.status === 'OFFERED' ? '#10b981' : '#ef4444'}`, borderRadius: '8px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              📧 Draft {app.status === 'OFFERED' ? 'Offer' : 'Post-Interview Rejection'} Email
                            </button>
                          </div>
                        ) : inv ? (
                          <button
                            onClick={() => handleOpenEditModal(inv)}
                            className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold shadow-sm transition"
                          >
                            ✏️ Edit Date
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setBatchRoleTitle(app.job?.title || '')
                              setSelectedAppIdForEmail(app.id)
                            }}
                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-xl font-bold shadow-sm transition"
                          >
                            📅 Schedule
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 2: Batch Schedule Candidates Together by Role */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-lg font-bold text-gray-900">2. Batch Schedule Role Interviews</h2>
            <p className="text-xs text-gray-500">
              Schedule all candidates for a specific role (e.g. MLE Intern) at once with staggered or unified slots.
            </p>
          </div>

          <form onSubmit={handleBatchSchedule} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Target Role</label>
              <select
                required
                className="w-full border rounded-xl p-2.5 text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                value={batchRoleTitle}
                onChange={(e) => setBatchRoleTitle(e.target.value)}
              >
                <option value="" disabled>Select Job Role (e.g., MLE Intern)...</option>
                {uniqueRoleTitles.map(role => (
                  <option key={role} value={role}>
                    {role} ({roleGroups[role].length} candidates)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full border rounded-xl p-2.5 text-sm font-medium"
                  value={batchBaseScheduledAt}
                  onChange={(e) => setBatchBaseScheduledAt(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Slot Interval (Stagger)</label>
                <select
                  className="w-full border rounded-xl p-2.5 text-sm bg-white font-medium"
                  value={batchStaggerMinutes}
                  onChange={(e) => setBatchStaggerMinutes(Number(e.target.value))}
                >
                  <option value={0}>0 min (Same time / Group session)</option>
                  <option value={15}>15 mins spacing</option>
                  <option value={30}>30 mins spacing</option>
                  <option value={45}>45 mins spacing</option>
                  <option value={60}>60 mins spacing</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Duration per Candidate</label>
                <select
                  className="w-full border rounded-xl p-2.5 text-sm bg-white font-medium"
                  value={batchDuration}
                  onChange={(e) => setBatchDuration(Number(e.target.value))}
                >
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Interview Type</label>
                <select
                  className="w-full border rounded-xl p-2.5 text-sm bg-white font-medium"
                  value={batchType}
                  onChange={(e) => setBatchType(e.target.value)}
                >
                  <option value="VIDEO">Video Call</option>
                  <option value="TECHNICAL">Technical Live</option>
                  <option value="PHONE">Phone Call</option>
                  <option value="ONSITE">Onsite Office</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Meeting Link</label>
              <input
                type="url"
                className="w-full border rounded-xl p-2.5 text-sm"
                value={batchMeetingLink}
                onChange={(e) => setBatchMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </div>

            <button
              type="submit"
              disabled={isBatchScheduling || !batchRoleTitle}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isBatchScheduling
                ? 'Scheduling Role Candidates...'
                : `📅 Batch Schedule ${batchRoleTitle ? `(${roleGroups[batchRoleTitle]?.length || 0} Candidates)` : ''}`}
            </button>
          </form>
        </div>

        {/* Section 3: Automated Email Drafter (Acceptance & Rejection) */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-lg font-bold text-gray-900">3. Automated Candidate Email Drafter</h2>
            <p className="text-xs text-gray-500">
              Select a candidate to auto-generate customized Acceptance or Rejection emails.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Candidate</label>
              <select
                className="w-full border rounded-xl p-2.5 text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                value={selectedAppIdForEmail}
                onChange={(e) => setSelectedAppIdForEmail(e.target.value)}
              >
                <option value="" disabled>Choose candidate application...</option>
                {applications.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.candidate?.firstName} {app.candidate?.lastName} — {app.job?.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Contextual hint showing which email type applies */}
            {selectedAppIdForEmail && (() => {
              const selApp = applications.find(a => a.id === selectedAppIdForEmail)
              if (!selApp) return null
              if (selApp.status === 'OFFERED') return (
                <div style={{ backgroundColor: '#052e16', border: '1px solid #16a34a', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#4ade80' }}>
                  🎉 This candidate has been <strong>Offered</strong> — use the Offer Letter email below.
                </div>
              )
              if (selApp.status === 'REJECTED') return (
                <div style={{ backgroundColor: '#450a0a', border: '1px solid #dc2626', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#f87171' }}>
                  ❌ This candidate has been <strong>Rejected after interview</strong> — use the Post-Interview Rejection email below.
                </div>
              )
              return null
            })()}

            {/* Action Buttons — 4 types across 2 rows */}
            <div className="space-y-2">
              <p style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pre-Interview</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDraftEmail('acceptance')}
                  disabled={isGeneratingEmail || !selectedAppIdForEmail}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-3 rounded-xl text-xs shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isGeneratingEmail ? 'Drafting...' : '📧 Interview Invite'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDraftEmail('rejection')}
                  disabled={isGeneratingEmail || !selectedAppIdForEmail}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 px-3 rounded-xl text-xs shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isGeneratingEmail ? 'Drafting...' : '❌ Pre-Interview Rejection'}
                </button>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '10px' }}>Post-Interview</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDraftEmail('offer')}
                  disabled={isGeneratingEmail || !selectedAppIdForEmail}
                  style={{ backgroundColor: '#065f46', color: '#6ee7b7', fontWeight: 700, padding: '10px 12px', borderRadius: '12px', fontSize: '12px', border: '1px solid #10b981', cursor: (isGeneratingEmail || !selectedAppIdForEmail) ? 'not-allowed' : 'pointer', opacity: (isGeneratingEmail || !selectedAppIdForEmail) ? 0.5 : 1 }}
                  className="flex items-center justify-center gap-1.5 transition"
                >
                  {isGeneratingEmail ? 'Drafting...' : '🎉 Offer Letter'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDraftEmail('post_rejection')}
                  disabled={isGeneratingEmail || !selectedAppIdForEmail}
                  style={{ backgroundColor: '#450a0a', color: '#fca5a5', fontWeight: 700, padding: '10px 12px', borderRadius: '12px', fontSize: '12px', border: '1px solid #dc2626', cursor: (isGeneratingEmail || !selectedAppIdForEmail) ? 'not-allowed' : 'pointer', opacity: (isGeneratingEmail || !selectedAppIdForEmail) ? 0.5 : 1 }}
                  className="flex items-center justify-center gap-1.5 transition"
                >
                  {isGeneratingEmail ? 'Drafting...' : '💔 Post-Interview Rejection'}
                </button>
              </div>
            </div>

            {emailSubject && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Generated Subject</label>
                <input
                  type="text"
                  className="w-full border rounded-xl p-2.5 text-sm font-medium bg-gray-50 text-gray-800"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Draft Body</label>
              <textarea
                rows={7}
                className="w-full border rounded-xl p-3 text-sm font-mono text-gray-800 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Click 'Draft Acceptance Email' or 'Draft Rejection Email' above to generate personalized content..."
              />
            </div>

            {emailBody && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`)
                    setSuccessMsg('Copied email to clipboard!')
                    setTimeout(() => setSuccessMsg(null), 3000)
                  }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-lg border transition"
                >
                  📋 Copy to Clipboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Individual Interview Date Modal */}
      {editingInterview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Change Individual Candidate Interview Date</h3>
              <button
                onClick={() => setEditingInterview(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateInterview} className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Candidate:</p>
                <p className="text-sm font-bold text-gray-800">
                  {editingInterview.application?.candidate?.firstName} {editingInterview.application?.candidate?.lastName}
                </p>
                <p className="text-xs text-indigo-600 font-medium">
                  {editingInterview.application?.job?.title}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full border rounded-xl p-2.5 text-sm font-medium"
                  value={editScheduledAt}
                  onChange={(e) => setEditScheduledAt(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Mins)</label>
                  <select
                    className="w-full border rounded-xl p-2.5 text-sm bg-white font-medium"
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value))}
                  >
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full border rounded-xl p-2.5 text-sm bg-white font-medium"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                  >
                    <option value="VIDEO">Video Call</option>
                    <option value="TECHNICAL">Technical Live</option>
                    <option value="PHONE">Phone</option>
                    <option value="ONSITE">Onsite</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Meeting Link</label>
                <input
                  type="url"
                  className="w-full border rounded-xl p-2.5 text-sm"
                  value={editMeetingLink}
                  onChange={(e) => setEditMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingInterview(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingInterview}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition disabled:opacity-50"
                >
                  {isUpdatingInterview ? 'Saving...' : 'Save New Date'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Template Customization Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">⚙️ Edit Email Structural Templates</h3>
                <p className="text-xs text-gray-500">
                  Customize the base template structure for Acceptance and Rejection emails.
                </p>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Helper Tag Reference */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 text-xs text-purple-900 space-y-1">
              <p className="font-bold">Available Dynamic Tag Placeholders:</p>
              <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                <span className="bg-white px-2 py-0.5 rounded border border-purple-300 font-semibold">{'{candidate_name}'}</span>
                <span className="bg-white px-2 py-0.5 rounded border border-purple-300 font-semibold">{'{job_title}'}</span>
                <span className="bg-white px-2 py-0.5 rounded border border-purple-300 font-semibold">{'{company_name}'}</span>
                <span className="bg-white px-2 py-0.5 rounded border border-purple-300 font-semibold">{'{interview_date}'}</span>
                <span className="bg-white px-2 py-0.5 rounded border border-purple-300 font-semibold">{'{meeting_link}'}</span>
              </div>
            </div>

            {/* Tabs for all 4 template types */}
            <div className="flex flex-wrap border-b gap-1">
              <button
                onClick={() => setActiveTemplateTab('acceptance')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition ${
                  activeTemplateTab === 'acceptance'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📧 Interview Invite
              </button>
              <button
                onClick={() => setActiveTemplateTab('rejection')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition ${
                  activeTemplateTab === 'rejection'
                    ? 'border-rose-600 text-rose-700 bg-rose-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                ❌ Pre-Interview Rejection
              </button>
              <button
                onClick={() => setActiveTemplateTab('offer')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition ${
                  activeTemplateTab === 'offer'
                    ? 'border-green-600 text-green-700 bg-green-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🎉 Offer Letter
              </button>
              <button
                onClick={() => setActiveTemplateTab('post_rejection')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition ${
                  activeTemplateTab === 'post_rejection'
                    ? 'border-red-700 text-red-700 bg-red-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                💔 Post-Interview Rejection
              </button>
            </div>

            {/* Template Editors — one per tab */}
            {(() => {
              const editorConfig = {
                acceptance: { sub: acceptanceSubjectTemplate, setSub: setAcceptanceSubjectTemplate, body: acceptanceBodyTemplate, setBody: setAcceptanceBodyTemplate, label: 'Interview Invite' },
                rejection: { sub: rejectionSubjectTemplate, setSub: setRejectionSubjectTemplate, body: rejectionBodyTemplate, setBody: setRejectionBodyTemplate, label: 'Pre-Interview Rejection' },
                offer: { sub: offerSubjectTemplate, setSub: setOfferSubjectTemplate, body: offerBodyTemplate, setBody: setOfferBodyTemplate, label: 'Offer Letter' },
                post_rejection: { sub: postRejectionSubjectTemplate, setSub: setPostRejectionSubjectTemplate, body: postRejectionBodyTemplate, setBody: setPostRejectionBodyTemplate, label: 'Post-Interview Rejection' },
              }[activeTemplateTab]
              return (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Subject Line Template — {editorConfig.label}</label>
                    <input
                      type="text"
                      className="w-full border rounded-xl p-2.5 text-sm font-medium"
                      value={editorConfig.sub}
                      onChange={(e) => editorConfig.setSub(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Body Structure Template — {editorConfig.label}</label>
                    <textarea
                      rows={10}
                      className="w-full border rounded-xl p-3 text-sm font-mono text-gray-800 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      value={editorConfig.body}
                      onChange={(e) => editorConfig.setBody(e.target.value)}
                    />
                  </div>
                </div>
              )
            })()}

            <div className="flex justify-between items-center pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setAcceptanceSubjectTemplate(DEFAULT_ACCEPTANCE_TEMPLATE_SUBJECT)
                  setAcceptanceBodyTemplate(DEFAULT_ACCEPTANCE_TEMPLATE_BODY)
                  setRejectionSubjectTemplate(DEFAULT_REJECTION_TEMPLATE_SUBJECT)
                  setRejectionBodyTemplate(DEFAULT_REJECTION_TEMPLATE_BODY)
                  setOfferSubjectTemplate(DEFAULT_OFFER_TEMPLATE_SUBJECT)
                  setOfferBodyTemplate(DEFAULT_OFFER_TEMPLATE_BODY)
                  setPostRejectionSubjectTemplate(DEFAULT_POST_REJECTION_TEMPLATE_SUBJECT)
                  setPostRejectionBodyTemplate(DEFAULT_POST_REJECTION_TEMPLATE_BODY)
                }}
                className="text-xs text-gray-500 hover:text-gray-800 font-semibold underline"
              >
                Reset to Defaults
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplates}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition"
                >
                  💾 Save Templates Structure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}