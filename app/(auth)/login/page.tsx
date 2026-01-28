'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // Load saved email on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('MindBreaker_email')
      const rememberMeWasChecked = localStorage.getItem('MindBreaker_remember')

      if (savedEmail && rememberMeWasChecked === 'true') {
        setEmail(savedEmail)
        setRememberMe(true)
      }
    }
  }, [])

  // Save email if remember me is checked
  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(e.target.checked)
    if (e.target.checked) {
      localStorage.setItem('MindBreaker_email', email)
      localStorage.setItem('MindBreaker_remember', 'true')
    } else {
      localStorage.removeItem('MindBreaker_email')
      localStorage.removeItem('MindBreaker_remember')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    }
  }

  const handleGitHubLogin = async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    }
  }

  return (
    <div>
      {/* Top Navigation Bar */}


      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden min-h-screen bg-[#f6f7f8] dark:bg-[#101922]">
        {/* Abstract Background Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#137fec]/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#137fec]/5 rounded-full blur-3xl -z-10"></div>

        <div className="w-full max-w-120 bg-white dark:bg-[#1c2127] rounded-xl shadow-2xl border border-gray-100 dark:border-[#3b4754] p-8 md:p-10">
          {/* Headline and Subtext */}
          <div className="flex flex-col items-center mb-8">
            <div className="size-12 bg-[#137fec]/20 flex items-center justify-center rounded-full mb-4">
              <span className='text-3xl material-symbols-outlined text-[#137fec]'>info</span>
            </div>
            <h1 className="text-gray-900 dark:text-white tracking-tight text-3xl font-bold leading-tight text-center pb-2">Welcome back</h1>
            <p className="text-gray-600 dark:text-[#b0bfcc] text-base font-normal leading-normal text-center">Enter your details to continue your educational journey.</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-4">
                <p className="text-red-500 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="flex flex-col">
                <p className="text-gray-700 dark:text-white text-sm font-medium leading-normal pb-2">Email Address</p>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#b0bfcc] w-5 h-5" >
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-gray-300 dark:border-[#3b4754] bg-gray-50 dark:bg-[#111418] h-14 placeholder:text-gray-400 dark:placeholder:text-[#b0bfcc] pl-12 pr-4 text-base font-normal leading-normal"
                  />
                </div>
              </label>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <p className="text-gray-700 dark:text-white text-sm font-medium leading-normal">Password</p>
                <a className="text-[#137fec] text-sm font-semibold hover:underline" href="/forgot-password">Forgot password?</a>
              </div>
              <label className="flex flex-col">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#b0bfcc] w-5 h-5" >
                    lock
                  </span>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-gray-300 dark:border-[#3b4754] bg-gray-50 dark:bg-[#111418] h-14 placeholder:text-gray-400 dark:placeholder:text-[#b0bfcc] pl-12 pr-4 text-base font-normal leading-normal"
                  />
                </div>
              </label>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                className="w-5 h-5 rounded border-gray-300 dark:border-[#3b4754] text-[#137fec] focus:ring-[#137fec] dark:bg-[#111418]"
              />
              <label className="text-sm text-gray-600 dark:text-[#b0bfcc] font-medium cursor-pointer" htmlFor="remember">Remember me for 30 days</label>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-4 bg-[#137fec] text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#137fec]/90 shadow-lg shadow-[#137fec]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Logging in...' : 'Log In to MindBreaker'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex py-4 items-center">
              <div className="grow border-t border-gray-200 dark:border-[#3b4754]"></div>
              <span className="shrink mx-4 text-gray-400 dark:text-[#b0bfcc] text-xs font-semibold uppercase tracking-widest">Or login with</span>
              <div className="grow border-t border-gray-200 dark:border-[#3b4754]"></div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 h-12 rounded-lg border border-gray-300 dark:border-[#3b4754] bg-white dark:bg-transparent text-gray-700 dark:text-white text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={handleGitHubLogin}
                className="flex items-center justify-center gap-2 h-12 rounded-lg border border-gray-300 dark:border-[#3b4754] bg-white dark:bg-transparent text-gray-700 dark:text-white text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                GitHub
              </button>
            </div>
          </form>

          {/* Footer Action */}
          <div className="mt-10 text-center">
            <p className="text-gray-600 dark:text-[#b0bfcc] text-sm">
              {"Don't have an account yet?"}
              <a className="text-[#137fec] font-bold hover:underline ml-1" href="/register">Join the community</a>
            </p>
          </div>
        </div>

        {/* Visual Elements representing Learning Paths */}
        <div className="mt-12 flex items-center gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex flex-col items-center">
            <div className="p-3 bg-white dark:bg-[#1c2127] rounded-lg shadow-sm mb-2 border border-gray-100 dark:border-[#3b4754]">
              <span className="material-symbols-outlined w-6 h-6 text-[#137fec]">check_circle</span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">Machine Learning</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-3 bg-white dark:bg-[#1c2127] rounded-lg shadow-sm mb-2 border border-gray-100 dark:border-[#3b4754]">
              <svg className="w-6 h-6 text-[#137fec]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">UI/UX Design</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-3 bg-white dark:bg-[#1c2127] rounded-lg shadow-sm mb-2 border border-gray-100 dark:border-[#3b4754]">
              <svg className="w-6 h-6 text-[#137fec]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">Web Development</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 dark:text-gray-600 border-t border-gray-200 dark:border-[#283039] bg-white dark:bg-[#101922]">
        <p>© 2024 MindBreaker Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <a className="hover:text-[#137fec] transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-[#137fec] transition-colors" href="#">Terms of Service</a>
          <a className="hover:text-[#137fec] transition-colors" href="#">Help Center</a>
        </div>
      </footer>
    </div>
  )
}
