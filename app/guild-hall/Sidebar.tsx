'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { getLevelFromXp } from '@/lib/gamification'

const getRankName = (level: number) => {
    if (level < 5) return 'Novice Explorer'
    if (level < 15) return 'Bronze Adventurer'
    if (level < 30) return 'Silver Knight'
    if (level < 50) return 'Gold Paladin'
    if (level < 75) return 'Master Mindbreaker'
    return 'Legendary Hero'
}

// Main nav — reflects user learning flow: Home → Explore → Practice → History
const MAIN_NAV_ITEMS = [
    { slug: 'guild-hall', label: 'Guild Hall', icon: 'swords', href: '/guild-hall', description: 'Your current quests and expeditions' },
    { slug: 'world-map', label: 'World Map', icon: 'map', href: '/guild-hall/world-map', description: 'Discover expeditions, quests and organizations' },
    { slug: 'missions', label: 'Missions', icon: 'assignment', href: '/guild-hall/missions', description: 'Practice and apply what you have learned' },
    { slug: 'archives', label: 'Archives', icon: 'local_library', href: '/guild-hall/archives', description: 'Your personal learning history and drafts', hasNotification: true },
]

// Account nav — visually separated (Settings pattern, NN/g)
const ACCOUNT_NAV_ITEMS = [
    { slug: 'armory', label: 'Armory', icon: 'handyman', href: '/guild-hall/armory', description: 'Manage your account and preferences' },
]

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

    // Close menu on Escape key
    useEffect(() => {
        if (!isOpen) return
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false)
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen])

    const isActive = (href: string) => {
        if (href === '/guild-hall') {
            return pathname === '/guild-hall'
        }
        if (href.includes('armory') && pathname?.includes('settings')) {
            return true
        }
        return pathname?.startsWith(href)
    }

    const getLinkClassName = (href: string) => {
        const active = isActive(href)
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
                aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isOpen}
                aria-controls="sidebar-nav"
            >
                <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
            </button>

            {/* Backdrop for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-inverse/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Container */}
            <aside
                id="sidebar-nav"
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
                            role="img"
                            aria-label={`Avatar of ${profile?.username || 'Unknown Hero'}`}
                        />
                    </div>

                    <h1 className="text-lg font-header text-inverse mb-2 tracking-wide">
                        {profile?.username || 'Unknown Hero'}
                    </h1>

                    <div className="flex items-center gap-3 w-full justify-center pt-2">
                        <div className="h-px w-6 bg-gold/50"></div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold text-center">
                            {getRankName(getLevelFromXp(profile?.total_xp || 0))}
                            <span className="block text-[8px] text-muted tracking-widest mt-0.5">Level {getLevelFromXp(profile?.total_xp || 0)}</span>
                        </p>
                        <div className="h-px w-6 bg-gold/50"></div>
                    </div>
                </div>

                {/* Navigation Section */}
                <div className="flex-1 px-8 py-4 flex flex-col gap-2">

                    {/* Main Nav: Home → Explore → Practice → History */}
                    <div className="space-y-1">
                        <nav aria-label="Main navigation" className="flex flex-col">
                            {MAIN_NAV_ITEMS.map((item) => (
                                <Link
                                    key={item.slug}
                                    className={getLinkClassName(item.href)}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    aria-current={isActive(item.href) ? 'page' : undefined}
                                    title={item.description}
                                >
                                    <span className="material-symbols-outlined text-base transition-transform duration-300 scale-80 group-hover:scale-90">
                                        {item.icon}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 border-b border-transparent relative flex items-center pr-1.5">
                                        {item.label}
                                        {item.hasNotification && (
                                            <span className="absolute -right-1 top-0 flex h-1.5 w-1.5" aria-label="New notification">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold"></span>
                                            </span>
                                        )}
                                    </span>
                                </Link>
                            ))}
                        </nav>

                        {/* Divider — separates content nav from account nav (NN/g pattern) */}
                        <div className="h-px bg-gold/10 my-4 mx-2" role="separator" aria-hidden="true" />

                        {/* Account Nav */}
                        <nav aria-label="Account navigation" className="flex flex-col">
                            {ACCOUNT_NAV_ITEMS.map((item) => (
                                <Link
                                    key={item.slug}
                                    className={getLinkClassName(item.href)}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    aria-current={isActive(item.href) ? 'page' : undefined}
                                    title={item.description}
                                >
                                    <span className="material-symbols-outlined text-base transition-transform duration-300 scale-80 group-hover:scale-90">
                                        {item.icon}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 border-b border-transparent">
                                        {item.label}
                                    </span>
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {profile?.is_admin && (
                        <div className="space-y-3 pt-4 border-t border-gold/10">
                            <nav aria-label="Admin navigation" className="flex flex-col gap-2">
                                <Link
                                    className={getLinkClassName('/guild-hall/admin')}
                                    href="/guild-hall/admin"
                                    onClick={() => setIsOpen(false)}
                                    aria-current={isActive('/guild-hall/admin') ? 'page' : undefined}
                                    title="Admin control panel"
                                >
                                    <span className="scale-80 group-hover:scale-90 material-symbols-outlined text-base transition-transform duration-300">security</span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 border-b border-transparent">Command</span>
                                </Link>
                            </nav>
                        </div>
                    )}

                </div>
                <button
                    onClick={handleSignOut}
                    className="mt-auto mb-6 mx-auto h-auto group flex items-center gap-4 px-2 py-1 transition-all duration-300 tracking-[0.4em] text-muted hover:text-gold"
                    aria-label="Sign out of MindBreaker"
                >
                    <span className="scale-80 group-hover:scale-90 material-symbols-outlined text-base transition-transform duration-300">logout</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Depart</span>
                </button>
            </aside>
        </>
    )
}
