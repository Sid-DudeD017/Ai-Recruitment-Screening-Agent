'use client'

import React, { useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
  resumeUploaded: boolean
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah.j@example.com',
      resumeUploaded: true,
    },
  ])

  // Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const { getToken } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)

  // 1. Add Candidate (POST /api/candidates)
  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !lastName || !email) return

    const newCandidate: Candidate = {
      id: Date.now().toString(),
      firstName,
      lastName,
      email,
      resumeUploaded: false,
    }

    setCandidates((prev) => [...prev, newCandidate])
    setFirstName('')
    setLastName('')
    setEmail('')
  }

  // 2. Upload Resume PDF (POST /api/candidates/:id/resume)
  const handleResumeUpload = async (candidateId: string) => {
    // 1. Create a hidden file input element dynamically
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    
    // 2. Listen for the user selecting a file
    fileInput.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setLoading(true);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const token = await getToken();
        
        // POST to the Next.js backend, which will forward to Python
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
        
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidateId ? { ...c, resumeUploaded: true } : c))
        );
        
        setActivities((prev) => [
          {
            id: Date.now().toString(),
            action: `Uploaded and parsed resume for ${candidates.find(c => c.id === candidateId)?.firstName} ${candidates.find(c => c.id === candidateId)?.lastName}`,
            timestamp: 'Just now',
            user: 'You',
          },
          ...prev,
        ]);
        alert('Resume uploaded successfully! AI extraction complete.');
      } catch (error) {
        console.error(error);
        alert('Error uploading resume. Check console.');
      } finally {
        setLoading(false);
      }
    };
    
    // 3. Trigger the file browser
    fileInput.click();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Candidate Directory</h1>
        <p className="text-gray-500">Add candidates manually and upload PDF resumes for AI processing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Add Candidate Form */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
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
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition"
            >
              Add Candidate
            </button>
          </form>
        </div>

        {/* Right: Candidate List & Drag-and-Drop Resume Uploader */}
        <div className="lg:col-span-2 bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-800">All Candidates</h2>
          </div>
          <div className="divide-y text-sm">
            {candidates.map((c) => (
              <div key={c.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-gray-500">{c.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  {c.resumeUploaded ? (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs px-2.5 py-1 rounded-md font-medium">
                      ✓ AI Parsed Resume
                    </span>
                  ) : (
                    <button
                      onClick={() => setSelectedCandidate(selectedCandidate === c.id ? null : c.id)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium px-3 py-1.5 rounded-md transition"
                    >
                      + Upload Resume
                    </button>
                  )}
                </div>

                {/* File Upload Dropdown */}
                {selectedCandidate === c.id && (
                  <div className="w-full sm:col-span-2 mt-2 p-3 bg-gray-50 border border-dashed rounded-lg flex items-center justify-between gap-3">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="text-xs"
                    />
                    <button
                      onClick={() => handleResumeUpload(c.id)}
                      disabled={!selectedFile || loading}
                      className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded font-medium disabled:opacity-50"
                    >
                      {loading ? 'AI Parsing...' : 'Submit PDF'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}