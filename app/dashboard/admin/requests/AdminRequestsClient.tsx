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

            // Update local state
            setRequests(prev => prev.map(r =>
                r.id === id
                    ? { ...r, status: 'approved' as const, reviewed_at: new Date().toISOString() }
                    : r
            ))

            router.refresh()
        } catch (error: any) {
            alert(error.message)
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

            // Update local state
            setRequests(prev => prev.map(r =>
                r.id === id
                    ? { ...r, status: 'rejected' as const, reviewed_at: new Date().toISOString() }
                    : r
            ))

            router.refresh()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-[#3b4754]">
                {(['pending', 'approved', 'rejected'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors capitalize ${activeTab === tab
                            ? 'border-[#137fec] text-[#137fec]'
                            : 'border-transparent text-gray-600 dark:text-[#b0bfcc] hover:text-gray-900 dark:text-white'
                            }`}
                    >
                        {tab} ({requests.filter(r => r.status === tab).length})
                    </button>
                ))}
            </div>

            {/* Requests List */}
            {filteredRequests.length > 0 ? (
                <div className="space-y-4">
                    {filteredRequests.map((request) => (
                        <div
                            key={request.id}
                            className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-[#137fec]/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[#137fec]">person</span>
                                        </div>
                                        <div>
                                            <h3 className="text-gray-900 dark:text-white font-bold">{request.profiles?.username || 'Unknown User'}</h3>
                                            <p className="text-gray-600 dark:text-[#b0bfcc] text-xs">
                                                Requested on {new Date(request.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-gray-600 dark:text-[#b0bfcc] text-sm font-medium mb-1">Reason:</p>
                                        <p className="text-gray-900 dark:text-white text-sm bg-gray-50 dark:bg-[#111418] rounded-lg p-3 border border-gray-200 dark:border-[#3b4754]">
                                            {request.reason}
                                        </p>
                                    </div>

                                    {request.reviewed_at && (
                                        <p className="text-gray-600 dark:text-[#b0bfcc] text-xs mt-3">
                                            Reviewed on {new Date(request.reviewed_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                {request.status === 'pending' && (
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleApprove(request.id)}
                                            disabled={loading === request.id}
                                            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-green-500/20 border border-green-500/30 text-green-500 font-bold hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <span className="material-symbols-outlined text-base">check_circle</span>
                                            {loading === request.id ? 'Approving...' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => handleReject(request.id)}
                                            disabled={loading === request.id}
                                            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-500 font-bold hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <span className="material-symbols-outlined text-base">cancel</span>
                                            {loading === request.id ? 'Rejecting...' : 'Reject'}
                                        </button>
                                    </div>
                                )}

                                {request.status === 'approved' && (
                                    <div className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30">
                                        <span className="text-green-500 font-bold text-sm flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base">check_circle</span>
                                            Approved
                                        </span>
                                    </div>
                                )}

                                {request.status === 'rejected' && (
                                    <div className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30">
                                        <span className="text-red-500 font-bold text-sm flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base">cancel</span>
                                            Rejected
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-12 text-center">
                    <span className="material-symbols-outlined text-6xl text-[#3b4754] mb-4 block">inbox</span>
                    <p className="text-gray-600 dark:text-[#b0bfcc] text-lg">No {activeTab} requests</p>
                </div>
            )}
        </div>
    )
}
