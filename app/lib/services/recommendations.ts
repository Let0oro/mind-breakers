import { createClient } from '@/utils/supabase/server'
import * as cheerio from 'cheerio'

export interface RecommendedQuest {
    url: string
    title: string
    description?: string
    image?: string
    sourceExpeditionTitle: string
    sourceExpeditionId: string
}

/**
 * Obtiene metadata (título, imagen) de una URL usando cheerio
 */
export async function getUrlMetadata(url: string) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; MindBreakerBot/1.0)',
            },
            next: { revalidate: 3600 * 24 } // Cachear por 24 horas
        })

        if (!response.ok) return null

        const html = await response.text()
        const $ = cheerio.load(html)

        const title = $('meta[property="og:title"]').attr('content') || $('title').text() || ''
        const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || ''
        const image = $('meta[property="og:image"]').attr('content') || ''

        return { title, description, image }
    } catch (error) {
        console.error(`Error fetching metadata for ${url}:`, error)
        return null
    }
}

/**
 * Busca misiones (quests) recomendadas de expediciones similares
 * Similitud = compartir al menos un enlace (Quest.link_url)
 */
export async function getRecommendedQuests(expeditionId: string): Promise<RecommendedQuest[]> {
    const supabase = await createClient()

    // 1. Obtener los links de la expedición actual
    const { data: currentExpeditionData } = await supabase
        .from('quests')
        .select('link_url')
        .eq('expedition_id', expeditionId)
        .not('link_url', 'is', null)

    const currentLinks = currentExpeditionData?.map(c => c.link_url).filter(Boolean) as string[] || []

    if (currentLinks.length === 0) return []

    // 2. Encontrar otras expediciones que contengan cualquiera de estos links
    const { data: similarQuestsMatch } = await supabase
        .from('quests')
        .select('expedition_id, link_url')
        .in('link_url', currentLinks)
        .neq('expedition_id', expeditionId)

    if (!similarQuestsMatch || similarQuestsMatch.length === 0) return []

    // Extraer IDs de expediciones únicos
    const similarExpeditionIds = Array.from(new Set(similarQuestsMatch.map(c => c.expedition_id)))

    // 3. Obtener "otras" misiones de esas expediciones
    const { data: recommendedRaw } = await supabase
        .from('quests')
        .select(`
      link_url,
      title,
      expeditions!inner (
        id,
        title
      )
    `)
        .in('expedition_id', similarExpeditionIds)
        .not('link_url', 'in', `(${currentLinks.map(l => `"${l}"`).join(',')})`)
        .limit(10)

    if (!recommendedRaw) return []

    // 4. Enriquecer con metadatos y deduplicar por URL
    const uniqueRecommendations = new Map<string, RecommendedQuest>()

    for (const item of recommendedRaw) {
        if (!item.link_url) continue
        if (uniqueRecommendations.has(item.link_url)) continue

        const expedition = Array.isArray(item.expeditions)
            ? item.expeditions[0]
            : item.expeditions as unknown as { id: string, title: string } | null

        const baseRec: RecommendedQuest = {
            url: item.link_url,
            title: item.title,
            sourceExpeditionTitle: expedition?.title || 'Unknown Expedition',
            sourceExpeditionId: expedition?.id || '',
        }

        uniqueRecommendations.set(item.link_url, baseRec)
    }

    // Fetch metadata en paralelo
    const allRecommendations = Array.from(uniqueRecommendations.values())
    // Shuffle and pick 3 random items
    const shuffledRecommendations = allRecommendations.sort(() => 0.5 - Math.random()).slice(0, 3)

    await Promise.all(
        shuffledRecommendations.map(async (rec) => {
            const meta = await getUrlMetadata(rec.url)
            if (meta) {
                if (meta.title) rec.title = meta.title
                rec.description = meta.description
                rec.image = meta.image
            }
        })
    )

    return shuffledRecommendations
}
