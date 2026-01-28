'use client'

import { useState, useEffect, useCallback } from 'react'

interface SimplifiedRepo {
    id: number
    name: string
    fullName: string
    url: string
    description: string | null
    language: string | null
    stars: number
    updatedAt: string
}

interface GitHubRepoSelectorProps {
    onSelect: (repoUrl: string) => void
    selectedUrl?: string
}

// Language color mapping
const languageColors: Record<string, string> = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#3178c6',
    'Python': '#3572A5',
    'Java': '#b07219',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'C++': '#f34b7d',
    'C#': '#178600',
    'Ruby': '#701516',
    'PHP': '#4F5D95',
    'Swift': '#ffac45',
    'Kotlin': '#A97BFF',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Vue': '#41b883',
}

export function GitHubRepoSelector({ onSelect, selectedUrl }: GitHubRepoSelectorProps) {
    const [repos, setRepos] = useState<SimplifiedRepo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [needsGitHub, setNeedsGitHub] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const fetchRepos = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/github/repos')
            const data = await response.json()

            if (!response.ok) {
                if (data.needsGitHub || data.needsReauth) {
                    setNeedsGitHub(true)
                    setError(data.message || 'GitHub account not linked')
                } else {
                    setError(data.error || 'Failed to fetch repositories')
                }
                return
            }

            setRepos(data.repos || [])
        } catch (err) {
            setError('Failed to connect to server')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchRepos()
    }, [fetchRepos])

    const filteredRepos = repos.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'today'
        if (diffDays === 1) return 'yesterday'
        if (diffDays < 7) return `${diffDays} days ago`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
        return date.toLocaleDateString()
    }

    // Loading state
    if (loading) {
        return (
            <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-[#3b4754] p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#137fec] border-t-transparent mx-auto mb-3"></div>
                <p className="text-sm text-gray-600 dark:text-[#b0bfcc]">Loading your GitHub repositories...</p>
            </div>
        )
    }

    // Needs GitHub linking
    if (needsGitHub) {
        return (
            <div className="rounded-lg border-2 border-dashed border-amber-500/50 bg-amber-500/10 p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-amber-400 mb-3">link</span>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    GitHub Account Required
                </h4>
                <p className="text-sm text-gray-600 dark:text-[#b0bfcc] mb-4">
                    To submit a GitHub repository, please log out and log back in using your GitHub account.
                </p>
                <a
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 transition-colors"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                    Link GitHub Account
                </a>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="rounded-lg border-2 border-dashed border-red-500/50 bg-red-500/10 p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-red-400 mb-3">error</span>
                <p className="text-sm text-red-400 mb-3">{error}</p>
                <button
                    onClick={fetchRepos}
                    className="text-sm text-[#137fec] hover:underline"
                >
                    Try again
                </button>
            </div>
        )
    }

    // Empty state
    if (repos.length === 0) {
        return (
            <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-[#3b4754] p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-600 dark:text-[#b0bfcc] mb-3">folder_off</span>
                <p className="text-sm text-gray-600 dark:text-[#b0bfcc]">
                    No public repositories found in your GitHub account.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Search */}
            <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-[#b0bfcc] text-lg">
                    search
                </span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search repositories..."
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-[#3b4754] bg-gray-50 dark:bg-[#101922] text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-[#b0bfcc] focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec] text-sm"
                />
            </div>

            {/* Repo list */}
            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-[#3b4754] divide-y divide-gray-200 dark:divide-[#3b4754]">
                {filteredRepos.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-600 dark:text-[#b0bfcc]">
                        No repositories match your search
                    </div>
                ) : (
                    filteredRepos.map((repo) => (
                        <button
                            key={repo.id}
                            type="button"
                            onClick={() => onSelect(repo.url)}
                            className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-[#1a232e] transition-colors ${selectedUrl === repo.url ? 'bg-[#137fec]/10 border-l-2 border-l-[#137fec]' : ''
                                }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                            {repo.name}
                                        </span>
                                        {selectedUrl === repo.url && (
                                            <span className="material-symbols-outlined text-[#137fec] text-base">check_circle</span>
                                        )}
                                    </div>
                                    {repo.description && (
                                        <p className="text-xs text-gray-600 dark:text-[#b0bfcc] line-clamp-1 mt-0.5">
                                            {repo.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600 dark:text-[#b0bfcc]">
                                        {repo.language && (
                                            <span className="flex items-center gap-1">
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: languageColors[repo.language] || '#6e7681' }}
                                                ></span>
                                                {repo.language}
                                            </span>
                                        )}
                                        {repo.stars > 0 && (
                                            <span className="flex items-center gap-0.5">
                                                ⭐ {repo.stars}
                                            </span>
                                        )}
                                        <span>Updated {formatDate(repo.updatedAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>

            <p className="text-xs text-gray-600 dark:text-[#b0bfcc]">
                Showing {filteredRepos.length} of {repos.length} public repositories
            </p>
        </div>
    )
}
