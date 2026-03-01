import { getRecommendedQuests } from '@/lib/services/recommendations'
import Image from 'next/image'

export default async function RecommendedQuests({ expeditionId }: { expeditionId: string }) {
    const recommendations = await getRecommendedQuests(expeditionId)

    if (recommendations.length === 0) {
        return null
    }

    return (
        <div className="mt-8 border border-border bg-main p-6">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-lg text-gold">change_circle</span>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gold mt-1">
                        You might also be interested in
                    </h2>
                </div>
                <p className="text-xs text-muted">
                    We found these external resources in expeditions similar to the one you&apos;re viewing.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((rec) => (
                    <a
                        key={rec.url}
                        href={rec.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex flex-col h-full overflow-hidden border border-border bg-background hover:bg-surface hover:border-gold shadow-sm transition-all"
                    >
                        {/* Image / Placeholder */}
                        <div className="relative aspect-video w-full overflow-hidden bg-surface-dark grayscale group-hover:grayscale-0 transition-all">
                            {rec.image ? (
                                <img
                                    src={rec.image}
                                    alt={rec.title || ''}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted">
                                    <span className="material-symbols-outlined text-5xl opacity-50">auto_stories</span>
                                </div>
                            )}

                            {/* Badge indicando origen */}
                            <div className="absolute top-2 right-2 border border-border bg-main px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted shadow-sm">
                                External Link
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex flex-col flex-1">
                            <h3 className="mb-2 line-clamp-2 text-xs font-bold uppercase tracking-wide text-text-main group-hover:text-gold transition-colors">
                                {rec.title || 'Recommended Resource'}
                            </h3>

                            {rec.description && (
                                <p className="mb-4 line-clamp-2 text-[10px] text-muted">
                                    {rec.description}
                                </p>
                            )}

                            <div className="mt-auto flex items-center justify-between text-[10px] uppercase tracking-widest text-muted">
                                <span className="truncate max-w-[80%]">
                                    From: {rec.sourceExpeditionTitle}
                                </span>
                                <span className="material-symbols-outlined text-sm group-hover:text-gold">open_in_new</span>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    )
}
