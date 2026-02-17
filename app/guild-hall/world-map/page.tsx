'use client'

import { useState, useEffect, Suspense, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    searchPaths,
    searchCourses,
    searchOrganizations,
    getUserSavedCourses,
    type CourseListItem,
    type OrganizationListItem
} from '@/lib/queries'
import type { PathListItem } from '@/lib/types'
import GuildHallLoading from '../loading'

type SearchResult = {
    id: string
    type: 'path' | 'course' | 'organization'
    title: string
    description?: string
    summary?: string
    thumbnail_url?: string
    xp_reward?: number
    organization?: string
    courseCount?: number
    pathCount?: number
    saved?: boolean
}

function ExplorePageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const initialTab = (searchParams.get('tab') as 'all' | 'paths' | 'courses' | 'organizations') || 'all'

    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'all' | 'paths' | 'courses' | 'organizations'>(initialTab)
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(true)

    // Use ref for savedCourseIds to avoid triggering performSearch recreation
    const savedCourseIdsRef = useRef<Set<string>>(new Set())
    const initializedRef = useRef(false)

    const supabase = createClient()

    useEffect(() => {
        const tabFromUrl = searchParams.get('tab') as typeof activeTab
        if (tabFromUrl && ['all', 'paths', 'courses', 'organizations'].includes(tabFromUrl)) {
            if (tabFromUrl !== activeTab) {
                setActiveTab(tabFromUrl)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])

    const handleTabChange = (newTab: typeof activeTab) => {
        setActiveTab(newTab)
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', newTab)
        router.push(`/guild-hall/world-map?${params.toString()}`)
    }

    const performSearch = useCallback(async () => {
        setLoading(true)
        const allResults: SearchResult[] = []

        try {
            const promises: Promise<void>[] = []

            // Fetch paths
            if (activeTab === 'all' || activeTab === 'paths') {
                promises.push(
                    searchPaths(supabase, {
                        query: searchQuery || undefined,
                        validated: true,
                        limit: 20
                    }).then((paths: PathListItem[]) => {
                        paths.forEach(path => {
                            const org = Array.isArray(path.organizations)
                                ? path.organizations[0]
                                : path.organizations
                            allResults.push({
                                id: path.id,
                                type: 'path',
                                title: path.title,
                                description: path.description,
                                summary: path.summary,
                                organization: org?.name,
                                courseCount: path.courses?.length || 0,
                            })
                        })
                    })
                )
            }

            // Fetch courses
            if (activeTab === 'all' || activeTab === 'courses') {
                promises.push(
                    searchCourses(supabase, {
                        query: searchQuery || undefined,
                        validated: true,
                        status: 'published',
                        limit: 20
                    }).then((courses: CourseListItem[]) => {
                        courses.forEach(course => {
                            allResults.push({
                                id: course.id,
                                type: 'course',
                                title: course.title,
                                summary: course.summary,
                                thumbnail_url: course.thumbnail_url,
                                xp_reward: course.xp_reward,
                                organization: course.organizations?.[0]?.name,
                                saved: savedCourseIdsRef.current.has(course.id)
                            })
                        })
                    })
                )
            }

            // Fetch organizations
            if (activeTab === 'all' || activeTab === 'organizations') {
                promises.push(
                    searchOrganizations(supabase, {
                        query: searchQuery || undefined,
                        limit: 10
                    }).then((orgs: OrganizationListItem[]) => {
                        orgs.forEach(org => {
                            allResults.push({
                                id: org.id,
                                type: 'organization',
                                title: org.name,
                                description: org.description,
                                pathCount: org.learning_paths?.length || 0,
                                courseCount: org.courses?.length || 0,
                            })
                        })
                    })
                )
            }

            await Promise.all(promises)
            setResults(allResults)
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setLoading(false)
        }
    }, [activeTab, searchQuery, supabase])

    // Initial load: fetch saved courses first, then perform search
    useEffect(() => {
        if (initializedRef.current) return
        initializedRef.current = true

        const initialize = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const savedIds = await getUserSavedCourses(supabase, user.id)
                savedCourseIdsRef.current = new Set(savedIds)
            }
            performSearch()
        }
        initialize()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Re-search when tab or query changes (but not on initial mount)
    useEffect(() => {
        if (!initializedRef.current) return
        performSearch()
    }, [performSearch])

    return (
        <>
            {/* Header */}
            <header className="mb-10">
                <h1 className="text-5xl font-header text-foreground tracking-tight mb-1">EXPLORE</h1>
                <p className="text-muted text-sm mb-6">
                    Discover expeditions, quests, and organizations
                </p>

                {/* Search */}
                <div className="relative max-w-2xl">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Search for anything..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 border border-border bg-main text-text-main placeholder:text-muted focus:outline-none focus:border-text-main transition-all"
                    />
                </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-6 mb-8 border-b border-border">
                {[
                    { key: 'all', label: 'ALL' },
                    { key: 'paths', label: 'expeditions' },
                    { key: 'courses', label: 'QUESTS' },
                    { key: 'organizations', label: 'ORGANIZATIONS' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key as typeof activeTab)}
                        className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab.key
                            ? 'border-text-main text-text-main'
                            : 'border-transparent text-muted hover:text-text-main'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin h-8 w-8 border-2 border-border border-t-text-main" />
                </div>
            ) : results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((result) => (
                        <ResultCard key={`${result.type}-${result.id}`} result={result} />
                    ))}
                </div>
            ) : (
                <div className="border border-border p-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-muted mb-4 block">
                        search_off
                    </span>
                    <p className="text-muted text-sm mb-1">
                        {searchQuery ? 'No results found' : 'Start typing to search'}
                    </p>
                    <p className="text-muted text-xs">
                        {searchQuery ? 'Try different keywords' : 'Search across expeditions, quests, and organizations'}
                    </p>
                </div>
            )}
        </>
    )
}

