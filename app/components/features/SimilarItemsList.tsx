'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

interface SimilarItemsListProps {
    type: 'courses' | 'learning_paths' | 'organizations'
    query: string
    currentId?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onAdapt?: (item: any) => void
}

export default function SimilarItemsList({ type, query, currentId, onAdapt }: SimilarItemsListProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const fetchSimilar = useCallback(async () => {
        if (!query || query.length < 3) {
            setItems([])
            return
        }

        setLoading(true)

        // Determine table and search column
        const table = type
        const searchColumn = type === 'organizations' ? 'name' : 'title'

        let queryBuilder = supabase
            .from(table)
            .select('*')
            .ilike(searchColumn, `%${query}%`)
            .limit(5)

        if (currentId) {
            queryBuilder = queryBuilder.neq('id', currentId)
        }

        const { data, error } = await queryBuilder

        if (!error && data) {
            setItems(data)
        }
        setLoading(false)
    }, [query, type, currentId, supabase])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchSimilar()
        }, 500) // Debounce

        return () => clearTimeout(timeoutId)
    }, [fetchSimilar])


    if (!query || items.length === 0) return null

    return (
        <div className="mt-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 animate-fade-in">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">lightbulb</span>
                Similar items found
            </h3>
            <div className="space-y-3">
                {items.map((item) => (
                    <div key={item.id} className="bg-main dark:bg-surface border border-amber-100 dark:border-amber-900/20 p-3 rounded-lg shadow-sm">
                        <h4 className="font-bold text-text-main dark:text-text-main text-sm">
                            {item.title || item.name}
                        </h4>
                        {item.description && (
                            <p className="text-xs text-muted dark:text-muted mt-1 line-clamp-2">
                                {item.description}
                            </p>
                        )}

                        {onAdapt && type === 'courses' && (
                            <button
                                type="button"
                                onClick={() => onAdapt(item)}
                                className="mt-2 text-xs font-bold text-brand hover:text-brand/80 flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">fork_right</span>
                                Adapt this course
                            </button>
                        )}

                        {type !== 'courses' && (
                            <div className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                                consider using this existing {type === 'learning_paths' ? 'path' : 'organization'}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
