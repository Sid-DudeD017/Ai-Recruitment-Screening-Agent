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

const S = {
  card: { backgroundColor: '#151c2c', border: '1px solid #2a364f', borderRadius: '12px', overflow: 'hidden' } as React.CSSProperties,
  thead: { backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  row: { borderBottom: '1px solid #2a364f' } as React.CSSProperties,
  kanbanCol: { backgroundColor: '#1a2438', border: '1px solid #2a364f', borderRadius: '12px', padding: '16px', minWidth: '280px', width: '280px', flexShrink: 0, minHeight: '480px' } as React.CSSProperties,
  kanbanColHeader: { color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  kanbanCard: { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '14px', marginBottom: '10px', cursor: 'grab', transition: 'border-color 0.15s' } as React.CSSProperties,
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
  const [ingestionPage, setIngestionPage] = useState(1)
  const ingestionPageSize = 10
  const { getToken } = useAuth()

  useEffect(() => {
    async function fetchJobs() {
      try {
        const token = await getToken()
        if (!token) return
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        const res = await fetch(`${baseUrl}/jobs`, { headers: { 'Authorization': `Bearer ${token}` } })
        if (res.ok) {
          const json = await res.json()
          setJobs(json.data || [])
          if (json.data?.length > 0) setActiveJobId(json.data[0].id)
        }
      } catch (err) { console.error('Failed to fetch jobs', err) }
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
        const res = await fetch(`${baseUrl}/applications?jobId=${activeJobId}`, { headers: { 'Authorization': `Bearer ${token}` } })
        if (!res.ok) throw new Error('Failed to fetch applications')
        const json = await res.json()
        const apps = Array.isArray(json.data) ? json.data : []
        setApplications(apps.filter((a: Application) => a.jobId === activeJobId))
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Unknown error fetching apps')
      } finally { setLoadingApps(false) }
    }
    fetchApplications()
  }, [activeJobId, getToken])

  const handleAIAutoProcessAll = async () => {
    if (!activeJobId) return
    const appsToProcess = applications.filter(a => (a.status === 'APPLIED' || a.status === 'SCREENING') && a.matchScore == null)
    if (appsToProcess.length === 0) return
    setIsBatchScoring(true)
    setBatchProgress({ total: appsToProcess.length, current: 0 })
    setError(null)
    const token = await getToken()
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    let currentProcessed = 0
    let rejectedCount = 0
    
    for (const app of appsToProcess) {
      try {
        let score = app.matchScore;
        let aiAnalysis = app.aiAnalysis;
        let matchAnalysis = app.matchAnalysis;
        
        // If it doesn't have a score yet, fetch from AI
        if (score == null) {
          const freshToken = await getToken()
          const res = await fetch(`${baseUrl}/ai/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${freshToken}` },
            body: JSON.stringify({ applicationId: app.id })
          })
          if (res.ok) {
            const json = await res.json()
            score = json.data?.matchScore || 0
            aiAnalysis = json.data?.recommendation || json.data?.analysis || app.aiAnalysis
            matchAnalysis = typeof json.data?.analysis === 'string' ? json.data.analysis : app.matchAnalysis
          } else {
            const errData = await res.json().catch(() => null)
            const errMsg = errData?.error?.message || `HTTP ${res.status}`
            setError(prev => prev ? `${prev} | App ${app.id}: ${errMsg}` : `Error on App ${app.id}: ${errMsg}`)
            score = 0; // fallback to reject if AI fails, or could skip
          }
        }

        // Now move the candidate based on their score (either pre-existing or newly fetched)
        if (score != null) {
          const targetStatus = score > 75 ? 'PENDING_REVIEW' : (score >= 50 ? 'SCREENING' : 'REJECTED');
          if (targetStatus === 'REJECTED') rejectedCount++;
          
          if (targetStatus !== app.status) {
            await fetch(`${baseUrl}/applications/${app.id}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ status: targetStatus })
            })
          }
          setApplications((prev) => prev.map((a) => a.id === app.id ? { ...a, status: targetStatus, matchScore: score, aiAnalysis, matchAnalysis } : a))
        }
      } catch (err) {
        setError(prev => prev ? `${prev} | App ${app.id}: Network Error` : `Network error on App ${app.id}`)
      }
      
      currentProcessed++
      setBatchProgress(prev => prev ? { ...prev, current: currentProcessed } : null)
      
      // Only wait if we actually made a network call to the AI to avoid hitting rate limits
      if (app.matchScore == null && currentProcessed < appsToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 4000))
      }
    }
    setIsBatchScoring(false)
    setBatchProgress(null)
    
    if (rejectedCount > 0) {
      alert(`Batch processing complete. ${rejectedCount} candidates were below the threshold and have been automatically rejected and sent rejection emails.`)
    } else if (currentProcessed > 0 && !error) {
      alert(`Batch processing complete. All candidates successfully passed the threshold.`)
    }
  }

  const handleApproveAndSend = () => {
    if (!reviewingApp) return
    setApplications(prev => prev.map(app => app.id === reviewingApp.id ? { ...app, status: 'INTERVIEW' } : app))
    setReviewingApp(null)
    alert('Email Sent successfully!')
  }

  const handleReject = () => {
    if (!reviewingApp) return
    setApplications(prev => prev.map(app => app.id === reviewingApp.id ? { ...app, status: 'REJECTED' } : app))
    setReviewingApp(null)
  }

  const handleDragStart = (e: React.DragEvent, appId: string) => { e.dataTransfer.setData('appId', appId) }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault() }
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: targetStatus })
      })
      if (!res.ok) throw new Error('Invalid state transition')
    } catch (err) {
      console.error('Failed to move application:', err)
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: previousStatus } : a))
      alert(err instanceof Error ? err.message : 'Failed to change status')
    }
  }

  const kanbanColumns: Application['status'][] = ['PENDING_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED']
  const ingestionApps = applications.filter(a => a.status === 'APPLIED' || a.status === 'SCREENING')
  const remainingToProcessCount = ingestionApps.filter(a => a.matchScore == null).length
  const totalPages = Math.ceil(ingestionApps.length / ingestionPageSize)
  const paginatedIngestionApps = ingestionApps.slice((ingestionPage - 1) * ingestionPageSize, ingestionPage * ingestionPageSize)

  const statusBadgeStyle = (status: string): React.CSSProperties => {
    if (status === 'SCREENING') return { backgroundColor: '#431407', color: '#fdba74', border: '1px solid #ea580c', borderRadius: '4px', padding: '1px 8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }
    return { backgroundColor: '#172554', color: '#93c5fd', border: '1px solid #2563eb', borderRadius: '4px', padding: '1px 8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.875rem' }}>Application Pipeline</h1>
          <p style={{ color: '#94a3b8', marginTop: '4px' }}>Autonomous processing and Human-in-the-loop review.</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={activeJobId}
            onChange={e => setActiveJobId(e.target.value)}
            style={{ backgroundColor: '#1e293b', color: '#ffffff', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }}
          >
            <option value="" disabled>Select a job</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
          <button
            onClick={handleAIAutoProcessAll}
            disabled={isBatchScoring || !activeJobId || ingestionApps.length === 0}
            style={{ backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: 700, padding: '8px 16px', borderRadius: '8px', fontSize: '14px', opacity: (isBatchScoring || !activeJobId || ingestionApps.length === 0) ? 0.5 : 1, whiteSpace: 'nowrap' }}
          >
            {isBatchScoring ? 'Processing...' : `✨ Process Remaining (${ingestionApps.length})`}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#450a0a', color: '#fca5a5', border: '1px solid #dc2626', borderRadius: '8px', padding: '12px 16px' }}>
          <p>{error}</p>
        </div>
      )}

      {batchProgress && (
        <div style={{ backgroundColor: '#1e1b4b', border: '1px solid #4f46e5', borderRadius: '12px', padding: '20px', gap: '12px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c7d2fe', fontWeight: 600 }}>
            <span>Agentic Batch Processing...</span>
            <span>{batchProgress.current} / {batchProgress.total}</span>
          </div>
          <div style={{ width: '100%', backgroundColor: '#312e81', borderRadius: '9999px', height: '10px' }}>
            <div style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%`, backgroundColor: '#6366f1', height: '10px', borderRadius: '9999px', transition: 'width 0.3s' }} />
          </div>
          <p style={{ color: '#a5b4fc', fontSize: '12px', textAlign: 'center' }}>Filtering candidates. Scores &gt; 75% will automatically move to Pending Review.</p>
        </div>
      )}

      {loadingApps ? (
        <div style={{ color: '#64748b', textAlign: 'center', padding: '48px' }} className="animate-pulse">Loading applications...</div>
      ) : (
        <>
          {/* AI-Controlled Zone */}
          <div style={S.card}>
            <div style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #2a364f', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'inline-block' }} />
                  AI-Controlled Zone (Ingestion Volume)
                </h2>
                <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Raw candidates awaiting autonomous scoring. Threshold: &gt; 75% match.</p>
              </div>
              <span style={{ backgroundColor: '#334155', color: '#e2e8f0', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '9999px' }}>
                {ingestionApps.length} Total • {remainingToProcessCount} Unscored
              </span>
            </div>

            {ingestionApps.length === 0 ? (
              <div style={{ color: '#475569', textAlign: 'center', padding: '32px', fontSize: '14px' }}>No raw candidates in the ingestion pipeline.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead style={S.thead}>
                    <tr>
                      <th style={{ padding: '12px 24px', fontWeight: 600 }}>Candidate</th>
                      <th style={{ padding: '12px 24px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '12px 24px', fontWeight: 600 }}>AI Match Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedIngestionApps.map(app => (
                      <tr key={app.id} style={S.row} className="transition hover:brightness-110">
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ color: '#ffffff', fontWeight: 600 }}>{app.candidate?.firstName} {app.candidate?.lastName}</span>
                          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>{app.job?.title || 'Unknown Job'}</div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={statusBadgeStyle(app.matchScore != null && app.status === 'APPLIED' ? 'SCREENING' : app.status)}>
                            {app.matchScore != null && app.status === 'APPLIED' ? 'SCREENING' : app.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          {app.matchScore != null ? (
                            <span style={{ fontWeight: 700, color: app.matchScore > 75 ? '#4ade80' : '#94a3b8' }}>{Math.round(app.matchScore)}%</span>
                          ) : (
                            <span style={{ color: '#475569', fontStyle: 'italic', fontSize: '12px' }}>Unscored</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div style={{ backgroundColor: '#1e293b', borderTop: '1px solid #2a364f', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => setIngestionPage(prev => Math.max(1, prev - 1))}
                  disabled={ingestionPage === 1}
                  style={{ color: '#cbd5e1', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '4px 12px', cursor: ingestionPage === 1 ? 'not-allowed' : 'pointer', opacity: ingestionPage === 1 ? 0.5 : 1 }}
                >Previous</button>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Page {ingestionPage} of {totalPages}</span>
                <button
                  onClick={() => setIngestionPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={ingestionPage === totalPages}
                  style={{ color: '#cbd5e1', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '4px 12px', cursor: ingestionPage === totalPages ? 'not-allowed' : 'pointer', opacity: ingestionPage === totalPages ? 0.5 : 1 }}
                >Next</button>
              </div>
            )}
          </div>

          {/* Human-Controlled Kanban */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a855f7', display: 'inline-block' }} />
              <h2 style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.125rem' }}>Human-Controlled Zone (Vetted)</h2>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
              {kanbanColumns.map((col) => {
                const colApps = applications.filter((a) => a.status === col)
                return (
                  <div key={col} style={S.kanbanCol} className="snap-start" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={S.kanbanColHeader}>{col}</span>
                      <span style={{ backgroundColor: '#334155', color: '#e2e8f0', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px' }}>{colApps.length}</span>
                    </div>

                    <div>
                      {colApps.map((app) => (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id)}
                          style={S.kanbanCard}
                        >
                          <h3 style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px' }}>
                            {app.candidate?.firstName} {app.candidate?.lastName}
                          </h3>
                          <p style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>{app.job?.title || 'Unknown Job'}</p>

                          {app.matchScore != null && (
                            <div style={{ backgroundColor: '#052e16', border: '1px solid #166534', borderRadius: '8px', padding: '10px', marginTop: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#4ade80', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Match</span>
                                <span style={{ color: '#86efac', fontWeight: 800, fontSize: '13px' }}>{Math.round(app.matchScore)}%</span>
                              </div>
                              {app.aiAnalysis && (
                                <p style={{ color: '#bbf7d0', fontSize: '11px', marginTop: '6px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {typeof app.aiAnalysis === 'string' ? app.aiAnalysis : JSON.stringify(app.aiAnalysis)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {colApps.length === 0 && (
                        <div style={{ border: '2px dashed #2a364f', borderRadius: '8px', padding: '24px', textAlign: 'center', color: '#475569', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <svg style={{ width: '20px', height: '20px', color: '#334155' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: '#151c2c', border: '1px solid #2a364f', borderRadius: '16px', maxWidth: '512px', width: '100%', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.25rem' }}>Human-in-the-Loop Review</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
              Review the AI's email draft for {reviewingApp.candidateName || (reviewingApp.candidate ? `${reviewingApp.candidate.firstName} ${reviewingApp.candidate.lastName}` : '')} before sending.
            </p>
            <div style={{ marginTop: '16px' }}>
              <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>AI Email Draft</label>
              <textarea
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
                style={{ width: '100%', height: '192px', padding: '12px', fontSize: '14px', backgroundColor: '#0f172a', color: '#ffffff', border: '1px solid #334155', borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setReviewingApp(null)} style={{ color: '#94a3b8', backgroundColor: '#1e293b', border: '1px solid #334155', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleReject} style={{ color: '#fca5a5', backgroundColor: '#450a0a', border: '1px solid #dc2626', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Reject Candidate</button>
              <button onClick={handleApproveAndSend} style={{ color: '#ffffff', backgroundColor: '#4f46e5', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>Approve & Send Email</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}