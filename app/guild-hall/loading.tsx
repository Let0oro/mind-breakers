export default function GuildHallDashboardLoading() {
    return (
        <div className="flex-1 px-4 py-8 md:px-12 md:py-8 animate-pulse">
            {/* Header Skeleton */}
            <header className="flex flex-wrap justify-between items-end gap-6 mb-10">
                <div className="h-12 w-64 bg-surface rounded" />
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex flex-col gap-1">
                        <div className="h-2 w-12 bg-surface rounded" />
                        <div className="h-6 w-24 bg-surface rounded" />
                    </div>
                    <div className="w-px h-8 bg-border/50 mx-2"></div>
                    <div className="flex flex-col gap-1">
                        <div className="h-2 w-12 bg-surface rounded" />
                        <div className="h-6 w-16 bg-surface rounded" />
                    </div>
                </div>
            </header>

            {/* Expeditions Section Skeleton */}
            <section className="mb-12">
                <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
                    <div className="h-6 w-40 bg-surface rounded" />
                    <div className="h-3 w-32 bg-surface rounded" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-48 border border-border bg-main rounded-xl p-6" />
                    ))}
                </div>
            </section>

            {/* Quests Section Skeleton */}
            <section className="mb-12">
                <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
                    <div className="h-6 w-32 bg-surface rounded" />
                    <div className="h-3 w-28 bg-surface rounded" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-64 border border-border bg-main rounded-xl p-4" />
                    ))}
                </div>
            </section>
        </div>
    )
}
