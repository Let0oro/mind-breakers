'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function NewOrganizationPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const { data, error: insertError } = await supabase
      .from('organizations')
      .insert({
        name: formData.get('name') as string,
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

    router.push('/dashboard/organizations')
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
          <h2 className="text-gray-900 dark:text-white text-3xl font-black tracking-tight">Add Organization</h2>
        </div>
        <p className="text-gray-600 dark:text-[#b0bfcc] text-base">
          Register a content creator or educational organization
        </p>
      </header>

      {/* Form */}
      <div className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-8 max-w-2xl">
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
            <label htmlFor="name" className="block text-gray-900 dark:text-white text-sm font-bold">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
              placeholder="e.g., Meta, Google, MIT, etc."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-gray-900 dark:text-white text-sm font-bold">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all resize-none"
              placeholder="Brief overview of the organization and what they teach..."
            />
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <label htmlFor="website_url" className="block text-gray-900 dark:text-white text-sm font-bold">
              Website
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-[#b0bfcc]">
                language
              </span>
              <input
                type="url"
                id="website_url"
                name="website_url"
                className="w-full h-12 pl-12 pr-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-[#137fec]/10 border border-[#137fec]/30 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-[#137fec] mt-0.5">info</span>
              <div>
                <p className="text-[#137fec] text-sm font-bold mb-1">What's Next?</p>
                <p className="text-gray-900 dark:text-white text-sm">
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
              className="flex-1 h-12 rounded-lg border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 rounded-lg bg-[#137fec] text-gray-900 dark:text-white font-bold hover:bg-[#137fec]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
