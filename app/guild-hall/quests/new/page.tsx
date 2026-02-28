'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { FormLayout, FormField, FormActions, FormError, FormSection, FormDivider } from '@/components/ui/Form'
import SimilarItemsList from '@/components/features/SimilarItemsList'
import { fetchUrlMetadata, calculateXPFromDuration } from '@/utils/fetch-metadata'
import { Quest } from '@/lib/types'
import Link from 'next/link'
import { afterQuestChange } from '@/lib/cache-actions'

interface Expedition {
  id: string
  title: string
  created_by: string
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

export default function NewQuestPage() {
  const [loading, setLoading] = useState({ draft: false, published: false })
  const [error, setError] = useState<string | null>(null)
  const [expeditions, setExpeditions] = useState<Expedition[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [showXpTooltip, setShowXpTooltip] = useState(false)
  const [xpNeedsAttention, setXpNeedsAttention] = useState(false)
  const xpTooltipTimeout = useRef<NodeJS.Timeout | null>(null)
  const [orderIndex, setOrderIndex] = useState(0)
  const [expeditionId, setExpeditionId] = useState(searchParams.get('expeditionId') || '')
  const [organizationId, setOrganizationId] = useState(searchParams.get('orgId') || '')
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
        setShowXpTooltip(true)
        if (xpTooltipTimeout.current) clearTimeout(xpTooltipTimeout.current)
        xpTooltipTimeout.current = setTimeout(() => {
          setShowXpTooltip(false)
          setXpNeedsAttention(false)
        }, 4000)
      }

      setMetadataFetched(true)
    }

