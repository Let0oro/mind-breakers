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
        if (path === '/guild-hall') {
            return pathname === '/guild-hall'
        }
        if (path.includes('armory') && pathname?.includes('settings')) {
            return true
        }
        return pathname?.startsWith(path)
    }

    const getLinkClassName = (path: string) => {
        const active = isActive(path)
        return `group flex items-center gap-4 px-2 py-2 transition-all duration-300 ${active
            ? 'text-gold [&>span]:border-gold'
            : 'text-muted [&>span]:border-transparent'
            }`
    }

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 size-11 z-50 px-2 py-2.5 bg-background text-foreground border border-border hover:bg-surface"
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
                    fixed inset-y-0 left-0 z-40 w-72 flex flex-col border-r border-border bg-background dark:bg-midnight
                    transition-transform duration-500 ease-out-expo
                    md:relative md:translate-x-0 overflow-y-auto
                    ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                `}
            >
                {/* Profile Section */}
                <div className="flex flex-col items-center pt-8 pb-4 px-6 text-center border-b border-border/10">
                    <div className="relative mb-6 group cursor-pointer">
                        <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl group-hover:bg-gold/30 transition-all duration-500"></div>
                        <div
                            className="relative h-18 w-18 rounded-xs bg-cover bg-center ornate-border group-hover:border-gold transition-all duration-500"
                            style={{ backgroundImage: `url("${profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}")` }}
                        />
                    </div>

                    <h1 className="text-lg font-header text-inverse mb-2 tracking-wide">
                        {profile?.username || 'Unknown Hero'}
                    </h1>

                    <div className="flex items-center gap-3 w-full justify-center">
                        <div className="h-px w-8 bg-gold"></div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">Silver Rank</p>
                        <div className="h-px w-8 bg-gold"></div>
                    </div>
                </div>

                {/* Navigation Section */}
                <div className="flex-1 px-8 py-4 flex flex-col gap-2">

                    {/* Main Nav */}
                    <div className="space-y-4">
                        <nav className="flex flex-col">

                            {[
                                { name: 'guild-hall', icon: 'swords' },
                                { name: 'world-map', icon: 'map' },
                                { name: 'archives', icon: 'local_library' },
                                { name: 'quests', icon: 'assignment_late' },
                                { name: 'expeditions', icon: 'flag' },
                                { name: 'armory', icon: 'handyman' }].map((path) => (
                                    <Link
                                        key={path.name}
                                        className={getLinkClassName(`${path.name == 'guild-hall' ? '/guild-hall' : '/guild-hall/' + path.name}`)}
                                        href={`/guild-hall/${path.name == 'armory' ? 'settings' : path.name == 'guild-hall' ? '' : path.name}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <span className={`material-symbols-outlined text-base transition-transform duration-300 scale-80 group-hover:scale-90`}>{path.icon}</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 border-b border-transparent`}>{path.name}</span>
                                    </Link>
                                ))}

                        </nav>
                    </div>

                    {profile?.is_admin && (
                        <div className="space-y-3 pt-4 border-t border-gold/10">
                            <nav className="flex flex-col gap-2">
                                <Link
                                    className={getLinkClassName('/guild-hall/admin')}
                                    href="/guild-hall/admin"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className={`scale-80 group-hover:scale-90 material-symbols-outlined text-base transition-transform duration-300 `}>security</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 border-b border-transparent `}>Command</span>
                                </Link>
                            </nav>
                        </div>
                    )}

                </div>
                <button
                    onClick={handleSignOut}
                    className="mt-auto mb-6 mx-auto h-auto group flex items-center gap-4 px-2 py-1 transition-all duration-300 tracking-[0.4em] text-muted hover:text-gold"
                >
                    <span className="scale-80 group-hover:scale-90 material-symbols-outlined text-base transition-transform duration-300">logout</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Depart</span>
                </button>
            </aside>
        </>
    )
}
