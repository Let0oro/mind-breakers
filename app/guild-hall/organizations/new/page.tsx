'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import SimilarItemsList from '@/components/features/SimilarItemsList'

export default function NewOrganizationPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const { error: insertError } = await supabase
      .from('organizations')
      .insert({
        name: name,
        description: formData.get('description') as string || null,
        website_url: formData.get('website_url') as string || null,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/guild-hall/organizations')
  }

  return (
    <>
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="text-muted dark:text-muted hover:text-text-main dark:text-text-main transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-text-main dark:text-text-main text-3xl font-black tracking-tight">Add Organization</h2>
        </div>
        <p className="text-muted dark:text-muted text-base">
          Register a content creator or educational organization
        </p>
      </header>

      {/* Form */}
      <div className="bg-main dark:bg-surface rounded-xl border border-border dark:border-border p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-4">
              <p className="text-red-500 text-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </p>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-text-main dark:text-text-main text-sm font-bold">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-lg bg-surface dark:bg-main border border-border dark:border-border text-text-main dark:text-text-main placeholder:text-muted dark:text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-ring/20 transition-all"
              placeholder="e.g., Meta, Google, MIT, etc."
            />
            <SimilarItemsList
              type="organizations"
              query={name}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-text-main dark:text-text-main text-sm font-bold">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-surface dark:bg-main border border-border dark:border-border text-text-main dark:text-text-main placeholder:text-muted dark:text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-ring/20 transition-all resize-none"
              placeholder="Brief overview of the organization and what they teach..."
            />
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <label htmlFor="website_url" className="block text-text-main dark:text-text-main text-sm font-bold">
              Website
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted dark:text-muted">
                language
              </span>
              <input
                type="url"
                id="website_url"
                name="website_url"
                className="w-full h-12 pl-12 pr-4 rounded-lg bg-surface dark:bg-main border border-border dark:border-border text-text-main dark:text-text-main placeholder:text-muted dark:text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-ring/20 transition-all"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-brand/10 border border-brand/30 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-brand mt-0.5">info</span>
              <div>
                <p className="text-brand text-sm font-bold mb-1">What&apos;s Next?</p>
                <p className="text-text-main dark:text-text-main text-sm">
                  After creating this organization, you can associate it with learning paths and courses when creating them.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 h-12 rounded-lg border border-border dark:border-border text-text-main dark:text-text-main font-medium hover:bg-surface dark:hover:bg-surface-dark transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 rounded-lg bg-brand text-text-main dark:text-text-main font-bold hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">add</span>
                  Add Organization
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
