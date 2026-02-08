export default function CoursesLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="mb-10">
                <div className="flex flex-wrap justify-between items-end gap-6 mb-6">
                    <div className="flex flex-col gap-1">
                        <div className="h-10 w-48 bg-surface-dark" />
                        <div className="h-4 w-32 bg-surface-dark" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 w-24 bg-surface-dark" />
                        <div className="h-10 w-24 bg-surface-dark" />
                    </div>
                </div>
                <div className="flex gap-6 border-b border-border pb-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-4 w-16 bg-surface-dark" />
                    ))}
                </div>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border border-border bg-main overflow-hidden">
                        <div className="h-40 bg-surface-dark" />
                        <div className="p-4 flex flex-col gap-3">
                            <div className="h-4 w-3/4 bg-surface-dark" />
                            <div className="space-y-2">
                                <div className="h-3 w-full bg-surface-dark" />
                                <div className="h-3 w-2/3 bg-surface-dark" />
                            </div>
                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
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
