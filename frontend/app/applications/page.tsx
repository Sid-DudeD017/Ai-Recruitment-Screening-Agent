'use client'

import React, { useState } from 'react'

interface Application {
  id: string
  candidateName: string
  jobTitle: string
  status: 'APPLIED' | 'SCREENING' | 'PENDING_REVIEW' | 'INTERVIEW' | 'HIRED'
  matchScore?: number
  matchAnalysis?: string
  draftEmail?: string
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([
    {
      id: 'app-1',
      candidateName: 'Sarah Jenkins',
      jobTitle: 'Senior Frontend Engineer',
      status: 'APPLIED',
    },
    {
      id: 'app-2',
      candidateName: 'Alex Rivera',
      jobTitle: 'Senior Frontend Engineer',
      status: 'SCREENING',
      matchScore: 88,
      matchAnalysis: 'Strong React and Next.js background. Matches 8/10 core skills.',
    },
    {
      id: 'app-3',
      candidateName: 'David Chen',
      jobTitle: 'Product Designer',
      status: 'INTERVIEW',
    },
    {
      id: 'app-4',
      candidateName: 'Emily Watson',
      jobTitle: 'Backend Engineer',
      status: 'PENDING_REVIEW',
      matchScore: 94,
      matchAnalysis: 'Perfect fit. Strong Python and System Design.',
      draftEmail: 'Subject: Next Steps at Our Company\n\nHi Emily,\n\nWe were extremely impressed by your background in Python and System Design. We would love to invite you to an interview this week.\n\nBest,\nRecruiting Team'
    }
  ])

  const [loadingMatch, setLoadingMatch] = useState<string | null>(null)
  const [ranking, setRanking] = useState(false)
  const [reviewingApp, setReviewingApp] = useState<Application | null>(null)
  const [editedEmail, setEditedEmail] = useState('')

  // AI Feature: Match individual candidate (POST /api/ai/match)
  const handleAIMatch = async (appId: string) => {
    setLoadingMatch(appId)

    // Simulate API call and automation pipeline
    setTimeout(() => {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId
            ? {
                ...app,
                status: 'PENDING_REVIEW', // HITL Pause!
                matchScore: 92,
                matchAnalysis:
                  'Excellent fit! Strong modern frontend architecture skills and 5+ years of relevant experience.',
                draftEmail: `Subject: Interview Invitation - ${app.jobTitle}\n\nHi ${app.candidateName.split(' ')[0]},\n\nWe reviewed your application and were very impressed with your modern frontend architecture skills. We would love to schedule an interview.\n\nBest,\nRecruiting Team`
              }
            : app
        )
      )
      setLoadingMatch(null)
    }, 1200)
  }

  // AI Feature: Rank all candidates (POST /api/ai/rank)
  const handleRankAll = async () => {
    setRanking(true)

    // Simulate ranking execution
    setTimeout(() => {
      setApplications((prev) =>
        prev.map((app, index) => ({
          ...app,
          matchScore: 95 - index * 7,
          matchAnalysis: `Rank #${index + 1}: High alignment with job requirements.`,
        }))
      )
      setRanking(false)
    }, 1500)
  }

  const handleApproveAndSend = () => {
    if (!reviewingApp) return
    // Simulate sending email and advancing stage
    setApplications(prev => prev.map(app => 
      app.id === reviewingApp.id ? { ...app, status: 'INTERVIEW' } : app
    ))
    setReviewingApp(null)
    alert('Email Sent successfully!')
  }

  const handleReject = () => {
    if (!reviewingApp) return
    setApplications(prev => prev.map(app => 
      app.id === reviewingApp.id ? { ...app, status: 'REJECTED' as any } : app
    ))
    setReviewingApp(null)
  }

  const columns: Application['status'][] = ['APPLIED', 'SCREENING', 'PENDING_REVIEW', 'INTERVIEW']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Application Pipeline</h1>
          <p className="text-gray-500">Track candidates and run AI evaluation matching.</p>
        </div>

        <button
          onClick={handleRankAll}
          disabled={ranking}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 disabled:opacity-50"
        >
          {ranking ? 'Ranking...' : '✨ AI Rank All Candidates'}
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colApps = applications.filter((a) => a.status === col)

          return (
            <div key={col} className="bg-gray-100 rounded-xl p-4 space-y-3 min-h-[500px]">
              <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase">
                <span>{col}</span>
                <span className="bg-gray-200 px-2 py-0.5 rounded-full">{colApps.length}</span>
              </div>

              <div className="space-y-3">
                {colApps.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white p-4 rounded-lg border shadow-sm space-y-3 hover:shadow-md transition"
                  >
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{app.candidateName}</h3>
                      <p className="text-xs text-gray-500">{app.jobTitle}</p>
                    </div>

                    {/* Match Score Badge */}
                    {app.matchScore !== undefined ? (
                      <div className="p-2 bg-green-50 border border-green-200 rounded-md space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-green-800">AI Match Score</span>
                          <span className="text-xs font-extrabold text-green-700">{app.matchScore}%</span>
                        </div>
                        {app.matchAnalysis && (
                          <p className="text-[11px] text-green-900 leading-tight">{app.matchAnalysis}</p>
                        )}
                        {app.status === 'PENDING_REVIEW' && (
                          <button 
                            onClick={() => {
                              setReviewingApp(app)
                              setEditedEmail(app.draftEmail || '')
                            }}
                            className="mt-2 w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded font-medium transition"
                          >
                            Review AI Draft
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAIMatch(app.id)}
                        disabled={loadingMatch === app.id}
                        className="w-full text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 py-1.5 rounded font-medium transition"
                      >
                        {loadingMatch === app.id ? 'Evaluating...' : '✨ Run AI Match'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* HITL Review Modal */}
      {reviewingApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Human-in-the-Loop Review</h2>
              <p className="text-sm text-gray-500">Review the AI's email draft for {reviewingApp.candidateName} before sending.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase">AI Email Draft</label>
              <textarea 
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
                className="w-full h-48 p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button 
                onClick={() => setReviewingApp(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md"
              >
                Reject Candidate
              </button>
              <button 
                onClick={handleApproveAndSend}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
              >
                Approve & Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}