'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

interface SidebarProps {
    user: User
    profile: Profile
}

export function Sidebar({ user, profile }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return pathname === '/dashboard'
        }
        return pathname?.startsWith(path)
    }

    const getLinkClassName = (path: string) => {
        const active = isActive(path)
        return `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active
            ? 'bg-brand/10 text-brand dark:bg-sidebar-accent dark:text-white'
            : 'text-muted dark:text-muted hover:text-main dark:hover:text-white hover:bg-surface dark:hover:bg-sidebar-accent/10'
            }`
    }

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 size-11 z-50 px-2 py-2.5 bg-sidebar dark:bg-sidebar text-main dark:text-white rounded-md border border-border dark:border-border hover:bg-surface dark:hover:bg-sidebar-accent"
                aria-label="Toggle Menu"
            >
                <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
            </button>

            {/* Backdrop for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col justify-between border-r border-border dark:border-border bg-sidebar dark:bg-sidebar p-4 
          transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 overflow-y-auto
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
            >
                <div className="flex flex-col gap-4">
                    {/* User Profile */}
                    <Link href={`/dashboard/users/${user.id}`} className={`flex items-center gap-3 px-2 mt-8 md:mt-0 ${getLinkClassName(`/dashboard/users/${user.id}`)}`}>
                        <div
                            className="h-10 w-10 rounded-full bg-cover bg-center border-2 border-brand"
                            style={{ backgroundImage: `url("${profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}")` }}
                        />
                        <div className="flex flex-col">
                            <h1 className="text-sm/6 md:text-sm/4 font-bold text-main dark:text-white truncate max-w-[140px]">
                                {profile?.username || user.email}
                            </h1>
                            <p className="text-muted dark:text-muted text-xs">Scholar • Lvl {profile?.level || 1}</p>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex flex-col">
                        <Link
                            className={getLinkClassName('/dashboard')}
                            href="/dashboard"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-6 h-6">home</span>
                            <span className="text-sm/6 md:text-sm/4 font-medium">Home</span>
                        </Link>
                        <Link
                            className={getLinkClassName('/dashboard/explore')}
                            href="/dashboard/explore"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-6 h-6">explore</span>
                            <span className="text-sm/6 md:text-sm/4 font-medium">Explore</span>
                        </Link>
                        <Link
                            className={getLinkClassName('/dashboard/quests')}
                            href="/dashboard/quests"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-6 h-6">school</span>
                            <span className="text-sm/6 md:text-sm/4 font-medium">Courses</span>
                        </Link>
                        <Link
                            className={getLinkClassName('/dashboard/drafts')}
                            href="/dashboard/drafts"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-6 h-6">edit_document</span>
                            <span className="text-sm/6 md:text-sm/4 font-medium">My Drafts</span>
                        </Link>
                        <Link
                            className={getLinkClassName('/dashboard/paths')}
                            href="/dashboard/paths"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-6 h-6">route</span>
                            <span className="text-sm/6 md:text-sm/4 font-medium">Learning Paths</span>
                        </Link>
                        <Link
                            className={getLinkClassName('/dashboard/exercises')}
                            href="/dashboard/exercises"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-6 h-6">assignment</span>
                            <span className="text-sm/6 md:text-sm/4 font-medium">Exercises</span>
                        </Link>
                        <Link
                            className={getLinkClassName('/dashboard/leaderboard')}
                            href="/dashboard/leaderboard"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-6 h-6">leaderboard</span>
                            <span className="text-sm/6 md:text-sm/4 font-medium">Leaderboard</span>
                        </Link>
                        <Link
                            className={getLinkClassName('/dashboard/organizations')}
                            href="/dashboard/organizations/new"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-6 h-6">business</span>
                            <span className="text-sm/6 md:text-sm/4 font-medium">Organizations</span>
                        </Link>

                        <div className="h-px bg-sidebar-border my-4"></div>

                        <Link
                            className={getLinkClassName('/dashboard/settings')}
                            href="/dashboard/settings"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-6 h-6">settings</span>
                            <span className="text-sm/6 md:text-sm/4 font-medium">Settings</span>
                        </Link>

                        {profile?.is_admin && (
                            <>
                                <Link
                                    className={getLinkClassName('/dashboard/admin/validations')}
                                    href="/dashboard/admin/validations"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="material-symbols-outlined w-6 h-6">fact_check</span>
                                    <span className="text-sm/6 md:text-sm/4 font-medium">Validations</span>
                                </Link>
                                <Link
                                    className={getLinkClassName('/dashboard/admin/submissions')}
                                    href="/dashboard/admin/submissions"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="material-symbols-outlined w-6 h-6">assignment_turned_in</span>
                                    <span className="text-sm/6 md:text-sm/4 font-medium">Submissions</span>
                                </Link>
                                <Link
                                    className={getLinkClassName('/dashboard/admin/requests')}
                                    href="/dashboard/admin/requests"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="material-symbols-outlined w-6 h-6">admin_panel_settings</span>
                                    <span className="text-sm/6 md:text-sm/4 font-medium">Admin Requests</span>
                                </Link>
                            </>
                        )}

                        <div className="h-px bg-sidebar-border my-4"></div>

                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-muted dark:text-muted hover:text-main dark:text-white hover:bg-main/5 w-full text-left"
                        >
                            <span className="material-symbols-outlined w-6 h-6">logout</span>
                            <span className="text-sm/6 md:text-sm/4 font-medium">Log Out</span>
                        </button>
                    </nav>
                </div>
            </aside>
        </>
    )
}
