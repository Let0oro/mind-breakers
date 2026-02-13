export default function QuestDetailLoading() {
    return (
        <div className="animate-pulse">
            {/* Back link */}
            <div className="mb-10">
                <div className="h-4 w-32 bg-surface rounded mb-4" />

                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mt-4 gap-6">
                    <div className="flex-1">
                        <div className="h-10 w-3/4 bg-surface rounded mb-2" />
                        <div className="h-4 w-full bg-surface rounded mb-3" />
                        <div className="flex gap-4">
                            <div className="h-3 w-20 bg-surface rounded" />
                            <div className="h-3 w-16 bg-surface rounded" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 w-20 border border-border rounded" />
                        <div className="h-10 w-28 border border-border rounded" />
                    </div>
                </div>
            </div>

            {/* Content grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Video placeholder */}
                    <div className="border border-border bg-main p-6">
                        <div className="aspect-video bg-surface rounded" />
                    </div>
                    {/* Description */}
                    <div className="border border-border bg-main p-6">
                        <div className="h-4 w-24 bg-surface rounded mb-4" />
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-surface rounded" />
                            <div className="h-3 w-5/6 bg-surface rounded" />
                            <div className="h-3 w-4/6 bg-surface rounded" />
                        </div>
                    </div>
                </div>
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="border border-border bg-main p-6">
                        <div className="h-4 w-28 bg-surface rounded mb-4" />
                        <div className="h-20 bg-surface rounded" />
                    </div>
                    <div className="border border-border bg-main p-6">
                        <div className="h-4 w-24 bg-surface rounded mb-4" />
                        <div className="space-y-3">
                            <div className="h-3 w-full bg-surface rounded" />
                            <div className="h-3 w-full bg-surface rounded" />
                            <div className="h-3 w-full bg-surface rounded" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
