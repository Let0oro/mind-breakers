'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { PathResource } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface PathResourcesProps {
    pathId: string
    initialResources?: PathResource[]
}

export default function PathResources({ pathId, initialResources = [] }: PathResourcesProps) {
    const [resources, setResources] = useState<PathResource[]>(initialResources)
    const [isAdmin, setIsAdmin] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const router = useRouter()

    // Form state
    const [isAdding, setIsAdding] = useState(false)
    const [title, setTitle] = useState('')
    const [linkType, setLinkType] = useState<'link' | 'text'>('link')
    const [content, setContent] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const supabase = useMemo(() => createClient(), [])

    // Sync state with server data when it changes (e.g. after router.refresh())
    useEffect(() => {
        setResources(initialResources)
    }, [initialResources])

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setCurrentUserId(user.id)
                // Check if admin
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single()

                if (profile?.is_admin) setIsAdmin(true)
            }
        }

        checkUser()
    }, [supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentUserId) return

        setSubmitting(true)
        const { error } = await supabase
            .from('path_resources')
            .insert({
                path_id: pathId,
                user_id: currentUserId,
                title,
                type: linkType,
                content
            })

        if (!error) {
            setTitle('')
            setContent('')
            setIsAdding(false)
            router.refresh()
        } else {
            alert('Error adding resource: ' + error.message)
        }
        setSubmitting(false)
    }

    const handleDelete = async (resourceId: string) => {
        if (!confirm('Are you sure you want to delete this resource?')) return

        const { error } = await supabase
            .from('path_resources')
            .delete()
            .eq('id', resourceId)

        if (!error) {
            // Optimistic update
            setResources(prev => prev.filter(r => r.id !== resourceId))
            router.refresh()
        } else {
            alert('Error deleting resource')
        }
    }

    return (
        <div className="mt-8 rounded-xl bg-main dark:bg-surface p-6 border border-border dark:border-border">
            <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-brand">library_books</span>
                    <h2 className="text-lg font-bold text-text-main dark:text-text-main">
                        Recommended Resources
                    </h2>
                </div>
                {!isAdding ? (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-sm font-medium text-brand hover:underline flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-base">add</span>
                        Add Resource
                    </button>
                ) : (
                    <button
                        onClick={() => setIsAdding(false)}
                        className="text-sm font-medium text-muted hover:text-text-main dark:text-muted"
                    >
                        Cancel
                    </button>
                )}
            </div>

            {/* Add Form */}
            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-8 p-4 bg-surface dark:bg-main rounded-lg border border-border dark:border-border">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-text-main dark:text-gray-300 mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full px-3 py-2 rounded-md border border-border dark:border-border bg-main dark:bg-surface text-sm"
                                placeholder="e.g. Official Documentation"
                            />
                        </div>

                        <div className="flex gap-4">
                            <div>
                                <label className="block text-xs font-bold text-text-main dark:text-gray-300 mb-1">Type</label>
                                <select
                                    value={linkType}
                                    onChange={(e) => setLinkType(e.target.value as 'link' | 'text')}
                                    className="px-3 py-2 rounded-md border border-border dark:border-border bg-main dark:bg-surface text-sm"
                                >
                                    <option value="link">Link (URL)</option>
                                    <option value="text">Text / Concept</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-text-main dark:text-gray-300 mb-1">
                                    {linkType === 'link' ? 'URL' : 'Description'}
                                </label>
                                <input
                                    type="text"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 rounded-md border border-border dark:border-border bg-main dark:bg-surface text-sm"
                                    placeholder={linkType === 'link' ? 'https://...' : 'Explain the concept...'}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-brand text-text-main rounded-md text-sm font-bold hover:bg-brand/90 disabled:opacity-50"
                            >
                                {submitting ? 'Adding...' : 'Add Resource'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* List */}
            {resources.length > 0 ? (
                <div className="space-y-3">
                    {resources.map((resource) => (
                        <div
                            key={resource.id}
                            className="flex items-start justify-between p-3 rounded-lg border border-border dark:border-border hover:bg-surface dark:hover:bg-sidebar-border/20 transition-colors group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-1">
                                    {resource.type === 'link' ? (
                                        <span className="material-symbols-outlined text-green-500 text-xl">link</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-amber-500 text-xl">article</span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-medium text-text-main dark:text-text-main text-sm">
                                        {resource.type === 'link' ? (
                                            <a href={resource.content} target="_blank" rel="noopener noreferrer" className="hover:text-brand hover:underline">
                                                {resource.title}
                                                <span className="material-symbols-outlined text-[10px] ml-1 align-top">open_in_new</span>
                                            </a>
                                        ) : (
                                            <span>{resource.title}</span>
                                        )}
                                    </h4>
                                    <p className="text-sm text-muted text-wrap break-all line-clamp-2 max-w-xs truncate dark:text-muted mt-0.5">
                                        {resource.type === 'link' ? resource.content : resource.content}
                                    </p>
                                    <div className="text-xs text-muted mt-1 flex items-center gap-1">
                                        {resource.profiles?.avatar_url && (
                                            <img src={resource.profiles.avatar_url} className="w-4 h-4 rounded-full" alt="" />
                                        )}
                                        <span>Added by {resource.profiles?.username || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>

                            {(isAdmin || currentUserId === resource.user_id) && (
                                <button
                                    onClick={() => handleDelete(resource.id)}
                                    className="text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                    title="Delete resource"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted dark:text-muted text-sm py-4 italic">
                    No resources added yet. Be the first to share something!
                </p>
            )}
        </div>
    )
}
