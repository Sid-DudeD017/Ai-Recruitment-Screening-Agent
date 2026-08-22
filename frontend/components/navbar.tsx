'use client'

import { SignInButton, UserButton, useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const { isSignedIn, isLoaded } = useAuth()
  const pathname = usePathname()
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const initialTheme = savedTheme || 'dark'
    setTheme(initialTheme)
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Jobs', href: '/jobs' },
    { name: 'Candidates', href: '/candidates' },
    { name: 'Pipeline', href: '/applications' },
    { name: 'Interviews & Email', href: '/interviews' },
    { name: 'Tutorial', href: '/tutorial' },
  ]

  return (
    <header style={{ backgroundColor: 'var(--card)', borderBottom: '1px solid var(--card-border)', color: 'var(--foreground)' }} className="flex justify-between items-center px-6 py-4 shadow-md">
      <div className="flex items-center gap-8">
        <Link href="/" style={{ color: 'var(--foreground)', fontWeight: 800, fontSize: '1.2rem', textDecoration: 'none' }} className="flex items-center gap-2">
          AI Recruitment
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
                  : { color: 'var(--foreground)' }
                }
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-150 ${
                  !isActive ? 'hover:bg-slate-200 dark:hover:bg-slate-800' : ''
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          style={{ border: '1px solid var(--card-border)', transition: 'background-color 0.15s' }}
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

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