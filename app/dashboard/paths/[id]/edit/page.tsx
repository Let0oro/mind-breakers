'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface LearningPath {
  id: string
  title: string
  summary: string | null
  description: string | null
  created_by: string
}

export default function EditPathPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params Promise con React.use()
  const { id } = use(params)

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
        .eq('id', id)
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
  }, [id, router, supabase])

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
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/paths/${id}`)
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este path? Esta acción no se puede deshacer.')) {
      return
    }

    setLoading(true)

    const { error: deleteError } = await supabase
      .from('learning_paths')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/paths')
  }

  if (!path && !error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-gray-600 dark:text-[#b0bfcc]">Cargando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  return (
    <>
      <header className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 dark:text-[#b0bfcc] hover:text-[#137fec] mb-4 inline-flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Editar Learning Path
        </h1>
      </header>

      <div className="max-w-2xl">
        <div className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-[#3b4754]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Título *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                defaultValue={path?.title}
                className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-[#f6f7f8] dark:bg-[#101922] px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc]/50 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec]"
                placeholder="ej: Fundamentos de React"
              />
            </div>

            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Resumen
              </label>
              <input
                type="text"
                id="summary"
                name="summary"
                defaultValue={path?.summary || ''}
                className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-[#f6f7f8] dark:bg-[#101922] px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc]/50 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec]"
                placeholder="Descripción corta (1-2 líneas)"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Descripción completa
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                defaultValue={path?.description || ''}
                className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-[#f6f7f8] dark:bg-[#101922] px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc]/50 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec] resize-none"
                placeholder="Describe en detalle qué aprenderá el usuario..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 rounded-lg border border-gray-200 dark:border-[#3b4754] px-4 py-2 text-sm font-medium text-gray-600 dark:text-[#b0bfcc] hover:bg-gray-100 dark:hover:bg-[#3b4754]/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-[#137fec] px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-[#137fec]/80 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-gray-200 dark:border-[#3b4754] pt-8">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Zona peligrosa</h3>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Eliminar Path
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
