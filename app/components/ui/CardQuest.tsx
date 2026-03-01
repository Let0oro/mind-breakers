'use client'

import { CardQuestBoard } from './cards/quest/CardQuestBoard'
import { CardQuestTimeline } from './cards/quest/CardQuestTimeline'
import { CardQuestRecommendation } from './cards/quest/CardQuestRecommendation'
import { CardQuestList } from './cards/quest/CardQuestList'
import { CardQuestCompact } from './cards/quest/CardQuestCompact'
import { CardQuestProfile } from './cards/quest/CardQuestProfile'
import { CardQuestGrid } from './cards/quest/CardQuestGrid'

export interface CardQuestProps {
    id: string
    title: string
    thumbnail_url?: string | null
    xp_reward?: number
    summary?: string
    instructor?: string
    duration?: string
    progress?: number
    status?: string
    href?: string
    variant?: 'grid' | 'compact' | 'profile' | 'draft' | 'list' | 'timeline' | 'recommendation' | 'board'
    isSaved?: boolean
    className?: string
    index?: number
    exercisesCount?: number
    organizationName?: string
    expeditionName?: string
    isLast?: boolean
}

export function CardQuest(props: CardQuestProps) {
    const { variant = 'grid' } = props

    switch (variant) {
        case 'board':
            return <CardQuestBoard {...props} />
        case 'timeline':
            return <CardQuestTimeline {...props} />
        case 'recommendation':
            return <CardQuestRecommendation {...props} />
        case 'list':
            return <CardQuestList {...props} />
        case 'compact':
            return <CardQuestCompact {...props} />
        case 'profile':
            return <CardQuestProfile {...props} />
        case 'draft':
            return <CardQuestGrid {...props} variant="draft" />
        case 'grid':
        default:
            return <CardQuestGrid {...props} variant="grid" />
    }
}