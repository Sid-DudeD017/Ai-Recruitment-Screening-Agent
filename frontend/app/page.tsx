'use client'

import React, { useEffect, useState } from 'react'

interface Stats {
  totalJobs: number
  openJobs: number
  totalCandidates: number
  applicationsThisMonth: number
  upcomingInterviews: number
  hiredThisMonth: number
}

interface PipelineStage {
  status: string
  count: number
}

interface ActivityItem {
  id: string
  action: string
  timestamp: string
  user: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [pipeline, setPipeline] = useState<PipelineStage[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mocking initial responses; hook up fetchApi('/api/dashboard/stats') here when backend is ready
    setTimeout(() => {
      setStats({
        totalJobs: 12,
        openJobs: 5,
        totalCandidates: 148,
        applicationsThisMonth: 34,
        upcomingInterviews: 6,
        hiredThisMonth: 3,
      })

      setPipeline([
        { status: 'APPLIED', count: 42 },
        { status: 'SHORTLISTED', count: 18 },
        { status: 'INTERVIEW', count: 8 },
        { status: 'OFFER', count: 4 },
        { status: 'HIRED', count: 3 },
      ])

      setActivities([
        { id: '1', action: 'Uploaded resume for John Doe', timestamp: '10 mins ago', user: 'Recruiter Alex' },
        { id: '2', action: 'Ran AI Bias Check on "Senior React Dev"', timestamp: '1 hour ago', user: 'Sarah' },
        { id: '3', action: 'Scheduled interview with Jane Smith', timestamp: '3 hours ago', user: 'Recruiter Alex' },
      ])

      setLoading(false)
    }, 400)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recruitment Dashboard</h1>
        <p className="text-gray-500">Real-time overview of candidate applications, AI evaluations, and interviews.</p>
      </div>

      {/* 1. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <StatCard title="Total Jobs" value={stats?.totalJobs} subtitle={`${stats?.openJobs} open openings`} />
        <StatCard title="Total Candidates" value={stats?.totalCandidates} subtitle="In talent pool" />
        <StatCard title="Applications" value={stats?.applicationsThisMonth} subtitle="Received this month" />
        <StatCard title="Upcoming Interviews" value={stats?.upcomingInterviews} subtitle="Scheduled" />
        <StatCard title="Hired Candidates" value={stats?.hiredThisMonth} subtitle="Joined this month" />
        <StatCard title="Active Openings" value={stats?.openJobs} subtitle="Ready for candidate screening" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Pipeline Overview */}
        <div className="lg:col-span-2 bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Application Pipeline Funnel</h2>
          <div className="space-y-3">
            {pipeline.map((item) => (
              <div key={item.status} className="space-y-1">
                <div className="flex justify-between text-sm font-medium text-gray-600">
                  <span>{item.status}</span>
                  <span>{item.count} Candidates</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(item.count * 2, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Recent Activity Stream */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
          <div className="divide-y text-sm">
            {activities.map((act) => (
              <div key={act.id} className="py-3 first:pt-0 last:pb-0">
                <p className="font-medium text-gray-800">{act.action}</p>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{act.user}</span>
                  <span>{act.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle }: { title: string; value?: number; subtitle: string }) {
  return (
    <div className="bg-white border p-6 rounded-xl shadow-sm space-y-2">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-extrabold text-gray-900">{value ?? 0}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  )
}