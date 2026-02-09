'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['web-dev'])
  const [loading, setLoading] = useState({ google: false, github: false, email: false })
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[^a-zA-Z\d]/.test(pwd)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(password)
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-inverse']

  const handleGoogleSignup = async () => {
    setError(null)
    setLoading(prev => ({ ...prev, google: true }))
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(prev => ({ ...prev, google: false }))
    }
  }

  const handleGitHubSignup = async () => {
    setError(null)
    setLoading(prev => ({ ...prev, github: true }))
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(prev => ({ ...prev, github: false }))
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(prev => ({ ...prev, email: true }))
    setError(null)
    setMessage(null)

    if (!email || !username || !password || !confirmPassword) {
      setError('Please fill in all fields')
      setLoading(prev => ({ ...prev, email: false }))
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(prev => ({ ...prev, email: false }))
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(prev => ({ ...prev, email: false }))
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          interests: selectedInterests,
        },
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(prev => ({ ...prev, email: false }))
      return
    }

    if (data.user && !data.session) {
      setMessage('Account created! Check your email to confirm your account.')
    } else {
      router.push('/guild-hall')
      router.refresh()
    }

    setLoading(prev => ({ ...prev, email: false }))
  }

  return (

    <main className="flex-1 flex flex-col lg:flex-row mx-auto w-full bg-sidebar">

      {/* Registration Form Area */}
      <section className="flex-1 flex flex-col items-center py-5 px-6 lg:px-20 overflow-y-auto">
        <div className="max-w-150 w-auto border border-border p-6 relative">

          {/* Headline */}
          <div className="mb-4">
            <h2 className="text-black dark:text-text-main text-3xl font-bold mb-2">Create your account</h2>
          </div>

          {/* Error & Message */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-500/20 border border-red-500/30 p-4">
              <p className="text-red-500 text-sm font-medium">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-6 rounded-lg bg-green-500/20 border border-green-500/30 p-4">
              <p className="text-green-500 text-sm font-medium">{message}</p>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleRegister} className="flex flex-col gap-5">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-black dark:text-text-main px-1">Username</label>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 px-4 rounded-xs border border-border dark:border-border bg-main dark:bg-surface text-black dark:text-text-main focus:ring-2 focus:ring-ring focus:border-transparent outline-none placeholder:text-muted"
                  placeholder="arivera_codes"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-black dark:text-text-main px-1">Email Address</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-xs border border-border dark:border-border bg-main dark:bg-surface text-black dark:text-text-main focus:ring-2 focus:ring-ring focus:border-transparent outline-none placeholder:text-muted"
                  placeholder="alex@example.com"
                />
              </div>

            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <label className="text-sm font-bold text-black dark:text-text-main px-1">Password</label>
              </div>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-xs border border-border dark:border-border bg-main dark:bg-surface text-black dark:text-text-main focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
                placeholder="••••••••"
              />
              {/* Password Strength Bar */}
              <div className="flex gap-1 px-1 mt-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-main-dark dark:bg-gray-700'
                      }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-black dark:text-text-main px-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-xs border border-border dark:border-border bg-main dark:bg-surface text-black dark:text-text-main focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>


            <div className="mt-4 flex flex-col gap-4">
              <button
                type="submit"
                disabled={loading.email || loading.google || loading.github}
                className="w-full h-auto py-3 bg-inverse hover:bg-inverse/90 text-main-alt disabled:opacity-50 disabled:cursor-not-allowed rounded-xs font-bold text-lg transition-all active:scale-[0.98] flex items-center justify-center"
              >
                {loading.email ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                ) : (
                  'Enter Platform'
                )}
              </button>

            </div>

            {/* Social Sign Up */}
            <div className="grid grid-cols-2 gap-4 mb-2">
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading.email || loading.google || loading.github}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xs border border-border dark:border-border bg-main dark:bg-transparent hover:bg-surface dark:hover:bg-surface transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading.google ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-inverse border-t-transparent" />
                ) : (
                  <>
                    <svg className="size-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-sm font-bold text-text-main">Google</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleGitHubSignup}
                disabled={loading.email || loading.google || loading.github}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xs border border-border dark:border-border bg-main dark:bg-transparent hover:bg-surface dark:hover:bg-surface transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading.github ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-inverse border-t-transparent" />
                ) : (
                  <>
                    <svg className="size-5 dark:fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                    <span className="text-sm font-bold text-text-main">GitHub</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-center text-xs text-muted dark:text-muted">
              By signing up, you agree to our
              <Link className="text-brand hover:underline ml-1" href="#">Terms of Service</Link> and
              <Link className="text-brand hover:underline ml-1" href="#">Privacy Policy</Link>.
            </p>

            <div className="text-center text-sm">
              <span className="text-muted dark:text-muted">Already have an account? </span>
              <Link href="/login" className="font-bold text-brand hover:underline">
                Log In
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
