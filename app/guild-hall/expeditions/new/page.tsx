'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { FormLayout, FormField, FormActions, FormError, FormDivider } from '@/components/ui/Form'
import SimilarItemsList from '@/components/features/SimilarItemsList'

export default function NewPathPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const router = useRouter()
  const supabase = createClient()

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

    const { data, error: insertError } = await supabase
      .from('learning_paths')
      .insert({
        title,
        summary,
        description,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/guild-hall/expeditions/${data.id}`)
  }

  return (
    <FormLayout
      title="New Path"
      subtitle="Define a structured learning journey for others to follow"
    >
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <FormError message={error} />

        <FormField
          label="Title"
          name="title"
          value={title}
          onChange={setTitle}
          placeholder="e.g., Full-Stack Web Development"
          required
        />

        <SimilarItemsList type="learning_paths" query={title} />

        <FormField
          label="Summary"
          name="summary"
          value={summary}
          onChange={setSummary}
          placeholder="Brief description (1-2 lines)"
          hint="This will appear in search results and path listings"
        />

        <FormField
          label="Description"
          name="description"
          type="textarea"
          value={description}
          onChange={setDescription}
          placeholder="Describe what learners will achieve, who it's for, and what makes this path unique..."
          rows={6}
        />

        <FormDivider />

        {/* Info Box */}
        <div className="border border-border p-4">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-text-main">info</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-text-main mb-1">Next Steps</p>
              <p className="text-sm text-muted">
                After creating your path, you&apos;ll be able to add courses and organize the learning sequence.
              </p>
            </div>
          </div>
        </div>

        <FormActions
          onPublish={handleSubmit}
          publishing={loading}
          publishLabel="Create Path"
          canPublish={!!title.trim()}
        />
      </form>
    </FormLayout>
  )
}
