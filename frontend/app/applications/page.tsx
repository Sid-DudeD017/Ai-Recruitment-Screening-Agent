'use client'

import React, { useState } from 'react'

interface Application {
  id: string
  candidateName: string
  jobTitle: string
  status: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'HIRED'
  matchScore?: number
  matchAnalysis?: string
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([
    {
      id: 'app-1',
      candidateName: 'Sarah Jenkins',
      jobTitle: 'Senior Frontend Engineer',
      status: 'APPLIED',
    },
    {
      id: 'app-2',
      candidateName: 'Alex Rivera',
      jobTitle: 'Senior Frontend Engineer',
      status: 'SCREENING',
      matchScore: 88,
      matchAnalysis: 'Strong React and Next.js background. Matches 8/10 core skills.',
    },
    {
      id: 'app-3',
      candidateName: 'David Chen',
      jobTitle: 'Product Designer',
      status: 'INTERVIEW',
    },
  ])

  const [loadingMatch, setLoadingMatch] = useState<string | null>(null)
  const [ranking, setRanking] = useState(false)

  // AI Feature: Match individual candidate (POST /api/ai/match)
  const handleAIMatch = async (appId: string) => {
    setLoadingMatch(appId)

    // Simulate API call
    setTimeout(() => {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId
            ? {
                ...app,
                matchScore: 92,
                matchAnalysis:
                  'Excellent fit! Strong modern frontend architecture skills and 5+ years of relevant experience.',
              }
            : app
        )
      )
      setLoadingMatch(null)
    }, 1200)
  }

  // AI Feature: Rank all candidates (POST /api/ai/rank)
  const handleRankAll = async () => {
    setRanking(true)

    // Simulate ranking execution
    setTimeout(() => {
      setApplications((prev) =>
        prev.map((app, index) => ({
          ...app,
          matchScore: 95 - index * 7,
          matchAnalysis: `Rank #${index + 1}: High alignment with job requirements.`,
        }))
      )
      setRanking(false)
    }, 1500)
  }

  const columns: Application['status'][] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'HIRED']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Application Pipeline</h1>
          <p className="text-gray-500">Track candidates and run AI evaluation matching.</p>
        </div>

        <button
          onClick={handleRankAll}
          disabled={ranking}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 disabled:opacity-50"
        >
          {ranking ? 'Ranking...' : '✨ AI Rank All Candidates'}
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colApps = applications.filter((a) => a.status === col)

          return (
            <div key={col} className="bg-gray-100 rounded-xl p-4 space-y-3 min-h-[500px]">
              <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase">
                <span>{col}</span>
                <span className="bg-gray-200 px-2 py-0.5 rounded-full">{colApps.length}</span>
              </div>

              <div className="space-y-3">
                {colApps.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white p-4 rounded-lg border shadow-sm space-y-3 hover:shadow-md transition"
                  >
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{app.candidateName}</h3>
                      <p className="text-xs text-gray-500">{app.jobTitle}</p>
                    </div>

                    {/* Match Score Badge */}
                    {app.matchScore !== undefined ? (
                      <div className="p-2 bg-green-50 border border-green-200 rounded-md space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-green-800">AI Match Score</span>
                          <span className="text-xs font-extrabold text-green-700">{app.matchScore}%</span>
                        </div>
                        {app.matchAnalysis && (
                          <p className="text-[11px] text-green-900 leading-tight">{app.matchAnalysis}</p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAIMatch(app.id)}
                        disabled={loadingMatch === app.id}
                        className="w-full text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 py-1.5 rounded font-medium transition"
                      >
                        {loadingMatch === app.id ? 'Evaluating...' : '✨ Run AI Match'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}