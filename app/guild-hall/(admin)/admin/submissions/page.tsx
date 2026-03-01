import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { getSubmissionsListCached } from '@/lib/cache'

interface Submission {
  id: string
  user_id: string
  exercise_id: string
  submission_type: string
  file_expedition: string | null
  drive_url: string | null
  github_repo_url: string | null
  submitted_at: string
  status: string
  profiles: { username: string | null }
  quest_exercises: {
    title: string
    quests: { title: string; id: string }
  }
}

export default async function AdminSubmissionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use cached query
  const submissions = await getSubmissionsListCached(supabase)

  return (
    <>
      <header className="mb-8">
        <Link
          href="/guild-hall"
          className="text-xs font-bold uppercase tracking-widest text-muted hover:text-text-main mb-4 inline-flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Dashboard
        </Link>
        <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-text-main">
          Review Submissions
        </h1>
      </header>

      <div className="space-y-4">
        {submissions && submissions.length > 0 ? (
          submissions.map((submission) => {
            const sub = submission as unknown as Submission
            return (
              <div
                key={sub.id}
                className={`border-2 bg-main p-6 ${sub.status === 'pending'
                  ? 'border-amber-500/50'
                  : sub.status === 'approved'
                    ? 'border-green-500/50'
                    : 'border-red-500/50'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-text-main">
                        {sub.quest_exercises.title}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${sub.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-500'
                          : sub.status === 'approved'
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                          }`}
                      >
                        {sub.status === 'pending' && 'Pending'}
                        {sub.status === 'approved' && 'Approved'}
                        {sub.status === 'rejected' && 'Rejected'}
                      </span>
                    </div>

                    <p className="text-sm text-muted mb-2">
                      Quest: {sub.quest_exercises.quests.title}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">person</span>
                        {sub.profiles.username || 'Anonymous'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">attach_file</span>
                        {sub.submission_type === 'text' ? 'Text' : sub.submission_type === 'zip' ? 'ZIP' : sub.submission_type === 'github' ? 'GitHub' : 'Drive'}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {sub.file_expedition && (
                        <a
                          href={sub.file_expedition}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 border border-border text-xs font-bold uppercase tracking-widest text-text-main hover:bg-surface transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          Download
                        </a>
                      )}
                      {sub.drive_url && (
                        <a
                          href={sub.drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 border border-border text-xs font-bold uppercase tracking-widest text-text-main hover:bg-surface transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Open Drive
                        </a>
                      )}
                      {sub.github_repo_url && (
                        <a
                          href={sub.github_repo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 border border-border text-xs font-bold uppercase tracking-widest text-text-main hover:bg-surface transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                          </svg>
                          GitHub
                        </a>
                      )}
                      <Link
                        href={`/guild-hall/quests/${sub.quest_exercises.quests.id}`}
                        className="inline-flex items-center gap-2 px-3 py-2 border border-border text-xs font-bold uppercase tracking-widest text-muted hover:text-text-main hover:bg-surface transition-colors"
                      >
                        View Quest
                      </Link>
                    </div>
                  </div>

                  {sub.status === 'pending' && (
                    <div className="ml-4 flex gap-2">
                      <form action={`/api/submissions/${sub.id}/approve`} method="POST">
                        <button
                          type="submit"
                          className="h-10 px-4 border border-green-500/30 text-green-500 text-xs font-bold uppercase tracking-widest hover:bg-green-500/10 transition-colors"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={`/api/submissions/${sub.id}/reject`} method="POST">
                        <button
                          type="submit"
                          className="h-10 px-4 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 transition-colors"
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="border border-border bg-main p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-muted mb-2 block">inbox</span>
            <p className="text-muted text-sm uppercase tracking-widest">No submissions to review</p>
          </div>
        )}
      </div>
    </>
  )
}
