export default function ExpeditionDetailLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="mb-10">
                <div className="h-4 w-28 bg-surface rounded mb-4" />

                <div className="flex items-start justify-between mt-4 gap-4">
                    <div className="flex-1">
                        <div className="h-10 w-3/4 bg-surface rounded mb-2" />
                        <div className="h-4 w-full bg-surface rounded mb-2" />
                        <div className="h-3 w-32 bg-surface rounded" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 w-20 border border-border rounded" />
                        <div className="h-10 w-16 border border-border rounded" />
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-6 h-2 w-full bg-surface rounded" />
            </div>

            {/* Content grid */}
            <div className="flex flex-col md:grid gap-6 lg:grid-cols-3">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="border border-border bg-main p-6">
                        <div className="h-4 w-28 bg-surface rounded mb-4" />
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-surface rounded" />
                            <div className="h-3 w-5/6 bg-surface rounded" />
                            <div className="h-3 w-4/6 bg-surface rounded" />
                        </div>
                        <div className="mt-6 space-y-2">
                            <div className="flex justify-between">
                                <div className="h-3 w-24 bg-surface rounded" />
                                <div className="h-3 w-8 bg-surface rounded" />
                            </div>
                            <div className="flex justify-between">
                                <div className="h-3 w-20 bg-surface rounded" />
                                <div className="h-3 w-8 bg-surface rounded" />
                            </div>
                        </div>
                    </div>
                    {/* Leaderboard skeleton */}
                    <div className="border border-border bg-main p-6">
                        <div className="h-4 w-28 bg-surface rounded mb-4" />
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 bg-surface rounded" />
                                    <div className="w-8 h-8 bg-surface rounded" />
                                    <div className="flex-1">
                                        <div className="h-3 w-20 bg-surface rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Course grid */}
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-6 w-6 bg-surface rounded" />
                        <div className="h-6 w-32 bg-surface rounded" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 md:p-8 bg-main border border-border/50 min-h-[400px]">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="border border-border p-4 space-y-3">
                                <div className="h-5 w-3/4 bg-surface rounded" />
                                <div className="h-3 w-full bg-surface rounded" />
                                <div className="h-3 w-1/2 bg-surface rounded" />
                                <div className="h-2 w-full bg-surface rounded mt-4" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
