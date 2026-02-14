'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { FormLayout, FormField, FormActions, FormError, FormSection, FormDivider } from '@/components/ui/Form'
import SimilarItemsList from '@/components/features/SimilarItemsList'
import { fetchUrlMetadata, calculateXPFromDuration } from '@/utils/fetch-metadata'
import { Course } from '@/lib/types'

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

export default function NewCoursePage() {
  const [loading, setLoading] = useState({ draft: false, published: false })
  const [error, setError] = useState<string | null>(null)
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const router = useRouter()
  const supabase = createClient()

  // Form fields
  const [linkUrl, setLinkUrl] = useState('')
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false)
  const [metadataFetched, setMetadataFetched] = useState(false)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [xpReward, setXpReward] = useState(100)
  const [xpNeedsAttention, setXpNeedsAttention] = useState(false)
  const xpTooltipTimeout = useRef<NodeJS.Timeout | null>(null)
  const [orderIndex, setOrderIndex] = useState(0)
  const [pathId, setPathId] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [originUk, setOriginUk] = useState<string | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])

  const addExercise = () => {
    setExercises([...exercises, { id: crypto.randomUUID(), title: '', description: '', requirements: '' }])
  }

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id))
  }

  const updateExercise = (id: string, field: keyof Exercise, value: string) => {
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, [field]: value } : ex))
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
      if (!title || !metadataFetched) setTitle(data.title)
      if (!summary || !metadataFetched) {
        const desc = data.description || ''
        setSummary(desc.length > 200 ? desc.substring(0, 197) + '...' : desc)
      }
      if (!description || !metadataFetched) setDescription(data.description)
      if (!thumbnailUrl || !metadataFetched) setThumbnailUrl(data.thumbnail)

      const calculatedXP = calculateXPFromDuration(data.durationHours)
      setXpReward(calculatedXP)

      if (calculatedXP === 0) {
        setXpNeedsAttention(true)
        if (xpTooltipTimeout.current) clearTimeout(xpTooltipTimeout.current)
        xpTooltipTimeout.current = setTimeout(() => setXpNeedsAttention(false), 4000)
      }

      setMetadataFetched(true)
    }

    setIsFetchingMetadata(false)
  }, [linkUrl, title, summary, description, thumbnailUrl, metadataFetched])

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [pathsRes, orgsRes] = await Promise.all([
        supabase.from('learning_paths').select('id, title').eq('created_by', user.id).order('title'),
        supabase.from('organizations').select('id, name').order('name'),
      ])

      if (pathsRes.data) setPaths(pathsRes.data)
      if (orgsRes.data) setOrganizations(orgsRes.data)
    }
    fetchData()
  }, [supabase])

  useEffect(() => {
    if (error) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [error])

  const handleAdapt = async (course: Course) => {
    if (confirm('Adapt this course? This will replace your current form data.')) {
      setTitle(course.title)
      setSummary(course.summary || '')
      setDescription(course.description || '')
      setThumbnailUrl(course.thumbnail_url || '')
      setLinkUrl(course.link_url || '')
      setXpReward(course.xp_reward || 100)
      setOriginUk(course.uk)

      const { data: courseExercises } = await supabase
        .from('course_exercises')
        .select('*')
        .eq('course_id', course.id)

      if (courseExercises) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setExercises(courseExercises.map((ex: any) => ({
          id: crypto.randomUUID(),
          title: ex.title,
          description: ex.description || '',
          requirements: ex.requirements || ''
        })))
      }
    }
  }

  const isFormValidForDraft = () => !!(title.trim() || linkUrl.trim())
  const isFormValidForPublish = () => !!(title.trim() && summary.trim() && description.trim() && thumbnailUrl.trim() && xpReward > 0 && pathId)

  const handleSaveClick = (targetStatus: 'draft' | 'published') => {
    setError(null)
    if (targetStatus === 'published' && !isFormValidForPublish()) {
      setError("To publish, all fields must be filled, a path selected, and XP > 0.")
      return
    }
    if (targetStatus === 'draft' && !isFormValidForDraft()) {
      setError("Drafts require at least a Title or a Link.")
      return
    }
    processSave(targetStatus)
  }

  const processSave = async (targetStatus: 'draft' | 'published') => {
    setLoading(p => ({ ...p, [targetStatus]: true }))
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in')
      setLoading(p => ({ ...p, [targetStatus]: false }))
      return
    }

    if (!pathId) {
      setError("Please select a learning path")
      setLoading(p => ({ ...p, [targetStatus]: false }))
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coursePayload: any = {
      path_id: pathId,
      title,
      summary,
      description,
      link_url: linkUrl || null,
      thumbnail_url: thumbnailUrl || null,
      organization_id: organizationId || null,
      xp_reward: xpReward,
      order_index: orderIndex,
      status: targetStatus,
      created_by: user.id,
      is_validated: false
    }

    if (originUk) coursePayload.uk = originUk

    const { data: courseData, error: insertError } = await supabase
      .from('courses')
      .insert(coursePayload)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(p => ({ ...p, [targetStatus]: false }))
      return
    }

    if (exercises.length > 0) {
      const validExercises = exercises.filter(ex => ex.title.trim())
      if (validExercises.length > 0) {
        const exercisesToInsert = validExercises.map(ex => ({
          course_id: courseData.id,
          title: ex.title.trim(),
          description: ex.description.trim() || null,
          requirements: ex.requirements.trim() || null,
        }))

        await supabase.from('course_exercises').insert(exercisesToInsert)
      }
    }

    router.push(`/guild-hall/quests/${courseData.id}`)
  }

  return (
    <div className="flex gap-8 flex-col lg:flex-row items-start">
      <div className="flex-1 w-full">
        <FormLayout title="New Quest" subtitle="Add a new quest to an existing expedition">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <FormError message={error} />

            {/* URL with Auto-fill */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-main">
                Quest URL
                {metadataFetched && <span className="text-[10px] font-normal normal-case text-green-500">✓ Metadata loaded</span>}
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
                      Auto-fill
                    </>
                  )}
                </button>
              </div>
              <SimilarItemsList type="courses" query={linkUrl} onAdapt={handleAdapt} />
            </div>

            <FormField
              label="Learning Path"
              name="path_id"
              type="select"
              value={pathId}
              onChange={setPathId}
              required
            >
              <option value="">Select a learning path</option>
              {paths.map((path) => (
                <option key={path.id} value={path.id}>{path.title}</option>
              ))}
            </FormField>

            <FormField
              label="Title"
              name="title"
              value={title}
              onChange={setTitle}
              placeholder="e.g., Introduction to React Hooks"
              required
              autoFilled={metadataFetched && !!title}
            />

            <SimilarItemsList type="courses" query={title} onAdapt={handleAdapt} />

            <FormField
              label="Summary"
              name="summary"
              value={summary}
              onChange={setSummary}
              placeholder="Brief one-liner about the quest"
              autoFilled={metadataFetched && !!summary}
            />

            <FormField
              label="Description"
              name="description"
              type="textarea"
              value={description}
              onChange={setDescription}
              placeholder="What will adventurers find in this quest?"
              autoFilled={metadataFetched && !!description}
            />

            {/* Thumbnail with preview */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-main">
                Thumbnail URL
                {metadataFetched && thumbnailUrl && <span className="text-[10px] font-normal normal-case text-green-500">✓ Auto-filled</span>}
              </label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted text-lg">image</span>
                  <input
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-surface border border-border text-text-main placeholder:text-muted focus:outline-none focus:border-text-main transition-all"
                    placeholder="https://example.com/image.jpg"
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
                onChange={(v) => { setXpReward(parseInt(v) || 0); setXpNeedsAttention(false) }}
                min={0}
                max={300}
                step={25}
                needsAttention={xpNeedsAttention}
                autoFilled={metadataFetched && xpReward > 0}
              />
            </div>

            <FormField
              label="Order in Path"
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
              saving={loading.draft}
              publishing={loading.published}
              canSave={isFormValidForDraft()}
              canPublish={isFormValidForPublish()}
              publishLabel="Publish Quest"
            />
          </form>
        </FormLayout>
      </div>

      {/* Sidebar Tips */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="border border-border p-6 sticky top-6">
          <h4 className="font-bold text-xs uppercase tracking-widest text-text-main mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">lightbulb</span>
            Pro Tips
          </h4>
          <ul className="text-xs text-muted space-y-3">
            <li>• Use clear, descriptive titles.</li>
            <li>• Add a high-quality thumbnail.</li>
            <li>• Check for existing quests before creating a new one.</li>
            <li>• You can adapt existing quests to your expedition!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
