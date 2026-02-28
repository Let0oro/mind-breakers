import { createClient } from '@/utils/supabase/server'
import * as cheerio from 'cheerio'

export interface RecommendedQuest {
    url: string
    title: string
    description?: string
    image?: string
    sourceExpeditionTitle: string // Nombre del expedition donde se encontró
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
 * Busca cursos recomendados de expeditions similares
 * Similitud = compartir al menos un enlace (Quest.link_url)
 */
export async function getRecommendedQuests(expeditionId: string): Promise<RecommendedQuest[]> {
    const supabase = await createClient()

    // 1. Obtener los links del expedition actual
    const { data: currentExpeditionData } = await supabase
        .from('quests')
        .select('link_url')
        .eq('expedition_id', expeditionId)
        .not('link_url', 'is', null)

    const currentLinks = currentExpeditionData?.map(c => c.link_url).filter(Boolean) as string[] || []

    if (currentLinks.length === 0) return []

    // 2. Encontrar otros expeditions que contengan cualquiera de estos links
    // Nota: Esto podría ser costoso si hay muchísimos datos, pero para < 10k cursos está bien.
    // Idealmente se haría con una función RPC en Supabase, pero lo haremos en aplicación por ahora.

    // Buscar cursos que tengan esos links pero NO sean del expedition actual
    const { data: similarQuestsMatch } = await supabase
        .from('quests')
        .select('expedition_id, link_url')
        .in('link_url', currentLinks)
        .neq('expedition_id', expeditionId)

    if (!similarQuestsMatch || similarQuestsMatch.length === 0) return []

    // Extraer IDs de expeditions únicos
    const similarExpeditionIds = Array.from(new Set(similarQuestsMatch.map(c => c.expedition_id)))

    // 3. Obtener "otros" cursos de esos expeditions (cursos que NO están en el expedition actual)
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
        .not('link_url', 'in', `(${currentLinks.map(l => `"${l}"`).join(',')})`) // Excluir links que ya tenemos
        .limit(10) // Limitar recomendaciones

    if (!recommendedRaw) return []

    // 4. Enriquecer con metadatos y dedublicar por URL
    const uniqueRecommendations = new Map<string, RecommendedQuest>()

    for (const item of recommendedRaw) {
        if (!item.link_url) continue
        if (uniqueRecommendations.has(item.link_url)) continue

        // Usar título del curso como fallback inicial
        const learningExpedition = Array.isArray(item.expeditions)
            ? item.expeditions[0]
            : item.expeditions as unknown as { id: string, title: string } | null

        const baseRec: RecommendedQuest = {
            url: item.link_url,
            title: item.title,
            sourceExpeditionTitle: learningExpedition?.title || 'Unknown Expedition',
            sourceExpeditionId: learningExpedition?.id || '',
        }

        uniqueRecommendations.set(item.link_url, baseRec)
    }

    // Fetch metadata en paralelo
    const recommendations = Array.from(uniqueRecommendations.values())

    await Promise.all(
        recommendations.map(async (rec) => {
            const meta = await getUrlMetadata(rec.url)
            if (meta) {
                if (meta.title) rec.title = meta.title
                rec.description = meta.description
                rec.image = meta.image
            }
        })
    )

    return recommendations
}
