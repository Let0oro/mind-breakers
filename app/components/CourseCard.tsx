import Link from 'next/link'

interface CourseCardProps {
  id: string
  title: string
  summary?: string
  thumbnailUrl?: string
  organization?: string
  xpReward: number
  completed?: boolean
}

export function CourseCard({
  id,
  title,
  summary,
  thumbnailUrl,
  organization,
  xpReward,
  completed = false,
}: CourseCardProps) {
  return (
    <Link href={`/dashboard/courses/${id}`} className="group">
      <div className={`overflow-hidden rounded-lg transition-all hover:shadow-xl ${
        completed ? 'border-2 border-green-500' : 'border border-gray-200'
      }`}>
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-gray-200">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {completed && (
            <div className="absolute top-2 right-2 rounded-full bg-green-500 p-1 text-white shadow-lg">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">
            {title}
          </h3>
          {summary && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {summary}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            {organization && <span>📚 {organization}</span>}
            <span className="font-medium text-indigo-600">⚡ {xpReward} XP</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
