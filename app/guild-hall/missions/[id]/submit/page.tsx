'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { FileUpload } from '@/components/ui/FileUpload'
import { GitHubRepoSelector } from '@/components/features/GitHubRepoSelector'

interface Exercise {
  id: string
  title: string
  description?: string
  requirements?: string
  quests: {
    id: string
    title: string
    expeditions: {
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
  const [submissionType, setSubmissionType] = useState<'text' | 'zip' | 'drive' | 'github'>('text')
  const [fileUrl, setFileUrl] = useState<string>('')
  const [textContent, setTextContent] = useState<string>('')
  const [driveUrl, setDriveUrl] = useState<string>('')
  const [githubRepoUrl, setGithubRepoUrl] = useState<string>('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadExercise = async () => {
      const { data } = await supabase
        .from('quest_exercises')
        .select('*, quests (id, title, expeditions (id))')
        .eq('id', id)
        .single()

      if (data) setExercise(data as Exercise)
    }
    loadExercise()
  }, [supabase, id])

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
        .from('quest-assets')
        .upload(fileName, blob)

      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('quest-assets')
        .getPublicUrl(uploadData!.path)

      finalFileUrl = publicUrl
    }

    const { error: insertError } = await supabase
      .from('exercise_submissions')
      .insert({
        user_id: user.id,
        exercise_id: id,
        submission_type: submissionType,
        file_expedition: (submissionType === 'text' || submissionType === 'zip') ? finalFileUrl : null,
        drive_url: submissionType === 'drive' ? driveUrl : null,
        github_repo_url: submissionType === 'github' ? githubRepoUrl : null,
        status: 'pending',
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    await fetch('/api/streak/update', { method: 'POST' })

    if (exercise) {
      router.push(`/guild-hall/quests/${exercise.quests.id}`)
    }
  }

  if (!exercise) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted dark:text-muted">Cargando...</div>
      </div>
    )
  }

  return (
    <>
      <header className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted dark:text-muted hover:text-brand mb-4 inline-flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back
        </button>
        <h1 className="text-2xl font-bold text-text-main dark:text-text-main">
          Submit Mission
        </h1>
        <p className="text-muted dark:text-muted mt-2">
          {exercise.title}
        </p>
      </header>

      <div className="max-w-2xl">
        <div className="rounded-xl bg-main dark:bg-surface p-6 border border-border dark:border-border">
          {exercise.description && (
            <div className="mb-6 rounded-lg bg-brand/10 border border-brand/30 p-4">
              <h3 className="text-sm font-medium text-brand mb-2">
                Mission Description
              </h3>
              <p className="text-sm text-muted dark:text-muted whitespace-pre-wrap">
                {exercise.description}
              </p>
            </div>
          )}

          {exercise.requirements && (
            <div className="mb-6 rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
              <h3 className="text-sm font-medium text-amber-400 mb-2">
                Requirements
              </h3>
              <p className="text-sm text-muted dark:text-muted whitespace-pre-wrap">
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

            {/* TDD Recommendation Message */}
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 flex gap-3 items-start">
              <span className="material-symbols-outlined text-blue-400 text-xl shrink-0">info</span>
              <p className="text-sm text-text-main dark:text-gray-300">
                <span className="font-bold text-blue-400">Pro Tip:</span> It is not mandatory, but it is highly recommended that the submitted project has complete <strong>Test Driven Development (TDD)</strong>. This will demonstrate your quality as a developer!
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main dark:text-text-main mb-3">
                Submission Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setSubmissionType('text')}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${submissionType === 'text'
                    ? 'border-brand bg-brand/20 text-brand'
                    : 'border-border dark:border-border text-muted dark:text-muted hover:border-border/50'
                    }`}
                >
                  📝 Text
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionType('zip')}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${submissionType === 'zip'
                    ? 'border-brand bg-brand/20 text-brand'
                    : 'border-border dark:border-border text-muted dark:text-muted hover:border-border/50'
                    }`}
                >
                  📦 ZIP File
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionType('drive')}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${submissionType === 'drive'
                    ? 'border-brand bg-brand/20 text-brand'
                    : 'border-border dark:border-border text-muted dark:text-muted hover:border-border/50'
                    }`}
                >
                  ☁️ Google Drive
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionType('github')}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${submissionType === 'github'
                    ? 'border-brand bg-brand/20 text-brand'
                    : 'border-border dark:border-border text-muted dark:text-muted hover:border-border/50'
                    }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </button>
              </div>
            </div>

            {submissionType === 'text' && (
              <div>
                <label htmlFor="text-content" className="block text-sm font-medium text-text-main dark:text-text-main mb-2">
                  Your solution (code, answers, etc.)
                </label>
                <textarea
                  id="text-content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={12}
                  required
                  className="w-full rounded-lg border border-border dark:border-border bg-sidebar dark:bg-sidebar px-4 py-2 font-mono text-sm text-text-main dark:text-text-main placeholder:text-muted dark:text-muted/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  placeholder="Pega tu código o respuesta aquí..."
                />
              </div>
            )}

            {submissionType === 'zip' && (
              <div>
                <label className="block text-sm font-medium text-text-main dark:text-text-main mb-2">
                  Upload your project (ZIP)
                </label>
                {fileUrl ? (
                  <div className="rounded-lg border-2 border-green-500/50 bg-green-500/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined h-8 w-8 text-green-400">check_circle</span>
                        <span className="text-sm font-medium text-green-400">
                          File uploaded successfully
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFileUrl('')}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <FileUpload
                    bucket="quest-assets"
                    expedition="submissions/"
                    accept=".zip"
                    onUploadComplete={setFileUrl}
                    maxSizeMB={50}
                  />
                )}
              </div>
            )}

            {submissionType === 'drive' && (
              <div>
                <label htmlFor="drive-url" className="block text-sm font-medium text-text-main dark:text-text-main mb-2">
                  Google Drive URL
                </label>
                <input
                  type="url"
                  id="drive-url"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border dark:border-border bg-sidebar dark:bg-sidebar px-4 py-2 text-text-main dark:text-text-main placeholder:text-muted dark:text-muted/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="https://drive.google.com/..."
                />
                <p className="mt-2 text-xs text-muted dark:text-muted">
                  Ensure the file/folder has view permissions for anyone with the link
                </p>
              </div>
            )}

            {submissionType === 'github' && (
              <div>
                <label className="block text-sm font-medium text-text-main dark:text-text-main mb-2">
                  Select a GitHub repository
                </label>
                <GitHubRepoSelector
                  onSelect={setGithubRepoUrl}
                  selectedUrl={githubRepoUrl}
                />
                {githubRepoUrl && (
                  <div className="mt-3 rounded-lg border-2 border-green-500/50 bg-green-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-400">check_circle</span>
                      <span className="text-sm font-medium text-green-400">Selected repository</span>
                    </div>
                    <a
                      href={githubRepoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand hover:underline mt-1 block truncate"
                    >
                      {githubRepoUrl}
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 rounded-lg border border-border dark:border-border px-4 py-2 text-sm font-medium text-muted dark:text-muted hover:bg-surface dark:hover:bg-border/30 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (submissionType === 'text' && !textContent) || (submissionType === 'zip' && !fileUrl) || (submissionType === 'drive' && !driveUrl) || (submissionType === 'github' && !githubRepoUrl)}
                className="flex-1 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-text-main dark:text-text-main hover:bg-brand/80 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Mission'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
