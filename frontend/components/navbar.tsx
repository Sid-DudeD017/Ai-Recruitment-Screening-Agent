'use client'

import { SignInButton, UserButton, useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { isSignedIn, isLoaded } = useAuth()
  const pathname = usePathname()

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Jobs', href: '/jobs' },
    { name: 'Candidates', href: '/candidates' },
    { name: 'Pipeline', href: '/applications' },
    { name: 'Interviews & Email', href: '/interviews' },
  ]

  return (
    <header className="flex justify-between items-center p-4 border-b bg-white shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" className="font-bold text-xl text-gray-800">
          AI Recruitment
        </Link>
        <nav className="hidden md:flex gap-2 text-sm font-medium">
          {navItems.map((item) => {
            // Check if link is active (exact match for home, startsWith for subroutes like /jobs/create)
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div>
        {!isLoaded ? (
          <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
        ) : !isSignedIn ? (
          <SignInButton mode="modal">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm transition">
              Sign In
            </button>
          </SignInButton>
        ) : (
          <UserButton />
        )}
      </div>
    </header>
  )
}