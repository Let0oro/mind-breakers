export default function DashboardLoading() {
    return (
        <div className="animate-pulse">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <div className="flex flex-col gap-2 w-full md:w-auto">
                    <div className="h-10 w-64 bg-surface-dark" />
                    <div className="h-4 w-48 bg-surface-dark" />
                </div>
                <div className="h-12 w-40 border border-border" />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
                {/* XP Card */}
                <div className="lg:col-span-3 p-6 border border-border bg-main">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 border border-border" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-40 bg-surface-dark" />
                            <div className="h-3 w-32 bg-surface-dark" />
                        </div>
                        <div className="h-5 w-24 bg-surface-dark" />
                    </div>
                    <div className="h-2 w-full bg-surface-dark" />
                </div>

                {/* Streak Card */}
                <div className="p-6 border border-border bg-main">
                    <div className="h-3 w-16 bg-surface-dark mb-4" />
                    <div className="h-12 w-20 bg-surface-dark" />
                </div>
            </div>

            {/* Courses Section */}
            <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-surface-dark" />
                        <div className="h-4 w-32 bg-surface-dark" />
                    </div>
                    <div className="h-3 w-16 bg-surface-dark" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="border border-border bg-main overflow-hidden">
                            <div className="h-40 bg-surface-dark" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 w-3/4 bg-surface-dark" />
                                <div className="h-3 w-1/2 bg-surface-dark" />
                                <div className="h-1 w-full bg-surface-dark mt-4" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Paths Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-surface-dark" />
                        <div className="h-4 w-32 bg-surface-dark" />
                    </div>
                    <div className="h-3 w-16 bg-surface-dark" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="p-6 border border-border bg-main flex gap-6 items-start">
                            <div className="h-16 w-16 border border-border shrink-0" />
                            <div className="flex-1 space-y-3">
                                <div className="h-4 w-1/2 bg-surface-dark" />
                                <div className="h-3 w-3/4 bg-surface-dark" />
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((j) => (
                                        <div key={j} className="w-3 h-3 bg-surface-dark" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
