'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { fetchUrlMetadata, isYouTubeUrl, type MetadataResponse } from '@/utils/fetch-metadata'

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

  // Metadata auto-fill states
  const [linkUrl, setLinkUrl] = useState('')
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false)
  const [metadataFetched, setMetadataFetched] = useState(false)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  // Fetch metadata from URL
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
      // Only update fields that are empty or if this is fresh metadata
      if (!title || metadataFetched === false) setTitle(data.title)
      if (!summary || metadataFetched === false) {
        // Use description as summary, truncated if too long
        const desc = data.description || ''
        setSummary(desc.length > 200 ? desc.substring(0, 197) + '...' : desc)
      }
      if (!description || metadataFetched === false) setDescription(data.description)
      if (!thumbnailUrl || metadataFetched === false) setThumbnailUrl(data.thumbnail)
      setMetadataFetched(true)
    }

    setIsFetchingMetadata(false)
  }, [linkUrl, title, summary, description, thumbnailUrl, metadataFetched])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // Obtener el usuario actual desde Supabase Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [pathsRes, orgsRes] = await Promise.all([
      supabase.from('learning_paths').select('id, title').eq('created_by', user.id).order('title'),
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
            className="text-gray-600 dark:text-[#b0bfcc] hover:text-gray-900 dark:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-gray-900 dark:text-white text-3xl font-black tracking-tight">Create Course</h2>
        </div>
        <p className="text-gray-600 dark:text-[#b0bfcc] text-base">
          Add a new course to an existing learning path
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

          {/* Course URL - First input with auto-fill */}
          <div className="space-y-2">
            <label htmlFor="link_url" className="block text-gray-900 dark:text-white text-sm font-bold">
              Course URL
              {metadataFetched && (
                <span className="ml-2 text-xs font-normal text-green-500">✓ Metadata loaded</span>
              )}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-[#b0bfcc]">
                  link
                </span>
                <input
                  type="url"
                  id="link_url"
                  name="link_url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                  placeholder="https://youtube.com/watch?v=... or any URL"
                />
              </div>
              <button
                type="button"
                onClick={handleFetchMetadata}
                disabled={!linkUrl.trim() || isFetchingMetadata}
                className="h-12 px-4 rounded-lg bg-[#137fec]/20 text-[#137fec] font-medium hover:bg-[#137fec]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isFetchingMetadata ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#137fec] border-t-transparent"></div>
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                    <span>Auto-fill</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-gray-600 dark:text-[#b0bfcc] text-xs">
              Paste a YouTube or web URL and click Auto-fill to fetch title, description and thumbnail
            </p>
          </div>

          {/* Learning Path */}
          <div className="space-y-2">
            <label htmlFor="path_id" className="block text-gray-900 dark:text-white text-sm font-bold">
              Learning Path <span className="text-red-500">*</span>
            </label>
            <select
              id="path_id"
              name="path_id"
              required
              className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
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
            <label htmlFor="title" className="block text-gray-900 dark:text-white text-sm font-bold">
              Course Title <span className="text-red-500">*</span>
              {metadataFetched && title && (
                <span className="ml-2 text-xs font-normal text-green-500">Auto-filled</span>
              )}
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
              placeholder="e.g., Introduction to React Hooks"
            />
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <label htmlFor="summary" className="block text-gray-900 dark:text-white text-sm font-bold">
              Summary
              {metadataFetched && summary && (
                <span className="ml-2 text-xs font-normal text-green-500">Auto-filled</span>
              )}
            </label>
            <input
              type="text"
              id="summary"
              name="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
              placeholder="Brief one-liner about the course"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-gray-900 dark:text-white text-sm font-bold">
              Description
              {metadataFetched && description && (
                <span className="ml-2 text-xs font-normal text-green-500">Auto-filled</span>
              )}
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all resize-none"
              placeholder="What will students learn?"
            />
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-2">
            <label htmlFor="thumbnail_url" className="block text-gray-900 dark:text-white text-sm font-bold">
              Thumbnail URL
              {metadataFetched && thumbnailUrl && (
                <span className="ml-2 text-xs font-normal text-green-500">Auto-filled</span>
              )}
            </label>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-[#b0bfcc]">
                  image
                </span>
                <input
                  type="url"
                  id="thumbnail_url"
                  name="thumbnail_url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              {thumbnailUrl && (
                <div className="w-20 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-[#3b4754] flex-shrink-0">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Row: Organization & XP Reward */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="organization_id" className="block text-gray-900 dark:text-white text-sm font-bold">
                Organization
              </label>
              <select
                id="organization_id"
                name="organization_id"
                className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
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
              <label htmlFor="xp_reward" className="block text-gray-900 dark:text-white text-sm font-bold">
                XP Reward
              </label>
              <input
                type="number"
                id="xp_reward"
                name="xp_reward"
                defaultValue={100}
                min={0}
                step={10}
                className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
              />
            </div>
          </div>

          {/* Order Index */}
          <div className="space-y-2">
            <label htmlFor="order_index" className="block text-gray-900 dark:text-white text-sm font-bold">
              Order in Path
            </label>
            <input
              type="number"
              id="order_index"
              name="order_index"
              defaultValue={0}
              min={0}
              className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc] focus:outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
              placeholder="0"
            />
            <p className="text-gray-600 dark:text-[#b0bfcc] text-xs">Lower numbers appear first (0 = first)</p>
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
