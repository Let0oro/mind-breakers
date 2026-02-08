'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { BreadcrumbItem } from '@/lib/types'

interface BreadcrumbProps {
    items?: BreadcrumbItem[]
    autoGenerate?: boolean
}

// Mapeo de segmentos de URL a etiquetas legibles
const SEGMENT_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    quests: 'Quests',
    paths: 'Paths',
    exercises: 'Exercises',
    organizations: 'Orgs',
    leaderboard: 'Leaderboard',
    admin: 'Admin',
    submissions: 'Submissions',
    new: 'New',
    edit: 'Edit',
    submit: 'Submit',
}

export default function Breadcrumb({ items, autoGenerate = true }: BreadcrumbProps) {
    const pathname = usePathname()

    // Si se proporcionan items personalizados, usarlos
    if (items && items.length > 0) {
        return <BreadcrumbNav items={items} />
    }

    // Auto-generar breadcrumbs desde la ruta actual
    if (autoGenerate && pathname) {
        const segments = pathname.split('/').filter(Boolean)
        const breadcrumbItems: BreadcrumbItem[] = []

        segments.forEach((segment, index) => {
            const path = '/' + segments.slice(0, index + 1).join('/')

            // Intentar obtener label del mapeo o usar el segmento capitalizado
            let label = SEGMENT_LABELS[segment] || segment

            // Si es un UUID o ID (contiene guiones o solo números), tratarlo especialmente
            if (segment.match(/^[0-9a-f-]+$/i) || segment.match(/^\d+$/)) {
                // Para IDs, intentar usar un nombre más descriptivo basado en el contexto
                const previousSegment = segments[index - 1]
                if (previousSegment === 'courses') {
                    label = 'Details'
                } else if (previousSegment === 'paths') {
                    label = 'Details'
                } else if (previousSegment === 'exercises') {
                    label = 'Details'
                } else if (previousSegment === 'organizations') {
                    label = 'Details'
                } else {
                    label = 'Details'
                }
            } else {
                // Capitalizar primera letra si no está en el mapeo
                if (!SEGMENT_LABELS[segment]) {
                    label = segment.charAt(0).toUpperCase() + segment.slice(1)
                }
            }

            breadcrumbItems.push({
                label,
                href: path,
            })
        })

        return <BreadcrumbNav items={breadcrumbItems} />
    }

    return null
}

function BreadcrumbNav({ items }: { items: BreadcrumbItem[] }) {
    if (!items || items.length === 0) return null

    return (
        <nav className="flex items-center gap-2 text-sm/6 font-thin md:font-medium mb-2 md:mb-6 md:text-sm">
            {items.map((item, index) => {
                const isLast = index === items.length - 1

                return (
                    <div key={index} className="flex items-center gap-2">
                        {item.icon && (
                            <span className="material-symbols-outlined text-sm text-muted">
                                {item.icon}
                            </span>
                        )}

                        {isLast ? (
                            <span className="text-text-main dark:text-text-main">
                                {item.label}
                            </span>
                        ) : (
                            <>
                                <Link
                                    href={item.href?.includes("organizations") ? "/dashboard/organizations/new" : item.href || '#'}
                                    className="text-muted hover:text-text-main transition-colors"
                                >
                                    {item.label}
                                </Link>
                                <span className="text-sm text-muted">
                                    {"/"}
                                </span>
                            </>
                        )}
                    </div>
                )
            })}
        </nav>
    )
}
