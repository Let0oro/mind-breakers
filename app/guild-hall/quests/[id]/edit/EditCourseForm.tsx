'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { fetchUrlMetadata, calculateXPFromDuration } from '@/utils/fetch-metadata'
import { Course, CourseExercise } from '@/lib/types'
import { FormLayout, FormField, FormActions, FormError, FormSection, FormDivider } from '@/components/ui/Form'

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
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
    const [showEditReasonModal, setShowEditReasonModal] = useState(false)
    const [editReason, setEditReason] = useState('')
    const [progressCount, setProgressCount] = useState(0)

    useEffect(() => {
        if (error) window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [error])

    // Exercises
    const [exercises, setExercises] = useState<Exercise[]>([])

    const addExercise = () => {
        setExercises([
            ...exercises,
            { id: crypto.randomUUID(), title: '', description: '', requirements: '' }
        ])
    }

    const removeExercise = (id: string) => {
        setExercises(exercises.filter(ex => ex.id !== id))
    }

    const updateExercise = (id: string, field: keyof Exercise, value: string) => {
        setExercises(exercises.map(ex =>
            ex.id === id ? { ...ex, [field]: value } : ex
        ))
    }

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

    useEffect(() => {
        const initData = async () => {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const [pathsRes, orgsRes] = await Promise.all([
                supabase.from('learning_paths').select('id, title').eq('created_by', user.id).order('title'),
                supabase.from('organizations').select('id, name').order('name'),
            ])

            if (pathsRes.data) setPaths(pathsRes.data)
            if (orgsRes.data) setOrganizations(orgsRes.data)

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

            setCourseStatus(course.status as 'draft' | 'published' | 'archived')
            const pCount = course.user_course_progress?.[0]?.count || 0
            setProgressCount(pCount)

            const sourceData = (course.draft_data as unknown as Course) || course

            setTitle(sourceData.title || course.title)
            setSummary(sourceData.summary || course.summary || '')
            setDescription(sourceData.description || course.description || '')
            setLinkUrl(sourceData.link_url || course.link_url || '')
            setThumbnailUrl(sourceData.thumbnail_url || course.thumbnail_url || '')
            setXpReward(sourceData.xp_reward ?? course.xp_reward)
            setOrderIndex(sourceData.order_index ?? course.order_index)
            setPathId(sourceData.path_id || course.path_id)
            setOrganizationId(sourceData.organization_id || course.organization_id || '')

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

    const isFormValidForDraft = () => !!(title.trim() || linkUrl.trim())

    const isFormValidForPublish = () => !!(
        title.trim() &&
        pathId &&
        summary.trim() &&
        description.trim() &&
        thumbnailUrl.trim() &&
        xpReward > 0
    )

    const handleSaveClick = (targetStatus: 'draft' | 'published') => {
        setError(null)

        if (targetStatus === 'published' && !isFormValidForPublish()) {
            setError("To publish, all fields must be filled and XP must be greater than 0.")
            return
        }
        if (targetStatus === 'draft' && !isFormValidForDraft()) {
            setError("Drafts require at least a Title or a Link.")
            return
        }

        if (courseStatus === 'published') {
            setShowEditReasonModal(true)
            return
        }

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

        if (courseStatus === 'published') {
            updatePayload = {
                draft_data: {
                    ...commonData,
                    updated_at: new Date().toISOString()
                },
                edit_reason: reason,
            }
        } else {
            updatePayload = {
                ...commonData,
                status: targetStatus,
                is_validated: false
            }
        }

        const { error: updateError } = await supabase
            .from('courses')
            .update(updatePayload)
            .eq('id', courseId)

        if (updateError) {
            setError(updateError.message)
            setSaving(false)
            return
        }

        await handleExercisesSave()

        setSaving(false)
        setShowEditReasonModal(false)
        router.refresh()

        if (targetStatus === 'published' && courseStatus === 'draft') {
            router.push(`/guild-hall/quests/${courseId}`)
        }
    }

    const handleExercisesSave = async () => {
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
            const { error } = await supabase
                .from('courses')
                .update({ status: 'archived', archived_at: new Date().toISOString() })
                .eq('id', courseId)

            if (error) {
                setError(error.message)
                setSaving(false)
            } else {
                router.push('/guild-hall/quests')
            }
        } else {
            const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', courseId)

            if (error) {
                setError(error.message)
                setSaving(false)
            } else {
                router.push('/guild-hall/quests')
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-text-main border-t-transparent" />
            </div>
        )
    }

    return (
        <>
            <FormLayout title="Edit Quest" subtitle="Update your course details">
                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    <FormError message={error} />

                    {/* Warning Banner for Published Courses */}
                    {courseStatus === 'published' && (
                        <div className="border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
                            <span className="material-symbols-outlined text-amber-500 text-lg">warning</span>
                            <p className="text-amber-500 text-sm">
                                Saving changes will reset the quest validation status to &quot;Pending&quot;.
                            </p>
                        </div>
                    )}

                    {/* URL with Auto-fill */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-main">
                            Quest URL
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted text-lg">link</span>
                                <input
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-surface border border-border text-text-main placeholder:text-muted focus:outline-none focus:border-text-main transition-all"
                                    placeholder="https://youtube.com/watch?v=..."
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleFetchMetadata}
                                disabled={!linkUrl.trim() || isFetchingMetadata}
                                className="h-12 px-4 border border-border text-text-main text-xs font-bold uppercase tracking-widest hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {isFetchingMetadata ? 'Fetching...' : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                        Re-fetch
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <FormField
                        label="Expedition"
                        name="path_id"
                        type="select"
                        value={pathId}
                        onChange={setPathId}
                        required
                    >
                        <option value="">Select an expedition</option>
                        {paths.map((path) => (
                            <option key={path.id} value={path.id}>{path.title}</option>
                        ))}
                    </FormField>

                    <FormField
                        label="Title"
                        name="title"
                        value={title}
                        onChange={setTitle}
                        required
                    />

                    <FormField
                        label="Summary"
                        name="summary"
                        value={summary}
                        onChange={setSummary}
                    />

                    <FormField
                        label="Description"
                        name="description"
                        type="textarea"
                        value={description}
                        onChange={setDescription}
                    />

                    {/* Thumbnail with preview */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-main">
                            Thumbnail URL
                        </label>
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted text-lg">image</span>
                                <input
                                    type="url"
                                    value={thumbnailUrl}
                                    onChange={(e) => setThumbnailUrl(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-surface border border-border text-text-main placeholder:text-muted focus:outline-none focus:border-text-main transition-all"
                                />
                            </div>
                            {thumbnailUrl && (
                                <div className="w-20 h-12 border border-border overflow-hidden shrink-0 grayscale">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={thumbnailUrl} alt="Preview" className="object-cover w-full h-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            label="Organization"
                            name="organization_id"
                            type="select"
                            value={organizationId}
                            onChange={setOrganizationId}
                        >
                            <option value="">None</option>
                            {organizations.map((org) => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </FormField>

                        <FormField
                            label="XP Reward"
                            name="xp_reward"
                            type="number"
                            value={xpReward}
                            onChange={(v) => setXpReward(parseInt(v) || 0)}
                            min={0}
                            max={300}
                            step={25}
                        />
                    </div>

                    <FormField
                        label="Order in Expedition"
                        name="order_index"
                        type="number"
                        value={orderIndex}
                        onChange={(v) => setOrderIndex(parseInt(v) || 0)}
                        min={0}
                        hint="Lower numbers appear first (0 = first)"
                    />

                    <FormDivider />

                    {/* Exercises */}
                    <FormSection title="Missions">
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={addExercise}
                                className="px-4 py-2 border border-border text-text-main text-xs font-bold uppercase tracking-widest hover:bg-surface transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Add Mission
                            </button>
                        </div>

                        {exercises.length === 0 ? (
                            <div className="text-center py-8 border border-dashed border-border">
                                <p className="text-muted text-sm">No missions added yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {exercises.map((exercise, index) => (
                                    <div key={exercise.id} className="border border-border overflow-hidden">
                                        <div className="p-4 bg-surface flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center justify-center w-6 h-6 bg-inverse text-inverse text-xs font-bold">
                                                    {index + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={exercise.title}
                                                    onChange={(e) => updateExercise(exercise.id, 'title', e.target.value)}
                                                    placeholder="Mission Title"
                                                    className="bg-transparent border-none text-text-main font-bold focus:outline-none w-64"
                                                />
                                            </div>
                                            <button type="button" onClick={() => removeExercise(exercise.id)} className="text-muted hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <textarea
                                                value={exercise.description}
                                                onChange={(e) => updateExercise(exercise.id, 'description', e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 bg-surface border border-border text-text-main text-sm focus:outline-none focus:border-text-main transition-all resize-none"
                                                placeholder="Description..."
                                            />
                                            <textarea
                                                value={exercise.requirements}
                                                onChange={(e) => updateExercise(exercise.id, 'requirements', e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 bg-surface border border-border text-text-main text-sm focus:outline-none focus:border-text-main transition-all resize-none"
                                                placeholder="Requirements..."
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </FormSection>

                    <FormActions
                        onSave={() => handleSaveClick('draft')}
                        onPublish={() => handleSaveClick('published')}
                        onDelete={handleDelete}
                        saving={saving}
                        canSave={isFormValidForDraft()}
                        canPublish={isFormValidForPublish()}
                        publishLabel={courseStatus === 'published' ? 'Update' : 'Publish'}
                        deleteLabel={progressCount > 0 ? 'Archive Course' : 'Delete Course'}
                        showDelete={true}
                    />
                </form>
            </FormLayout>

            {/* Edit Reason Modal */}
            {showEditReasonModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-main border border-border p-6 max-w-md w-full">
                        <h3 className="text-xl font-black uppercase tracking-tight text-text-main mb-4">Update Published Course</h3>
                        <p className="text-sm text-muted mb-4">
                            Since this course is published, your changes will be saved as a draft for admin review. The live version will remain unchanged until approved.
                        </p>
                        <label className="block text-xs font-bold uppercase tracking-widest text-text-main mb-2">
                            Reason for changes <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            className="w-full px-4 py-3 bg-surface border border-border text-text-main mb-6 focus:outline-none focus:border-text-main resize-none"
                            placeholder="e.g. Fixed typo in summary..."
                            rows={3}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowEditReasonModal(false)}
                                className="px-6 h-10 border border-border text-text-main text-xs font-bold uppercase tracking-widest hover:bg-surface transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => processSave('published', editReason)}
                                disabled={!editReason.trim() || saving}
                                className="px-6 h-10 bg-inverse text-inverse text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
                            >
                                {saving ? 'Submitting...' : 'Submit for Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
