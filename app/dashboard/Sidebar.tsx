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
        return `flex items-center gap-3 px-3 py-2 transition-colors ${active
            ? 'text-text-main font-bold border-l-2 border-text-main -ml-[2px]'
            : 'text-muted hover:text-text-main'
            }`
    }

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 size-11 z-50 px-2 py-2.5 bg-main text-text-main border border-border hover:bg-surface"
                aria-label="Toggle Menu"
            >
                <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
            </button>

            {/* Backdrop for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-inverse/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-56 flex flex-col justify-between border-r border-border bg-main p-4 
                    transition-transform duration-300 ease-in-out
                    md:relative md:translate-x-0 overflow-y-auto
                    ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                `}
            >
                <div className="flex flex-col gap-6">
                    {/* User Profile */}
                    <Link href={`/dashboard/users/${user.id}`} className="flex items-center gap-3 mt-8 md:mt-0 group">
                        <div
                            className="h-10 w-10 bg-cover bg-center border border-border grayscale group-hover:grayscale-0 transition-all"
                            style={{ backgroundImage: `url("${profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}")` }}
                        />
                        <div className="flex flex-col">
                            <h1 className="text-xs font-bold uppercase tracking-wide text-text-main truncate max-w-30">
                                {profile?.username || user.email}
                            </h1>
                            <p className="text-muted text-[10px] uppercase tracking-wider">Level {profile?.level || 1}</p>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-1">
                        <Link
                            className={getLinkClassName('/dashboard')}
                            href="/dashboard"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-5 h-5 text-lg">home</span>
                            <span className="text-xs uppercase tracking-widest">Home</span>
                        </Link>
                        <Link
                            className={getLinkClassName('/dashboard/explore')}
                            href="/dashboard/explore"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-5 h-5 text-lg">explore</span>
                            <span className="text-xs uppercase tracking-widest">Explore</span>
                        </Link>
                        {/* <Link
                            className={getLinkClassName('/dashboard/quests')}
                            href="/dashboard/quests"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-5 h-5 text-lg">school</span>
                            <span className="text-xs uppercase tracking-widest">Quests</span>
                        </Link>
                        <Link
                            className={getLinkClassName('/dashboard/drafts')}
                            href="/dashboard/drafts"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-5 h-5 text-lg">edit_document</span>
                            <span className="text-xs uppercase tracking-widest">My Drafts</span>
                        </Link>
                        <Link
                            className={getLinkClassName('/dashboard/paths')}
                            href="/dashboard/paths"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-5 h-5 text-lg">route</span>
                            <span className="text-xs uppercase tracking-widest">Paths</span>
                        </Link>
                        <Link
                        className={getLinkClassName('/dashboard/exercises')}
                        href="/dashboard/exercises"
                        onClick={() => setIsOpen(false)}
                        >
                        <span className="material-symbols-outlined w-5 h-5 text-lg">assignment</span>
                        <span className="text-xs uppercase tracking-widest">Exercises</span>
                        </Link> */}


                        <Link
                            className={getLinkClassName('/dashboard/library')}
                            href="/dashboard/library"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-5 h-5 text-lg">collections_bookmark</span>
                            <span className="text-xs uppercase tracking-widest">Library</span>
                        </Link>

                        
                        <Link
                            className={getLinkClassName('/dashboard/leaderboard')}
                            href="/dashboard/leaderboard"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-5 h-5 text-lg">leaderboard</span>
                            <span className="text-xs uppercase tracking-widest">Leaderboard</span>
                        </Link>
                        {/* <Link
                            className={getLinkClassName('/dashboard/organizations')}
                            href="/dashboard/organizations/new"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-5 h-5 text-lg">business</span>
                            <span className="text-xs uppercase tracking-widest">Organizations</span>
                        </Link> */}

                        <div className="h-px bg-border my-3" />

                        <Link
                            className={getLinkClassName('/dashboard/settings')}
                            href="/dashboard/settings"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined w-5 h-5 text-lg">settings</span>
                            <span className="text-xs uppercase tracking-widest">Settings</span>
                        </Link>

                        {profile?.is_admin && (
                            <>
                                <Link
                                    className={getLinkClassName('/dashboard/admin')}
                                    href="/dashboard/admin"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="material-symbols-outlined w-5 h-5 text-lg">shield_person</span>
                                    <span className="text-xs uppercase tracking-widest">Admin</span>
                                </Link>
                                {/* <Link
                                    className={getLinkClassName('/dashboard/admin/validations')}
                                    href="/dashboard/admin/validations"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="material-symbols-outlined w-5 h-5 text-lg">fact_check</span>
                                    <span className="text-xs uppercase tracking-widest">Validations</span>
                                </Link>
                                <Link
                                    className={getLinkClassName('/dashboard/admin/submissions')}
                                    href="/dashboard/admin/submissions"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="material-symbols-outlined w-5 h-5 text-lg">assignment_turned_in</span>
                                    <span className="text-xs uppercase tracking-widest">Submissions</span>
                                </Link>
                                <Link
                                    className={getLinkClassName('/dashboard/admin/requests')}
                                    href="/dashboard/admin/requests"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="material-symbols-outlined w-5 h-5 text-lg">admin_panel_settings</span>
                                    <span className="text-xs uppercase tracking-widest">Admin Requests</span>
                                </Link> */}
                            </>
                        )}

                        <div className="h-px bg-border my-3" />

                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-3 py-2 transition-colors text-muted hover:text-text-main w-full text-left"
                        >
                            <span className="material-symbols-outlined w-5 h-5 text-lg">door_open</span>
                            <span className="text-xs uppercase tracking-widest">Log Out</span>
                        </button>
                    </nav>
                </div>
            </aside>
        </>
    )
}
