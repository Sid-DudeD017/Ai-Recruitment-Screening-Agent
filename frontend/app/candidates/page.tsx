'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

interface Job {
  id: string
  title: string
}

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  linkedinUrl?: string | null
  resumeUploaded?: boolean
  _count?: {
    resumes: number;
    applications: number;
  }
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  
  // Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const { getToken } = useAuth()
  
  const [isAddingCandidate, setIsAddingCandidate] = useState(false)
  const [uploadingResumeId, setUploadingResumeId] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)

  // Apply to Job State
  const [applyingCandidateId, setApplyingCandidateId] = useState<string | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    async function fetchCandidates() {
      try {
        setPageLoading(true)
        const token = await getToken()
        if (!token) return

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        const [candidatesRes, jobsRes] = await Promise.all([
          fetch(`${baseUrl}/candidates`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${baseUrl}/jobs`, { headers: { 'Authorization': `Bearer ${token}` } })
        ])

        if (!candidatesRes.ok) throw new Error('Failed to fetch candidates')
        if (!jobsRes.ok) throw new Error('Failed to fetch jobs')

        const candidatesJson = await candidatesRes.json()
        const jobsJson = await jobsRes.json()
        
        setCandidates(candidatesJson.data || [])
        setJobs(jobsJson.data || [])
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setPageLoading(false)
      }
    }
    fetchCandidates()
  }, [getToken])

  // 1. Add Candidate (POST /api/candidates)
  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !lastName || !email) return

    setIsAddingCandidate(true)
    setError(null)
    setSuccessMsg(null)
    
    try {
      const token = await getToken()
      if (!token) throw new Error("Authentication required")
      
      const payload = {
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        linkedinUrl: linkedinUrl || undefined
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const res = await fetch(`${baseUrl}/candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error?.message || 'Failed to create candidate')
      }

      const json = await res.json()
      setCandidates((prev) => [json.data, ...prev])
      
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setLinkedinUrl('')
      setSuccessMsg('Candidate added successfully!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to create candidate')
    } finally {
      setIsAddingCandidate(false)
    }
  }

  // 2. Upload Resume PDF (POST /api/candidates/:id/resume)
  const handleResumeUpload = async (candidateId: string) => {
    if (!selectedFile) return;

    setUploadingResumeId(candidateId);
    setError(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = await getToken();

      // POST to the backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/candidates/${candidateId}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error('Failed to upload resume');
      }

      // Optimistically update the UI
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, resumeUploaded: true } : c))
      );

      setSuccessMsg('Resume uploaded successfully! AI extraction complete.');
      setTimeout(() => setSuccessMsg(null), 5000);
      setSelectedFile(null);
      setSelectedCandidate(null);
    } catch (err) {
      console.error(err);
      setError('Error uploading resume. Please try again.');
    } finally {
      setUploadingResumeId(null);
    }
  }

  // 3. Apply Candidate to Job (POST /api/applications)
  const handleApplyToJob = async (candidateId: string) => {
    if (!selectedJobId) {
      setError("Please select a job to apply to.");
      return;
    }

    setIsApplying(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          candidateId,
          jobId: selectedJobId
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || 'Failed to create application');
      }

      setSuccessMsg('Successfully applied candidate to job!');
      setTimeout(() => setSuccessMsg(null), 3000);
      setApplyingCandidateId(null);
      setSelectedJobId('');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error applying to job');
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Candidate Directory</h1>
        <p className="text-gray-500">Add candidates manually and upload PDF resumes for AI processing.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          <p>{error}</p>
        </div>
      )}
      
      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
          <p>{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Add Candidate Form */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4 h-fit sticky top-6">
          <h2 className="text-lg font-bold text-gray-800">Add New Candidate</h2>
          <form onSubmit={handleAddCandidate} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">First Name</label>
              <input
                type="text"
                required
                className="mt-1 w-full border rounded-lg p-2 text-sm"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                required
                className="mt-1 w-full border rounded-lg p-2 text-sm"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                required
                className="mt-1 w-full border rounded-lg p-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Phone (Optional)</label>
              <input
                type="tel"
                className="mt-1 w-full border rounded-lg p-2 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">LinkedIn URL (Optional)</label>
              <input
                type="url"
                className="mt-1 w-full border rounded-lg p-2 text-sm"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isAddingCandidate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              {isAddingCandidate ? 'Adding...' : 'Add Candidate'}
            </button>
          </form>
        </div>

        {/* Right: Candidate List & Drag-and-Drop Resume Uploader */}
        <div className="lg:col-span-2 bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-800">All Candidates</h2>
          </div>
          
          {pageLoading ? (
            <div className="p-8 text-center text-gray-500 animate-pulse">Loading candidates...</div>
          ) : (
            <div className="divide-y text-sm">
              {candidates.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No candidates found. Add one on the left.</div>
              ) : (
                candidates.map((c) => {
                  const hasResume = c.resumeUploaded || (c._count && c._count.resumes > 0);
                  
                  return (
                    <div key={c.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-50 transition">
                      <div>
                        <p className="font-semibold text-gray-900">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                        {(c.phone || c.linkedinUrl) && (
                          <p className="text-xs text-gray-400 mt-1">
                            {c.phone && <span className="mr-2">📞 {c.phone}</span>}
                            {c.linkedinUrl && <span>🔗 LinkedIn</span>}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:items-end gap-2">
                        <div className="flex items-center gap-3">
                          {hasResume ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs px-2.5 py-1 rounded-md font-medium">
                                ✓ AI Parsed Resume
                              </span>
                              <button
                                onClick={() => setApplyingCandidateId(applyingCandidateId === c.id ? null : c.id)}
                                className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-medium px-3 py-1.5 rounded-md transition"
                              >
                                Apply to Job
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedCandidate(selectedCandidate === c.id ? null : c.id)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium px-3 py-1.5 rounded-md transition"
                            >
                              + Upload Resume
                            </button>
                          )}
                        </div>
                        
                        {/* Job Apply Dropdown */}
                        {applyingCandidateId === c.id && (
                          <div className="mt-2 p-2 bg-gray-50 border border-dashed rounded-lg flex items-center justify-between gap-2 min-w-[250px]">
                            <select
                              value={selectedJobId}
                              onChange={(e) => setSelectedJobId(e.target.value)}
                              className="text-xs p-1.5 border rounded flex-1"
                            >
                              <option value="">Select a job...</option>
                              {jobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleApplyToJob(c.id)}
                              disabled={!selectedJobId || isApplying}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] px-3 py-1.5 rounded font-medium disabled:opacity-50 whitespace-nowrap"
                            >
                              {isApplying ? 'Applying...' : 'Apply'}
                            </button>
                          </div>
                        )}

                        {/* File Upload Dropdown */}
                        {selectedCandidate === c.id && !hasResume && (
                          <div className="mt-2 p-2 bg-gray-50 border border-dashed rounded-lg flex items-center justify-between gap-2 max-w-[250px]">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                              className="text-xs max-w-[150px]"
                            />
                            <button
                              onClick={() => handleResumeUpload(c.id)}
                              disabled={!selectedFile || uploadingResumeId === c.id}
                              className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded font-medium disabled:opacity-50 whitespace-nowrap"
                            >
                              {uploadingResumeId === c.id ? 'AI Parsing...' : 'Submit PDF'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}