'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface LearningPath {
  id: string
  title: string
}

interface Organization {
  id: string
  name: string
}

export default function NewCoursePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [pathsRes, orgsRes] = await Promise.all([
      supabase.from('learning_paths').select('id, title').order('title'),
      supabase.from('organizations').select('id, name').order('name'),
    ])

    if (pathsRes.data) setPaths(pathsRes.data)
    if (orgsRes.data) setOrganizations(orgsRes.data)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const pathId = formData.get('path_id') as string
    if (!pathId) {
      setError('Please select a learning path')
      setLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('courses')
      .insert({
        path_id: pathId,
        title: formData.get('title') as string,
        summary: formData.get('summary') as string,
        description: formData.get('description') as string,
        link_url: formData.get('link_url') as string || null,
        thumbnail_url: formData.get('thumbnail_url') as string || null,
        organization_id: formData.get('organization_id') as string || null,
        xp_reward: parseInt(formData.get('xp_reward') as string) || 100,
        order_index: parseInt(formData.get('order_index') as string) || 0,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/courses/${data.id}`)
  }

  return (
    <>
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="text-[#9dabb9] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-white text-3xl font-black tracking-tight">Create Course</h2>
        </div>
        <p className="text-[#9dabb9] text-base">
          Add a new course to an existing learning path
        </p>
      </header>

      {/* Form */}
      <div className="bg-[#1a232e] rounded-xl border border-[#3b4754] p-8 max-w-3xl">
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

          {/* Learning Path */}
          <div className="space-y-2">
            <label htmlFor="path_id" className="block text-white text-sm font-bold">
              Learning Path <span className="text-red-500">*</span>
            </label>
            <select
              id="path_id"
              name="path_id"
              required
              className="w-full h-12 px-4 rounded-lg bg-[#111418] border border-[#3b4754] text-white focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
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
            <label htmlFor="title" className="block text-white text-sm font-bold">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full h-12 px-4 rounded-lg bg-[#111418] border border-[#3b4754] text-white placeholder:text-[#9dabb9] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
              placeholder="e.g., Introduction to React Hooks"
            />
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <label htmlFor="summary" className="block text-white text-sm font-bold">
              Summary
            </label>
            <input
              type="text"
              id="summary"
              name="summary"
              className="w-full h-12 px-4 rounded-lg bg-[#111418] border border-[#3b4754] text-white placeholder:text-[#9dabb9] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
              placeholder="Brief one-liner about the course"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-white text-sm font-bold">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-[#111418] border border-[#3b4754] text-white placeholder:text-[#9dabb9] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all resize-none"
              placeholder="What will students learn?"
            />
          </div>

          {/* Link URL */}
          <div className="space-y-2">
            <label htmlFor="link_url" className="block text-white text-sm font-bold">
              Course URL
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#9dabb9]">
                link
              </span>
              <input
                type="url"
                id="link_url"
                name="link_url"
                className="w-full h-12 pl-12 pr-4 rounded-lg bg-[#111418] border border-[#3b4754] text-white placeholder:text-[#9dabb9] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                placeholder="https://example.com/course"
              />
            </div>
            <p className="text-[#9dabb9] text-xs">YouTube, Udemy, or any external course link</p>
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-2">
            <label htmlFor="thumbnail_url" className="block text-white text-sm font-bold">
              Thumbnail URL
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#9dabb9]">
                image
              </span>
              <input
                type="url"
                id="thumbnail_url"
                name="thumbnail_url"
                className="w-full h-12 pl-12 pr-4 rounded-lg bg-[#111418] border border-[#3b4754] text-white placeholder:text-[#9dabb9] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {/* Row: Organization & XP Reward */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="organization_id" className="block text-white text-sm font-bold">
                Organization
              </label>
              <select
                id="organization_id"
                name="organization_id"
                className="w-full h-12 px-4 rounded-lg bg-[#111418] border border-[#3b4754] text-white focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
              >
                <option value="">None</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="xp_reward" className="block text-white text-sm font-bold">
                XP Reward
              </label>
              <input
                type="number"
                id="xp_reward"
                name="xp_reward"
                defaultValue={100}
                min={0}
                step={10}
                className="w-full h-12 px-4 rounded-lg bg-[#111418] border border-[#3b4754] text-white placeholder:text-[#9dabb9] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
              />
            </div>
          </div>

          {/* Order Index */}
          <div className="space-y-2">
            <label htmlFor="order_index" className="block text-white text-sm font-bold">
              Order in Path
            </label>
            <input
              type="number"
              id="order_index"
              name="order_index"
              defaultValue={0}
              min={0}
              className="w-full h-12 px-4 rounded-lg bg-[#111418] border border-[#3b4754] text-white placeholder:text-[#9dabb9] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
              placeholder="0"
            />
            <p className="text-[#9dabb9] text-xs">Lower numbers appear first (0 = first)</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 h-12 rounded-lg border border-[#3b4754] text-white font-medium hover:bg-[#283039] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 rounded-lg bg-[#137fec] text-white font-bold hover:bg-[#137fec]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">add</span>
                  Create Course
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
