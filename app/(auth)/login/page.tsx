'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'


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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

    const { error } = await supabase.auth.signInWithPassword({
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
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-[.99rem] relative overflow-hidden bg-sidebar dark:bg-sidebar">
      {/* Abstract Background Decorative Elements */}
      <div className="w-full max-w-120 border border-border p-8">
        {/* Headline and Subtext */}
        <h1 className="text-text-main tracking-tight text-3xl font-bold leading-tight text-center pb-2">Welcome back</h1>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-xs bg-red-500/20 border border-red-500/30 p-4">
              <p className="text-red-500 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-main px-1">Email Address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-xs border border-border dark:border-border bg-main dark:bg-color-input text-black dark:text-text-main focus:ring-2 focus:ring-ring focus:border-transparent outline-none placeholder:text-muted"
              placeholder="name@company.com"
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-text-main text-sm font-medium leading-normal">Password</p>
              <a className="text-text-main text-sm font-semibold hover:underline" href="/forgot-password">Forgot password?</a>
            </div>
            <label className="flex flex-col">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted dark:text-muted w-5 h-5" >
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
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xs text-text-main dark:text-text-main focus:outline-0 focus:ring-2 focus:ring-ring/50 border border-border dark:border-border bg-surface dark:bg-main h-14 placeholder:text-muted dark:placeholder:text-muted pl-12 pr-4 text-base font-normal leading-normal"
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
              className="w-5 h-5 rounded border-border dark:border-border text-brand focus:ring-ring dark:bg-main"
            />
            <label className="text-sm text-muted dark:text-muted font-medium cursor-pointer" htmlFor="remember">Remember me for 30 days</label>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-auto py-3 bg-inverse hover:bg-inverse/90 text-main-alt disabled:opacity-50 disabled:cursor-not-allowed rounded-xs font-bold text-lg transition-all active:scale-[0.98]"
          >
            <span>{loading ? 'Logging in...' : 'Log In to MindBreaker'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex py-4 items-center">
            <div className="grow border-t border-border dark:border-border"></div>
            <span className="shrink mx-4 text-muted dark:text-muted text-xs font-semibold uppercase tracking-widest">Or login with</span>
            <div className="grow border-t border-border dark:border-border"></div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 h-12 rounded-xs border border-border dark:border-border bg-main dark:bg-transparent text-text-main text-sm font-semibold hover:bg-surface dark:hover:bg-surface-dark transition-colors"
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
              className="flex items-center justify-center gap-2 h-12 rounded-xs border border-border dark:border-border bg-main dark:bg-transparent text-text-main text-sm font-semibold hover:bg-surface dark:hover:bg-surface-dark transition-colors"
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
          <p className="text-muted dark:text-muted text-sm">
            {"Don't have an account yet?"}
            <a className="text-brand font-bold hover:underline ml-1" href="/register">Join the community</a>
          </p>
        </div>
      </div>

    </main>
  )
}
