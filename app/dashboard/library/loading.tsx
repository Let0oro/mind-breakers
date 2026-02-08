export default function ExploreLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="mb-10">
                <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
                    <div className="flex flex-col gap-1">
                        <div className="h-10 w-40 bg-surface-dark" />
                        <div className="h-4 w-56 bg-surface-dark" />
                    </div>
                </div>
                <div className="h-12 w-full bg-surface-dark mb-6" />
                <div className="flex gap-6 border-b border-border pb-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-4 w-20 bg-surface-dark" />
                    ))}
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border border-border bg-main overflow-hidden">
                        <div className="h-40 bg-surface-dark" />
                        <div className="p-4 flex flex-col gap-3">
                            <div className="h-4 w-3/4 bg-surface-dark" />
                            <div className="h-3 w-full bg-surface-dark" />
                            <div className="flex items-center justify-between mt-3">
                                <div className="h-3 w-12 bg-surface-dark" />
                                <div className="h-3 w-16 bg-surface-dark" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
