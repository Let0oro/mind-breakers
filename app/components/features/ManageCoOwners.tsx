'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Profile } from '@/lib/types'

interface ManageCoOwnersProps {
    pathId: string
    createdBy: string
}

interface CoOwner {
    id: string
    user_id: string
    profile: Profile
}

export function ManageCoOwners({ pathId, createdBy }: ManageCoOwnersProps) {
    const [coOwners, setCoOwners] = useState<CoOwner[]>([])
    const [newOwnerUsername, setNewOwnerUsername] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        const fetchUserAndOwners = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUserId(user?.id || null)

            if (user && user.id === createdBy) {
                fetchCoOwners()
            }
        }
        fetchUserAndOwners()
    }, [pathId, createdBy, supabase])

    const fetchCoOwners = async () => {
        const { data } = await supabase
            .from('path_owners')
            .select(`
                id,
                user_id,
                profile:profiles(*)
            `)
            .eq('path_id', pathId)

        if (data) {
            setCoOwners(data as unknown as CoOwner[])
        }
    }

    const handleAddOwner = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        try {
            // 1. Find user by username
            const { data: userProfile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', newOwnerUsername)
                .single()

            if (profileError || !userProfile) {
                throw new Error('Usuario no encontrado')
            }

            if (userProfile.id === createdBy) {
                throw new Error('Ya eres el creador de este path')
            }

            // 2. Add to path_owners
            const { error: insertError } = await supabase
                .from('path_owners')
                .insert({
                    path_id: pathId,
                    user_id: userProfile.id
                })

            if (insertError) {
                if (insertError.code === '23505') { // Unique violation
                    throw new Error('Este usuario ya es co-owner')
                }
                throw insertError
            }

            setMessage({ type: 'success', text: 'Co-owner añadido correctamente' })
            setNewOwnerUsername('')
            fetchCoOwners()

        } catch (error) {
            setMessage({ type: 'error', text: (error as Error).message || 'Error al añadir co-owner' })
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemoveOwner = async (userId: string) => {
        if (!confirm('¿Estás seguro de quitar a este usuario como co-owner?')) return

        try {
            const { error } = await supabase
                .from('path_owners')
                .delete()
                .eq('path_id', pathId)
                .eq('user_id', userId)

            if (error) throw error
            fetchCoOwners()
        } catch (error) {
            console.error('Error removing owner:', error)
            alert('Error al eliminar co-owner')
        }
    }

    if (currentUserId !== createdBy) return null

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-text-main dark:text-text-main flex items-center gap-2">
                <span className="material-symbols-outlined text-muted">group_add</span>
                Gestionar Co-owners
            </h3>

            <div className="bg-surface dark:bg-main p-4 rounded-lg border border-border dark:border-border">
                {message && (
                    <div className={`mb-4 p-2 rounded text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleAddOwner} className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newOwnerUsername}
                        onChange={(e) => setNewOwnerUsername(e.target.value)}
                        placeholder="Username del usuario..."
                        className="flex-1 rounded-lg border border-border dark:border-border bg-main dark:bg-surface px-3 py-2 text-sm text-text-main dark:text-text-main focus:border-brand focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !newOwnerUsername}
                        className="px-4 py-2 bg-brand text-text-main rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
                    >
                        Añadir
                    </button>
                </form>

                <div className="space-y-2">
                    {coOwners.length > 0 ? (
                        coOwners.map((owner) => (
                            <div key={owner.id} className="flex items-center justify-between p-2 bg-main dark:bg-surface rounded border border-border dark:border-border">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-main-dark dark:bg-gray-700 overflow-hidden">
                                        {owner.profile?.avatar_url ? (
                                            <img src={owner.profile.avatar_url} alt={owner.profile.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted uppercase">
                                                {owner.profile?.username?.[0] || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-text-main dark:text-text-main">
                                        {owner.profile?.username}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveOwner(owner.user_id)}
                                    className="text-red-500 hover:text-red-600 p-1"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted italic">No hay co-owners asignados.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
