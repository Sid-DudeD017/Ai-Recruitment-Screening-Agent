'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface Stats {
  jobs: { total: number; open: number; closed: number; draft: number };
  candidates: { total: number };
  applications: { total: number; thisMonth: number };
  interviews: { upcoming: number };
  hired: { thisMonth: number };
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
  const [error, setError] = useState<string | null>(null)

  const { getToken } = useAuth()

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        const token = await getToken()
        
        if (!token) {
          setError('Authentication required')
          return
        }

        const headers = {
          'Authorization': `Bearer ${token}`
        }
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'

        const [statsRes, pipelineRes, activitiesRes] = await Promise.all([
          fetch(`${baseUrl}/dashboard/stats`, { headers }),
          fetch(`${baseUrl}/dashboard/pipeline`, { headers }),
          fetch(`${baseUrl}/dashboard/activity`, { headers })
        ])

        if (!statsRes.ok || !pipelineRes.ok || !activitiesRes.ok) {
          throw new Error(`Failed to fetch dashboard data. Stats: ${statsRes.status}, Pipeline: ${pipelineRes.status}, Activities: ${activitiesRes.status}`)
        }

        const [statsData, pipelineData, activitiesData] = await Promise.all([
          statsRes.json(),
          pipelineRes.json(),
          activitiesRes.json()
        ])

        setStats(statsData.data)
        setPipeline(pipelineData.data)
        setActivities(activitiesData.data)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()

    const handleRefresh = () => {
      fetchDashboardData()
    }
    
    window.addEventListener('refresh-kanban', handleRefresh)
    return () => window.removeEventListener('refresh-kanban', handleRefresh)
  }, [getToken])

  if (error) {
    if (error === 'Authentication required') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Welcome to AI Recruitment!</h2>
          <p className="text-gray-500">Please sign in using the button in the top right to view your dashboard.</p>
        </div>
      )
    }
    
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 m-8 max-w-4xl">
        <h2 className="font-bold">Error Loading Dashboard</h2>
        <p>{error}</p>
      </div>
    )
  }

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
        <StatCard title="Total Jobs" value={stats?.jobs?.total} subtitle={`${stats?.jobs?.open} open openings`} />
        <StatCard title="Total Candidates" value={stats?.candidates?.total} subtitle="In talent pool" />
        <StatCard title="Applications" value={stats?.applications?.thisMonth} subtitle="Received this month" />
        <StatCard title="Upcoming Interviews" value={stats?.interviews?.upcoming} subtitle="Scheduled" />
        <StatCard title="Hired Candidates" value={stats?.hired?.thisMonth} subtitle="Joined this month" />
        <StatCard title="Active Openings" value={stats?.jobs?.open} subtitle="Ready for candidate screening" />
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