import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Breadcrumb from '@/components/breadcrumb'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/login')

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="dark flex h-screen overflow-hidden bg-[#101922]">
            <style>{`
        :root {
          --primary: #137fec;
          --background-light: #f6f7f8;
          --background-dark: #101922;
        }
      `}</style>

            {/* Side Navigation */}
            <aside className="w-64 flex flex-col justify-between border-r border-[#3b4754] bg-[#f6f7f8] dark:bg-[#101922] p-4">
                <div className="flex flex-col gap-8">
                    {/* User Profile */}
                    <div className="flex items-center gap-3 px-2">
                        <div className="h-10 w-10 rounded-full bg-cover bg-center border-2 border-[#137fec]" style={{ backgroundImage: `url("https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}")` }} />
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold text-black dark:text-white truncate">{profile?.username || user.email}</h1>
                            <p className="text-[#9dabb9] text-xs">Scholar • Lvl {profile?.level || 1}</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-1">
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#283039] text-white" href="/dashboard">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M10.5 19.5h3v3h-3v-3zm6-12h3v12h-3v-12zm-9 6h3v6H7.5v-6zm-6-6h3v12h-3v-12z" />
                            </svg>
                            <span className="text-sm font-medium">Home</span>
                        </Link>
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/explore">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                            </svg>
                            <span className="text-sm font-medium">Explore</span>
                        </Link>
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/courses">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z" />
                            </svg>
                            <span className="text-sm font-medium">Courses</span>
                        </Link>
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/paths">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
                            </svg>
                            <span className="text-sm font-medium">Learning Paths</span>
                        </Link>
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/exercises">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                            </svg>
                            <span className="text-sm font-medium">Exercises</span>
                        </Link>
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/leaderboard">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <span className="text-sm font-medium">Leaderboard</span>
                        </Link>
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/organizations">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                            <span className="text-sm font-medium">Organizations</span>
                        </Link>

                        <div className="h-px bg-[#3b4754] my-4"></div>

                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/profile">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                            <span className="text-sm font-medium">Profile</span>
                        </Link>
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/settings">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.62l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.09-.47 0-.59.22L2.74 8.87c-.12.21-.08.48.1.62l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.62l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.48-.1-.62l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                            </svg>
                            <span className="text-sm font-medium">Settings</span>
                        </Link>
                    </nav>
                </div>

                {/* Create Course Button */}
                <Link href="/dashboard/courses/new" className="flex w-full items-center justify-center gap-2 rounded-lg h-11 bg-[#137fec] text-white text-sm font-bold transition-transform hover:bg-[#137fec]/90 active:scale-95">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                    </svg>
                    <span>Create New Course</span>
                </Link>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto px-8 py-6">
                {/* Breadcrumb Navigation */}
                <Breadcrumb />

                {children}
            </main>
        </div>
    )
}
