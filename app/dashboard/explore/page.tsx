'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

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

    // Get initial tab from URL or default to 'all'
    const initialTab = (searchParams.get('tab') as 'all' | 'paths' | 'courses' | 'organizations') || 'all'

    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'all' | 'paths' | 'courses' | 'organizations'>(initialTab)
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [savedCourseIds, setSavedCourseIds] = useState<Set<string>>(new Set())

    const supabase = createClient()

    // Sync state with URL params when they change
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab') as typeof activeTab
        if (tabFromUrl && ['all', 'paths', 'courses', 'organizations'].includes(tabFromUrl)) {
            if (tabFromUrl !== activeTab) {
                setActiveTab(tabFromUrl)
            }
        }
    }, [searchParams, activeTab])

    // Update URL when tab changes state (user click)
    const handleTabChange = (newTab: typeof activeTab) => {
        setActiveTab(newTab)
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', newTab)
        router.push(`/dashboard/explore?${params.toString()}`)
    }

    // Fetch saved courses once on mount
    useEffect(() => {
        const fetchSavedCourses = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('saved_courses')
                .select('course_id')
                .eq('user_id', user.id)

            if (data) {
                setSavedCourseIds(new Set(data.map(item => item.course_id)))
            }
        }
        fetchSavedCourses()
    }, [supabase])

    const performSearch = useCallback(async () => {
        setLoading(true)
        const allResults: SearchResult[] = []

        try {
            // Search Learning Paths
            if (activeTab === 'all' || activeTab === 'paths') {
                let pathQuery = supabase
                    .from('learning_paths')
                    .select(`
            id,
            title,
            summary,
            description,
            organizations (name),
            courses (id)
          `)
                    .order('created_at', { ascending: false })
                    .limit(20)

                if (searchQuery) {
                    pathQuery = pathQuery.or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
                }

                const { data: paths } = await pathQuery

                paths?.forEach(path => {
                    allResults.push({
                        id: path.id,
                        type: 'path',
                        title: path.title,
                        description: path.description,
                        summary: path.summary,
                        organization: path.organizations?.[0]?.name,
                        courseCount: path.courses?.length || 0,
                    })
                })
            }

            // Search Courses
            if (activeTab === 'all' || activeTab === 'courses') {
                let courseQuery = supabase
                    .from('courses')
                    .select(`
            id,
            title,
            summary,
            thumbnail_url,
            xp_reward,
            organizations (name)
          `)
                    .order('created_at', { ascending: false })
                    .limit(20)

                if (searchQuery) {
                    courseQuery = courseQuery.or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%`)
                }

                const { data: courses } = await courseQuery

                courses?.forEach(course => {
                    allResults.push({
                        id: course.id,
                        type: 'course',
                        title: course.title,
                        summary: course.summary,
                        thumbnail_url: course.thumbnail_url,
                        xp_reward: course.xp_reward,
                        organization: course.organizations?.[0]?.name,
                        saved: savedCourseIds.has(course.id)
                    })
                })
            }

            // Search Organizations
            if (activeTab === 'all' || activeTab === 'organizations') {
                let orgQuery = supabase
                    .from('organizations')
                    .select(`
            id,
            name,
            description,
            learning_paths (id),
            courses (id)
          `)
                    .order('name')
                    .limit(10)

                if (searchQuery) {
                    orgQuery = orgQuery.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
                }

                const { data: orgs } = await orgQuery

                orgs?.forEach(org => {
                    allResults.push({
                        id: org.id,
                        type: 'organization',
                        title: org.name,
                        description: org.description,
                        pathCount: org.learning_paths?.length || 0,
                        courseCount: org.courses?.length || 0,
                    })
                })
            }

            setResults(allResults)
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setLoading(false)
        }
    }, [activeTab, searchQuery, savedCourseIds, supabase])

    useEffect(() => {
        performSearch()
    }, [performSearch])

    return (
        <>
            {/* Header Section */}
            <header className="mb-8">
                <h2 className="text-gray-900 dark:text-white text-3xl font-black tracking-tight mb-2">Explore</h2>
                <p className="text-gray-600 dark:text-[#b0bfcc] text-base mb-6">
                    Discover learning paths, courses, and organizations
                </p>

                {/* Search Bar */}
                <div className="relative max-w-2xl">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-[#b0bfcc]">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Search for anything..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 rounded-lg bg-white dark:bg-[#1a232e] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                    />
                </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[#3b4754]">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'paths', label: 'Learning Paths' },
                    { key: 'courses', label: 'Courses' },
                    { key: 'organizations', label: 'Organizations' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key as typeof activeTab)}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.key
                            ? 'border-[#137fec] text-[#137fec]'
                            : 'border-transparent text-gray-600 dark:text-[#b0bfcc] hover:text-gray-900 dark:text-white'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-[#3b4754] border-t-[#137fec]"></div>
                </div>
            ) : results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((result) => (
                        <ResultCard key={`${result.type}-${result.id}`} result={result} />
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-12 text-center">
                    <span className="material-symbols-outlined text-6xl text-[#3b4754] mb-4 block">
                        search_off
                    </span>
                    <p className="text-gray-600 dark:text-[#b0bfcc] text-lg mb-2">
                        {searchQuery ? 'No results found' : 'Start typing to search'}
                    </p>
                    <p className="text-gray-600 dark:text-[#b0bfcc] text-sm">
                        {searchQuery ? 'Try different keywords' : 'Search across paths, courses, and organizations'}
                    </p>
                </div>
            )}
        </>
    )
}

function ResultCard({ result }: { result: SearchResult }) {
    const getLink = () => {
        switch (result.type) {
            case 'path':
                return `/dashboard/paths/${result.id}`
            case 'course':
                return `/dashboard/courses/${result.id}`
            case 'organization':
                return `/dashboard/organizations/${result.id}`
            default:
                return '#'
        }
    }

    const getIcon = () => {
        switch (result.type) {
            case 'path':
                return 'route'
            case 'course':
                return 'school'
            case 'organization':
                return 'business'
            default:
                return 'help'
        }
    }

    const getTypeLabel = () => {
        switch (result.type) {
            case 'path':
                return 'Learning Path'
            case 'course':
                return 'Course'
            case 'organization':
                return 'Organization'
            default:
                return ''
        }
    }

    return (
        <Link
            href={getLink()}
            className="group bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] hover:border-[#137fec]/50 transition-all overflow-hidden relative"
        >
            {/* Type Badge & Icon */}
            <div className="p-5 border-b border-gray-200 dark:border-[#3b4754]">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-600 dark:text-[#b0bfcc] uppercase tracking-wider">
                        {getTypeLabel()}
                    </span>
                    <div className="flex items-center gap-2">
                        {result.saved && (
                            <span className="material-symbols-outlined text-yellow-500" title="Saved">
                                bookmark
                            </span>
                        )}
                        <span className="material-symbols-outlined text-[#137fec]">
                            {getIcon()}
                        </span>
                    </div>
                </div>
                <h3 className="text-gray-900 dark:text-white font-bold text-lg group-hover:text-[#137fec] transition-colors line-clamp-2">
                    {result.title}
                </h3>
            </div>

            {/* Content */}
            <div className="p-5">
                {result.summary && (
                    <p className="text-gray-600 dark:text-[#b0bfcc] text-sm line-clamp-2 mb-3">
                        {result.summary}
                    </p>
                )}

                {result.description && !result.summary && (
                    <p className="text-gray-600 dark:text-[#b0bfcc] text-sm line-clamp-2 mb-3">
                        {result.description}
                    </p>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-3 text-xs">
                    {result.organization && (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-[#b0bfcc]">
                            <span className="material-symbols-outlined text-sm">business</span>
                            <span>{result.organization}</span>
                        </div>
                    )}
                    {result.xp_reward && (
                        <div className="flex items-center gap-1 text-[#137fec]">
                            <span className="material-symbols-outlined text-sm">star</span>
                            <span className="font-bold">{result.xp_reward} XP</span>
                        </div>
                    )}
                    {result.courseCount !== undefined && result.courseCount > 0 && (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-[#b0bfcc]">
                            <span className="material-symbols-outlined text-sm">school</span>
                            <span>{result.courseCount} courses</span>
                        </div>
                    )}
                    {result.pathCount !== undefined && result.pathCount > 0 && (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-[#b0bfcc]">
                            <span className="material-symbols-outlined text-sm">route</span>
                            <span>{result.pathCount} paths</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
}

export default function ExplorePage() {
    return (
        <Suspense fallback={<div className="text-gray-900 dark:text-white">Loading...</div>}>
            <ExplorePageContent />
        </Suspense>
    )
}
