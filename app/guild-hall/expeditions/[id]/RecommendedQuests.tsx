import { getRecommendedQuests } from '@/lib/services/recommendations'
import Image from 'next/image'

export default async function RecommendedQuests({ expeditionId }: { expeditionId: string }) {
    const recommendations = await getRecommendedQuests(expeditionId)

    if (recommendations.length === 0) {
        return null
    }

    return (
        <div className="mt-8 border border-indigo-100 bg-indigo-50/50 p-6 backdrop-blur-sm">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-text-main">
                    ✨ You might also be interested in
                </h2>
                <p className="text-sm text-muted">
                    We found these additional resources in expeditions similar to the one you&apos;re viewing.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((rec) => (
                    <a
                        key={rec.url}
                        href={rec.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block h-full overflow-hidden border border-white/50 bg-main/60 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:bg-main/80"
                    >
                        {/* Image / Placeholder */}
                        <div className="relative aspect-video w-full overflow-hidden bg-surface">
                            {rec.image ? (
                                <img
                                    src={rec.image}
                                    alt={rec.title || ''}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-200">
                                    <span className="material-symbols-outlined text-5xl">auto_stories</span>
                                </div>
                            )}

                            {/* Badge indicando origen */}
                            <div className="absolute top-2 right-2 rounded-full bg-main/90 px-2 py-1 text-xs font-medium text-muted shadow-sm backdrop-blur-md">
                                Seen in another expedition
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <h3 className="mb-2 line-clamp-2 text-base font-semibold text-text-main group-hover:text-indigo-600">
                                {rec.title || 'Recurso Recomendado'}
                            </h3>

                            {rec.description && (
                                <p className="mb-4 line-clamp-2 text-xs text-muted">
                                    {rec.description}
                                </p>
                            )}

                            <div className="mt-auto flex items-center justify-between text-xs text-muted">
                                <span className="truncate max-w-[70%]">
                                    From: {rec.sourceExpeditionTitle}
                                </span>
                                <span className="material-symbols-outlined text-base">open_in_new</span>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    )
}
