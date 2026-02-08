'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminRequest, Profile } from '@/lib/types'

interface AdminRequestWithProfile extends Omit<AdminRequest, 'profiles'> {
    profiles?: Pick<Profile, 'id' | 'username'>
}

export function AdminRequestsClient({ initialRequests }: { initialRequests: AdminRequestWithProfile[] }) {
    const [requests, setRequests] = useState(initialRequests)
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
    const [loading, setLoading] = useState<string | null>(null)
    const router = useRouter()

    const filteredRequests = requests.filter(r => r.status === activeTab)

    const handleApprove = async (id: string) => {
        setLoading(id)
        try {
            const res = await fetch(`/api/admin/requests/${id}/approve`, {
                method: 'POST',
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to approve request')
            }

            setRequests(prev => prev.map(r =>
                r.id === id
                    ? { ...r, status: 'approved' as const, reviewed_at: new Date().toISOString() }
                    : r
            ))

            router.refresh()
        } catch (error: unknown) {
            alert(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(null)
        }
    }

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to reject this request?')) return

        setLoading(id)
        try {
            const res = await fetch(`/api/admin/requests/${id}/reject`, {
                method: 'POST',
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to reject request')
            }

            setRequests(prev => prev.map(r =>
                r.id === id
                    ? { ...r, status: 'rejected' as const, reviewed_at: new Date().toISOString() }
                    : r
            ))

            router.refresh()
        } catch (error: unknown) {
            alert(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(null)
        }
    }

    const tabs = [
        { key: 'pending' as const, label: 'Pending', icon: 'pending' },
        { key: 'approved' as const, label: 'Approved', icon: 'check_circle' },
        { key: 'rejected' as const, label: 'Rejected', icon: 'cancel' },
    ]

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-6 border-b border-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 -mb-px flex items-center gap-2 ${activeTab === tab.key
                            ? 'border-text-main text-text-main'
                            : 'border-transparent text-muted hover:text-text-main'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                        {tab.label}
                        <span className={`px-1.5 py-0.5 text-[10px] ${activeTab === tab.key ? 'bg-inverse text-inverse' : 'bg-surface text-muted'}`}>
                            {requests.filter(r => r.status === tab.key).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Requests List */}
            {filteredRequests.length > 0 ? (
                <div className="space-y-4">
                    {filteredRequests.map((request) => (
                        <div
                            key={request.id}
                            className="border border-border bg-main p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-surface flex items-center justify-center border border-border">
                                            <span className="material-symbols-outlined text-text-main">person</span>
                                        </div>
                                        <div>
                                            <h3 className="text-text-main font-bold">{request.profiles?.username || 'Unknown User'}</h3>
                                            <p className="text-muted text-xs">
                                                Requested on {new Date(request.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Reason:</p>
                                        <p className="text-text-main text-sm bg-surface p-3 border border-border">
                                            {request.reason}
                                        </p>
                                    </div>

                                    {request.reviewed_at && (
                                        <p className="text-muted text-xs mt-3">
                                            Reviewed on {new Date(request.reviewed_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                {request.status === 'pending' && (
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleApprove(request.id)}
                                            disabled={loading === request.id}
                                            className="flex items-center gap-2 h-10 px-4 border border-green-500/30 text-green-500 text-xs font-bold uppercase tracking-widest hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                            {loading === request.id ? '...' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => handleReject(request.id)}
                                            disabled={loading === request.id}
                                            className="flex items-center gap-2 h-10 px-4 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <span className="material-symbols-outlined text-sm">cancel</span>
                                            {loading === request.id ? '...' : 'Reject'}
                                        </button>
                                    </div>
                                )}

                                {request.status === 'approved' && (
                                    <div className="px-4 py-2 border border-green-500/30">
                                        <span className="text-green-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                            Approved
                                        </span>
                                    </div>
                                )}

                                {request.status === 'rejected' && (
                                    <div className="px-4 py-2 border border-red-500/30">
                                        <span className="text-red-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">cancel</span>
                                            Rejected
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="border border-border bg-main p-12 text-center">
                    <span className="material-symbols-outlined text-6xl text-muted mb-4 block">inbox</span>
                    <p className="text-muted text-sm uppercase tracking-widest">No {activeTab} requests</p>
                </div>
            )}
        </div>
    )
}