function ResultCard({ result }: { result: SearchResult }) {
    const getLink = () => {
        switch (result.type) {
            case 'path': return `/guild-hall/expeditions/${result.id}`
            case 'course': return `/guild-hall/quests/${result.id}`
            case 'organization': return `/guild-hall/organizations/${result.id}`
            default: return '#'
        }
    }

    const getIcon = () => {
        switch (result.type) {
            case 'path': return 'flag'
            case 'course': return 'assignment_late'
            case 'organization': return 'groups'
            default: return 'help'
        }
    }

    const getTypeLabel = () => {
        switch (result.type) {
            case 'path': return 'Expedition'
            case 'course': return 'Quest'
            case 'organization': return 'Organization'
            default: return ''
        }
    }

    return (
        <Link
            href={getLink()}
            className="group border border-border hover:border-text-main bg-main transition-all overflow-hidden"
        >
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                        {getTypeLabel()}
                    </span>
                    <div className="flex items-center gap-2">
                        {result.saved && (
                            <span className="material-symbols-outlined text-sm text-text-main">bookmark</span>
                        )}
                        <span className="material-symbols-outlined text-lg text-text-main">
                            {getIcon()}
                        </span>
                    </div>
                </div>
                <h3 className="text-text-main font-bold uppercase tracking-wide text-sm group-hover:underline line-clamp-2">
                    {result.title}
                </h3>
            </div>

            {/* Content */}
            <div className="p-4">
                {result.summary && (
                    <p className="text-muted text-xs line-clamp-2 mb-3">
                        {result.summary}
                    </p>
                )}

                {result.description && !result.summary && (
                    <p className="text-muted text-xs line-clamp-2 mb-3">
                        {result.description}
                    </p>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-3 text-xs text-muted">
                    {result.organization && (
                        <span>{result.organization}</span>
                    )}
                    {result.xp_reward && (
                        <span>{result.xp_reward} XP</span>
                    )}
                    {result.courseCount !== undefined && result.courseCount > 0 && (
                        <span>{result.courseCount} quests</span>
                    )}
                    {result.pathCount !== undefined && result.pathCount > 0 && (
                        <span>{result.pathCount} expeditions</span>
                    )}
                </div>
            </div>
        </Link>
    )
}

export default function ExplorePage() {
    return (
        <Suspense fallback={<GuildHallLoading />}>
            <ExplorePageContent />
        </Suspense>
    )
}
