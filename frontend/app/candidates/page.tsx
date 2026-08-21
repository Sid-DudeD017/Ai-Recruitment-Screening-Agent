'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import JSZip from 'jszip'

interface Job {
  id: string
  title: string
}

interface ParsingJob {
  id: string
  fileName: string
  status: 'PENDING' | 'PARSING' | 'COMPLETED' | 'FAILED'
  progress: number | null
  error: string | null
  createdAt: string
  completedAt?: string
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
  const [parsingJobs, setParsingJobs] = useState<ParsingJob[]>([])
  
  const { getToken } = useAuth()
  
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  // Bulk Upload State
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ total: number, current: number, currentFileName: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // NEW: State for Auto-Apply Job Selection
  const [selectedJobIdForUpload, setSelectedJobIdForUpload] = useState<string>('')

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

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
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

  // Fetch parsing jobs
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    async function fetchParsingJobs() {
      try {
        const token = await getToken();
        if (!token) return;

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const res = await fetch(`${baseUrl}/candidates/parsing-jobs`, { headers: { 'Authorization': `Bearer ${token}` } });
        
        if (res.ok) {
          const json = await res.json();
          const jobs = json.data || [];
          setParsingJobs(jobs);

          // Poll every 3 seconds if active jobs, else 15 seconds
          const hasActive = jobs.some((j: ParsingJob) => j.status === 'PENDING' || j.status === 'PARSING');
          timeoutId = setTimeout(fetchParsingJobs, hasActive ? 3000 : 15000);
        } else {
          timeoutId = setTimeout(fetchParsingJobs, 15000);
        }
      } catch (err) {
        console.error('Failed to fetch parsing jobs:', err);
        timeoutId = setTimeout(fetchParsingJobs, 15000);
      }
    }

    fetchParsingJobs();

