import { ClerkProvider } from '@clerk/nextjs'
import Navbar from '@/components/navbar'
import React from 'react'
import './globals.css'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-gray-50 min-h-screen text-gray-900">
          <Navbar />
          <main className="max-w-7xl mx-auto p-6">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  )
}
