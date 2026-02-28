'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { FormLayout, FormField, FormActions, FormError, FormDivider } from '@/components/ui/Form'
import SimilarItemsList from '@/components/features/SimilarItemsList'
import { afterExpeditionChange } from '@/lib/cache-actions'

interface Expedition {
  id: string
  title: string
}

export default function NewExpeditionPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [existingExpeditions, setExistingExpeditions] = useState<Expedition[]>([])
  const [selectedExistingId, setSelectedExistingId] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const fromQuest = searchParams.get('from') === 'quest'

  useEffect(() => {
    if (!fromQuest) return
    const fetchExpeditions = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('expeditions')
        .select('id, title')
        .eq('created_by', user.id)
        .order('title')
      if (data) setExistingExpeditions(data)
    }
    fetchExpeditions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromQuest])

  // If user picks an existing expedition while in quest context → go back to quest/new with that expeditionId
  const handleSelectExisting = (id: string) => {
    if (id) {
      router.push(`/guild-hall/quests/new?expeditionId=${id}`)
    }
    setSelectedExistingId(id)
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Admins get their expeditions auto-validated
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    const autoValidate = !!profile?.is_admin

    const { data, error: insertError } = await supabase
      .from('expeditions')
      .insert({
        title,
        summary,
        description,
        created_by: user.id,
        is_validated: autoValidate,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Invalidate unstable_cache so admin panel sees the new expedition immediately
    await afterExpeditionChange(data.id)

    if (fromQuest) {
      router.push(`/guild-hall/quests/new?expeditionId=${data.id}`)
    } else {
      router.push(`/guild-hall/expeditions/${data.id}`)
    }
  }

  return (
    <FormLayout
      title="New Expedition"
      subtitle="Define a structured journey for others to follow"
    >
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <FormError message={error} />

        {/* Wizard context banner + existing picker */}
        {fromQuest && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 border border-amber-500/30 bg-amber-500/5 p-3">
              <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">route</span>
              <p className="text-xs text-amber-500">
                You&apos;re adding an expedition for your new quest. After creating it, you&apos;ll be taken back to the quest form.
              </p>
            </div>

            {existingExpeditions.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-main">
                  Or select an existing expedition
                </label>
                <select
                  value={selectedExistingId}
                  onChange={(e) => handleSelectExisting(e.target.value)}
                  className="w-full h-10 px-4 bg-main border border-border text-text-main focus:outline-none focus:border-text-main transition-all"
                >
                  <option value="">— Pick one —</option>
                  {existingExpeditions.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <p className="text-xs text-muted">Selecting an existing expedition will take you back to the quest form immediately.</p>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-text-main mb-4">Create a new one</p>
            </div>
          </div>
        )}

        <FormField
          label="Title"
          name="title"
          value={title}
          onChange={setTitle}
          placeholder="e.g., Full-Stack Web Development"
          required
        />

        <SimilarItemsList type="expeditions" query={title} />

        <FormField
          label="Summary"
          name="summary"
          value={summary}
          onChange={setSummary}
          placeholder="Brief description (1-2 lines)"
          hint="This will appear in search results and expedition listings"
        />

        <FormField
          label="Description"
          name="description"
          type="textarea"
          value={description}
          onChange={setDescription}
          placeholder="Describe what adventurers will achieve, who it's for, and what makes this expedition unique..."
          rows={6}
        />

        <FormDivider />

        {!fromQuest && (
          <div className="border border-border p-4">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-text-main">info</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-text-main mb-1">Next Steps</p>
                <p className="text-sm text-muted">
                  After creating your expedition, you&apos;ll be able to add quests and organize the learning sequence.
                </p>
              </div>
            </div>
          </div>
        )}

        <FormActions
          onPublish={handleSubmit}
          publishing={loading}
          publishLabel={fromQuest ? 'Create & Return to Quest' : 'Create Expedition'}
          canPublish={!!title.trim()}
        />
      </form>
    </FormLayout>
  )
}
