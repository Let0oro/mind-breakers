import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

interface MetadataRequest {
    url: string
    type?: 'youtube' | 'web'
}

interface MetadataResult {
    title: string
    description: string
    thumbnail: string
    duration?: string
    durationHours?: number
    channelTitle?: string
}

// ============================================================================
// Duration Parsing
// ============================================================================

/**
 * Parse ISO 8601 duration (YouTube format) to hours
 * Example: PT1H30M45S -> 1.5125
 */
function parseISO8601Duration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0

    const hours = parseInt(match[1] || '0', 10)
    const minutes = parseInt(match[2] || '0', 10)
    const seconds = parseInt(match[3] || '0', 10)

    return hours + minutes / 60 + seconds / 3600
}

/**
 * Parse human-readable duration text to hours
 * Examples: "10 hours", "2h 30m", "45 minutes", "1.5 hrs"
 */
function parseTextDuration(text: string): number {
    if (!text) return 0

    const lowerText = text.toLowerCase()

    // Pattern: "X hours Y minutes" or "Xh Ym"
    const hoursMinutes = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\s*(?:(\d+)\s*(?:minutes?|mins?|m))?/)
    if (hoursMinutes) {
        const hours = parseFloat(hoursMinutes[1])
        const minutes = parseInt(hoursMinutes[2] || '0', 10)
        return hours + minutes / 60
    }

    // Pattern: "X minutes" only
    const minutesOnly = lowerText.match(/(\d+)\s*(?:minutes?|mins?|m)/)
    if (minutesOnly) {
        return parseInt(minutesOnly[1], 10) / 60
    }

    // Pattern: just a number followed by hours
    const justHours = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)/)
    if (justHours) {
        return parseFloat(justHours[1])
    }

    return 0
}

// ============================================================================
// YouTube Metadata
// ============================================================================

async function fetchYouTubeMetadata(videoId: string, apiKey: string): Promise<MetadataResult> {
    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`
    )

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
        throw new Error('Video not found')
    }

    const video = data.items[0]
    const duration = video.contentDetails.duration
    const durationHours = parseISO8601Duration(duration)

    return {
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
        duration: duration,
        durationHours: durationHours,
        channelTitle: video.snippet.channelTitle,
    }
}

// ============================================================================
// Jina AI Reader - Fallback for SPAs
// ============================================================================

async function fetchWithJinaAI(url: string): Promise<MetadataResult> {
    try {
        const response = await fetch(`https://r.jina.ai/${url}`, {
            headers: {
                'Accept': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error(`Jina API error: ${response.status}`)
        }

        const data = await response.json()

        return {
            title: data.data?.title || '',
            description: data.data?.description || '',
            thumbnail: data.data?.image || '',
        }
    } catch (error) {
        console.error('Jina AI fallback failed:', error)
        throw error
    }
}

// ============================================================================
// HTML Parsing Utilities
// ============================================================================

function decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&#x27;': "'",
        '&#x2F;': '/',
        '&nbsp;': ' ',
    }
    return text.replace(/&(?:amp|lt|gt|quot|#39|apos|#x27|#x2F|nbsp);/gi, (match) => entities[match.toLowerCase()] || match)
}

function cleanTitle(title: string): string {
    if (!title) return ''

    title = decodeHtmlEntities(title.trim())

    const separators = [' | ', ' - ', ' – ', ' : ', ' — ']

    for (const sep of separators) {
        if (title.includes(sep)) {
            const parts = title.split(sep)
            const meaningfulParts = parts.filter(part => {
                const cleaned = part.trim().toLowerCase()
                const genericTerms = ['edx', 'youtube', 'coursera', 'udemy', 'course', 'curso', 'learn', 'home']
                if (genericTerms.includes(cleaned)) return false
                if (part.trim().length < 4) return false
                return true
            })

            if (meaningfulParts.length > 0) {
                return meaningfulParts.reduce((a, b) => a.length > b.length ? a : b).trim()
            }
        }
    }

    return title.trim()
}

function extractMetaContent(html: string, property: string, isName = false): string | null {
    const attr = isName ? 'name' : 'property'
    const patterns = [
        new RegExp(`<meta[^>]*${attr}=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'),
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${property}["']`, 'i'),
    ]

    for (const pattern of patterns) {
        const match = html.match(pattern)
        if (match && match[1]) {
            return decodeHtmlEntities(match[1])
        }
    }

    return null
}

function isGenericTitle(title: string): boolean {
    if (!title || title.length < 10) return true

    const genericPatterns = [
        /^course\s*\|/i,
        /^curso\s*\|/i,
        /^\s*edx\s*$/i,
        /^home\s*[-|]/i,
        /^loading/i,
        /^untitled/i,
    ]

    return genericPatterns.some(pattern => pattern.test(title))
}

/**
 * Extract duration from HTML content
 */
function extractDurationFromHtml(html: string): number {
    // Try common duration patterns in meta tags or content
    const patterns = [
        // Schema.org duration
        /"duration":\s*"PT?([^"]+)"/i,
        // Common text patterns
        /(?:duration|length|time):\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i,
        /(\d+)\s*(?:hours?|hrs?)\s*(?:(\d+)\s*(?:minutes?|mins?))?/i,
    ]

    for (const pattern of patterns) {
        const match = html.match(pattern)
        if (match) {
            // If it looks like ISO 8601
            if (match[1] && match[1].includes('H')) {
                return parseISO8601Duration('PT' + match[1])
            }
            // If it's hours and optional minutes
            if (match[1]) {
                const hours = parseFloat(match[1])
                const minutes = match[2] ? parseInt(match[2], 10) : 0
                return hours + minutes / 60
            }
        }
    }

    return 0
}

