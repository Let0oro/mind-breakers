import Link from 'next/link'

interface PathCardProps {
  id: string
  title: string
  summary?: string
  organization?: string
  courseCount: number
  completedCount?: number
}

export function PathCard({
  id,
  title,
  summary,
  organization,
  courseCount,
  completedCount = 0,
}: PathCardProps) {
  const progress = courseCount > 0 ? (completedCount / courseCount) * 100 : 0

  return (
    <Link href={`/dashboard/paths/${id}`} className="group">
      <div className="h-full overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-indigo-300 hover:shadow-lg">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
            {title}
          </h3>
          {summary && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {summary}
            </p>
          )}

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{completedCount}/{courseCount} cursos</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {organization && (
            <p className="mt-4 text-xs text-gray-500">
              Por {organization}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
