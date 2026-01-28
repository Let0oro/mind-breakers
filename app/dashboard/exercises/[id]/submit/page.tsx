'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { FileUpload } from '@/components/FileUpload'

interface Exercise {
  id: string
  title: string
  description?: string
  requirements?: string
  courses: {
    id: string
    title: string
    learning_paths: {
      id: string
    }
  }
}

export default function SubmitExercisePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params Promise con React.use()
  const { id } = use(params)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [submissionType, setSubmissionType] = useState<'text' | 'zip' | 'drive'>('text')
  const [fileUrl, setFileUrl] = useState<string>('')
  const [textContent, setTextContent] = useState<string>('')
  const [driveUrl, setDriveUrl] = useState<string>('')

  const router = useRouter()
  const supabase = createClient()

  const loadExercise = useCallback(async () => {
    const { data } = await supabase
      .from('course_exercises')
      .select('*, courses (id, title, learning_paths (id))')
      .eq('id', id)
      .single()

    if (data) setExercise(data as Exercise)
  }, [supabase, id])

  useEffect(() => {
    loadExercise()
  }, [loadExercise])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    let finalFileUrl = fileUrl

    if (submissionType === 'text' && textContent) {
      const blob = new Blob([textContent], { type: 'text/plain' })
      const fileName = `submissions/${Date.now()}-${Math.random().toString(36).substring(2)}.txt`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-assets')
        .upload(fileName, blob)

      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('course-assets')
        .getPublicUrl(uploadData.path)

      finalFileUrl = publicUrl
    }

    const { error: insertError } = await supabase
      .from('exercise_submissions')
      .insert({
        user_id: user.id,
        exercise_id: id,
        submission_type: submissionType,
        file_path: submissionType !== 'drive' ? finalFileUrl : null,
        drive_url: submissionType === 'drive' ? driveUrl : null,
        status: 'pending',
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    if (exercise) {
      router.push(`/dashboard/courses/${exercise.courses.id}`)
    }
  }

  if (!exercise) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-gray-600 dark:text-[#b0bfcc]">Cargando...</div>
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
          Entregar ejercicio
        </h1>
        <p className="text-gray-600 dark:text-[#b0bfcc] mt-2">
          {exercise.title}
        </p>
      </header>

      <div className="max-w-2xl">
        <div className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-[#3b4754]">
          {exercise.description && (
            <div className="mb-6 rounded-lg bg-[#137fec]/10 border border-[#137fec]/30 p-4">
              <h3 className="text-sm font-medium text-[#137fec] mb-2">
                Descripción del ejercicio
              </h3>
              <p className="text-sm text-gray-600 dark:text-[#b0bfcc] whitespace-pre-wrap">
                {exercise.description}
              </p>
            </div>
          )}

          {exercise.requirements && (
            <div className="mb-6 rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
              <h3 className="text-sm font-medium text-amber-400 mb-2">
                Requisitos
              </h3>
              <p className="text-sm text-gray-600 dark:text-[#b0bfcc] whitespace-pre-wrap">
                {exercise.requirements}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                Tipo de entrega
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSubmissionType('text')}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${submissionType === 'text'
                    ? 'border-[#137fec] bg-[#137fec]/20 text-[#137fec]'
                    : 'border-gray-200 dark:border-[#3b4754] text-gray-600 dark:text-[#b0bfcc] hover:border-[#b0bfcc]/50'
                    }`}
                >
                  📝 Texto
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionType('zip')}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${submissionType === 'zip'
                    ? 'border-[#137fec] bg-[#137fec]/20 text-[#137fec]'
                    : 'border-gray-200 dark:border-[#3b4754] text-gray-600 dark:text-[#b0bfcc] hover:border-[#b0bfcc]/50'
                    }`}
                >
                  📦 Archivo ZIP
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionType('drive')}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${submissionType === 'drive'
                    ? 'border-[#137fec] bg-[#137fec]/20 text-[#137fec]'
                    : 'border-gray-200 dark:border-[#3b4754] text-gray-600 dark:text-[#b0bfcc] hover:border-[#b0bfcc]/50'
                    }`}
                >
                  ☁️ Google Drive
                </button>
              </div>
            </div>

            {submissionType === 'text' && (
              <div>
                <label htmlFor="text-content" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Tu solución (código, respuestas, etc.)
                </label>
                <textarea
                  id="text-content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={12}
                  required
                  className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-[#f6f7f8] dark:bg-[#101922] px-4 py-2 font-mono text-sm text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc]/50 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec] resize-none"
                  placeholder="Pega tu código o respuesta aquí..."
                />
              </div>
            )}

            {submissionType === 'zip' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Sube tu proyecto (ZIP)
                </label>
                {fileUrl ? (
                  <div className="rounded-lg border-2 border-green-500/50 bg-green-500/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined h-8 w-8 text-green-400">check_circle</span>
                        <span className="text-sm font-medium text-green-400">
                          Archivo subido correctamente
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFileUrl('')}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                ) : (
                  <FileUpload
                    bucket="course-assets"
                    path="submissions/"
                    accept=".zip"
                    onUploadComplete={setFileUrl}
                    maxSizeMB={50}
                  />
                )}
              </div>
            )}

            {submissionType === 'drive' && (
              <div>
                <label htmlFor="drive-url" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  URL de Google Drive
                </label>
                <input
                  type="url"
                  id="drive-url"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-[#f6f7f8] dark:bg-[#101922] px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc]/50 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec]"
                  placeholder="https://drive.google.com/..."
                />
                <p className="mt-2 text-xs text-gray-600 dark:text-[#b0bfcc]">
                  Asegúrate de que el archivo/carpeta tenga permisos de visualización para cualquiera con el enlace
                </p>
              </div>
            )}

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
                disabled={loading || (submissionType === 'text' && !textContent) || (submissionType === 'zip' && !fileUrl) || (submissionType === 'drive' && !driveUrl)}
                className="flex-1 rounded-lg bg-[#137fec] px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-[#137fec]/80 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Enviando...' : 'Enviar ejercicio'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
