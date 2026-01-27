'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { FileUpload } from '@/components/FileUpload'

export default function NewCoursePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paths, setPaths] = useState<Array<{ id: string; title: string }>>([])
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('')
  const [linkUrl, setLinkUrl] = useState<string>('')
  const [isYouTube, setIsYouTube] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const pathId = searchParams.get('pathId') // Si viene de un path específico
  const supabase = createClient()

  // Agregar esta función dentro del componente
  const handleAutoFill = async () => {
    if (!linkUrl) return

    setLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fetch-metadata`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ url: linkUrl }),
        }
      )

      const metadata = await response.json()

      if (metadata.error) {
        setError(metadata.error)
        return
      }

      // Auto-rellenar campos
      const titleInput = document.getElementById('title') as HTMLInputElement
      const summaryInput = document.getElementById('summary') as HTMLInputElement
      const descInput = document.getElementById('description') as HTMLTextAreaElement

      if (titleInput && !titleInput.value) titleInput.value = metadata.title
      if (summaryInput && !summaryInput.value) summaryInput.value = metadata.description?.substring(0, 100)
      if (descInput && !descInput.value) descInput.value = metadata.description
      if (metadata.thumbnail) setThumbnailUrl(metadata.thumbnail)

    } catch (err) {
      setError('Error al obtener metadatos')
    } finally {
      setLoading(false)
    }
  }



  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Detectar si es URL de YouTube y extraer thumbnail
    if (linkUrl) {
      const isYT = linkUrl.includes('youtube.com') || linkUrl.includes('youtu.be')
      setIsYouTube(isYT)

      if (isYT && !thumbnailUrl) {
        const videoId = extractYouTubeId(linkUrl)
        if (videoId) {
          setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`)
        }
      }
    }
  }, [linkUrl])

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const loadData = async () => {
    // Cargar paths
    const { data: pathsData } = await supabase
      .from('learning_paths')
      .select('id, title')
      .order('title')

    if (pathsData) setPaths(pathsData)

    // Cargar organizaciones
    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name')

    if (orgsData) setOrganizations(orgsData)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const selectedPathId = formData.get('path_id') as string

    if (!selectedPathId) {
      setError('Debes seleccionar un path')
      setLoading(false)
      return
    }

    // Obtener el último order_index del path
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('order_index')
      .eq('path_id', selectedPathId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrderIndex = existingCourses && existingCourses.length > 0
      ? existingCourses[0].order_index + 1
      : 0

    const { data, error: insertError } = await supabase
      .from('courses')
      .insert({
        path_id: selectedPathId,
        title: formData.get('title') as string,
        summary: formData.get('summary') as string,
        description: formData.get('description') as string,
        link_url: linkUrl,
        thumbnail_url: thumbnailUrl,
        organization_id: formData.get('organization_id') as string || null,
        order_index: nextOrderIndex,
        xp_reward: parseInt(formData.get('xp_reward') as string) || 100,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/paths/${selectedPathId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Agregar nuevo curso
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Seleccionar Path */}
            <div>
              <label htmlFor="path_id" className="block text-sm font-medium text-gray-700 mb-2">
                Learning Path *
              </label>
              <select
                id="path_id"
                name="path_id"
                required
                defaultValue={pathId || ''}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Selecciona un path</option>
                {paths.map((path) => (
                  <option key={path.id} value={path.id}>
                    {path.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Título */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Título del curso *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="ej: Introducción a React Hooks"
              />
            </div>

            {/* URL del curso/video */}
            <div>
              <label htmlFor="link_url" className="block text-sm font-medium text-gray-700 mb-2">
                URL del curso (YouTube, Udemy, etc.)
              </label>
              <input
                type="url"
                id="link_url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="https://youtube.com/watch?v=..."
              />
              {isYouTube && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ Video de YouTube detectado - thumbnail cargado automáticamente
                </p>
              )}
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen/Captura del curso
              </label>

              {thumbnailUrl ? (
                <div className="space-y-3">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl('')}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Cambiar imagen
                  </button>
                </div>
              ) : (
                <FileUpload
                  bucket="course-assets"
                  path="thumbnails/"
                  accept="image/*"
                  onUploadComplete={setThumbnailUrl}
                  maxSizeMB={2}
                />
              )}

              <button
                type="button"
                onClick={handleAutoFill}
                disabled={!linkUrl || loading}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
              >
                ✨ Auto-rellenar desde URL
              </button>
            </div>

            {/* Resumen y Descripción */}
            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
                Resumen breve
              </label>
              <input
                type="text"
                id="summary"
                name="summary"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="1-2 líneas sobre qué trata el curso"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción completa
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Describe en detalle el contenido..."
              />
            </div>

            {/* Organización */}
            <div>
              <label htmlFor="organization_id" className="block text-sm font-medium text-gray-700 mb-2">
                Organización/Autor
              </label>
              <select
                id="organization_id"
                name="organization_id"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Sin organización</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => router.push('/dashboard/organizations/new')}
                className="mt-2 text-xs text-indigo-600 hover:text-indigo-700"
              >
                + Crear nueva organización
              </button>
            </div>

            {/* XP Reward */}
            <div>
              <label htmlFor="xp_reward" className="block text-sm font-medium text-gray-700 mb-2">
                Experiencia (XP) al completar
              </label>
              <input
                type="number"
                id="xp_reward"
                name="xp_reward"
                defaultValue={100}
                min={10}
                step={10}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Crear Curso'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
