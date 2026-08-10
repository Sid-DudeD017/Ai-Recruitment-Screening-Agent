'use client'

import React, { useState } from 'react'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  department: string
  location: string
  status: string
}

export default function JobsPage() {
  const [jobs] = useState<Job[]>([
    {
      id: '1',
      title: 'Senior Frontend Engineer',
      department: 'Engineering',
      location: 'Remote',
      status: 'OPEN',
    },
    {
      id: '2',
      title: 'Product Designer',
      department: 'Design',
      location: 'New York, NY',
      status: 'OPEN',
    },
  ])

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

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500">
            <tr>
              <th className="p-4">Job Title</th>
              <th className="p-4">Department</th>
              <th className="p-4">Location</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-semibold text-gray-900">{job.title}</td>
                <td className="p-4">{job.department}</td>
                <td className="p-4">{job.location}</td>
                <td className="p-4">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {job.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}