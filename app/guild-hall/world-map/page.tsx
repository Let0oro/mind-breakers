'use client'

import { useState, useEffect, Suspense, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    searchExpeditions,
    searchQuests,
    searchOrganizations,
    getUserSavedQuests,
    type QuestListItem,
    type OrganizationListItem
} from '@/lib/queries'
import type { ExpeditionListItem } from '@/lib/types'
import GuildHallLoading from '../loading'

type SearchResult = {
    id: string
    type: 'expedition' | 'quest' | 'organization'
    title: string
    description?: string
    summary?: string
    thumbnail_url?: string
    xp_reward?: number
    organization?: string
    questCount?: number
    expeditionCount?: number
    saved?: boolean
}

function ExplorePageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const initialTab = (searchParams.get('tab') as 'all' | 'expeditions' | 'quests' | 'organizations') || 'all'

    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'all' | 'expeditions' | 'quests' | 'organizations'>(initialTab)
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(true)

    // Use ref for savedQuestIds to avoid triggering performSearch recreation
    const savedQuestIdsRef = useRef<Set<string>>(new Set())
    const initializedRef = useRef(false)

    const supabase = createClient()

    useEffect(() => {
        const tabFromUrl = searchParams.get('tab') as typeof activeTab
        if (tabFromUrl && ['all', 'expeditions', 'quests', 'organizations'].includes(tabFromUrl)) {
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

            // Fetch expeditions
            if (activeTab === 'all' || activeTab === 'expeditions') {
                promises.push(
                    searchExpeditions(supabase, {
                        query: searchQuery || undefined,
                        validated: true,
                        limit: 20
                    }).then((expeditions: ExpeditionListItem[]) => {
                        expeditions.forEach(expedition => {
                            const org = Array.isArray(expedition.organizations)
                                ? expedition.organizations[0]
                                : expedition.organizations
                            allResults.push({
                                id: expedition.id,
                                type: 'expedition',
                                title: expedition.title,
                                description: expedition.description,
                                summary: expedition.summary,
                                organization: org?.name,
                                questCount: expedition.quests?.length || 0,
                            })
                        })
                    })
                )
            }

            // Fetch quests
            if (activeTab === 'all' || activeTab === 'quests') {
                promises.push(
                    searchQuests(supabase, {
                        query: searchQuery || undefined,
                        validated: true,
                        status: 'published',
                        limit: 20
                    }).then((quests: QuestListItem[]) => {
                        quests.forEach(quest => {
                            allResults.push({
                                id: quest.id,
                                type: 'quest',
                                title: quest.title,
                                summary: quest.summary,
                                thumbnail_url: quest.thumbnail_url,
                                xp_reward: quest.xp_reward,
                                organization: quest.organizations?.[0]?.name,
                                saved: savedQuestIdsRef.current.has(quest.id)
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
                                expeditionCount: org.expeditions?.length || 0,
                                questCount: org.quests?.length || 0,
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

    // Initial load: fetch saved quests first, then perform search
    useEffect(() => {
        if (initializedRef.current) return
        initializedRef.current = true

        const initialize = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const savedIds = await getUserSavedQuests(supabase, user.id)
                savedQuestIdsRef.current = new Set(savedIds)
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
                    { key: 'expeditions', label: 'expeditions' },
                    { key: 'quests', label: 'QUESTS' },
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
            case 'expedition': return `/guild-hall/expeditions/${result.id}`
            case 'quest': return `/guild-hall/quests/${result.id}`
            case 'organization': return `/guild-hall/organizations/${result.id}`
            default: return '#'
        }
    }

    const getIcon = () => {
        switch (result.type) {
            case 'expedition': return 'flag'
            case 'quest': return 'assignment_late'
            case 'organization': return 'groups'
            default: return 'help'
        }
    }

    const getTypeLabel = () => {
        switch (result.type) {
            case 'expedition': return 'Expedition'
            case 'quest': return 'Quest'
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
                    {result.questCount !== undefined && result.questCount > 0 && (
                        <span>{result.questCount} quests</span>
                    )}
                    {result.expeditionCount !== undefined && result.expeditionCount > 0 && (
                        <span>{result.expeditionCount} expeditions</span>
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
