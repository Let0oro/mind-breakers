export default function CoursesLoading() {
    return (
        <div className="animate-pulse">
            {/* Header Section */}
            <div className="flex flex-wrap justify-between items-end gap-6 mb-8">
                <div className="flex flex-col gap-2">
                    <div className="h-8 w-48 bg-main dark:bg-surface rounded-lg"></div>
                    <div className="h-4 w-32 bg-main dark:bg-surface rounded-lg"></div>
                </div>
                <div className="h-11 w-40 bg-main dark:bg-surface rounded-lg"></div>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-main dark:bg-surface rounded-xl overflow-hidden border border-border dark:border-border">
                        {/* Thumbnail */}
                        <div className="h-40 bg-surface-dark"></div>

                        {/* Content */}
                        <div className="p-5 flex flex-col gap-3">
                            <div className="h-5 w-3/4 bg-sidebar-border rounded"></div>
                            <div className="space-y-2">
                                <div className="h-3 w-full bg-sidebar-border rounded"></div>
                                <div className="h-3 w-2/3 bg-sidebar-border rounded"></div>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-border dark:border-border">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-sidebar-border rounded-full"></div>
                                    <div className="h-3 w-12 bg-sidebar-border rounded"></div>
                                </div>
                                <div className="h-3 w-24 bg-sidebar-border rounded"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
