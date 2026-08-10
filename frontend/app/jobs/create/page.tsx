'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateJobPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    description: '',
    requirements: '',
  })

  const [biasAnalysis, setBiasAnalysis] = useState<string | null>(null)
  const [checkingBias, setCheckingBias] = useState(false)

  // AI Feature: Check for Bias (POST /api/ai/check-bias)
  const handleCheckBias = async () => {
    if (!formData.description) return
    setCheckingBias(true)
    setBiasAnalysis(null)

    // Simulate API call to /api/ai/check-bias
    setTimeout(() => {
      setBiasAnalysis(
        'AI Analysis: The description is overall inclusive. Consider replacing aggressive terms like "rockstar candidate" with "experienced engineer".'
      )
      setCheckingBias(false)
    }, 1000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Submit via POST /api/jobs here
    router.push('/jobs')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
        <p className="text-gray-500">Fill in details and run an AI bias check on the description.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Job Title</label>
          <input
            type="text"
            required
            className="mt-1 w-full border rounded-lg p-2 text-sm"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input
              type="text"
              required
              className="mt-1 w-full border rounded-lg p-2 text-sm"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              required
              className="mt-1 w-full border rounded-lg p-2 text-sm"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Job Description</label>
            <button
              type="button"
              onClick={handleCheckBias}
              disabled={checkingBias || !formData.description}
              className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-md font-medium disabled:opacity-50 transition"
            >
              {checkingBias ? 'Checking...' : '✨ Check AI Bias'}
            </button>
          </div>
          <textarea
            rows={4}
            required
            className="w-full border rounded-lg p-2 text-sm"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {biasAnalysis && (
          <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 rounded-lg text-xs">
            {biasAnalysis}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition"
        >
          Publish Position
        </button>
      </form>
    </div>
  )
}