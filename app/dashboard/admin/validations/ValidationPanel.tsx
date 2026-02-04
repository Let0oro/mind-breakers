'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FuzzyMatchSelect } from '@/components/ui/FuzzyMatchSelect'



import { EditRequest } from '@/lib/types'

interface PendingCourse {
    id: string
    title: string
    summary?: string
    is_validated: boolean
    created_at: string
    organizations?: { id: string; name: string } | { id: string; name: string }[]
    draft_data?: Record<string, unknown> // Fixed any
}

interface PendingOrganization {
    id: string
    name: string
    description?: string
    website_url?: string
    is_validated: boolean
    created_at: string
}

interface PendingPath {
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
        courses: PendingCourse[]
        organizations: PendingOrganization[]
        paths: PendingPath[]
        edits: EditRequest[]
    }
    existingItems: {
        organizations: ExistingItem[]
        courses: ExistingItem[]
        paths: ExistingItem[]
    }
}

type TabType = 'organizations' | 'courses' | 'paths' | 'edits'

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

    // Helper to get org name from object or array
    const getOrgName = (org: { id: string; name: string } | { id: string; name: string }[] | undefined): string | undefined => {
        if (!org) return undefined
        if (Array.isArray(org)) return org[0]?.name
        return org.name
    }

    const tabs: { key: TabType; label: string; count: number }[] = [
        { key: 'organizations', label: 'Organizations', count: pendingItems.organizations.length },
        { key: 'courses', label: 'Courses', count: pendingItems.courses.length },
        { key: 'paths', label: 'Learning Paths', count: pendingItems.paths.length },
        { key: 'edits', label: 'Edits', count: pendingItems.edits.length },
    ]

    const [rejectionModal, setRejectionModal] = useState<{
        type: TabType | 'edits'
        id: string
    } | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')

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

    const openRejectionModal = (type: TabType | 'edits', id: string) => {
        setRejectionModal({ type, id })
        setRejectionReason('')
    }

    const handleDelete = async (type: TabType | 'edits', id: string) => {
        if (!confirm('¿Estás seguro de rechazar/eliminar este item?')) {
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
            alert('Por favor indica una razón para el rechazo.')
            return
        }

        setLoading(rejectionModal.id)
        try {
            const { type, id } = rejectionModal
            const endpoint = type === 'edits'
                ? `/api/admin/validations/edits/${id}`
                : `/api/admin/validations/${type}/${id}`

            // Use DELETE method but send reason in body?
            // DELETE usually doesn't have body.
            // Depending on API implementation.
            // If we want to "Archive" or "Reject", maybe PATCH with action='reject'?
            // The previous code used DELETE.
            // I will Assume the backend supports DELETE or I should change to PATCH.
            // The prompt says "archiving instead of deleting".
            // So I should probably use PATCH with action='reject'.

            const response = await fetch(endpoint, {
                method: 'PATCH', // Changed from DELETE to PATCH for soft rejection
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
                // Fallback to DELETE if PATCH not supported? No, stick to new logic.
                alert('Error al rechazar.')
            }
        } finally {
            setLoading(null)
        }
    }

    const handleSaveEdit = async () => {
        if (!editingItem) return

        // This is for editing NEW items (not edit requests)
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
        if (type === 'edits') return; // Cannot merge edits

        if (!confirm('¿Estás seguro de fusionar este item con el existente? El item pendiente será eliminado.')) {
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
                <div className="rounded-xl bg-white dark:bg-[#1a232e] p-12 text-center border border-gray-200 dark:border-sidebar-border">
                    <span className="material-symbols-outlined text-4xl text-[#3b4754] mb-4">check_circle</span>
                    <p className="text-gray-600 dark:text-muted-foreground">No hay organizaciones pendientes de validación</p>
                </div>
            ) : (
                pendingItems.organizations.map((org) => (
                    <div
                        key={org.id}
                        className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-sidebar-border hover:border-brand/30 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{org.name}</h3>
                                    <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                                        Pendiente
                                    </span>
                                </div>
                                {org.description && (
                                    <p className="text-sm text-gray-600 dark:text-muted-foreground mb-2 line-clamp-2">{org.description}</p>
                                )}
                                {org.website_url && (
                                    <a
                                        href={org.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-brand hover:underline"
                                    >
                                        {org.website_url}
                                    </a>
                                )}
                                <p className="text-xs text-gray-600 dark:text-muted-foreground/60 mt-2">
                                    Creado: {new Date(org.created_at).toLocaleDateString('es-ES')}
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
                                    className="p-2 rounded-lg border border-gray-200 dark:border-sidebar-border text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-sidebar-border/50 transition-colors"
                                    title="Editar"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button
                                    onClick={() => handleApprove('organizations', org.id)}
                                    disabled={loading === org.id}
                                    className="px-4 py-2 rounded-lg bg-green-600 text-gray-900 dark:text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading === org.id ? '...' : 'Aprobar'}
                                </button>
                                <button
                                    onClick={() => handleDelete('organizations', org.id)}
                                    disabled={loading === org.id}
                                    className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors"
                                    title="Eliminar"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>

                        {/* Fuzzy match suggestions */}
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

    const renderCourses = () => (
        <div className="space-y-4">
            {pendingItems.courses.length === 0 ? (
                <div className="rounded-xl bg-white dark:bg-[#1a232e] p-12 text-center border border-gray-200 dark:border-sidebar-border">
                    <span className="material-symbols-outlined text-4xl text-[#3b4754] mb-4">check_circle</span>
                    <p className="text-gray-600 dark:text-muted-foreground">No hay cursos pendientes de validación</p>
                </div>
            ) : (
                pendingItems.courses.map((course) => {
                    const isShadowDraft = !!course.draft_data
                    // Safely cast draft_data for access
                    const draft = course.draft_data as { title?: string; summary?: string; edit_reason?: string } | undefined

                    return (
                        <div
                            key={course.id}
                            className={`rounded-xl bg-white dark:bg-[#1a232e] p-6 border transition-colors ${isShadowDraft
                                ? 'border-purple-500/30 hover:border-purple-500/50'
                                : 'border-gray-200 dark:border-sidebar-border hover:border-brand/30'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                            {isShadowDraft && draft?.title ? draft.title : course.title}
                                        </h3>
                                        {isShadowDraft ? (
                                            <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400 font-bold">
                                                Edición Pendiente
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                                                Nuevo Curso
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-muted-foreground mb-2 line-clamp-2">
                                        {isShadowDraft && draft?.summary ? draft.summary : course.summary}
                                    </p>

                                    {isShadowDraft && draft?.edit_reason && (
                                        <div className="mt-2 text-sm bg-gray-50 dark:bg-[#111418] p-2 rounded text-gray-700 dark:text-gray-300">
                                            <strong>Razón del cambio:</strong> {draft.edit_reason}
                                        </div>
                                    )}

                                    {getOrgName(course.organizations) && (
                                        <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">
                                            Organización: {getOrgName(course.organizations)}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-600 dark:text-muted-foreground/60 mt-2">
                                        Actualizado: {new Date(course.created_at).toLocaleDateString('es-ES')}
                                    </p>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    {/* Preview Draft Data */}
                                    {isShadowDraft && (
                                        <details className="text-xs">
                                            <summary className="p-2 rounded-lg border cursor-pointer">JSON</summary>
                                            <pre className="absolute bg-black text-white p-4 rounded z-10 max-w-sm overflow-auto text-xs">
                                                {JSON.stringify(course.draft_data, null, 2)}
                                            </pre>
                                        </details>
                                    )}

                                    <button
                                        onClick={() => openRejectionModal('courses', course.id)}
                                        disabled={loading === course.id}
                                        className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors"
                                        title="Rechazar"
                                        aria-label="Rechazar"
                                    >
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>

                                    <button
                                        onClick={() => handleApprove('courses', course.id)}
                                        disabled={loading === course.id}
                                        className="px-4 py-2 rounded-lg bg-green-600 text-gray-900 dark:text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                        aria-label={isShadowDraft ? 'Aprobar Cambios' : 'Aprobar'}
                                    >
                                        {loading === course.id ? '...' : (isShadowDraft ? 'Aprobar Cambios' : 'Aprobar')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    )

    const renderPaths = () => (
        <div className="space-y-4">
            {pendingItems.paths.length === 0 ? (
                <div className="rounded-xl bg-white dark:bg-[#1a232e] p-12 text-center border border-gray-200 dark:border-sidebar-border">
                    <span className="material-symbols-outlined text-4xl text-[#3b4754] mb-4">check_circle</span>
                    <p className="text-gray-600 dark:text-muted-foreground">No hay learning paths pendientes de validación</p>
                </div>
            ) : (
                pendingItems.paths.map((path) => (
                    <div
                        key={path.id}
                        className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-sidebar-border hover:border-brand/30 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{path.title}</h3>
                                    <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                                        Pendiente
                                    </span>
                                </div>
                                {path.summary && (
                                    <p className="text-sm text-gray-600 dark:text-muted-foreground mb-2 line-clamp-2">{path.summary}</p>
                                )}
                                {getOrgName(path.organizations) && (
                                    <p className="text-xs text-gray-600 dark:text-muted-foreground">
                                        Organización: {getOrgName(path.organizations)}
                                    </p>
                                )}
                                <p className="text-xs text-gray-600 dark:text-muted-foreground/60 mt-2">
                                    Creado: {new Date(path.created_at).toLocaleDateString('es-ES')}
                                </p>
                            </div>

                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => setEditingItem({
                                        type: 'paths',
                                        id: path.id,
                                        name: path.title,
                                        description: path.summary,
                                    })}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-sidebar-border text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-sidebar-border/50 transition-colors"
                                    title="Editar"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button
                                    onClick={() => handleApprove('paths', path.id)}
                                    disabled={loading === path.id}
                                    className="px-4 py-2 rounded-lg bg-green-600 text-gray-900 dark:text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading === path.id ? '...' : 'Aprobar'}
                                </button>
                                <button
                                    onClick={() => handleDelete('paths', path.id)}
                                    disabled={loading === path.id}
                                    className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors"
                                    title="Eliminar"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>

                        <FuzzyMatchSuggestions
                            value={path.title}
                            existingItems={existingItems.paths}
                            onMerge={(targetId) => handleMerge('paths', path.id, targetId)}
                        />
                    </div>
                ))
            )}
        </div>
    )

    const renderEdits = () => (
        <div className="space-y-4">
            {pendingItems.edits.length === 0 ? (
                <div className="rounded-xl bg-white dark:bg-[#1a232e] p-12 text-center border border-gray-200 dark:border-sidebar-border">
                    <span className="material-symbols-outlined text-4xl text-[#3b4754] mb-4">check_circle</span>
                    <p className="text-gray-600 dark:text-muted-foreground">No hay ediciones pendientes de validación</p>
                </div>
            ) : (
                pendingItems.edits.map((item) => (
                    <div
                        key={item.id}
                        className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-sidebar-border hover:border-brand/30 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                        Edit: {item.resource_title || item.resource_id}
                                    </h3>
                                    <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                                        {item.resource_type}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-muted-foreground mb-2 font-medium">
                                    Razón: {item.reason || 'Sin razón especificada'}
                                </p>

                                {/* Diff Preview could go here */}
                                <details className="mt-2 text-xs">
                                    <summary className="cursor-pointer text-brand">Ver cambios JSON</summary>
                                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-black rounded overflow-x-auto">
                                        {JSON.stringify(item.data, null, 2)}
                                    </pre>
                                </details>

                                <p className="text-xs text-gray-600 dark:text-muted-foreground/60 mt-2">
                                    Solicitado: {new Date(item.created_at).toLocaleDateString('es-ES')}
                                </p>
                            </div>

                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => handleApprove('edits', item.id)}
                                    disabled={loading === item.id}
                                    className="px-4 py-2 rounded-lg bg-green-600 text-gray-900 dark:text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading === item.id ? '...' : 'Aprobar Edición'}
                                </button>
                                <button
                                    onClick={() => handleDelete('edits', item.id)}
                                    disabled={loading === item.id}
                                    className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors"
                                    title="Rechazar"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    )

    return (
        <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-sidebar-border pb-4 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.key
                            ? 'bg-brand text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-sidebar-border/50'
                            }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`px-1.5 py-0.5 rounded text-xs ${activeTab === tab.key
                                ? 'bg-white/20'
                                : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'organizations' && renderOrganizations()}
            {activeTab === 'courses' && renderCourses()}
            {activeTab === 'paths' && renderPaths()}
            {activeTab === 'edits' && renderEdits()}

            {/* Edit Modal (for legacy creations, not edits of edits) */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    {/* ... Existing Modal Content ... */}
                    <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#1a232e] border border-gray-200 dark:border-sidebar-border p-6 mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Item</h2>
                            <button
                                onClick={() => setEditingItem(null)}
                                className="p-2 text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <FuzzyMatchSelect
                                label={editingItem.type === 'organizations' ? 'Nombre' : 'Título'}
                                value={editingItem.name}
                                onChange={(name) => setEditingItem({ ...editingItem, name })}
                                existingItems={existingItems[editingItem.type as 'organizations' | 'courses' | 'paths']}
                                placeholder="Nombre del item..."
                            />

                            {editingItem.type === 'organizations' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                        Website URL
                                    </label>
                                    <input
                                        type="url"
                                        value={editingItem.websiteUrl || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, websiteUrl: e.target.value })}
                                        className="w-full rounded-lg border border-gray-200 dark:border-sidebar-border bg-sidebar dark:bg-sidebar px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-muted-foreground/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-[#137fec]"
                                        placeholder="https://..."
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    {editingItem.type === 'organizations' ? 'Descripción' : 'Resumen'}
                                </label>
                                <textarea
                                    value={editingItem.description || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-200 dark:border-sidebar-border bg-sidebar dark:bg-sidebar px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-muted-foreground/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-[#137fec] resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingItem(null)}
                                className="flex-1 rounded-lg border border-gray-200 dark:border-sidebar-border px-4 py-2 text-sm font-medium text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-sidebar-border/50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={loading === editingItem.id}
                                className="flex-1 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-brand/80 disabled:opacity-50 transition-colors"
                            >
                                {loading === editingItem.id ? 'Guardando...' : 'Guardar y Aprobar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Rejection Modal */}
            {rejectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#1a232e] border border-gray-200 dark:border-sidebar-border p-6 mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Motivo del Rechazo</h2>
                            <button
                                onClick={() => setRejectionModal(null)}
                                className="p-2 text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Por favor explica por qué se rechaza este cambio:
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg border border-gray-200 dark:border-sidebar-border bg-sidebar dark:bg-sidebar px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-muted-foreground/50 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                                    placeholder="Ej: El contenido es inapropiado, faltan secciones, etc."
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setRejectionModal(null)}
                                className="flex-1 rounded-lg border border-gray-200 dark:border-sidebar-border px-4 py-2 text-sm font-medium text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-sidebar-border/50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmRejection}
                                disabled={loading === rejectionModal.id || !rejectionReason.trim()}
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {loading === rejectionModal.id ? 'Procesando...' : 'Confirmar Rechazo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

// Helper component for inline fuzzy match suggestions
function FuzzyMatchSuggestions({
    value,
    existingItems,
    onMerge
}: {
    value: string
    existingItems: ExistingItem[]
    onMerge: (targetId: string) => void
}) {
    // Levenshtein distance
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
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-sidebar-border">
            <p className="text-xs text-gray-600 dark:text-muted-foreground mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-yellow-400">warning</span>
                Items similares existentes:
            </p>
            <div className="flex flex-wrap gap-2">
                {similarItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onMerge(item.id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sidebar-border/50 hover:bg-gray-100 dark:hover:bg-sidebar-border transition-colors group"
                    >
                        <span className="text-sm text-gray-900 dark:text-white">{item.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${item.score > 0.8
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {Math.round(item.score * 100)}%
                        </span>
                        <span className="text-xs text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                            Fusionar →
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
}
