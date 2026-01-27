'use client'

import { YouTubeEmbed } from '@next/third-parties/google'

interface YouTubePlayerProps {
  url: string
  onComplete?: () => void
}

export function YouTubePlayer({ url, onComplete }: YouTubePlayerProps) {
  // Extraer video ID de diferentes formatos de URL
  const getVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const videoId = getVideoId(url)

  if (!videoId) {
    return (
      <div className="flex aspect-video items-center justify-center bg-gray-100 text-gray-500">
        URL de YouTube inválida
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <YouTubeEmbed 
        videoid={videoId} 
        height={400}
        params="controls=1&modestbranding=1"
      />
      {onComplete && (
        <button
          onClick={onComplete}
          className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Marcar como completado
        </button>
      )}
    </div>
  )
}
