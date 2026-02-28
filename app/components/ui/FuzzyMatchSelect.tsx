'use client'

import { useState, useMemo, useRef, useEffect } from 'react'

interface FuzzyMatchSelectProps {
    value: string
    onChange: (value: string) => void
    existingItems: Array<{ id: string; name: string }>
    placeholder?: string
    label?: string
    onSelectExisting?: (item: { id: string; name: string }) => void
}

// Levenshtein distance algorithm for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length
    const n = str2.length
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase()) {
                dp[i][j] = dp[i - 1][j - 1]
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
            }
        }
    }

    return dp[m][n]
}

// Calculate similarity score (0-1, higher is more similar)
function similarityScore(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length)
    if (maxLen === 0) return 1
    const distance = levenshteinDistance(str1, str2)
    return 1 - distance / maxLen
}

export function FuzzyMatchSelect({
    value,
    onChange,
    existingItems,
    placeholder = 'Enter name...',
    label,
    onSelectExisting
}: FuzzyMatchSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Find similar items based on current input
    const suggestions = useMemo(() => {
        if (!value || value.length < 2) return []

        return existingItems
            .map(item => ({
                ...item,
                score: similarityScore(value, item.name)
            }))
            .filter(item => item.score > 0.3) // Only show items with >30% similarity
            .sort((a, b) => b.score - a.score)
            .slice(0, 5) // Top 5 matches
    }, [value, existingItems])

    // Check for exact match (case insensitive)
    const exactMatch = existingItems.find(
        item => item.name.toLowerCase() === value.toLowerCase()
    )

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={containerRef} className="relative">
            {label && (
                <label className="block text-sm font-medium text-text-main dark:text-text-main mb-2">
                    {label}
                </label>
            )}

            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => {
                        setIsOpen(true)
                    }}
                    onBlur={() => { }}
                    placeholder={placeholder}
                    className={`w-full rounded-lg border bg-surface dark:bg-sidebar px-4 py-2 text-text-main dark:text-text-main placeholder:text-muted dark:text-muted/50 focus:outline-none focus:ring-1 transition-all ${exactMatch
                        ? 'border-yellow-500/50 focus:border-yellow-500 focus:ring-yellow-500/30'
                        : 'border-border dark:border-border focus:border-brand focus:ring-ring'
                        }`}
                />

                {/* Warning icon for potential duplicate */}
                {exactMatch && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-500 text-lg">warning</span>
                    </div>
                )}
            </div>

            {/* Exact match warning */}
            {exactMatch && (
                <div className="mt-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3">
                    <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-yellow-500 text-sm mt-0.5">info</span>
                        <div className="flex-1">
                            <p className="text-sm text-yellow-400 font-medium">
                                ¡Ya existe un item con este nombre!
                            </p>
                            <p className="text-xs text-muted dark:text-muted mt-1">
                                &quot;{exactMatch.name}&quot; ya está registrado.
                                {onSelectExisting && (
                                    <button
                                        type="button"
                                        onClick={() => onSelectExisting(exactMatch)}
                                        className="ml-1 text-brand hover:underline"
                                    >
                                        Usar existente
                                    </button>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Suggestions dropdown */}
            {isOpen && suggestions.length > 0 && !exactMatch && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-border dark:border-border bg-main dark:bg-surface shadow-xl">
                    <div className="p-2 border-b border-border dark:border-border">
                        <p className="text-xs text-muted dark:text-muted">
                            <span className="material-symbols-outlined text-xs mr-1">lightbulb</span>
                            Items similares existentes:
                        </p>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {suggestions.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    if (onSelectExisting) {
                                        onSelectExisting(item)
                                    } else {
                                        onChange(item.name)
                                    }
                                    setIsOpen(false)
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-border/30 transition-colors flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-text-main dark:text-text-main">{item.name}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${item.score > 0.8
                                        ? 'bg-red-500/20 text-red-400'
                                        : item.score > 0.6
                                            ? 'bg-yellow-500/20 text-yellow-400'
                                            : 'bg-border text-muted dark:text-muted'
                                        }`}>
                                        {Math.round(item.score * 100)}% similar
                                    </span>
                                </div>
                                <span className="text-xs text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                                    Usar este →
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