    return () => clearTimeout(timeoutId);
  }, [getToken])

  // Bulk Upload Handlers
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!selectedJobIdForUpload) return; // Prevent drop if no job selected
    const files = Array.from(e.dataTransfer.files)
    await processFiles(files)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedJobIdForUpload) return; // Prevent select if no job selected
    if (e.target.files) {
      const files = Array.from(e.target.files)
      await processFiles(files)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  
  const processFiles = async (files: File[]) => {
    let filesToUpload: File[] = []
    
    for (const file of files) {
      if (file.name.toLowerCase().endsWith('.zip')) {
        try {
          const zip = new JSZip()
          const contents = await zip.loadAsync(file)
          for (const [filename, zipEntry] of Object.entries(contents.files)) {
            // Ignore directories, macosx metadata, and hidden files (e.g. ._resume.pdf)
            const isHidden = filename.split('/').pop()?.startsWith('._');
            if (!zipEntry.dir && !filename.includes('__MACOSX') && !isHidden) {
              const lowerName = filename.toLowerCase()
              if (lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
                const blob = await zipEntry.async('blob')
                const basename = filename.split('/').pop() || filename
                const mimeType = lowerName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                filesToUpload.push(new File([blob], basename, { type: mimeType }))
              }
            }
          }
        } catch (err) {
          console.error("Failed to parse zip", err)
          setError("Failed to parse ZIP file.")
        }
      } else {
        const lowerName = file.name.toLowerCase()
        if (lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
           filesToUpload.push(file)
        }
      }
    }
    
    if (filesToUpload.length === 0) {
      setError("No valid resumes (.pdf, .docx) found in the selection.")
      return
    }
    
    setError(null)
    setSuccessMsg(null)
    setUploadProgress({ total: filesToUpload.length, current: 0, currentFileName: '' })
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
    
    // Create parsing jobs upfront so they appear in history immediately
    let precreatedJobs: any[] = [];
    try {
      const initialToken = await getToken();
      const createRes = await fetch(`${baseUrl}/candidates/parsing-jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${initialToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileNames: filesToUpload.map(f => f.name) })
      });
      if (createRes.ok) {
        const createJson = await createRes.json();
        precreatedJobs = createJson.data || [];
      }
    } catch (err) {
      console.error("Failed to precreate parsing jobs:", err);
    }

    let successCount = 0;
    for (let i = 0; i < filesToUpload.length; i++) {
      const uploadFile = filesToUpload[i]
      setUploadProgress(prev => prev ? { ...prev, current: i, currentFileName: uploadFile.name } : null)
      
      try {
        const formData = new FormData()
        formData.append('file', uploadFile)
        if (precreatedJobs[i] && precreatedJobs[i].id) {
          formData.append('jobId', precreatedJobs[i].id);
        }
        // NEW: Send the job ID to auto-apply
        if (selectedJobIdForUpload) {
          formData.append('applyToJobId', selectedJobIdForUpload);
        }
        
        // Fetch a fresh token for EACH file because the loop can take several minutes and Clerk tokens expire quickly (60s)
        const freshToken = await getToken()
        
        const res = await fetch(`${baseUrl}/candidates/auto-parse`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${freshToken}` },
          body: formData
        })
        
        if (res.ok) {
          const json = await res.json()
          if (json.data?.candidate) {
            // Add property to instantly show AI tag
            const newCand = { ...json.data.candidate, resumeUploaded: true }
            setCandidates(prev => {
              const exists = prev.find(c => c.id === newCand.id);
              if (exists) {
                return prev.map(c => c.id === newCand.id ? newCand : c);
              }
              return [newCand, ...prev];
            })
            successCount++
          }
        } else {
            const errData = await res.json().catch(() => null)
            const errMsg = errData?.error?.message || errData?.message || `HTTP ${res.status}`
            console.error(`Backend returned error for ${uploadFile.name}: ${errMsg}`)
            setError(prev => prev ? `${prev} | ${uploadFile.name}: ${errMsg}` : `Error on ${uploadFile.name}: ${errMsg}`)
        }
      } catch (err) {
        console.error("Upload failed for", uploadFile.name, err)
        setError(prev => prev ? `${prev} | ${uploadFile.name}: Network Error` : `Network error on ${uploadFile.name}`)
      }
      
      // Delay for 4 seconds between uploads to respect Gemini API free tier rate limits (15 RPM)
      if (i < filesToUpload.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 4000));
      }
    }
    
    setUploadProgress(null)
    if (successCount === filesToUpload.length) {
      setSuccessMsg(`Successfully extracted and parsed ${successCount} resumes!`)
      setTimeout(() => setSuccessMsg(null), 5000)
    } else {
      setError(prev => prev 
        ? `Successfully processed ${successCount} out of ${filesToUpload.length} resumes. Details: ${prev}` 
        : `Successfully processed ${successCount} out of ${filesToUpload.length} resumes. Some failed.`)
    }
  }

  // Apply Candidate to Job
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/applications`, {
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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Candidate Directory</h1>
        <p className="text-gray-500">Autonomous Bulk Processing Zone. Drop resumes below to auto-extract data.</p>
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

      {/* Bulk Upload Section */}
      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <h2 className="font-bold text-gray-800 mb-2">1. Select Job for Auto-Apply</h2>
          <select
            value={selectedJobIdForUpload}
            onChange={(e) => setSelectedJobIdForUpload(e.target.value)}
            className="w-full max-w-md p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none transition"
          >
            <option value="">-- Select an open position --</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          {!selectedJobIdForUpload && (
            <p className="text-sm text-red-500 mt-2">You must select a job before uploading resumes.</p>
          )}
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-2">2. Upload Resumes</h2>
          {/* Bulk Upload Dropzone */}
          <div 
            className={`border-2 border-dashed rounded-xl p-10 text-center transition ${!selectedJobIdForUpload ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' : isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white hover:bg-gray-50 cursor-pointer'}`}
            onDragOver={(e) => { e.preventDefault(); if (selectedJobIdForUpload) setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => { if (selectedJobIdForUpload) fileInputRef.current?.click() }}
          >
            <input 
              type="file" 
              multiple 
              accept=".zip,.pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              disabled={!selectedJobIdForUpload}
            />
            
            {uploadProgress ? (
              <div className="max-w-md mx-auto space-y-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold text-gray-900 text-lg">AI Parsing Resumes...</h3>
                <p className="text-sm text-gray-500">Extracting: {uploadProgress.currentFileName}</p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs font-semibold text-indigo-700">{uploadProgress.current} / {uploadProgress.total} completed</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="bg-indigo-100 p-4 rounded-full">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">Drag & Drop Resumes Here</p>
                  <p className="text-sm text-gray-500 mt-1">Upload a <span className="font-bold text-gray-700">.zip</span> file containing multiple PDFs, or select multiple <span className="font-bold text-gray-700">.pdf</span> files directly.</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); if (selectedJobIdForUpload) fileInputRef.current?.click() }}
                  disabled={!selectedJobIdForUpload}
                  className={`mt-4 px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg transition ${!selectedJobIdForUpload ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  Browse Files
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resume Parsing History */}
      {parsingJobs.length > 0 && (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-800">Resume Parsing History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b">
                <tr>
                  <th className="px-6 py-4">File</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {parsingJobs.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900 truncate max-w-[200px]" title={job.fileName}>{job.fileName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        job.status === 'COMPLETED' ? 'bg-green-600 text-white border border-green-700' :
                        job.status === 'FAILED' ? 'bg-red-600 text-white border border-red-700' :
                        job.status === 'PARSING' ? 'bg-blue-600 text-white border border-blue-700' :
                        'bg-gray-600 text-white border border-gray-700'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{job.progress !== null ? `${job.progress}%` : '—'}</td>
                    <td className="px-6 py-4 text-red-600 truncate max-w-[300px]" title={job.error || ''}>{job.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidate List */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-800">All Candidates ({candidates.length})</h2>
        </div>
        
        {pageLoading ? (
          <div className="p-12 text-center text-gray-500 animate-pulse">Loading candidates...</div>
        ) : (
          <div className="divide-y text-sm">
            {candidates.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No candidates found. Drop some resumes above to begin.</div>
            ) : (
              candidates.map((c) => {
                const hasResume = c.resumeUploaded || (c._count && c._count.resumes > 0);
                
                return (
                  <div key={c.id} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-50 transition">
                    <div>
                      <p className="font-bold text-gray-900 text-base">{c.firstName} {c.lastName}</p>
                      <p className="text-sm text-gray-500 mt-1">{c.email}</p>
                      {(c.phone || c.linkedinUrl) && (
                        <p className="text-xs text-gray-500 mt-2 flex gap-4">
                          {c.phone && <span>📞 {c.phone}</span>}
                          {c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" className="text-blue-600 hover:underline">🔗 LinkedIn</a>}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="flex items-center gap-3">
                        {hasResume ? (
                          <span className="inline-flex items-center gap-1 bg-green-600 text-white border border-green-700 text-xs px-2.5 py-1.5 rounded-md font-medium shadow-sm">
                            ✓ AI Parsed Resume
                          </span>
                        ) : (
                          <button
                            onClick={() => setApplyingCandidateId(applyingCandidateId === c.id ? null : c.id)}
                            className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-sm font-medium px-4 py-2 rounded-lg transition"
                          >
                            Apply to Job
                          </button>
                        )}
                      </div>
                      
                      {/* Job Apply Dropdown */}
                      {applyingCandidateId === c.id && (
                        <div className="mt-2 p-3 bg-white shadow-lg border rounded-xl flex items-center justify-between gap-3 min-w-[300px]">
                          <select
                            value={selectedJobId}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                            className="text-sm p-2 border rounded-lg flex-1 bg-gray-50"
                          >
                            <option value="">Select an open position...</option>
                            {jobs.map(job => (
                              <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleApplyToJob(c.id)}
                            disabled={!selectedJobId || isApplying}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-50 whitespace-nowrap"
                          >
                            {isApplying ? 'Applying...' : 'Confirm'}
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
  )
}