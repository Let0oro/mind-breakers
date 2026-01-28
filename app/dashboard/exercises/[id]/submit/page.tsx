'use client'

import { useState, useEffect, useEffectEvent } from 'react'
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

export default function SubmitExercisePage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [submissionType, setSubmissionType] = useState<'text' | 'zip' | 'drive'>('text')
  const [fileUrl, setFileUrl] = useState<string>('')
  const [textContent, setTextContent] = useState<string>('')
  const [driveUrl, setDriveUrl] = useState<string>('')

  const router = useRouter()
  const supabase = createClient()

  // useEffectEvent para cargar ejercicio sin deps reactivas
  const loadExercise = useEffectEvent(async () => {
    const { data } = await supabase
      .from('course_exercises')
      .select('*, courses (id, title, learning_paths (id))')
      .eq('id', params.id)
      .single()

    if (data) setExercise(data as Exercise)
  })

  useEffect(() => {
    loadExercise()
  }, [params.id, loadExercise])

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
        exercise_id: params.id,
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Entregar ejercicio
          </h1>
          <p className="text-gray-600 mb-6">
            {exercise.title}
          </p>

          {exercise.description && (
            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Descripción del ejercicio
              </h3>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">
                {exercise.description}
              </p>
            </div>
          )}

          {exercise.requirements && (
            <div className="mb-6 rounded-lg bg-amber-50 p-4">
              <h3 className="text-sm font-medium text-amber-900 mb-2">
                Requisitos
              </h3>
              <p className="text-sm text-amber-800 whitespace-pre-wrap">
                {exercise.requirements}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de entrega
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSubmissionType('text')}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${submissionType === 'text'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                >
                  📝 Texto
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionType('zip')}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${submissionType === 'zip'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                >
                  📦 Archivo ZIP
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionType('drive')}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${submissionType === 'drive'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                >
                  ☁️ Google Drive
                </button>
              </div>
            </div>

            {submissionType === 'text' && (
              <div>
                <label htmlFor="text-content" className="block text-sm font-medium text-gray-700 mb-2">
                  Tu solución (código, respuestas, etc.)
                </label>
                <textarea
                  id="text-content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={12}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Pega tu código o respuesta aquí..."
                />
              </div>
            )}

            {submissionType === 'zip' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sube tu proyecto (ZIP)
                </label>
                {fileUrl ? (
                  <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined h-8 w-8 text-green-600">check_circle</span>
                        <span className="text-sm font-medium text-green-900">
                          Archivo subido correctamente
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFileUrl('')}
                        className="text-sm text-red-600 hover:text-red-700"
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
                <label htmlFor="drive-url" className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Google Drive
                </label>
                <input
                  type="url"
                  id="drive-url"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="https://drive.google.com/..."
                />
                <p className="mt-2 text-xs text-gray-500">
                  Asegúrate de que el archivo/carpeta tenga permisos de visualización para cualquiera con el enlace
                </p>
              </div>
            )}

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
                disabled={loading || (submissionType === 'text' && !textContent) || (submissionType === 'zip' && !fileUrl) || (submissionType === 'drive' && !driveUrl)}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar ejercicio'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
