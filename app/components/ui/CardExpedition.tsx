'use client'

import { CardExpeditionHero } from './cards/expedition/CardExpeditionHero'
import { CardExpeditionProfile } from './cards/expedition/CardExpeditionProfile'
import { CardExpeditionMain } from './cards/expedition/CardExpeditionMain'

export interface CardExpeditionProps {
    id: string
    title: string
    summary?: string | null
    completedQuests?: number
    totalQuests?: number
    nextQuest?: string
    progressPercent?: number
    isSaved?: boolean
    isValidated?: boolean
    color?: string
    variant?: 'hero' | 'card' | 'profile'
    href?: string
    organizationName?: string
    createdAt?: string
    className?: string
    thumbnailUrl?: string | null
    isOwner?: boolean
    index?: number
}

export function CardExpedition(props: CardExpeditionProps) {
    const { variant = 'card' } = props

    switch (variant) {
        case 'hero':
            return <CardExpeditionHero {...props} />
        case 'profile':
            return <CardExpeditionProfile {...props} />
        case 'card':
        default:
            return <CardExpeditionMain {...props} />
    }
}
