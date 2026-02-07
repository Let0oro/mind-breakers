export default function ExercisesLoading() {
    return (
        <div className="animate-pulse">
            {/* Header Section */}
            <div className="mb-8">
                <div className="h-8 w-48 bg-main dark:bg-surface rounded-lg mb-2"></div>
                <div className="h-4 w-64 bg-main dark:bg-surface rounded-lg mb-6"></div>

                {/* Filter Tabs */}
                <div className="flex gap-2 border-b border-border dark:border-border">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="px-4 py-2">
                            <div className="h-4 w-24 bg-main dark:bg-surface rounded"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Exercise List Skeleton */}
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-main dark:bg-surface rounded-xl border border-border dark:border-border p-6 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-1/3 bg-sidebar-border rounded"></div>
                                <div className="h-5 w-20 bg-sidebar-border rounded-full"></div>
                            </div>
                            <div className="h-4 w-2/3 bg-sidebar-border rounded"></div>
                            <div className="flex gap-4">
                                <div className="h-3 w-32 bg-sidebar-border rounded"></div>
                                <div className="h-3 w-24 bg-sidebar-border rounded"></div>
                            </div>
                        </div>

                        <div className="w-full md:w-32 shrink-0">
                            <div className="h-10 w-full bg-sidebar-border rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
