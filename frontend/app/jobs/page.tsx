'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'

interface Job {
  id: string
  title: string
  location: string | null
  status: string
  type: string
}

const cardStyle: React.CSSProperties = { backgroundColor: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '12px', overflow: 'hidden' }
const theadStyle: React.CSSProperties = { backgroundColor: 'var(--card)', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--card-border)' }
const trStyle: React.CSSProperties = { borderBottom: '1px solid var(--card-border)' }

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { getToken } = useAuth()

  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true)
        const token = await getToken()
        if (!token) { setError('Authentication required'); return }
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
        const res = await fetch(`${baseUrl}/jobs`, { headers: { 'Authorization': `Bearer ${token}` } })
        if (!res.ok) throw new Error('Failed to fetch jobs')
        const json = await res.json()
        setJobs(json.data || [])
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [getToken])

  const getStatusStyle = (status: string): React.CSSProperties => {
    if (status === 'OPEN') return { backgroundColor: 'var(--color-emerald-bg)', color: 'var(--color-emerald-text)', border: '1px solid var(--color-emerald-border)', borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 700 }
    return { backgroundColor: 'var(--card-border)', color: 'var(--muted)', border: '1px solid var(--card-border)', borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 700 }
  }

  const getTypeStyle = (): React.CSSProperties => ({
    color: '#fb923c', fontWeight: 600, fontSize: '13px'
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-gray-900 font-extrabold text-3xl">Jobs Management</h1>
          <p className="text-gray-500 mt-1">View and manage open positions.</p>
        </div>
        <Link
          href="/jobs/create"
          style={{ backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 700, padding: '8px 16px', borderRadius: '8px', fontSize: '14px', textDecoration: 'none' }}
        >
          + Create New Job
        </Link>
      </div>

      {error && (
        <div style={{ backgroundColor: '#450a0a', color: '#fca5a5', border: '1px solid #dc2626', borderRadius: '8px', padding: '12px 16px' }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ height: '200px', backgroundColor: 'var(--card-border)', borderRadius: '12px', animation: 'pulse 2s infinite' }} />
      ) : (
        <div style={cardStyle}>
          <table className="w-full text-left text-sm">
            <thead style={theadStyle}>
              <tr>
                <th className="p-4">Job Title</th>
                <th className="p-4">Location</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} style={trStyle} className="transition hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="p-4 font-semibold text-gray-900">{job.title}</td>
                  <td className="p-4 text-gray-600">{job.location || '-'}</td>
                  <td className="p-4" style={getTypeStyle()}>{job.type}</td>
                  <td className="p-4">
                    <span style={getStatusStyle(job.status)}>{job.status}</span>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--muted)', textAlign: 'center', padding: '32px' }}>
                    No jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}