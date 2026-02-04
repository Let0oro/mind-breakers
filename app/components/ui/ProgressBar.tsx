interface ProgressBarProps {
  current: number
  total: number
  showLabel?: boolean
}

export function ProgressBar({ current, total, showLabel = true }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progreso</span>
          <span className="font-medium">{current}/{total} cursos</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-right text-xs text-gray-500">{percentage}%</div>
      )}
    </div>
  )
}
