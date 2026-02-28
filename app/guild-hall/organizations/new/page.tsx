'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import SimilarItemsList from '@/components/features/SimilarItemsList'
import { afterOrganizationChange } from '@/lib/cache-actions'

interface Organization {
  id: string
  name: string
}

export default function NewOrganizationPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [existingOrgs, setExistingOrgs] = useState<Organization[]>([])
  const [selectedExistingId, setSelectedExistingId] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const fromQuest = searchParams.get('from') === 'quest'
  const expeditionId = searchParams.get('expeditionId') || ''

  useEffect(() => {
    if (!fromQuest) return
    const fetchOrgs = async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name')
      if (data) setExistingOrgs(data)
    }
    fetchOrgs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromQuest])

  // If user picks an existing org while in quest context → go back to quest/new with orgId (and expeditionId if present)
  const handleSelectExisting = (id: string) => {
    if (id) {
      const params = new URLSearchParams()
      if (expeditionId) params.set('expeditionId', expeditionId)
      params.set('orgId', id)
      router.push(`/guild-hall/quests/new?${params.toString()}`)
    }
    setSelectedExistingId(id)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    // Admins get their organizations auto-validated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    const autoValidate = !!profile?.is_admin

    const { data, error: insertError } = await supabase
      .from('organizations')
      .insert({
        name: name,
        description: formData.get('description') as string || null,
        website_url: formData.get('website_url') as string || null,
        is_validated: autoValidate,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Invalidate unstable_cache so admin panel sees the new org immediately
    await afterOrganizationChange()

    if (fromQuest && data) {
      const params = new URLSearchParams()
      if (expeditionId) params.set('expeditionId', expeditionId)
      params.set('orgId', data.id)
      router.push(`/guild-hall/quests/new?${params.toString()}`)
    } else {
      router.push('/guild-hall/organizations')
    }
  }

  return (
    <>
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="text-muted hover:text-text-main transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-text-main text-3xl font-black tracking-tight">Add Organization</h2>
        </div>
        <p className="text-muted text-base">
          Register a content creator or educational organization
        </p>
      </header>

      {/* Form */}
      <div className="bg-main border border-border p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Wizard context banner + existing picker */}
          {fromQuest && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 border border-amber-500/30 bg-amber-500/5 p-3">
                <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">route</span>
                <p className="text-xs text-amber-500">
                  You&apos;re adding an organization for your new quest. After creating it, you&apos;ll be taken back to the quest form.
                </p>
              </div>

              {existingOrgs.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-main">
                    Or select an existing organization
                  </label>
                  <select
                    value={selectedExistingId}
                    onChange={(e) => handleSelectExisting(e.target.value)}
                    className="w-full h-10 px-4 bg-main border border-border text-text-main focus:outline-none focus:border-text-main transition-all"
                  >
                    <option value="">— Pick one —</option>
                    {existingOrgs.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted">Selecting an existing organization will take you back to the quest form immediately.</p>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <p className="text-xs font-bold uppercase tracking-widest text-text-main mb-4">Create a new one</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-red-500 text-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </p>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-text-main text-xs font-bold uppercase tracking-widest">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-12 px-4 bg-main border border-border text-text-main placeholder:text-muted focus:outline-none focus:border-text-main transition-all"
              placeholder="e.g., Meta, Google, MIT, etc."
            />
            <SimilarItemsList
              type="organizations"
              query={name}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-text-main text-xs font-bold uppercase tracking-widest">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="w-full px-4 py-3 bg-main border border-border text-text-main placeholder:text-muted focus:outline-none focus:border-text-main transition-all resize-none"
              placeholder="Brief overview of the organization and what they teach..."
            />
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <label htmlFor="website_url" className="block text-text-main text-xs font-bold uppercase tracking-widest">
              Website
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                language
              </span>
              <input
                type="url"
                id="website_url"
                name="website_url"
                className="w-full h-12 pl-12 pr-4 bg-main border border-border text-text-main placeholder:text-muted focus:outline-none focus:border-text-main transition-all"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Info Box — only when not in wizard context */}
          {!fromQuest && (
            <div className="border border-border p-4">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-text-main mt-0.5">info</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-text-main mb-1">What&apos;s Next?</p>
                  <p className="text-text-main text-sm">
                    After creating this organization, you can associate it with expeditions and quests when creating them.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 h-12 border border-border text-text-main font-medium hover:bg-surface transition-colors text-xs uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 h-12 bg-inverse text-inverse font-bold hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-inverse border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">add</span>
                  {fromQuest ? 'Create & Return to Quest' : 'Add Organization'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
