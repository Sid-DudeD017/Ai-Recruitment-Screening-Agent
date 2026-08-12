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
  
  const [isBatchScoring, setIsBatchScoring] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ total: number, current: number } | null>(null)
  
  const [reviewingApp, setReviewingApp] = useState<Application | null>(null)
  const [editedEmail, setEditedEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Ingestion Table State
  const [ingestionPage, setIngestionPage] = useState(1)
  const ingestionPageSize = 10

  const { getToken } = useAuth()

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

  useEffect(() => {
    async function fetchApplications() {
      if (!activeJobId) return
      
      try {
        setLoadingApps(true)
        const token = await getToken()
        if (!token) return

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        const res = await fetch(`${baseUrl}/applications?jobId=${activeJobId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!res.ok) throw new Error('Failed to fetch applications')
        
        const json = await res.json()
        const apps = Array.isArray(json.data) ? json.data : []
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

  const handleAIAutoProcessAll = async () => {
    if (!activeJobId) return
    
    // Process anything that hasn't made it to the human board yet
    const appsToProcess = applications.filter(a => a.status === 'APPLIED' || a.status === 'SCREENING')
    if (appsToProcess.length === 0) return
    
    setIsBatchScoring(true)
    setBatchProgress({ total: appsToProcess.length, current: 0 })
    setError(null)
    
    const token = await getToken()
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    
    let currentProcessed = 0
    
    // Process sequentially to avoid Gemini API free tier rate limits (15 RPM)
    for (const app of appsToProcess) {
        try {
            // Fetch a fresh token for EACH item because the loop can take several minutes and Clerk tokens expire quickly (60s)
            const freshToken = await getToken()
            
            const res = await fetch(`${baseUrl}/ai/match`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${freshToken}`
                },
                body: JSON.stringify({ applicationId: app.id })
            })
            
            if (res.ok) {
                const json = await res.json()
                const score = json.data?.matchScore || 0
                
                // Auto-Threshold Logic
                const targetStatus = score > 75 ? 'PENDING_REVIEW' : 'SCREENING'
                
                if (targetStatus !== app.status) {
                    await fetch(`${baseUrl}/applications/${app.id}/status`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ status: targetStatus })
                    })
                }
                
                setApplications((prev) =>
                    prev.map((a) =>
                        a.id === app.id
                        ? {
                            ...a,
                            status: targetStatus,
                            matchScore: score,
                            aiAnalysis: json.data?.recommendation || json.data?.analysis || a.aiAnalysis,
                            matchAnalysis: typeof json.data?.analysis === 'string' ? json.data.analysis : a.matchAnalysis,
                        }
                        : a
                    )
                )
            } else {
                const errData = await res.json().catch(() => null)
                const errMsg = errData?.error?.message || errData?.message || `HTTP ${res.status}`
                console.error(`Backend returned error for app ${app.id}: ${errMsg}`)
                setError(prev => prev ? `${prev} | App ${app.id}: ${errMsg}` : `Error on App ${app.id}: ${errMsg}`)
            }
        } catch (err) {
            console.error("Failed item", err)
            setError(prev => prev ? `${prev} | App ${app.id}: Network Error` : `Network error on App ${app.id}`)
        }
        
        currentProcessed++
        setBatchProgress(prev => prev ? { ...prev, current: currentProcessed } : null)
        
        // Wait 4 seconds between requests
        if (currentProcessed < appsToProcess.length) {
            await new Promise(resolve => setTimeout(resolve, 4000))
        }
    }
    
    setIsBatchScoring(false)
    setBatchProgress(null)
  }

  const handleApproveAndSend = () => {
    if (!reviewingApp) return
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
        throw new Error('Invalid state transition')
      }
    } catch (err) {
      console.error('Failed to move application:', err)
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: previousStatus } : a))
      alert(err instanceof Error ? err.message : 'Failed to change status')
    }
  }

  // Visual Architecture Overhaul
  const kanbanColumns: Application['status'][] = ['PENDING_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED']
  
  const ingestionApps = applications.filter(a => a.status === 'APPLIED' || a.status === 'SCREENING')
  const totalPages = Math.ceil(ingestionApps.length / ingestionPageSize)
  const paginatedIngestionApps = ingestionApps.slice((ingestionPage - 1) * ingestionPageSize, ingestionPage * ingestionPageSize)

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Application Pipeline</h1>
          <p className="text-gray-500">Autonomous processing and Human-in-the-loop review.</p>
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
            onClick={handleAIAutoProcessAll}
            disabled={isBatchScoring || !activeJobId}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 disabled:opacity-50 whitespace-nowrap shadow-sm"
          >
            {isBatchScoring ? 'Processing...' : '✨ Process All Candidates'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          <p>{error}</p>
        </div>
      )}
      
      {batchProgress && (
        <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-xl space-y-3 shadow-inner">
          <div className="flex justify-between items-center text-indigo-900 font-semibold">
            <span>Agentic Batch Processing...</span>
            <span>{batchProgress.current} / {batchProgress.total}</span>
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-3">
            <div 
              className="bg-indigo-600 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-indigo-700 font-medium text-center">Filtering candidates. Scores &gt; 75% will automatically move to Pending Review.</p>
        </div>
      )}

      {loadingApps ? (
        <div className="p-12 text-center text-gray-500 animate-pulse">Loading applications...</div>
      ) : (
        <>
          {/* AI-Controlled Zone (Ingestion Data Table) */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b p-4 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  AI-Controlled Zone (Ingestion Volume)
                </h2>
                <p className="text-xs text-gray-500 mt-1">Raw candidates awaiting autonomous scoring. Threshold: &gt; 75% match.</p>
              </div>
              <span className="bg-gray-200 text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
                {ingestionApps.length} Candidates
              </span>
            </div>
            
            {ingestionApps.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No raw candidates in the ingestion pipeline.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Candidate</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">AI Match Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-700">
                    {paginatedIngestionApps.map(app => (
                      <tr key={app.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {app.candidate?.firstName} {app.candidate?.lastName}
                          <div className="text-xs text-gray-500 font-normal">{app.job?.title || 'Unknown Job'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide ${app.status === 'SCREENING' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {app.matchScore != null ? (
                            <span className={`font-bold ${app.matchScore > 75 ? 'text-green-600' : 'text-gray-500'}`}>{Math.round(app.matchScore)}%</span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Unscored</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-gray-50 border-t p-3 flex justify-between items-center text-sm text-gray-600">
                <button 
                  onClick={() => setIngestionPage(prev => Math.max(1, prev - 1))}
                  disabled={ingestionPage === 1}
                  className="px-3 py-1 bg-white border rounded hover:bg-gray-100 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <span>Page {ingestionPage} of {totalPages}</span>
                <button 
                  onClick={() => setIngestionPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={ingestionPage === totalPages}
                  className="px-3 py-1 bg-white border rounded hover:bg-gray-100 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Human-Controlled Zone (Kanban Board) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <h2 className="font-bold text-gray-800 text-lg">Human-Controlled Zone (Vetted)</h2>
            </div>
            
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
              {kanbanColumns.map((col) => {
                const colApps = applications.filter((a) => a.status === col)

                return (
                  <div 
                    key={col} 
                    className="bg-gray-100 rounded-xl p-4 space-y-3 min-w-[300px] w-[300px] flex-shrink-0 snap-start min-h-[500px]"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col)}
                  >
                    <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase">
                      <span>{col}</span>
                      <span className="bg-gray-200 px-2 py-0.5 rounded-full text-[10px]">{colApps.length}</span>
                    </div>

                    <div className="space-y-3">
                      {colApps.map((app) => (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id)}
                          className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3 hover:border-purple-300 hover:shadow-md transition cursor-grab active:cursor-grabbing group"
                        >
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm group-hover:text-purple-700 transition">
                              {app.candidate?.firstName} {app.candidate?.lastName}
                            </h3>
                            <p className="text-xs text-gray-500">{app.job?.title || 'Unknown Job'}</p>
                          </div>

                          {/* Match Score Badge */}
                          {app.matchScore != null && (
                            <div className="p-2.5 bg-green-50 border border-green-200 rounded-md space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-green-800 uppercase tracking-wide">AI Match</span>
                                <span className="text-xs font-extrabold text-green-700 bg-white px-2 py-0.5 rounded shadow-sm border border-green-100">
                                  {Math.round(app.matchScore)}%
                                </span>
                              </div>
                              {app.aiAnalysis && (
                                <p className="text-[11px] text-green-900 leading-snug line-clamp-3">
                                  {typeof app.aiAnalysis === 'string' ? app.aiAnalysis : JSON.stringify(app.aiAnalysis)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {colApps.length === 0 && (
                        <div className="p-6 text-center text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center gap-2">
                          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                          Drop cards here
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
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
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition"
              >
                Reject Candidate
              </button>
              <button 
                onClick={handleApproveAndSend}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition shadow-sm"
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