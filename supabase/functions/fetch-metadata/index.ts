// import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// const corsHeaders = {
//     'Access-Control-Allow-Origin': '*',
//     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
// }

// interface MetadataRequest {
//     url: string
//     type?: 'youtube' | 'web'
// }

// interface MetadataResult {
//     title: string
//     description: string
//     thumbnail: string
//     duration?: string
//     channelTitle?: string
// }

// // ============================================================================
// // YouTube Metadata
// // ============================================================================

// async function fetchYouTubeMetadata(videoId: string, apiKey: string): Promise<MetadataResult> {
//     const response = await fetch(
//         `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`
//     )

//     const data = await response.json()

//     if (!data.items || data.items.length === 0) {
//         throw new Error('Video not found')
//     }

//     const video = data.items[0]

//     return {
//         title: video.snippet.title,
//         description: video.snippet.description,
//         thumbnail: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
//         duration: video.contentDetails.duration,
//         channelTitle: video.snippet.channelTitle,
//     }
// }

// // ============================================================================
// // Jina AI Reader - Fallback for SPAs
// // ============================================================================

// async function fetchWithJinaAI(url: string): Promise<MetadataResult> {
//     try {
//         const response = await fetch(`https://r.jina.ai/${url}`, {
//             headers: {
//                 'Accept': 'application/json',
//             },
//         })

//         if (!response.ok) {
//             throw new Error(`Jina API error: ${response.status}`)
//         }

//         const data = await response.json()

//         return {
//             title: data.data?.title || '',
//             description: data.data?.description || '',
//             thumbnail: data.data?.image || '',
//         }
//     } catch (error) {
//         console.error('Jina AI fallback failed:', error)
//         throw error
//     }
// }

// // ============================================================================
// // HTML Parsing Utilities
// // ============================================================================

// function decodeHtmlEntities(text: string): string {
//     const entities: Record<string, string> = {
//         '&amp;': '&',
//         '&lt;': '<',
//         '&gt;': '>',
//         '&quot;': '"',
//         '&#39;': "'",
//         '&apos;': "'",
//         '&#x27;': "'",
//         '&#x2F;': '/',
//         '&nbsp;': ' ',
//     }
//     return text.replace(/&(?:amp|lt|gt|quot|#39|apos|#x27|#x2F|nbsp);/gi, (match) => entities[match.toLowerCase()] || match)
// }

// function cleanTitle(title: string): string {
//     if (!title) return ''

//     title = decodeHtmlEntities(title.trim())

//     const separators = [' | ', ' - ', ' – ', ' : ', ' — ']

//     for (const sep of separators) {
//         if (title.includes(sep)) {
//             const parts = title.split(sep)
//             const meaningfulParts = parts.filter(part => {
//                 const cleaned = part.trim().toLowerCase()
//                 const genericTerms = ['edx', 'youtube', 'coursera', 'udemy', 'course', 'curso', 'learn', 'home']
//                 if (genericTerms.includes(cleaned)) return false
//                 if (part.trim().length < 4) return false
//                 return true
//             })

//             if (meaningfulParts.length > 0) {
//                 return meaningfulParts.reduce((a, b) => a.length > b.length ? a : b).trim()
//             }
//         }
//     }

//     return title.trim()
// }

// function extractMetaContent(html: string, property: string, isName = false): string | null {
//     const attr = isName ? 'name' : 'property'
//     const patterns = [
//         new RegExp(`<meta[^>]*${attr}=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'),
//         new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${property}["']`, 'i'),
//     ]

//     for (const pattern of patterns) {
//         const match = html.match(pattern)
//         if (match && match[1]) {
//             return decodeHtmlEntities(match[1])
//         }
//     }

//     return null
// }

// function isGenericTitle(title: string): boolean {
//     if (!title || title.length < 10) return true

//     const genericPatterns = [
//         /^course\s*\|/i,
//         /^curso\s*\|/i,
//         /^\s*edx\s*$/i,
//         /^home\s*[-|]/i,
//         /^loading/i,
//         /^untitled/i,
//     ]

//     return genericPatterns.some(pattern => pattern.test(title))
// }

