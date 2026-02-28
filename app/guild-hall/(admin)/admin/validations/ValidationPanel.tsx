'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FuzzyMatchSelect } from '@/components/ui/FuzzyMatchSelect'

import { EditRequest } from '@/lib/types'

interface PendingQuest {
    id: string
    title: string
    summary?: string
    is_validated: boolean
    created_at: string
    organizations?: { id: string; name: string } | { id: string; name: string }[]
    draft_data?: Record<string, unknown>
}

interface PendingOrganization {
    id: string
    name: string
    description?: string
    website_url?: string
    is_validated: boolean
    created_at: string
}

interface PendingExpedition {
    id: string
    title: string
    summary?: string
    is_validated: boolean
    created_at: string
    organizations?: { id: string; name: string } | { id: string; name: string }[]
}

interface ExistingItem {
    id: string
    name: string
}

interface ValidationPanelProps {
    pendingItems: {
        quests: PendingQuest[]
        organizations: PendingOrganization[]
        expeditions: PendingExpedition[]
        edits: EditRequest[]
    }
    existingItems: {
        organizations: ExistingItem[]
        quests: ExistingItem[]
        expeditions: ExistingItem[]
    }
}

type TabType = 'organizations' | 'quests' | 'expeditions' | 'edits'

export function ValidationPanel({ pendingItems, existingItems }: ValidationPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>('organizations')
    const [editingItem, setEditingItem] = useState<{
        type: TabType
        id: string
        name: string
        description?: string
        websiteUrl?: string
    } | null>(null)
    const [loading, setLoading] = useState<string | null>(null)
    const router = useRouter()

    // Split courses: new quests vs draft edits  
    const newQuestCourses = pendingItems.quests.filter(c => !c.draft_data)
    const draftEditCourses = pendingItems.quests.filter(c => !!c.draft_data)

    const getOrgName = (org: { id: string; name: string } | { id: string; name: string }[] | undefined): string | undefined => {
        if (!org) return undefined
        if (Array.isArray(org)) return org[0]?.name
        return org.name
    }

    const tabs: { key: TabType; label: string; count: number; icon: string }[] = [
        { key: 'organizations', label: 'Organizations', count: pendingItems.organizations.length, icon: 'corporate_fare' },
        { key: 'quests', label: 'Quests', count: newQuestCourses.length, icon: 'school' },
        { key: 'expeditions', label: 'Expeditions', count: pendingItems.expeditions.length, icon: 'route' },
        { key: 'edits', label: 'Edits', count: pendingItems.edits.length + draftEditCourses.length, icon: 'edit_note' },
    ]

    const [rejectionModal, setRejectionModal] = useState<{
        type: TabType | 'edits'
        id: string
        isCourseEdit?: boolean
    } | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')

    // Draft-data preview modal
    const [draftPreviewModal, setDraftPreviewModal] = useState<PendingQuest | null>(null)

    const handleApprove = async (type: TabType | 'edits', id: string) => {
        setLoading(id)
        try {
            const endpoint = type === 'edits'
                ? `/api/admin/validations/edits/${id}`
                : `/api/admin/validations/${type}/${id}`

            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' }),
            })

            if (response.ok) {
                router.refresh()
            }
        } finally {
            setLoading(null)
        }
    }

    const openRejectionModal = (type: TabType | 'edits', id: string, isCourseEdit?: boolean) => {
        setRejectionModal({ type, id, isCourseEdit })
        setRejectionReason('')
    }

    const handleDelete = async (type: TabType | 'edits', id: string) => {
        if (!confirm('Are you sure you want to reject/delete this item?')) {
            return
        }

        setLoading(id)
        try {
            const endpoint = type === 'edits'
                ? `/api/admin/validations/edits/${id}`
                : `/api/admin/validations/${type}/${id}`

            const response = await fetch(endpoint, {
                method: 'DELETE',
            })

            if (response.ok) {
                router.refresh()
            }
        } finally {
            setLoading(null)
        }
    }

    const confirmRejection = async () => {
        if (!rejectionModal) return
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection.')
            return
        }

        setLoading(rejectionModal.id)
        try {
            const { type, id, isCourseEdit } = rejectionModal
            // Course draft edits and regular edits both use courses endpoint for rejection
            const endpoint = (type === 'edits' && !isCourseEdit)
                ? `/api/admin/validations/edits/${id}`
                : `/api/admin/validations/${type}/${id}`

            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reject',
                    rejection_reason: rejectionReason
                }),
            })

            if (response.ok) {
                setRejectionModal(null)
                router.refresh()
            } else {
                alert('Error rejecting item.')
            }
        } finally {
            setLoading(null)
        }
    }

    const handleSaveEdit = async () => {
        if (!editingItem) return
        if (editingItem.type === 'edits') return

        setLoading(editingItem.id)
        try {
            const response = await fetch(`/api/admin/validations/${editingItem.type}/${editingItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    name: editingItem.name,
                    description: editingItem.description,
                    website_url: editingItem.websiteUrl,
                }),
            })

            if (response.ok) {
                setEditingItem(null)
                router.refresh()
            }
        } finally {
            setLoading(null)
        }
    }

    const handleMerge = async (type: TabType, sourceId: string, targetId: string) => {
        if (type === 'edits') return;

        if (!confirm('Are you sure you want to merge this item with the existing one? The pending item will be deleted.')) {
            return
        }

        setLoading(sourceId)
        try {
            const response = await fetch(`/api/admin/validations/${type}/${sourceId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'merge', targetId }),
            })

            if (response.ok) {
                router.refresh()
            }
        } finally {
            setLoading(null)
        }
    }

    const renderOrganizations = () => (
        <div className="space-y-4">
            {pendingItems.organizations.length === 0 ? (
                <div className="border border-border bg-main p-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-muted mb-2 block">check_circle</span>
                    <p className="text-muted text-sm uppercase tracking-widest">No pending organizations</p>
                </div>
            ) : (
                pendingItems.organizations.map((org) => (
                    <div
                        key={org.id}
                        className="border border-border bg-main p-6 hover:border-text-main transition-colors"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-text-main truncate">{org.name}</h3>
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-500">
                                        Pending
                                    </span>
                                </div>
                                {org.description && (
                                    <p className="text-sm text-muted mb-2 line-clamp-2">{org.description}</p>
                                )}
                                {org.website_url && (
                                    <a
                                        href={org.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-text-main hover:underline"
                                    >
                                        {org.website_url}
                                    </a>
                                )}
                                <p className="text-xs text-muted mt-2">
                                    Created: {new Date(org.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => setEditingItem({
                                        type: 'organizations',
                                        id: org.id,
                                        name: org.name,
                                        description: org.description,
                                        websiteUrl: org.website_url,
                                    })}
                                    className="p-2 border border-border text-muted hover:text-text-main hover:bg-surface transition-colors"
                                    title="Edit"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button
                                    onClick={() => handleApprove('organizations', org.id)}
                                    disabled={loading === org.id}
                                    className="px-4 py-2 border border-green-500/30 text-green-500 text-xs font-bold uppercase tracking-widest hover:bg-green-500/10 disabled:opacity-50 transition-colors"
                                >
                                    {loading === org.id ? '...' : 'Approve'}
                                </button>
                                <button
                                    onClick={() => handleDelete('organizations', org.id)}
                                    disabled={loading === org.id}
                                    className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                                    title="Delete"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>

                        <FuzzyMatchSuggestions
                            value={org.name}
                            existingItems={existingItems.organizations}
                            onMerge={(targetId) => handleMerge('organizations', org.id, targetId)}
                        />
                    </div>
                ))
            )}
        </div>
    )

    const renderQuests = () => (
        <div className="space-y-4">
            {newQuestCourses.length === 0 ? (
                <div className="border border-border bg-main p-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-muted mb-2 block">check_circle</span>
                    <p className="text-muted text-sm uppercase tracking-widest">No pending quests</p>
                </div>
            ) : (
                newQuestCourses.map((quest) => {
                    const isShadowDraft = !!quest.draft_data
                    const draft = quest.draft_data as { title?: string; summary?: string; edit_reason?: string } | undefined

                    return (
                        <div
                            key={quest.id}
                            className={`border bg-main p-6 transition-colors ${isShadowDraft
                                ? 'border-purple-500/30 hover:border-purple-500/50'
                                : 'border-border hover:border-text-main'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-text-main truncate">
                                            {isShadowDraft && draft?.title ? draft.title : quest.title}
                                        </h3>
                                        {isShadowDraft ? (
                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-purple-500/20 text-purple-500">
                                                Pending Edit
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-500">
                                                New Quest
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted mb-2 line-clamp-2">
                                        {isShadowDraft && draft?.summary ? draft.summary : quest.summary}
                                    </p>

                                    {isShadowDraft && draft?.edit_reason && (
                                        <div className="mt-2 text-sm bg-surface p-2 border border-border text-text-main">
                                            <strong>Edit reason:</strong> {draft.edit_reason}
                                        </div>
                                    )}

                                    {getOrgName(quest.organizations) && (
                                        <p className="text-xs text-muted mt-1">
                                            Organization: {getOrgName(quest.organizations)}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted mt-2">
                                        Updated: {new Date(quest.created_at).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    {isShadowDraft && (
                                        <details className="text-xs">
                                            <summary className="p-2 border border-border cursor-pointer hover:bg-surface">JSON</summary>
                                            <pre className="absolute bg-inverse text-inverse p-4 z-10 max-w-sm overflow-auto text-xs">
                                                {JSON.stringify(quest.draft_data, null, 2)}
                                            </pre>
                                        </details>
                                    )}

                                    <button
                                        onClick={() => openRejectionModal('quests', quest.id)}
                                        disabled={loading === quest.id}
                                        className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                                        title="Reject"
                                    >
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>

                                    <button
                                        onClick={() => handleApprove('quests', quest.id)}
                                        disabled={loading === quest.id}
                                        className="px-4 py-2 border border-green-500/30 text-green-500 text-xs font-bold uppercase tracking-widest hover:bg-green-500/10 disabled:opacity-50 transition-colors"
                                    >
                                        {loading === quest.id ? '...' : (isShadowDraft ? 'Approve Edit' : 'Approve')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    )

    const renderExpeditions = () => (
        <div className="space-y-4">
            {pendingItems.expeditions.length === 0 ? (
                <div className="border border-border bg-main p-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-muted mb-2 block">check_circle</span>
                    <p className="text-muted text-sm uppercase tracking-widest">No pending expeditions</p>
                </div>
            ) : (
                pendingItems.expeditions.map((expedition) => (
                    <div
                        key={expedition.id}
                        className="border border-border bg-main p-6 hover:border-text-main transition-colors"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-text-main truncate">{expedition.title}</h3>
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-500">
                                        Pending
                                    </span>
                                </div>
                                {expedition.summary && (
                                    <p className="text-sm text-muted mb-2 line-clamp-2">{expedition.summary}</p>
                                )}
                                {getOrgName(expedition.organizations) && (
                                    <p className="text-xs text-muted">
                                        Organization: {getOrgName(expedition.organizations)}
                                    </p>
                                )}
                                <p className="text-xs text-muted mt-2">
                                    Created: {new Date(expedition.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => setEditingItem({
                                        type: 'expeditions',
                                        id: expedition.id,
                                        name: expedition.title,
                                        description: expedition.summary,
                                    })}
                                    className="p-2 border border-border text-muted hover:text-text-main hover:bg-surface transition-colors"
                                    title="Edit"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button
                                    onClick={() => handleApprove('expeditions', expedition.id)}
                                    disabled={loading === expedition.id}
                                    className="px-4 py-2 border border-green-500/30 text-green-500 text-xs font-bold uppercase tracking-widest hover:bg-green-500/10 disabled:opacity-50 transition-colors"
                                >
                                    {loading === expedition.id ? '...' : 'Approve'}
                                </button>
                                <button
                                    onClick={() => handleDelete('expeditions', expedition.id)}
                                    disabled={loading === expedition.id}
                                    className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                                    title="Delete"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>

                        <FuzzyMatchSuggestions
                            value={expedition.title}
                            existingItems={existingItems.expeditions}
                            onMerge={(targetId) => handleMerge('expeditions', expedition.id, targetId)}
                        />
                    </div>
                ))
            )}
        </div>
    )

    const renderEdits = () => (
        <div className="space-y-4">
            {/* Draft-edit courses (validated courses with pending draft_data) */}
            {draftEditCourses.map((course) => {
                const draft = course.draft_data as { title?: string; summary?: string; edit_reason?: string } | undefined
                return (
                    <div
                        key={course.id}
                        className="border border-purple-500/30 bg-main p-6 hover:border-purple-500/50 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-text-main truncate">
                                        {draft?.title || course.title}
                                    </h3>
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-purple-500/20 text-purple-500">
                                        Pending Edit
                                    </span>
                                </div>
                                <p className="text-sm text-muted mb-2 line-clamp-2">
                                    {draft?.summary || course.summary}
                                </p>

                                {draft?.edit_reason && (
                                    <div className="mt-2 text-sm bg-surface p-2 border border-border text-text-main">
                                        <strong>Edit reason:</strong> {draft.edit_reason}
                                    </div>
                                )}

                                {getOrgName(course.organizations) && (
                                    <p className="text-xs text-muted mt-1">
                                        Organization: {getOrgName(course.organizations)}
                                    </p>
                                )}
                                <p className="text-xs text-muted mt-2">
                                    Updated: {new Date(course.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => setDraftPreviewModal(course)}
                                    className="px-3 py-2 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-widest hover:bg-purple-500/10 transition-colors flex items-center gap-1.5"
                                    title="Preview changes"
                                >
                                    <span className="material-symbols-outlined text-sm">preview</span>
                                    Preview
                                </button>

                                <button
                                    onClick={() => openRejectionModal('quests', course.id, true)}
                                    disabled={loading === course.id}
                                    className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                                    title="Reject"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>

                                <button
                                    onClick={() => handleApprove('quests', course.id)}
                                    disabled={loading === course.id}
                                    className="px-4 py-2 border border-green-500/30 text-green-500 text-xs font-bold uppercase tracking-widest hover:bg-green-500/10 disabled:opacity-50 transition-colors"
                                >
                                    {loading === course.id ? '...' : 'Approve Edit'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            })}

            {/* Edit requests from the edit_requests table */}
            {pendingItems.edits.map((item) => (
                <div
                    key={item.id}
                    className="border border-border bg-main p-6 hover:border-text-main transition-colors"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-text-main truncate">
                                    Edit: {item.resource_title || item.resource_id}
                                </h3>
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-purple-500/20 text-purple-500">
                                    {item.resource_type}
                                </span>
                            </div>
                            <p className="text-sm text-muted mb-2">
                                Reason: {item.reason || 'No reason specified'}
                            </p>

                            <details className="mt-2 text-xs">
                                <summary className="cursor-pointer text-text-main hover:underline">View JSON Changes</summary>
                                <pre className="mt-2 p-2 bg-surface border border-border overflow-x-auto">
                                    {JSON.stringify(item.data, null, 2)}
                                </pre>
                            </details>

                            <p className="text-xs text-muted mt-2">
                                Requested: {new Date(item.created_at).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={() => handleApprove('edits', item.id)}
                                disabled={loading === item.id}
                                className="px-4 py-2 border border-green-500/30 text-green-500 text-xs font-bold uppercase tracking-widest hover:bg-green-500/10 disabled:opacity-50 transition-colors"
                            >
                                {loading === item.id ? '...' : 'Approve Edit'}
                            </button>
                            <button
                                onClick={() => openRejectionModal('edits', item.id)}
                                disabled={loading === item.id}
                                className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                                title="Reject"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {draftEditCourses.length === 0 && pendingItems.edits.length === 0 && (
                <div className="border border-border bg-main p-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-muted mb-2 block">check_circle</span>
                    <p className="text-muted text-sm uppercase tracking-widest">No pending edits</p>
                </div>
            )}
        </div>
    )

    return (
        <>
            {/* Tabs */}
            <div className="flex gap-6 mb-6 border-b border-border pb-4 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 -mb-[17px] flex items-center gap-2 whitespace-nowrap ${activeTab === tab.key
                            ? 'border-text-main text-text-main'
                            : 'border-transparent text-muted hover:text-text-main'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`px-1.5 py-0.5 text-[10px] ${activeTab === tab.key
                                ? 'bg-inverse text-inverse'
                                : 'bg-amber-500/20 text-amber-500'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'organizations' && renderOrganizations()}
            {activeTab === 'quests' && renderQuests()}
            {activeTab === 'expeditions' && renderExpeditions()}
            {activeTab === 'edits' && renderEdits()}

            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-lg border border-border bg-main p-6 mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold uppercase tracking-widest text-text-main">Edit Item</h2>
                            <button
                                onClick={() => setEditingItem(null)}
                                className="p-2 text-muted hover:text-text-main transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <FuzzyMatchSelect
                                label={editingItem.type === 'organizations' ? 'Name' : 'Title'}
                                value={editingItem.name}
                                onChange={(name) => setEditingItem({ ...editingItem, name })}
                                existingItems={existingItems[editingItem.type as 'organizations' | 'quests' | 'expeditions']}
                                placeholder="Item name..."
                            />

                            {editingItem.type === 'organizations' && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-text-main mb-2">
                                        Website URL
                                    </label>
                                    <input
                                        type="url"
                                        value={editingItem.websiteUrl || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, websiteUrl: e.target.value })}
                                        className="w-full border border-border bg-surface px-4 py-2 text-text-main placeholder:text-muted focus:border-text-main focus:outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-text-main mb-2">
                                    {editingItem.type === 'organizations' ? 'Description' : 'Summary'}
                                </label>
                                <textarea
                                    value={editingItem.description || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                    rows={3}
                                    className="w-full border border-border bg-surface px-4 py-2 text-text-main placeholder:text-muted focus:border-text-main focus:outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingItem(null)}
                                className="flex-1 px-4 py-2 border border-border text-muted text-xs font-bold uppercase tracking-widest hover:text-text-main hover:bg-surface transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={loading === editingItem.id}
                                className="flex-1 bg-inverse text-inverse px-4 py-2 text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-colors"
                            >
                                {loading === editingItem.id ? 'Saving...' : 'Save & Approve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md border border-border bg-main p-6 mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold uppercase tracking-widest text-text-main">Rejection Reason</h2>
                            <button
                                onClick={() => setRejectionModal(null)}
                                className="p-2 text-muted hover:text-text-main transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-text-main mb-2">
                                    Please explain why this is being rejected:
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                    className="w-full border border-border bg-surface px-4 py-2 text-text-main placeholder:text-muted focus:border-red-500 focus:outline-none resize-none"
                                    placeholder="e.g., Content is inappropriate, missing sections, etc."
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setRejectionModal(null)}
                                className="flex-1 px-4 py-2 border border-border text-muted text-xs font-bold uppercase tracking-widest hover:text-text-main hover:bg-surface transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRejection}
                                disabled={loading === rejectionModal.id || !rejectionReason.trim()}
                                className="flex-1 border border-red-500/30 text-red-500 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                            >
                                {loading === rejectionModal.id ? 'Processing...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Draft Preview Modal */}
            {draftPreviewModal && (
                <CourseEditPreviewModal
                    course={draftPreviewModal}
                    onClose={() => setDraftPreviewModal(null)}
                />
            )}
        </>
    )
}

// ─── CourseEditPreviewModal ───────────────────────────────────────────────────

interface CourseEditPreviewModalProps {
    course: PendingQuest
    onClose: () => void
}

function CourseEditPreviewModal({ course, onClose }: CourseEditPreviewModalProps) {
    const draft = course.draft_data as Record<string, unknown> | undefined
    if (!draft) return null

    // Fields to show in the preview
    const previewFields: { key: string; label: string }[] = [
        { key: 'title', label: 'Title' },
        { key: 'summary', label: 'Summary' },
        { key: 'description', label: 'Description' },
        { key: 'thumbnail_url', label: 'Thumbnail URL' },
        { key: 'xp_reward', label: 'XP Reward' },
    ]

    const currentValues: Record<string, unknown> = {
        title: course.title,
        summary: course.summary,
        description: (course as unknown as Record<string, unknown>).description,
        thumbnail_url: (course as unknown as Record<string, unknown>).thumbnail_url,
        xp_reward: (course as unknown as Record<string, unknown>).xp_reward,
    }

    // Get changed fields only (ignore meta fields like edit_reason)
    const changedFields = previewFields.filter(
        f => f.key in draft && draft[f.key] !== currentValues[f.key]
    )

    const unchangedFields = previewFields.filter(
        f => !(f.key in draft) || draft[f.key] === currentValues[f.key]
    )

    const editReason = draft.edit_reason as string | undefined

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl border border-border bg-main mx-4 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                    <div>
                        <h2 className="text-lg font-bold uppercase tracking-widest text-text-main">
                            Edit Preview
                        </h2>
                        <p className="text-xs text-muted mt-0.5">{course.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted hover:text-text-main transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 space-y-6 flex-1">
                    {/* Edit reason */}
                    {editReason && (
                        <div className="bg-purple-500/10 border border-purple-500/30 p-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">Edit Reason</p>
                            <p className="text-sm text-text-main">{editReason}</p>
                        </div>
                    )}

                    {/* Changed fields */}
                    {changedFields.length > 0 && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-text-main mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-amber-500">change_circle</span>
                                Changed Fields ({changedFields.length})
                            </p>
                            <div className="space-y-4">
                                {changedFields.map(({ key, label }) => (
                                    <div key={key} className="border border-border">
                                        <div className="px-3 py-1.5 bg-surface border-b border-border">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</span>
                                        </div>
                                        <div className="grid grid-cols-2 divide-x divide-border">
                                            {/* Before */}
                                            <div className="p-3">
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-red-400 mb-1.5">Before</p>
                                                <p className="text-sm text-muted break-words">
                                                    {currentValues[key] != null
                                                        ? String(currentValues[key])
                                                        : <em className="text-muted/50">empty</em>
                                                    }
                                                </p>
                                            </div>
                                            {/* After */}
                                            <div className="p-3 bg-green-500/5">
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-green-400 mb-1.5">After</p>
                                                <p className="text-sm text-text-main break-words">
                                                    {draft[key] != null
                                                        ? String(draft[key])
                                                        : <em className="text-muted/50">empty</em>
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Unchanged fields (collapsed) */}
                    {unchangedFields.length > 0 && changedFields.length > 0 && (
                        <details className="text-xs">
                            <summary className="cursor-pointer text-muted hover:text-text-main flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">expand_more</span>
                                {unchangedFields.length} unchanged field{unchangedFields.length !== 1 ? 's' : ''}
                            </summary>
                            <div className="mt-3 space-y-2 pl-4 border-l border-border">
                                {unchangedFields.map(({ key, label }) => (
                                    <div key={key} className="flex items-start gap-3">
                                        <span className="text-muted w-28 shrink-0">{label}:</span>
                                        <span className="text-text-main break-words">
                                            {currentValues[key] != null ? String(currentValues[key]) : '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}

                    {changedFields.length === 0 && (
                        <div className="text-center py-8 text-muted text-sm">
                            No recognizable field changes detected in draft data.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 border border-border text-muted text-xs font-bold uppercase tracking-widest hover:text-text-main hover:bg-surface transition-colors"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </div>
    )
}

function FuzzyMatchSuggestions({
    value,
    existingItems,
    onMerge
}: {
    value: string
    existingItems: ExistingItem[]
    onMerge: (targetId: string) => void
}) {
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

    function similarityScore(str1: string, str2: string): number {
        const maxLen = Math.max(str1.length, str2.length)
        if (maxLen === 0) return 1
        const distance = levenshteinDistance(str1, str2)
        return 1 - distance / maxLen
    }

    const similarItems = existingItems
        .map(item => ({
            ...item,
            score: similarityScore(value, item.name)
        }))
        .filter(item => item.score > 0.5)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)

    if (similarItems.length === 0) return null

    return (
        <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-amber-500">warning</span>
                Similar existing items:
            </p>
            <div className="flex flex-wrap gap-2">
                {similarItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onMerge(item.id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 border border-border hover:bg-surface transition-colors group"
                    >
                        <span className="text-sm text-text-main">{item.name}</span>
                        <span className={`text-[10px] px-1 py-0.5 ${item.score > 0.8
                            ? 'bg-red-500/20 text-red-500'
                            : 'bg-amber-500/20 text-amber-500'
                            }`}>
                            {Math.round(item.score * 100)}%
                        </span>
                        <span className="text-xs text-text-main opacity-0 group-hover:opacity-100 transition-opacity">
                            Merge →
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
}
