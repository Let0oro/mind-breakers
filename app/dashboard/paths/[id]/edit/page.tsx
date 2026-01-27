'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface LearningPath {
  id: string
  title: string
  summary: string | null
  description: string | null
  created_by: string
}

export default function EditPathPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [path, setPath] = useState<LearningPath | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadPath = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('id', params.id)
        .single()

      if (fetchError || !data) {
        setError('Path no encontrado')
        return
      }

      if (data.created_by !== user.id) {
        setError('No tienes permisos para editar este path')
        return
      }

      setPath(data)
    }

    loadPath()
  }, [params.id, router, supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const { error: updateError } = await supabase
      .from('learning_paths')
      .update({
        title: formData.get('title') as string,
        summary: formData.get('summary') as string,
        description: formData.get('description') as string,
      })
      .eq('id', params.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/paths/${params.id}`)
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este path? Esta acción no se puede deshacer.')) {
      return
    }

    setLoading(true)

    const { error: deleteError } = await supabase
      .from('learning_paths')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      setError(deleteError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/paths')
  }

  if (!path && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Editar Learning Path
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                defaultValue={path?.title}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="ej: Fundamentos de React"
              />
            </div>

            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
                Resumen
              </label>
              <input
                type="text"
                id="summary"
                name="summary"
                defaultValue={path?.summary || ''}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Descripción corta (1-2 líneas)"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción completa
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                defaultValue={path?.description || ''}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Describe en detalle qué aprenderá el usuario..."
              />
            </div>

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
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>

          <div className="mt-8 border-t pt-8">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Zona peligrosa</h3>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Eliminar Path
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