    setIsFetchingMetadata(false)
  }, [linkUrl, title, summary, description, thumbnailUrl, metadataFetched])

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [expeditionsRes, orgsRes] = await Promise.all([
        supabase.from('expeditions').select('id, title, created_by').eq('created_by', user.id).order('title'),
        supabase.from('organizations').select('id, name').order('name'),
      ])

      if (expeditionsRes.data) setExpeditions(expeditionsRes.data)
      if (orgsRes.data) setOrganizations(orgsRes.data)
    }
    fetchData()
  }, [supabase, searchParams])

  useEffect(() => {
    if (error) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [error])

  const handleAdapt = async (quest: Quest) => {
    if (confirm('Adapt this quest? This will replace your current form data.')) {
      setTitle(quest.title)
      setSummary(quest.summary || '')
      setDescription(quest.description || '')
      setThumbnailUrl(quest.thumbnail_url || '')
      setLinkUrl(quest.link_url || '')
      setXpReward(quest.xp_reward || 100)
      setOriginUk(quest.uk)

      const { data: questExercises } = await supabase
        .from('quest_exercises')
        .select('*')
        .eq('quest_id', quest.id)

      if (questExercises) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setExercises(questExercises.map((ex: any) => ({
          id: crypto.randomUUID(),
          title: ex.title,
          description: ex.description || '',
          requirements: ex.requirements || ''
        })))
      }
    }
  }

  const isFormValidForDraft = () => !!(title.trim() || linkUrl.trim())
  const isFormValidForPublish = () => !!(title.trim() && summary.trim() && description.trim() && thumbnailUrl.trim() && xpReward > 0 && expeditionId && organizationId)

  // Build a human-readable list of what's missing for publish
  const getPublishDisabledReason = (): string | undefined => {
    if (isFormValidForPublish()) return undefined
    const missing: string[] = []
    if (!title.trim()) missing.push('Title')
    if (!summary.trim()) missing.push('Summary')
    if (!description.trim()) missing.push('Description')
    if (!thumbnailUrl.trim()) missing.push('Thumbnail URL')
    if (!(xpReward > 0)) missing.push('XP Reward (must be > 0)')
    if (!expeditionId) missing.push('Expedition (expedition)')
    if (!organizationId) missing.push('Organization')
    return missing.join(' · ')
  }

  const handleSaveClick = (targetStatus: 'draft' | 'published') => {
    setError(null)
    if (targetStatus === 'published' && !isFormValidForPublish()) {
      setError("To publish, all fields must be filled, a expedition selected, and XP > 0.")
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

    if (!expeditionId) {
      setError("Please select a expedition")
      setLoading(p => ({ ...p, [targetStatus]: false }))
      return
    }

    // Check if user qualifies for auto-validation:
    // - admins always get validated content
    // - the owner of the selected expedition gets their quests validated
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = !!profile?.is_admin
    const selectedExpedition = expeditions.find(p => p.id === expeditionId)
    const isExpeditionOwner = selectedExpedition?.created_by === user.id
    const autoValidate = isAdmin || isExpeditionOwner

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const questPayload: any = {
      expedition_id: expeditionId,
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
      is_validated: autoValidate  // Admins & expedition owners skip the validation queue
    }

    if (originUk) questPayload.uk = originUk

    const { data: questData, error: insertError } = await supabase
      .from('quests')
      .insert(questPayload)
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
          quest_id: questData.id,
          title: ex.title.trim(),
          description: ex.description.trim() || null,
          requirements: ex.requirements.trim() || null,
        }))

        await supabase.from('quest_exercises').insert(exercisesToInsert)
      }
    }

    // Invalidate unstable_cache so admin panel sees the new quest immediately
    await afterQuestChange(questData.id)

    router.push(`/guild-hall/quests/${questData.id}`)
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
              <SimilarItemsList type="quests" query={linkUrl} onAdapt={handleAdapt} />
            </div>

            <FormField
              label="Expedition"
              name="expedition_id"
              type="select"
              value={expeditionId}
              onChange={setExpeditionId}
              required
            >
              <option value="">Select a expedition</option>
              {expeditions.map((expedition) => (
                <option key={expedition.id} value={expedition.id}>{expedition.title}</option>
              ))}
            </FormField>
            {expeditions.length === 0 && (
              <p className="text-xs text-muted -mt-1">
                No expeditions yet.{' '}
                <Link
                  href="/guild-hall/expeditions/new?from=quest"
                  className="text-text-main underline hover:no-underline"
                >
                  Create a new expedition →
                </Link>
              </p>
            )}
            {expeditions.length > 0 && !expeditionId && (
              <p className="text-xs text-muted -mt-1">
                Don&apos;t see yours?{' '}
                <Link
                  href="/guild-hall/expeditions/new?from=quest"
                  className="text-text-main underline hover:no-underline"
                >
                  Create a new expedition →
                </Link>
              </p>
            )}

            <FormField
              label="Title"
              name="title"
              value={title}
              onChange={setTitle}
              placeholder="e.g., Introduction to React Hooks"
              required
              autoFilled={metadataFetched && !!title}
            />

            <SimilarItemsList type="quests" query={title} onAdapt={handleAdapt} />

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
              <div className="space-y-2">
                <FormField
                  label="Organization"
                  name="organization_id"
                  type="select"
                  value={organizationId}
                  onChange={setOrganizationId}
                  required
                >
                  <option value="">Select an organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </FormField>
                {/* Wizard escape hatch: create new org carrying context */}
                <p className="text-xs text-muted">
                  <Link
                    href={`/guild-hall/organizations/new?from=quest${expeditionId ? `&expeditionId=${expeditionId}` : ''}`}
                    className="text-text-main underline hover:no-underline"
                  >
                    + Create new organization
                  </Link>
                </p>
              </div>

              <div className="space-y-2 relative">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-main">
                  XP Reward
                  {metadataFetched && xpReward > 0 && (
                    <span className="text-[10px] font-normal normal-case text-green-500">✓ Auto-calculated</span>
                  )}
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => setShowXpTooltip(true)}
                      onMouseLeave={() => !xpNeedsAttention && setShowXpTooltip(false)}
                      onClick={() => setShowXpTooltip(!showXpTooltip)}
                      className="text-muted hover:text-text-main transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">info</span>
                    </button>
                    {showXpTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 dark:bg-surface-dark bg-surface text-text-main text-xs border border-border backdrop-blur-sm shadow-xl z-50">
                        <p className="font-bold mb-2">📊 XP by Duration:</p>
                        <ul className="space-y-1 text-muted">
                          <li>&lt; 2h → 25 XP</li>
                          <li>2–4h → 50 XP</li>
                          <li>4–8h → 100 XP</li>
                          <li>8–20h → 150 XP</li>
                          <li>20–40h → 200 XP</li>
                          <li>40h+ → 300 XP (max)</li>
                        </ul>
                        {xpNeedsAttention && (
                          <p className="mt-2 text-amber-400 font-medium">⚠️ Duration not found. Set XP manually.</p>
                        )}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-8 border-transparent border-t-border" />
                      </div>
                    )}
                  </div>
                </label>
                <input
                  type="number"
                  name="xp_reward"
                  value={xpReward}
                  onChange={(e) => { setXpReward(parseInt(e.target.value) || 0); setXpNeedsAttention(false) }}
                  min={0}
                  max={300}
                  step={25}
                  className={`w-full h-12 px-4 bg-surface border text-text-main focus:outline-none focus:border-text-main transition-all ${xpNeedsAttention
                      ? 'border-amber-500 animate-pulse ring-2 ring-amber-500/30'
                      : 'border-border'
                    }`}
                />
              </div>
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
              saving={loading.draft}
              publishing={loading.published}
              canSave={isFormValidForDraft()}
              canPublish={isFormValidForPublish()}
              publishLabel="Publish Quest"
              publishDisabledReason={getPublishDisabledReason()}
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
