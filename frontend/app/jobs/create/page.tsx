'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

export default function CreateJobPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    type: 'FULL_TIME',
    salaryMin: '',
    salaryMax: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)
    
    try {
      const token = await getToken()
      if (!token) throw new Error("Authentication required")
      
      const payload = {
        ...formData,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin, 10) : undefined,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax, 10) : undefined,
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const res = await fetch(`${baseUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        if (errData?.error?.errors) {
          setFieldErrors(errData.error.errors)
        }
        throw new Error(errData?.error?.message || 'Failed to create job')
      }
      
      router.push('/jobs')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
        <p className="text-gray-500">Fill in details for the open position.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          <p className="font-medium">{error}</p>
          {Object.keys(fieldErrors).length > 0 && (
            <ul className="mt-2 list-disc list-inside text-sm">
              {Object.entries(fieldErrors).map(([field, msgs]) => (
                <li key={field}>{msgs[0]}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Job Title</label>
          <input
            type="text"
            required
            className="mt-1 w-full border rounded-lg p-2 text-sm text-gray-900 bg-white placeholder-gray-400"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          {fieldErrors.title && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.title[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              required
              className="mt-1 w-full border rounded-lg p-2 text-sm text-gray-900 bg-white placeholder-gray-400"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            {fieldErrors.location && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.location[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              required
              className="mt-1 w-full border rounded-lg p-2 text-sm bg-white text-gray-900 placeholder-gray-400"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="REMOTE">Remote</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
            {fieldErrors.type && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.type[0]}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Minimum Salary (Optional)</label>
            <input
              type="number"
              className="mt-1 w-full border rounded-lg p-2 text-sm text-gray-900 bg-white placeholder-gray-400"
              value={formData.salaryMin}
              onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
            />
            {fieldErrors.salaryMin && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.salaryMin[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Maximum Salary (Optional)</label>
            <input
              type="number"
              className="mt-1 w-full border rounded-lg p-2 text-sm text-gray-900 bg-white placeholder-gray-400"
              value={formData.salaryMax}
              onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
            />
            {fieldErrors.salaryMax && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.salaryMax[0]}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Job Description</label>
          <textarea
            rows={4}
            required
            className="mt-1 w-full border rounded-lg p-2 text-sm text-gray-900 bg-white placeholder-gray-400"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          {fieldErrors.description && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.description[0]}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Requirements</label>
          <textarea
            rows={3}
            required
            className="mt-1 w-full border rounded-lg p-2 text-sm text-gray-900 bg-white placeholder-gray-400"
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
          />
          {fieldErrors.requirements && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.requirements[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50"
        >
          {loading ? 'Publishing...' : 'Publish Position'}
        </button>
      </form>
    </div>
  )
}