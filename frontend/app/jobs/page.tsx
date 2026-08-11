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
        
        if (!token) {
          setError('Authentication required')
          return
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        const res = await fetch(`${baseUrl}/jobs`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!res.ok) {
          throw new Error('Failed to fetch jobs')
        }

        const json = await res.json()
        // Assuming API returns { success: true, data: Job[], meta: ... }
        // or { data: Job[] } based on previous assumption
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobs Management</h1>
          <p className="text-gray-500">View and manage open positions.</p>
        </div>
        <Link
          href="/jobs/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + Create New Job
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          <h2 className="font-bold">Error</h2>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500">
              <tr>
                <th className="p-4">Job Title</th>
                <th className="p-4">Location</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-semibold text-gray-900">{job.title}</td>
                  <td className="p-4">{job.location || '-'}</td>
                  <td className="p-4">{job.type}</td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      job.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
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