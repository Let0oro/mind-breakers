'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['web-dev'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const interests = [
    { id: 'web-dev', label: 'Web Dev', icon: 'code' },
    { id: 'data-science', label: 'Data Science', icon: 'database' },
    { id: 'digital-art', label: 'Digital Art', icon: 'brush' },
    { id: 'marketing', label: 'Marketing', icon: 'monitoring' },
    { id: 'ai-ml', label: 'AI/ML', icon: 'psychology' },
  ]

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

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
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-primary']

  const handleGoogleSignup = async () => {
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

  const handleGitHubSignup = async () => {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!fullName || !email || !username || !password || !confirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
          interests: selectedInterests,
        },
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user && !data.session) {
      setMessage('Account created! Check your email to confirm your account.')
    } else {
      router.push('/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div>

      <main className="flex-1 flex flex-col lg:flex-row mx-auto w-full min-h-screen bg-[#f6f7f8] dark:bg-[#101922]">
        {/* Sidebar: Benefits & Gamification */}
        <aside className="hidden lg:flex w-100 flex-col justify-between p-10 bg-white dark:bg-[#111418] border-r border-[#e5e7eb] dark:border-[#283039]">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">

              <h1 className="text-black dark:text-white text-3xl font-bold leading-tight">Unlock your potential.</h1>
              <p className="text-gray-600 dark:text-[#9dabb9] text-base leading-relaxed">Join 50,000+ learners building their future through community-driven paths and gamified challenges.</p>
            </div>
            <div className="flex flex-col gap-4">
              {/* Benefit 1 */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#283039] border border-transparent hover:border-[#137fec]/30 transition-all">
                <div className="size-10 rounded-full bg-[#137fec] flex items-center justify-center text-white shrink-0">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v12.5A2.25 2.25 0 003.75 18.5h12.5a2.25 2.25 0 002.25-2.25V9.5M6.5 6.5h7M6.5 10h4M6.5 13.5h7" />
                  </svg>
                </div>
                <div>
                  <p className="text-black dark:text-white text-sm font-bold">10k+ Learning Paths</p>
                  <p className="text-gray-500 dark:text-[#9dabb9] text-xs">User-generated curriculum for every skill</p>
                </div>
              </div>
              {/* Benefit 2 */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#283039] border border-transparent hover:border-[#137fec]/30 transition-all">
                <div className="size-10 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <p className="text-black dark:text-white text-sm font-bold">Earn XP & Badges</p>
                  <p className="text-gray-500 dark:text-[#9dabb9] text-xs">Get recognized for your consistency</p>
                </div>
              </div>
              {/* Benefit 3 */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#283039] border border-transparent hover:border-[#137fec]/30 transition-all">
                <div className="size-10 rounded-full bg-purple-500 flex items-center justify-center text-white shrink-0">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v4h8v-4zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <div>
                  <p className="text-black dark:text-white text-sm font-bold">Global Leaderboard</p>
                  <p className="text-gray-500 dark:text-[#9dabb9] text-xs">Compete with learners worldwide</p>
                </div>
              </div>
            </div>
          </div>
          {/* Mini Leaderboard Preview */}
          <div className="mt-10 p-4 bg-[#137fec]/5 rounded-xl border border-[#137fec]/10">
            <p className="text-xs font-bold text-[#137fec] uppercase tracking-wider mb-3">Community Spotlight</p>
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-cover bg-center border-2 border-white dark:border-gray-800 shadow-sm bg-[url('https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah')]"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold dark:text-white truncate">Sarah Jenkins</p>
                <p className="text-[10px] text-gray-500 truncate">Just reached Level 42 • UI Design</p>
              </div>
              <span className="text-xs font-bold text-[#137fec] shrink-0">+250 XP</span>
            </div>
          </div>
        </aside>

        {/* Registration Form Area */}
        <section className="flex-1 flex flex-col items-center py-10 px-6 lg:px-20 overflow-y-auto">
          <div className="max-w-150 w-full">
            {/* Progress Bar */}
            <div className="flex flex-col gap-3 mb-8">
              <div className="flex justify-between items-end">
                <p className="text-black dark:text-white text-sm font-semibold">Step 1 of 2: Account Details</p>
                <p className="text-[#137fec] text-sm font-bold">50%</p>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-[#3b4754] overflow-hidden">
                <div className="h-full bg-[#137fec] transition-all duration-500 w-1/2"></div>
              </div>
            </div>

            {/* Headline */}
            <div className="mb-8">
              <h2 className="text-black dark:text-white text-3xl font-bold mb-2">Create your account</h2>
              <p className="text-gray-600 dark:text-[#9dabb9] text-base">Enter your details to start your learning journey.</p>
            </div>

            {/* Social Sign Up */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                type="button"
                onClick={handleGoogleSignup}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 dark:border-[#283039] bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-[#1c242c] transition-all"
              >
                <svg className="size-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-sm font-bold dark:text-white">Google</span>
              </button>
              <button
                type="button"
                onClick={handleGitHubSignup}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 dark:border-[#283039] bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-[#1c242c] transition-all"
              >
                <svg className="size-5 dark:fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                <span className="text-sm font-bold dark:text-white">GitHub</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-[#283039]"></div>
              </div>
              <span className="relative bg-[#f6f7f8] dark:bg-[#101922] px-4 text-xs font-medium text-gray-500 uppercase tracking-widest">Or continue with email</span>
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
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-black dark:text-white px-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-[#283039] bg-white dark:bg-[#1c242c] text-black dark:text-white focus:ring-2 focus:ring-[#137fec] focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                  placeholder="Alex Rivera"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-black dark:text-white px-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-[#283039] bg-white dark:bg-[#1c242c] text-black dark:text-white focus:ring-2 focus:ring-[#137fec] focus:border-transparent outline-none placeholder:text-gray-400"
                    placeholder="alex@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-black dark:text-white px-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-[#283039] bg-white dark:bg-[#1c242c] text-black dark:text-white focus:ring-2 focus:ring-[#137fec] focus:border-transparent outline-none placeholder:text-gray-400"
                    placeholder="arivera_codes"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-black dark:text-white px-1">Password</label>
                  <span className={`text-[10px] font-bold uppercase ${passwordStrength > 0 ? `text-${strengthColors[passwordStrength].split('-')[1]}-500` : 'text-gray-400'}`}>
                    {strengthLabels[passwordStrength] || 'Enter password'}
                  </span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-[#283039] bg-white dark:bg-[#1c242c] text-black dark:text-white focus:ring-2 focus:ring-[#137fec] focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
                {/* Password Strength Bar */}
                <div className="flex gap-1 px-1 mt-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-black dark:text-white px-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-[#283039] bg-white dark:bg-[#1c242c] text-black dark:text-white focus:ring-2 focus:ring-[#137fec] focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="mt-4 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-black dark:text-white px-1">Tell us your interests</h3>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => toggleInterest(interest.id)}
                      className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 transition-all ${selectedInterests.includes(interest.id)
                        ? 'border-[#137fec] bg-[#137fec]/10 text-[#137fec]'
                        : 'border-gray-200 dark:border-[#283039] text-gray-600 dark:text-[#9dabb9] hover:border-[#137fec]/50'
                        }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        {interest.id === 'web-dev' && <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 12a1 1 0 001 1h12a1 1 0 001-1v-2a1 1 0 00-1-1H4a1 1 0 00-1 1v2z" />}
                        {interest.id === 'data-science' && <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 12a1 1 0 001 1h12a1 1 0 001-1v-2a1 1 0 00-1-1H4a1 1 0 00-1 1v2z" />}
                        {interest.id === 'digital-art' && <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 12a1 1 0 001 1h12a1 1 0 001-1v-2a1 1 0 00-1-1H4a1 1 0 00-1 1v2z" />}
                        {interest.id === 'marketing' && <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 12a1 1 0 001 1h12a1 1 0 001-1v-2a1 1 0 00-1-1H4a1 1 0 00-1 1v2z" />}
                        {interest.id === 'ai-ml' && <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 12a1 1 0 001 1h12a1 1 0 001-1v-2a1 1 0 00-1-1H4a1 1 0 00-1 1v2z" />}
                      </svg>
                      {interest.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-[#137fec] hover:bg-[#137fec]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-[#137fec]/20 transition-all active:scale-[0.98]"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                  By signing up, you agree to our
                  <Link className="text-[#137fec] hover:underline ml-1" href="#">Terms of Service</Link> and
                  <Link className="text-[#137fec] hover:underline ml-1" href="#">Privacy Policy</Link>.
                </p>
              </div>

              <div className="text-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
                <Link href="/login" className="font-bold text-[#137fec] hover:underline">
                  Log In
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}
