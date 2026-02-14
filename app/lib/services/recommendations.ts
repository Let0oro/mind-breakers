import { createClient } from '@/utils/supabase/server'
import * as cheerio from 'cheerio'

export interface RecommendedCourse {
    url: string
    title: string
    description?: string
    image?: string
    sourcePathTitle: string // Nombre del path donde se encontró
    sourcePathId: string
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
 * Busca cursos recomendados de paths similares
 * Similitud = compartir al menos un enlace (Course.link_url)
 */
export async function getRecommendedCourses(pathId: string): Promise<RecommendedCourse[]> {
    const supabase = await createClient()

    // 1. Obtener los links del path actual
    const { data: currentPathData } = await supabase
        .from('courses')
        .select('link_url')
        .eq('path_id', pathId)
        .not('link_url', 'is', null)

    const currentLinks = currentPathData?.map(c => c.link_url).filter(Boolean) as string[] || []

    if (currentLinks.length === 0) return []

    // 2. Encontrar otros paths que contengan cualquiera de estos links
    // Nota: Esto podría ser costoso si hay muchísimos datos, pero para < 10k cursos está bien.
    // Idealmente se haría con una función RPC en Supabase, pero lo haremos en aplicación por ahora.

    // Buscar cursos que tengan esos links pero NO sean del path actual
    const { data: similarCoursesMatch } = await supabase
        .from('courses')
        .select('path_id, link_url')
        .in('link_url', currentLinks)
        .neq('path_id', pathId)

    if (!similarCoursesMatch || similarCoursesMatch.length === 0) return []

    // Extraer IDs de paths únicos
    const similarPathIds = Array.from(new Set(similarCoursesMatch.map(c => c.path_id)))

    // 3. Obtener "otros" cursos de esos paths (cursos que NO están en el path actual)
    const { data: recommendedRaw } = await supabase
        .from('courses')
        .select(`
      link_url,
      title,
      learning_paths!inner (
        id,
        title
      )
    `)
        .in('path_id', similarPathIds)
        .not('link_url', 'in', `(${currentLinks.map(l => `"${l}"`).join(',')})`) // Excluir links que ya tenemos
        .limit(10) // Limitar recomendaciones

    if (!recommendedRaw) return []

    // 4. Enriquecer con metadatos y dedublicar por URL
    const uniqueRecommendations = new Map<string, RecommendedCourse>()

    for (const item of recommendedRaw) {
        if (!item.link_url) continue
        if (uniqueRecommendations.has(item.link_url)) continue

        // Usar título del curso como fallback inicial
        const learningPath = Array.isArray(item.learning_paths)
            ? item.learning_paths[0]
            : item.learning_paths as unknown as { id: string, title: string } | null

        const baseRec: RecommendedCourse = {
            url: item.link_url,
            title: item.title,
            sourcePathTitle: learningPath?.title || 'Unknown Expedition',
            sourcePathId: learningPath?.id || '',
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
