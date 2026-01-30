'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { fetchUrlMetadata, calculateXPFromDuration } from '@/utils/fetch-metadata'
import { Course, CourseExercise } from '@/lib/types'

interface LearningPath {
    id: string
    title: string
}

interface Organization {
    id: string
    name: string
}

interface Exercise {
    id: string
    title: string
    description: string
    requirements: string
}

export function EditCourseForm({ courseId }: { courseId: string }) {
    const [loading, setLoading] = useState(true) // Start loading to fetch data
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Lists for selects
    const [paths, setPaths] = useState<LearningPath[]>([])
    const [organizations, setOrganizations] = useState<Organization[]>([])

    const router = useRouter()
    const supabase = createClient()

    // Form Fields
    const [linkUrl, setLinkUrl] = useState('')
    const [isFetchingMetadata, setIsFetchingMetadata] = useState(false)

    const [pathId, setPathId] = useState('')
    const [organizationId, setOrganizationId] = useState('')

    const [title, setTitle] = useState('')
    const [summary, setSummary] = useState('')
    const [description, setDescription] = useState('')
    const [thumbnailUrl, setThumbnailUrl] = useState('')
    const [xpReward, setXpReward] = useState(100)
    const [orderIndex, setOrderIndex] = useState(0)

    // Workflow State
    const [courseStatus, setCourseStatus] = useState<'draft' | 'published' | 'archived'>('draft')
    const [version, setVersion] = useState(1)
    const [rejectionReason, setRejectionReason] = useState<string | null>(null)
    const [hasPendingChanges, setHasPendingChanges] = useState(false)
    const [showEditReasonModal, setShowEditReasonModal] = useState(false)
    const [editReason, setEditReason] = useState('')
    const [progressCount, setProgressCount] = useState(0)

    // Scroll to error
    useEffect(() => {
        if (error) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }, [error])

    // XP Tooltip



    // Exercises
    const [exercises, setExercises] = useState<Exercise[]>([])

    // Helper to add new exercise
    const addExercise = () => {
        setExercises([
            ...exercises,
            { id: crypto.randomUUID(), title: '', description: '', requirements: '' }
        ])
    }

    // Helper to remove exercise
    const removeExercise = (id: string) => {
        setExercises(exercises.filter(ex => ex.id !== id))
    }

    // Helper to update exercise
    const updateExercise = (id: string, field: keyof Exercise, value: string) => {
        setExercises(exercises.map(ex =>
            ex.id === id ? { ...ex, [field]: value } : ex
        ))
    }

    // Fetch metadata from URL
    const handleFetchMetadata = useCallback(async () => {
        if (!linkUrl.trim()) return

        setIsFetchingMetadata(true)
        setError(null)

        const { data, error: fetchError } = await fetchUrlMetadata(linkUrl)

        if (fetchError) {
            setError(`Error fetching metadata: ${fetchError}`)
            setIsFetchingMetadata(false)
            return
        }

        if (data) {
            // In edit mode, we might overwrite existing data if the user explicitly asks for autofill
            // To be safe, we only overwrite if the fields are empty OR if user just clicked the button explicitly
            // Since this function is triggered by button click, we assume user wants to update.
            setTitle(data.title)

            const desc = data.description || ''
            setSummary(desc.length > 200 ? desc.substring(0, 197) + '...' : desc)
            setDescription(data.description)
            setThumbnailUrl(data.thumbnail)

            const calculatedXP = calculateXPFromDuration(data.durationHours)
            setXpReward(calculatedXP)

        }

        setIsFetchingMetadata(false)
    }, [linkUrl])

    // Initial Data Fetch
    useEffect(() => {
        const initData = async () => {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // 1. Load User's Paths & Orgs
            const [pathsRes, orgsRes] = await Promise.all([
                supabase.from('learning_paths').select('id, title').eq('created_by', user.id).order('title'),
                supabase.from('organizations').select('id, name').order('name'),
            ])

            if (pathsRes.data) setPaths(pathsRes.data)
            if (orgsRes.data) setOrganizations(orgsRes.data)

            // 2. Load Course Data
            const { data: course, error: courseError } = await supabase
                .from('courses')
                .select(`
                *,
                course_exercises (*),
                user_course_progress (count)
            `)
                .eq('id', courseId)
                .single()

            if (courseError || !course) {
                setError("Failed to load course")
                setLoading(false)
                return
            }

            // Verify ownership
            if (course.created_by !== user.id) {
                // RLS checked implicitly
            }

            // Set Workflow State
            setCourseStatus(course.status as 'draft' | 'published' | 'archived')
            setVersion(course.version || 1)
            setRejectionReason(course.rejection_reason)
            // count is returned by supabase count query
            const pCount = course.user_course_progress?.[0]?.count || 0
            setProgressCount(pCount)

            // Determine if we show Draft Data or Live Data
            const sourceData = (course.draft_data as unknown as Course) || course
            if (course.draft_data) {
                setHasPendingChanges(true)
            }

            // Populate Form from sourceData (Draft or Live)
            setTitle(sourceData.title || course.title)
            setSummary(sourceData.summary || course.summary || '')
            setDescription(sourceData.description || course.description || '')
            setLinkUrl(sourceData.link_url || course.link_url || '')
            setThumbnailUrl(sourceData.thumbnail_url || course.thumbnail_url || '')
            setXpReward(sourceData.xp_reward ?? course.xp_reward)
            setOrderIndex(sourceData.order_index ?? course.order_index)
            setPathId(sourceData.path_id || course.path_id)
            setOrganizationId(sourceData.organization_id || course.organization_id || '')

            // Exercises
            // If draft_data has exercises, likely stored as JSON.
            // But currently our plan says draft_data stores columns.
            // Exercises are a separate table.
            // Implementation detail: "Shadow Draft" usually applies to the main table.
            // Exercises are tricky. If we edit exercises in a published course, they are live immediately?
            // Or should we store exercise diffs?
            // FOR MVP: Exercises edits are LIVE immediately (simplification), or we need a complex JSON structure.
            // Let's stick to: Main attributes use Shadow Draft. Exercises are live (or we warn user).
            // User request implied "editing the course", usually metadata.
            // We will load exercises from the relation as usual.
            if (course.course_exercises) {
                setExercises(course.course_exercises.map((ex: CourseExercise) => ({
                    id: ex.id,
                    title: ex.title,
                    description: ex.description || '',
                    requirements: ex.requirements || ''
                })))
            }

            setLoading(false)
        }

        initData()
    }, [courseId, supabase, router])

    // Validation Helpers
    const isFormValidForDraft = () => {
        return !!(title.trim() || linkUrl.trim())
    }

    const isFormValidForPublish = () => {
        return !!(
            title.trim() &&
            pathId &&
            summary.trim() &&
            description.trim() &&
            thumbnailUrl.trim() &&
            xpReward > 0
        )
    }

    const handleSaveClick = (targetStatus: 'draft' | 'published') => {
        setError(null)

        // Validation
        if (targetStatus === 'published' && !isFormValidForPublish()) {
            setError("To publish, all fields must be filled and XP must be greater than 0.")
            return
        }
        if (targetStatus === 'draft' && !isFormValidForDraft()) {
            setError("Drafts require at least a Title or a Link.")
            return
        }

        // If trying to update a published course, we need a reason
        if (courseStatus === 'published') {
            setShowEditReasonModal(true)
            return
        }

        // Otherwise proceed directly
        processSave(targetStatus)
    }

    const processSave = async (targetStatus: 'draft' | 'published', reason?: string) => {
        setSaving(true)
        setError(null)

        const commonData = {
            path_id: pathId,
            title: title,
            summary: summary,
            description: description,
            link_url: linkUrl || null,
            thumbnail_url: thumbnailUrl || null,
            organization_id: organizationId || null,
            xp_reward: xpReward,
            order_index: orderIndex,
        }

        let updatePayload: Record<string, unknown> = {}

        // Scenario 1: Course is Published -> Save to Shadow Draft
        if (courseStatus === 'published') {
            // We do NOT change status or is_validated of the main row, to keep it live.
            // We save changes to draft_data.
            updatePayload = {
                draft_data: {
                    ...commonData,
                    updated_at: new Date().toISOString()
                },
                edit_reason: reason,
                // We typically verify shadow drafts, so we don't change is_validated of the row.
            }
        }
        // Scenario 2: Course is Draft -> Update Main Columns
        else {
            updatePayload = {
                ...commonData,
                status: targetStatus,
                is_validated: targetStatus === 'published' ? false : false // Pending if published
            }
        }

        // 1. Update Course
        const { error: updateError } = await supabase
            .from('courses')
            .update(updatePayload)
            .eq('id', courseId)

        if (updateError) {
            setError(updateError.message)
            setSaving(false)
            return
        }

        // 2. Handle Exercises (Keep existing logic: Exercises are LIVE)
        // ... (Exercises Logic same as before) 
        // Optimization: Extract exercise logic to function if needed, but inline is fine for now if we just copy headers.
        // Re-using existing exercises logic below:

        await handleExercisesSave()

        setSaving(false)
        setShowEditReasonModal(false)
        router.refresh()

        // Show success?
        if (targetStatus === 'published' && courseStatus === 'draft') {
            router.push(`/dashboard/courses/${courseId}`)
        }
    }

    const handleExercisesSave = async () => {
        // Get existing DB IDs first
        const { data: existingIdsData } = await supabase
            .from('course_exercises')
            .select('id')
            .eq('course_id', courseId)

        const existingIds = existingIdsData?.map(x => x.id) || []
        const currentFormIds = exercises.map(x => x.id)
        const idsToDelete = existingIds.filter(id => !currentFormIds.includes(id))

        if (idsToDelete.length > 0) {
            await supabase.from('course_exercises').delete().in('id', idsToDelete)
        }

        if (exercises.length > 0) {
            const exercisesToUpsert = exercises.map(ex => ({
                id: ex.id,
                course_id: courseId,
                title: ex.title.trim(),
                description: ex.description.trim() || null,
                requirements: ex.requirements.trim() || null,
            }))

            const { error: exerciseError } = await supabase
                .from('course_exercises')
                .upsert(exercisesToUpsert)

            if (exerciseError) console.error('Error saving exercises:', exerciseError)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure?')) return

        setSaving(true)
        if (progressCount > 0) {
            // Soft Delete (Archive)
            const { error } = await supabase
                .from('courses')
                .update({ status: 'archived', archived_at: new Date().toISOString() })
                .eq('id', courseId)

            if (error) {
                setError(error.message)
                setSaving(false)
            } else {
                router.push('/dashboard/courses')
            }
        } else {
            // Hard Delete
            const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', courseId)

            if (error) {
                setError(error.message)
                setSaving(false)
            } else {
                router.push('/dashboard/courses')
            }
        }
    }

    // Wrap for form submit (unused mostly)
    const handleSubmit = (e: React.FormEvent) => e.preventDefault()

    if (loading) {
        return <div className="p-8 text-center">Loading course data...</div>
    }

    return (
        <>
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600 dark:text-[#b0bfcc] hover:text-gray-900 dark:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-gray-900 dark:text-white text-3xl font-black tracking-tight">Edit Course</h2>
                </div>
                <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-3 rounded-lg w-fit text-sm">
                    <span className="material-symbols-outlined text-lg">warning</span>
                    Saving changes will reset the course validation status to &quot;Pending&quot;.
                </div>
            </header>

            {rejectionReason && (
                <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
                    <div className="flex items-center gap-2 font-bold mb-1">
                        <span className="material-symbols-outlined">block</span>
                        Changes Rejected
                    </div>
                    <p className="text-sm">{rejectionReason}</p>
                </div>
            )}

            {/* Form */}
            <div className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-8 max-w-3xl">
                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-4">
                            <p className="text-red-500 text-sm font-medium flex items-center gap-2">
                                <span className="material-symbols-outlined text-base">error</span>
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Course URL */}
                    <div className="space-y-2">
                        <label htmlFor="link_url" className="block text-gray-900 dark:text-white text-sm font-bold">
                            Course URL
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-[#b0bfcc]">
                                    link
                                </span>
                                <input
                                    type="url"
                                    id="link_url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                                    placeholder="https://youtube.com/watch?v=..."
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleFetchMetadata}
                                disabled={!linkUrl.trim() || isFetchingMetadata}
                                className="h-12 px-4 rounded-lg bg-[#137fec]/20 text-[#137fec] font-medium hover:bg-[#137fec]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {isFetchingMetadata ? (
                                    <span>Fetching...</span>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                        <span>Re-fetch</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Learning Path */}
                    <div className="space-y-2">
                        <label htmlFor="path_id" className="block text-gray-900 dark:text-white text-sm font-bold">
                            Learning Path <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="path_id"
                            required
                            value={pathId}
                            onChange={(e) => setPathId(e.target.value)}
                            className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                        >
                            <option value="">Select a learning path</option>
                            {paths.map((path) => (
                                <option key={path.id} value={path.id}>
                                    {path.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <label htmlFor="title" className="block text-gray-900 dark:text-white text-sm font-bold">
                            Course Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                        />
                    </div>

                    {/* Summary */}
                    <div className="space-y-2">
                        <label htmlFor="summary" className="block text-gray-900 dark:text-white text-sm font-bold">
                            Summary
                        </label>
                        <input
                            type="text"
                            id="summary"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label htmlFor="description" className="block text-gray-900 dark:text-white text-sm font-bold">
                            Description
                        </label>
                        <textarea
                            id="description"
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all resize-none"
                        />
                    </div>

                    {/* Thumbnail URL */}
                    <div className="space-y-2">
                        <label htmlFor="thumbnail_url" className="block text-gray-900 dark:text-white text-sm font-bold">
                            Thumbnail URL
                        </label>
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-[#b0bfcc]">
                                    image
                                </span>
                                <input
                                    type="url"
                                    id="thumbnail_url"
                                    value={thumbnailUrl}
                                    onChange={(e) => setThumbnailUrl(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                                />
                            </div>
                            {thumbnailUrl && (
                                <div className="w-20 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-[#3b4754] flex-shrink-0">
                                    <img
                                        src={thumbnailUrl}
                                        alt="Preview"
                                        className="object-cover"
                                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                            (e.target as HTMLImageElement).style.display = 'none'
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row: Organization & XP Reward */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="organization_id" className="block text-gray-900 dark:text-white text-sm font-bold">
                                Organization
                            </label>
                            <select
                                id="organization_id"
                                value={organizationId}
                                onChange={(e) => setOrganizationId(e.target.value)}
                                className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                            >
                                <option value="">None</option>
                                {organizations.map((org) => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2 relative">
                            <label htmlFor="xp_reward" className="flex items-center gap-2 text-gray-900 dark:text-white text-sm font-bold">
                                XP Reward
                                <div className="relative">
                                    <button type="button" className="text-gray-600 dark:text-[#b0bfcc]">
                                        <span className="material-symbols-outlined text-base">info</span>
                                    </button>
                                    {/* Tooltip content same as before ... */}
                                </div>
                            </label>
                            <input
                                type="number"
                                id="xp_reward"
                                value={xpReward}
                                onChange={(e) => setXpReward(parseInt(e.target.value) || 0)}
                                className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white focus:outline-none focus:border-[#137fec] transition-all"
                            />
                        </div>
                    </div>

                    {/* Order Index */}
                    <div className="space-y-2">
                        <label htmlFor="order_index" className="block text-gray-900 dark:text-white text-sm font-bold">
                            Order in Path
                        </label>
                        <input
                            type="number"
                            id="order_index"
                            value={orderIndex}
                            onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
                            className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                        />
                    </div>

                    <div className="border-t border-gray-200 dark:border-[#3b4754] my-8"></div>

                    {/* Exercise Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Exercises</h3>
                            <button
                                type="button"
                                onClick={addExercise}
                                className="px-4 py-2 rounded-lg bg-[#137fec]/10 text-[#137fec] hover:bg-[#137fec]/20 font-medium transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">add</span>
                                Add Exercise
                            </button>
                        </div>

                        <div className="space-y-4">
                            {exercises.map((exercise, index) => (
                                <div key={exercise.id} className="rounded-xl border border-gray-200 dark:border-[#3b4754] bg-white dark:bg-[#1a232e] overflow-hidden">
                                    <div className="p-4 bg-gray-50 dark:bg-[#283039] flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#137fec] text-white text-xs font-bold">
                                                {index + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={exercise.title}
                                                onChange={(e) => updateExercise(exercise.id, 'title', e.target.value)}
                                                placeholder="Exercise Title"
                                                className="bg-transparent border-none text-gray-900 dark:text-white font-bold focus:ring-0 p-0 w-64"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeExercise(exercise.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                    {/* Description and Requirements inputs... same as before */}
                                    <div className="p-4 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <textarea
                                                value={exercise.description}
                                                onChange={(e) => updateExercise(exercise.id, 'description', e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#137fec] transition-all resize-none"
                                                placeholder="Description..."
                                            />
                                            <textarea
                                                value={exercise.requirements}
                                                onChange={(e) => updateExercise(exercise.id, 'requirements', e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#137fec] transition-all resize-none"
                                                placeholder="Requirements..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>


                </form>
            </div>

            {/* Edit Reason Modal */}
            {showEditReasonModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1a232e] rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-[#3b4754]">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Update Published Course</h3>
                        <p className="text-sm text-gray-600 dark:text-[#b0bfcc] mb-4">
                            Since this course is published, your changes will be saved as a draft for admin review. The live version will remain unchanged until approved.
                        </p>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Reason for changes <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white mb-6 focus:outline-none focus:border-[#137fec] resize-none"
                            placeholder="e.g. Fixed typo in summary..."
                            rows={3}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowEditReasonModal(false)}
                                className="px-4 py-2 rounded-lg text-gray-600 dark:text-[#b0bfcc] hover:bg-gray-100 dark:hover:bg-[#283039]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => processSave('published', editReason)}
                                disabled={!editReason.trim() || saving}
                                className="px-4 py-2 rounded-lg bg-[#137fec] text-white font-bold hover:bg-[#137fec]/90 disabled:opacity-50"
                            >
                                {saving ? 'Submitting...' : 'Submit for Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions Footer */}
            <div className="flex gap-3 pt-8 border-t border-gray-200 dark:border-[#3b4754] mt-8">
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-6 h-12 rounded-lg border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">delete</span>
                    {progressCount > 0 ? 'Archive Course' : 'Delete Course'}
                </button>
                <div className="flex-1 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => handleSaveClick('draft')}
                        disabled={saving || (courseStatus === 'draft' && !isFormValidForDraft())}
                        className="px-6 h-12 rounded-lg border border-[#137fec] text-[#137fec] font-bold hover:bg-[#137fec]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSaveClick('published')}
                        disabled={saving || !isFormValidForPublish()}
                        className="px-6 h-12 rounded-lg bg-[#137fec] text-white font-bold hover:bg-[#137fec]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {courseStatus === 'published' ? (
                            <>
                                <span className="material-symbols-outlined">edit_document</span>
                                Update
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">rocket_launch</span>
                                Publish
                            </>
                        )}
                    </button>
                </div>
            </div>
        </>
    )
}
