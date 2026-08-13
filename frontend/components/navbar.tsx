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
    <header style={{ backgroundColor: '#151c2c', borderBottom: '1px solid #2a364f', color: '#ffffff' }} className="flex justify-between items-center px-6 py-4 shadow-md">
      <div className="flex items-center gap-8">
        <Link href="/" style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.2rem', textDecoration: 'none' }} className="flex items-center gap-2">
          <span>🤖</span> AI Recruitment
        </Link>
        <nav className="hidden md:flex gap-2 text-sm font-medium">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                style={isActive
                  ? { backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: 700 }
                  : { color: '#cbd5e1' }
                }
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-150 ${
                  !isActive ? 'hover:bg-slate-800' : ''
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
          <div className="h-8 w-8 rounded-full bg-slate-700 animate-pulse" />
        ) : !isSignedIn ? (
          <SignInButton mode="modal">
            <button style={{ backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: 700 }} className="px-4 py-2 rounded-xl text-sm transition shadow-sm hover:opacity-90">
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