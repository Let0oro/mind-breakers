export default function LeaderboardLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="mb-10">
                <div className="flex flex-wrap justify-between items-end gap-6">
                    <div className="flex flex-col gap-1">
                        <div className="h-10 w-56 bg-surface-dark" />
                        <div className="h-4 w-40 bg-surface-dark" />
                    </div>
                    <div className="h-10 w-32 bg-surface-dark" />
                </div>
            </div>

            {/* Table */}
            <div className="border border-border bg-main">
                <div className="bg-surface-dark px-6 py-4 flex gap-6">
                    <div className="h-3 w-12 bg-surface" />
                    <div className="h-3 w-24 bg-surface" />
                    <div className="h-3 w-12 bg-surface" />
                    <div className="h-3 w-16 bg-surface" />
                </div>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-6 border-t border-border">
                        <div className="h-6 w-8 bg-surface-dark" />
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 bg-surface-dark" />
                            <div className="h-4 w-24 bg-surface-dark" />
                        </div>
                        <div className="h-4 w-16 bg-surface-dark" />
                        <div className="h-4 w-20 bg-surface-dark" />
                    </div>
                ))}
            </div>

            {/* Podium */}
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="flex flex-col items-center pt-12">
                    <div className="w-14 h-14 bg-surface-dark mb-3" />
                    <div className="h-3 w-16 bg-surface-dark" />
                </div>
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-surface-dark mb-3" />
                    <div className="h-4 w-20 bg-surface-dark" />
                </div>
                <div className="flex flex-col items-center pt-16">
                    <div className="w-12 h-12 bg-surface-dark mb-3" />
                    <div className="h-3 w-14 bg-surface-dark" />
                </div>
            </div>
        </div>
    )
}
