export default function PathsListLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="mb-10">
                <div className="flex flex-wrap justify-between items-end gap-6 mb-6">
                    <div className="flex flex-col gap-1">
                        <div className="h-10 w-32 bg-surface-dark" />
                        <div className="h-4 w-24 bg-surface-dark" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 w-24 bg-surface-dark" />
                        <div className="h-10 w-24 bg-surface-dark" />
                    </div>
                </div>
            </div>

            {/* Paths Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border border-border bg-main p-6 flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                                <div className="h-5 w-3/4 bg-surface-dark" />
                                <div className="h-3 w-1/3 bg-surface-dark" />
                            </div>
                            <div className="w-5 h-5 bg-surface-dark" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-surface-dark" />
                            <div className="h-3 w-5/6 bg-surface-dark" />
                        </div>
                        <div className="flex items-center gap-4 mt-auto">
                            <div className="h-3 w-16 bg-surface-dark" />
                        </div>
                        <div className="h-1 w-full bg-surface-dark" />
                    </div>
                ))}
            </div>
        </div>
    )
}
