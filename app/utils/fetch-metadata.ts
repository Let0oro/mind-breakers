import { createClient } from '@/utils/supabase/client'

export interface MetadataResponse {
    title: string
    description: string
    thumbnail: string
    // YouTube-specific fields
    duration?: string
    channelTitle?: string
}

export interface FetchMetadataResult {
    data: MetadataResponse | null
    error: string | null
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
