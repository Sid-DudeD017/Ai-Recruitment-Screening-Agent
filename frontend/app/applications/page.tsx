'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'

interface Application {
  id: string
  candidateId?: string
  jobId?: string
  candidateName?: string
  jobTitle?: string
  status: 'APPLIED' | 'SCREENING' | 'SHORTLISTED' | 'PENDING_REVIEW' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'REJECTED'
  matchScore?: number | null
  matchAnalysis?: string
  aiAnalysis?: any
  draftEmail?: string
  candidate?: {
    firstName: string
    lastName: string
    email: string
  }
  job?: {
    title: string
  }
}

interface Job {
  id: string
  title: string
}

export default function ApplicationsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [activeJobId, setActiveJobId] = useState<string>('')
  
  const [applications, setApplications] = useState<Application[]>([])
  const [loadingApps, setLoadingApps] = useState(false)
  
  const [loadingMatch, setLoadingMatch] = useState<string | null>(null)
  const [ranking, setRanking] = useState(false)
  const [reviewingApp, setReviewingApp] = useState<Application | null>(null)
  const [editedEmail, setEditedEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { getToken } = useAuth()

  // 1. Fetch Jobs on mount for the selector
  useEffect(() => {
    async function fetchJobs() {
      try {
        const token = await getToken()
        if (!token) return

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        const res = await fetch(`${baseUrl}/jobs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const json = await res.json()
          setJobs(json.data || [])
          if (json.data && json.data.length > 0) {
            setActiveJobId(json.data[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to fetch jobs', err)
      }
    }
    fetchJobs()
  }, [getToken])

  // 2. Fetch Applications when activeJobId changes
  useEffect(() => {
    async function fetchApplications() {
      if (!activeJobId) return
      
      try {
        setLoadingApps(true)
        const token = await getToken()
        if (!token) return

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        // Pass jobId as query param. If API doesn't support it, we filter on client anyway.
        const res = await fetch(`${baseUrl}/applications?jobId=${activeJobId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!res.ok) {
          throw new Error('Failed to fetch applications')
        }
        
        const json = await res.json()
        const apps = Array.isArray(json.data) ? json.data : []
        // Filter by job ID on client just in case the API ignores the query param
        setApplications(apps.filter((a: Application) => a.jobId === activeJobId))
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Unknown error fetching apps')
      } finally {
        setLoadingApps(false)
      }
    }
    fetchApplications()
  }, [activeJobId, getToken])

  // AI Feature: Match individual candidate (POST /api/ai/match)
  const handleAIMatch = async (app: Application) => {
    setLoadingMatch(app.id)
    setError(null)
    try {
      const token = await getToken()
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      
      // Wait, standard AI match endpoint takes candidateSkills etc... but the instruction says:
      // POST /api/ai/match with candidateId + jobId
      const res = await fetch(`${baseUrl}/ai/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ candidateId: app.candidateId, jobId: app.jobId })
      })
      
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error?.message || 'Match failed')
      }
      
      const json = await res.json()
      
      // We expect the backend to return { matchScore, recommendation, ... }

      setApplications((prev) =>
        prev.map((a) =>
          a.id === app.id
            ? {
                ...a,
                status: 'PENDING_REVIEW', // HITL Pause!
                matchScore: json.data?.matchScore ?? a.matchScore ?? undefined,
                aiAnalysis: json.data?.recommendation || json.data?.analysis || a.aiAnalysis,
                matchAnalysis: typeof json.data?.analysis === 'string' ? json.data.analysis : a.matchAnalysis,
                draftEmail: json.data?.draftEmail || `Subject: Interview Invitation - ${a.job?.title || a.jobTitle || 'the role'}\n\nHi ${a.candidate?.firstName || (a.candidateName ? a.candidateName.split(' ')[0] : '')},\n\nWe reviewed your application and were very impressed with your background. We would love to schedule an interview.\n\nBest,\nRecruiting Team`

              }
            : a
        )
      )
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed AI Match')
    } finally {
      setLoadingMatch(null)
    }
  }

  // AI Feature: Rank all candidates (POST /api/ai/rank)
  const handleRankAll = async () => {
    if (!activeJobId) return
    setRanking(true)
    setError(null)
    
    try {
      const token = await getToken()
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      
      const res = await fetch(`${baseUrl}/ai/rank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobId: activeJobId })
      })
      
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error?.message || 'Ranking failed')
      }
      
      const json = await res.json()
      const rankings = json.data?.rankings || []
      
      // Build a map of candidateId -> ranking data
      const rankMap = new Map()
      rankings.forEach((r: any, index: number) => {
        rankMap.set(r.candidateId, { ...r, rankIndex: index + 1 })
      })
      
      setApplications((prev) =>
        prev.map((app) => {
          if (app.jobId !== activeJobId) return app
          const r = rankMap.get(app.candidateId)
          if (r) {
            return {
              ...app,
              matchScore: r.score,
              aiAnalysis: `Rank #${r.rankIndex}: ${r.reasoning}`,
            }
          }
          return app
        }).sort((a, b) => {
           // Re-sort within the list by match score descending
           const scoreA = a.matchScore || 0;
           const scoreB = b.matchScore || 0;
           return scoreB - scoreA;
        })
      )
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed to rank candidates')
    } finally {
      setRanking(false)
    }
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
      app.id === reviewingApp.id ? { ...app, status: 'REJECTED' } : app
    ))
    setReviewingApp(null)
  }

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData('appId', appId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: Application['status']) => {
    e.preventDefault()
    const appId = e.dataTransfer.getData('appId')
    if (!appId) return

    const appToMove = applications.find(a => a.id === appId)
    if (!appToMove || appToMove.status === targetStatus) return

    const previousStatus = appToMove.status
    
    // Optimistic update
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: targetStatus } : a))
    
    try {
      const token = await getToken()
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      
      const res = await fetch(`${baseUrl}/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: targetStatus })
      })
      
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error?.message || 'Invalid state transition')
      }
    } catch (err) {
      console.error('Failed to move application:', err)
      // Rollback optimistic update
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: previousStatus } : a))
      alert(err instanceof Error ? err.message : 'Failed to change status')
    }
  }

  const columns: Application['status'][] = ['APPLIED', 'SCREENING', 'PENDING_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED']


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Application Pipeline</h1>
          <p className="text-gray-500">Track candidates and run AI evaluation matching.</p>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={activeJobId} 
            onChange={e => setActiveJobId(e.target.value)}
            className="border-gray-300 rounded-lg text-sm bg-white border p-2"
          >
            <option value="" disabled>Select a job</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
          
          <button
            onClick={handleRankAll}
            disabled={ranking || !activeJobId}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            {ranking ? 'Ranking...' : '✨ AI Rank All'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          <p>{error}</p>
        </div>
      )}

      {loadingApps ? (
        <div className="p-12 text-center text-gray-500 animate-pulse">Loading applications...</div>
      ) : (
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
          {columns.map((col) => {
            const colApps = applications.filter((a) => a.status === col)

            return (
              <div 
                key={col} 
                className="bg-gray-100 rounded-xl p-4 space-y-3 min-w-[280px] w-[280px] flex-shrink-0 snap-start min-h-[500px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col)}
              >
                <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase">
                  <span>{col}</span>
                  <span className="bg-gray-200 px-2 py-0.5 rounded-full">{colApps.length}</span>
                </div>

                <div className="space-y-3">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      className="bg-white p-4 rounded-lg border shadow-sm space-y-3 hover:shadow-md transition cursor-grab active:cursor-grabbing"
                    >
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">
                          {app.candidate?.firstName} {app.candidate?.lastName}
                        </h3>
                        <p className="text-xs text-gray-500">{app.job?.title || 'Unknown Job'}</p>
                      </div>

                      {/* Match Score Badge */}
                      {app.matchScore != null ? (
                        <div className="p-2 bg-green-50 border border-green-200 rounded-md space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-green-800">AI Match Score</span>
                            <span className="text-xs font-extrabold text-green-700">{Math.round(app.matchScore)}%</span>
                          </div>
                          {app.aiAnalysis && (
                            <p className="text-[11px] text-green-900 leading-tight">
                              {typeof app.aiAnalysis === 'string' ? app.aiAnalysis : JSON.stringify(app.aiAnalysis)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAIMatch(app)}
                          disabled={loadingMatch === app.id}
                          className="w-full text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 py-1.5 rounded font-medium transition disabled:opacity-50"
                        >
                          {loadingMatch === app.id ? 'Evaluating...' : '✨ Run AI Match'}
                        </button>
                      )}
                    </div>
                  ))}
                  {colApps.length === 0 && (
                    <div className="p-4 text-center text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                      Drop cards here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* HITL Review Modal */}
      {reviewingApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Human-in-the-Loop Review</h2>
              <p className="text-sm text-gray-500">Review the AI's email draft for {reviewingApp.candidateName || (reviewingApp.candidate ? `${reviewingApp.candidate.firstName} ${reviewingApp.candidate.lastName}` : '')} before sending.</p>
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