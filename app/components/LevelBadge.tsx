interface LevelBadgeProps {
  level: number
  xp: number
  showProgress?: boolean
}

export function LevelBadge({ level, xp, showProgress = true }: LevelBadgeProps) {
  // Cálculo simple: cada nivel requiere 1000 XP más que el anterior
  const xpForNextLevel = level * 1000
  const xpProgress = xp % 1000
  const progressPercentage = (xpProgress / 1000) * 100

  const getLevelColor = (level: number) => {
    if (level < 5) return 'bg-green-500'
    if (level < 10) return 'bg-blue-500'
    if (level < 20) return 'bg-purple-500'
    if (level < 50) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${getLevelColor(level)} text-white font-bold text-lg shadow-lg`}>
          {level}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">Nivel {level}</div>
          <div className="text-xs text-gray-500">{xp.toLocaleString()} XP total</div>
        </div>
      </div>
      
      {showProgress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Siguiente nivel</span>
            <span>{xpProgress}/{1000} XP</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full ${getLevelColor(level)} transition-all duration-500`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