// ============================================================================
// Web Metadata Extraction
// ============================================================================

async function fetchWebMetadata(url: string): Promise<MetadataResult> {
    let title = ''
    let description = ''
    let thumbnail = ''
    let durationHours = 0

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
            },
        })

        if (response.ok) {
            const html = await response.text()

            // Try og:title
            const ogTitle = extractMetaContent(html, 'og:title')
            if (ogTitle && ogTitle.length > 3) {
                title = cleanTitle(ogTitle)
            }

            // Try twitter:title
            if (!title || isGenericTitle(title)) {
                const twitterTitle = extractMetaContent(html, 'twitter:title', true)
                if (twitterTitle && twitterTitle.length > 3) {
                    title = cleanTitle(twitterTitle)
                }
            }

            // Try <title> tag
            if (!title || isGenericTitle(title)) {
                const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
                if (titleMatch && titleMatch[1]) {
                    title = cleanTitle(titleMatch[1])
                }
            }

            // Try specific patterns for known sites
            if (!title || isGenericTitle(title)) {
                const edxTitle = html.match(/class="[^"]*course-title[^"]*"[^>]*>([^<]+)</i)
                if (edxTitle && edxTitle[1]) {
                    title = decodeHtmlEntities(edxTitle[1].trim())
                }
            }

            // Extract description
            const ogDesc = extractMetaContent(html, 'og:description')
            description = ogDesc || extractMetaContent(html, 'description', true) || ''

            // Extract thumbnail
            const ogImage = extractMetaContent(html, 'og:image')
            if (ogImage) {
                thumbnail = ogImage
                if (thumbnail.startsWith('/')) {
                    const urlObj = new URL(url)
                    thumbnail = `${urlObj.protocol}//${urlObj.host}${thumbnail}`
                }
            }

            // Extract duration
            durationHours = extractDurationFromHtml(html)
        }
    } catch (error) {
        console.error('Standard fetch failed:', error)
    }

    // Fallback to Jina AI for SPAs or when title is generic
    if (!title || isGenericTitle(title)) {
        console.log('Using Jina AI fallback for:', url)
        try {
            const jinaResult = await fetchWithJinaAI(url)
            if (jinaResult.title && !isGenericTitle(jinaResult.title)) {
                title = jinaResult.title
            }
            if (!description && jinaResult.description) {
                description = jinaResult.description
            }
            if (!thumbnail && jinaResult.thumbnail) {
                thumbnail = jinaResult.thumbnail
            }
        } catch (jinaError) {
            console.error('Jina AI fallback also failed:', jinaError)
        }
    }

    return {
        title: title || 'Sin título',
        description: description || '',
        thumbnail: thumbnail || '',
        durationHours: durationHours > 0 ? durationHours : undefined,
    }
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { url, type }: MetadataRequest = await req.json()

        if (!url) {
            throw new Error('URL is required')
        }

        let metadata: MetadataResult

        const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')

        if (isYouTube || type === 'youtube') {
            const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)

            if (!videoIdMatch) {
                throw new Error('Invalid YouTube URL')
            }

            const videoId = videoIdMatch[1]
            const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')

            if (youtubeApiKey) {
                metadata = await fetchYouTubeMetadata(videoId, youtubeApiKey)
            } else {
                metadata = await fetchWebMetadata(url)
            }
        } else {
            metadata = await fetchWebMetadata(url)
        }

        return new Response(
            JSON.stringify(metadata),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