// // ============================================================================
// // Web Metadata Extraction
// // ============================================================================

// async function fetchWebMetadata(url: string): Promise<MetadataResult> {
//     let title = ''
//     let description = ''
//     let thumbnail = ''

//     try {
//         // First attempt: standard fetch
//         const response = await fetch(url, {
//             headers: {
//                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
//                 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
//                 'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
//             },
//         })

//         if (response.ok) {
//             const html = await response.text()

//             // Try og:title
//             const ogTitle = extractMetaContent(html, 'og:title')
//             if (ogTitle && ogTitle.length > 3) {
//                 title = cleanTitle(ogTitle)
//             }

//             // Try twitter:title
//             if (!title || isGenericTitle(title)) {
//                 const twitterTitle = extractMetaContent(html, 'twitter:title', true)
//                 if (twitterTitle && twitterTitle.length > 3) {
//                     title = cleanTitle(twitterTitle)
//                 }
//             }

//             // Try <title> tag
//             if (!title || isGenericTitle(title)) {
//                 const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
//                 if (titleMatch && titleMatch[1]) {
//                     title = cleanTitle(titleMatch[1])
//                 }
//             }

//             // Try specific patterns for known sites
//             if (!title || isGenericTitle(title)) {
//                 // edX course title
//                 const edxTitle = html.match(/class="[^"]*course-title[^"]*"[^>]*>([^<]+)</i)
//                 if (edxTitle && edxTitle[1]) {
//                     title = decodeHtmlEntities(edxTitle[1].trim())
//                 }
//             }

//             // Extract description
//             const ogDesc = extractMetaContent(html, 'og:description')
//             description = ogDesc || extractMetaContent(html, 'description', true) || ''

//             // Extract thumbnail
//             const ogImage = extractMetaContent(html, 'og:image')
//             if (ogImage) {
//                 thumbnail = ogImage
//                 if (thumbnail.startsWith('/')) {
//                     const urlObj = new URL(url)
//                     thumbnail = `${urlObj.protocol}//${urlObj.host}${thumbnail}`
//                 }
//             }
//         }
//     } catch (error) {
//         console.error('Standard fetch failed:', error)
//     }

//     // Fallback to Jina AI for SPAs or when title is generic
//     if (!title || isGenericTitle(title)) {
//         console.log('Using Jina AI fallback for:', url)
//         try {
//             const jinaResult = await fetchWithJinaAI(url)
//             if (jinaResult.title && !isGenericTitle(jinaResult.title)) {
//                 title = jinaResult.title
//             }
//             if (!description && jinaResult.description) {
//                 description = jinaResult.description
//             }
//             if (!thumbnail && jinaResult.thumbnail) {
//                 thumbnail = jinaResult.thumbnail
//             }
//         } catch (jinaError) {
//             console.error('Jina AI fallback also failed:', jinaError)
//         }
//     }

//     return {
//         title: title || 'Sin título',
//         description: description || '',
//         thumbnail: thumbnail || '',
//     }
// }

// // ============================================================================
// // Main Handler
// // ============================================================================

// serve(async (req) => {
//     if (req.method === 'OPTIONS') {
//         return new Response('ok', { headers: corsHeaders })
//     }

//     try {
//         const { url, type }: MetadataRequest = await req.json()

//         if (!url) {
//             throw new Error('URL is required')
//         }

//         let metadata: MetadataResult

//         const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')

//         if (isYouTube || type === 'youtube') {
//             const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)

//             if (!videoIdMatch) {
//                 throw new Error('Invalid YouTube URL')
//             }

//             const videoId = videoIdMatch[1]
//             const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')

//             if (youtubeApiKey) {
//                 metadata = await fetchYouTubeMetadata(videoId, youtubeApiKey)
//             } else {
//                 metadata = await fetchWebMetadata(url)
//             }
//         } else {
//             metadata = await fetchWebMetadata(url)
//         }

//         return new Response(
//             JSON.stringify(metadata),
//             {
//                 headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//                 status: 200,
//             }
//         )
//     } catch (error) {
//         return new Response(
//             JSON.stringify({ error: error.message }),
//             {
//                 headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//                 status: 400,
//             }
//         )
//     }
// })
