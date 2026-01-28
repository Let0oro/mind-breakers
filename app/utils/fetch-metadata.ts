import { createClient } from '@/utils/supabase/client'

export interface MetadataResponse {
    title: string
    description: string
    thumbnail: string
    // Duration fields
    duration?: string
    durationHours?: number
    // YouTube-specific fields
    channelTitle?: string
}

export interface FetchMetadataResult {
    data: MetadataResponse | null
    error: string | null
}

/**
 * XP tiers based on course duration
 */
const XP_TIERS = [
    { maxHours: 2, xp: 25 },
    { maxHours: 4, xp: 50 },
    { maxHours: 8, xp: 100 },
    { maxHours: 20, xp: 150 },
    { maxHours: 40, xp: 200 },
    { maxHours: Infinity, xp: 300 },
]

/**
 * Calculate XP reward based on course duration in hours
 * Returns 0 if duration is not available (user should set manually)
 */
export function calculateXPFromDuration(durationHours?: number): number {
    if (!durationHours || durationHours <= 0) {
        return 0 // No duration = user must set manually
    }

    for (const tier of XP_TIERS) {
        if (durationHours < tier.maxHours) {
            return tier.xp
        }
    }

    return 300 // Max XP
}

/**
 * Get XP tier description for tooltip
 */
export function getXPTierDescription(): string {
    return `< 2h → 25 XP | 2-4h → 50 XP | 4-8h → 100 XP | 8-20h → 150 XP | 20-40h → 200 XP | 40h+ → 300 XP`
}

/**
 * Fetches metadata from a URL using the Supabase edge function.
 * Supports YouTube URLs (with extended metadata) and regular web URLs.
 * 
 * @param url - The URL to fetch metadata from
 * @returns Object with data (metadata) or error message
 */
export async function fetchUrlMetadata(url: string): Promise<FetchMetadataResult> {
    if (!url || !url.trim()) {
        return { data: null, error: 'URL is required' }
    }

    try {
        const supabase = createClient()

        const { data, error } = await supabase.functions.invoke('fetch-metadata', {
            body: { url: url.trim() }
        })

        if (error) {
            console.error('Edge function error:', error)
            return { data: null, error: error.message || 'Failed to fetch metadata' }
        }

        if (data?.error) {
            return { data: null, error: data.error }
        }

        return {
            data: {
                title: data.title || '',
                description: data.description || '',
                thumbnail: data.thumbnail || '',
                duration: data.duration,
                durationHours: data.durationHours,
                channelTitle: data.channelTitle,
            },
            error: null
        }
    } catch (err) {
        console.error('Fetch metadata error:', err)
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error occurred'
        }
    }
}

/**
 * Checks if a URL is a YouTube video URL
 */
export function isYouTubeUrl(url: string): boolean {
    return url.includes('youtube.com/watch') || url.includes('youtu.be/')
}

