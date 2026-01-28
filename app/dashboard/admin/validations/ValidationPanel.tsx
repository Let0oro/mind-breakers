'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FuzzyMatchSelect } from '@/components/FuzzyMatchSelect'

interface PendingCourse {
    id: string
    title: string
    summary?: string
    is_validated: boolean
    created_at: string
    organizations?: { id: string; name: string } | { id: string; name: string }[]
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
    }
    existingItems: {
        organizations: ExistingItem[]
        courses: ExistingItem[]
        paths: ExistingItem[]
    }
}

type TabType = 'organizations' | 'courses' | 'paths'

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
    ]

    const handleApprove = async (type: TabType, id: string) => {
        setLoading(id)
        try {
            const response = await fetch(`/api/admin/validations/${type}/${id}`, {
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

    const handleDelete = async (type: TabType, id: string) => {
        if (!confirm('¿Estás seguro de eliminar este item? Esta acción no se puede deshacer.')) {
            return
        }

        setLoading(id)
        try {
            const response = await fetch(`/api/admin/validations/${type}/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                router.refresh()
            }
        } finally {
            setLoading(null)
        }
    }

    const handleSaveEdit = async () => {
        if (!editingItem) return

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
                <div className="rounded-xl bg-white dark:bg-[#1a232e] p-12 text-center border border-gray-200 dark:border-[#3b4754]">
                    <span className="material-symbols-outlined text-4xl text-[#3b4754] mb-4">check_circle</span>
                    <p className="text-gray-600 dark:text-[#b0bfcc]">No hay organizaciones pendientes de validación</p>
                </div>
            ) : (
                pendingItems.organizations.map((org) => (
                    <div
                        key={org.id}
                        className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-[#3b4754] hover:border-[#137fec]/30 transition-colors"
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
                                    <p className="text-sm text-gray-600 dark:text-[#b0bfcc] mb-2 line-clamp-2">{org.description}</p>
                                )}
                                {org.website_url && (
                                    <a
                                        href={org.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#137fec] hover:underline"
                                    >
                                        {org.website_url}
                                    </a>
                                )}
                                <p className="text-xs text-gray-600 dark:text-[#b0bfcc]/60 mt-2">
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
                                    className="p-2 rounded-lg border border-gray-200 dark:border-[#3b4754] text-gray-600 dark:text-[#b0bfcc] hover:bg-gray-100 dark:hover:bg-[#3b4754]/50 transition-colors"
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
                <div className="rounded-xl bg-white dark:bg-[#1a232e] p-12 text-center border border-gray-200 dark:border-[#3b4754]">
                    <span className="material-symbols-outlined text-4xl text-[#3b4754] mb-4">check_circle</span>
                    <p className="text-gray-600 dark:text-[#b0bfcc]">No hay cursos pendientes de validación</p>
                </div>
            ) : (
                pendingItems.courses.map((course) => (
                    <div
                        key={course.id}
                        className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-[#3b4754] hover:border-[#137fec]/30 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{course.title}</h3>
                                    <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                                        Pendiente
                                    </span>
                                </div>
                                {course.summary && (
                                    <p className="text-sm text-gray-600 dark:text-[#b0bfcc] mb-2 line-clamp-2">{course.summary}</p>
                                )}
                                {getOrgName(course.organizations) && (
                                    <p className="text-xs text-gray-600 dark:text-[#b0bfcc]">
                                        Organización: {getOrgName(course.organizations)}
                                    </p>
                                )}
                                <p className="text-xs text-gray-600 dark:text-[#b0bfcc]/60 mt-2">
                                    Creado: {new Date(course.created_at).toLocaleDateString('es-ES')}
                                </p>
                            </div>

                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => setEditingItem({
                                        type: 'courses',
                                        id: course.id,
                                        name: course.title,
                                        description: course.summary,
                                    })}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-[#3b4754] text-gray-600 dark:text-[#b0bfcc] hover:bg-gray-100 dark:hover:bg-[#3b4754]/50 transition-colors"
                                    title="Editar"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button
                                    onClick={() => handleApprove('courses', course.id)}
                                    disabled={loading === course.id}
                                    className="px-4 py-2 rounded-lg bg-green-600 text-gray-900 dark:text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading === course.id ? '...' : 'Aprobar'}
                                </button>
                                <button
                                    onClick={() => handleDelete('courses', course.id)}
                                    disabled={loading === course.id}
                                    className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors"
                                    title="Eliminar"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>

                        <FuzzyMatchSuggestions
                            value={course.title}
                            existingItems={existingItems.courses}
                            onMerge={(targetId) => handleMerge('courses', course.id, targetId)}
                        />
                    </div>
                ))
            )}
        </div>
    )

    const renderPaths = () => (
        <div className="space-y-4">
            {pendingItems.paths.length === 0 ? (
                <div className="rounded-xl bg-white dark:bg-[#1a232e] p-12 text-center border border-gray-200 dark:border-[#3b4754]">
                    <span className="material-symbols-outlined text-4xl text-[#3b4754] mb-4">check_circle</span>
                    <p className="text-gray-600 dark:text-[#b0bfcc]">No hay learning paths pendientes de validación</p>
                </div>
            ) : (
                pendingItems.paths.map((path) => (
                    <div
                        key={path.id}
                        className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-[#3b4754] hover:border-[#137fec]/30 transition-colors"
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
                                    <p className="text-sm text-gray-600 dark:text-[#b0bfcc] mb-2 line-clamp-2">{path.summary}</p>
                                )}
                                {getOrgName(path.organizations) && (
                                    <p className="text-xs text-gray-600 dark:text-[#b0bfcc]">
                                        Organización: {getOrgName(path.organizations)}
                                    </p>
                                )}
                                <p className="text-xs text-gray-600 dark:text-[#b0bfcc]/60 mt-2">
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
                                    className="p-2 rounded-lg border border-gray-200 dark:border-[#3b4754] text-gray-600 dark:text-[#b0bfcc] hover:bg-gray-100 dark:hover:bg-[#3b4754]/50 transition-colors"
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

    return (
        <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[#3b4754] pb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === tab.key
                            ? 'bg-[#137fec] text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-[#b0bfcc] hover:bg-gray-100 dark:hover:bg-[#3b4754]/50'
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

            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#1a232e] border border-gray-200 dark:border-[#3b4754] p-6 mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Item</h2>
                            <button
                                onClick={() => setEditingItem(null)}
                                className="p-2 text-gray-600 dark:text-[#b0bfcc] hover:text-gray-900 dark:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <FuzzyMatchSelect
                                label={editingItem.type === 'organizations' ? 'Nombre' : 'Título'}
                                value={editingItem.name}
                                onChange={(name) => setEditingItem({ ...editingItem, name })}
                                existingItems={existingItems[editingItem.type]}
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
                                        className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-[#f6f7f8] dark:bg-[#101922] px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc]/50 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec]"
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
                                    className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-[#f6f7f8] dark:bg-[#101922] px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc]/50 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec] resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingItem(null)}
                                className="flex-1 rounded-lg border border-gray-200 dark:border-[#3b4754] px-4 py-2 text-sm font-medium text-gray-600 dark:text-[#b0bfcc] hover:bg-gray-100 dark:hover:bg-[#3b4754]/50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={loading === editingItem.id}
                                className="flex-1 rounded-lg bg-[#137fec] px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-[#137fec]/80 disabled:opacity-50 transition-colors"
                            >
                                {loading === editingItem.id ? 'Guardando...' : 'Guardar y Aprobar'}
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
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#3b4754]">
            <p className="text-xs text-gray-600 dark:text-[#b0bfcc] mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-yellow-400">warning</span>
                Items similares existentes:
            </p>
            <div className="flex flex-wrap gap-2">
                {similarItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onMerge(item.id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#3b4754]/50 hover:bg-gray-100 dark:hover:bg-[#3b4754] transition-colors group"
                    >
                        <span className="text-sm text-gray-900 dark:text-white">{item.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${item.score > 0.8
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {Math.round(item.score * 100)}%
                        </span>
                        <span className="text-xs text-[#137fec] opacity-0 group-hover:opacity-100 transition-opacity">
                            Fusionar →
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
}
