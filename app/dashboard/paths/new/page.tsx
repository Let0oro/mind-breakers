'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function NewPathPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error: insertError } = await supabase
      .from('learning_paths')
      .insert({
        title: formData.get('title') as string,
        summary: formData.get('summary') as string,
        description: formData.get('description') as string,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/paths/${data.id}`)
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
          <h2 className="text-gray-900 dark:text-white text-3xl font-black tracking-tight">Create Learning Path</h2>
        </div>
        <p className="text-gray-600 dark:text-[#b0bfcc] text-base">
          Define a structured learning journey for others to follow
        </p>
      </header>

      {/* Form */}
      <div className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-8 max-w-3xl">
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

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-gray-900 dark:text-white text-sm font-bold">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
              placeholder="e.g., Full-Stack Web Development"
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
              name="summary"
              className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
              placeholder="Brief description (1-2 lines)"
            />
            <p className="text-gray-600 dark:text-[#b0bfcc] text-xs">This will appear in search results and path listings</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-gray-900 dark:text-white text-sm font-bold">
              Full Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all resize-none"
              placeholder="Describe what learners will achieve, who it's for, and what makes this path unique..."
            />
          </div>

          {/* Info Box */}
          <div className="bg-[#137fec]/10 border border-[#137fec]/30 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-[#137fec] mt-0.5">info</span>
              <div>
                <p className="text-[#137fec] text-sm font-bold mb-1">Next Steps</p>
                <p className="text-gray-900 dark:text-white text-sm">
                  After creating your path, you&apos;ll be able to add courses and organize the learning sequence.
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
                  Creating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">add</span>
                  Create Path
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
