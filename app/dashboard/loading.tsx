export default function DashboardLoading() {
    return (
        <div className="animate-pulse">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div className="flex flex-col gap-2 w-full md:w-auto">
                    <div className="h-8 w-64 bg-main dark:bg-surface rounded-lg mb-1"></div>
                    <div className="h-4 w-48 bg-main dark:bg-surface rounded-lg"></div>
                </div>
                <div className="h-11 w-32 bg-main dark:bg-surface rounded-lg shrink-0"></div>
            </div>

            {/* Stats & Leveling Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* XP Card */}
                <div className="lg:col-span-2 flex flex-col gap-4 p-6 rounded-xl border border-border dark:border-border bg-main dark:bg-surface">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-sidebar-border rounded-full"></div>
                            <div className="flex flex-col gap-2">
                                <div className="h-4 w-32 bg-sidebar-border rounded"></div>
                                <div className="h-3 w-24 bg-sidebar-border rounded"></div>
                            </div>
                        </div>
                        <div className="h-4 w-20 bg-sidebar-border rounded"></div>
                    </div>
                    <div className="h-3 w-full rounded-full bg-sidebar-border"></div>
                    <div className="h-4 w-32 bg-sidebar-border rounded"></div>
                </div>

                {/* Streak Stats */}
                <div className="flex flex-col justify-between p-6 rounded-xl border border-border dark:border-border bg-main dark:bg-surface min-h-[140px]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-4 w-24 bg-sidebar-border rounded"></div>
                        <div className="w-6 h-6 bg-sidebar-border rounded"></div>
                    </div>
                    <div>
                        <div className="h-10 w-24 bg-sidebar-border rounded mb-2"></div>
                        <div className="h-4 w-20 bg-sidebar-border rounded"></div>
                    </div>
                </div>
            </div>

            {/* Dashboard Modules */}
            <div className="grid grid-cols-1 gap-10">
                {/* My Courses Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-main dark:bg-surface rounded"></div>
                            <div className="h-6 w-48 bg-main dark:bg-surface rounded"></div>
                        </div>
                        <div className="h-4 w-16 bg-main dark:bg-surface rounded"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-xl overflow-hidden border border-border dark:border-border bg-main dark:bg-surface">
                                <div className="h-32 bg-surface-dark"></div>
                                <div className="p-4 flex flex-col gap-3">
                                    <div className="h-4 w-3/4 bg-sidebar-border rounded"></div>
                                    <div className="h-3 w-1/2 bg-sidebar-border rounded"></div>
                                    <div className="space-y-1 mt-2">
                                        <div className="flex justify-between">
                                            <div className="h-2 w-10 bg-sidebar-border rounded"></div>
                                            <div className="h-2 w-8 bg-sidebar-border rounded"></div>
                                        </div>
                                        <div className="h-1.5 w-full bg-sidebar-border rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Learning Paths Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-main dark:bg-surface rounded"></div>
                            <div className="h-6 w-48 bg-main dark:bg-surface rounded"></div>
                        </div>
                        <div className="h-4 w-16 bg-main dark:bg-surface rounded"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map((i) => (
                            <div key={i} className="p-6 rounded-xl border border-border dark:border-border bg-main dark:bg-surface flex gap-6 items-center">
                                <div className="h-20 w-20 shrink-0 rounded-lg bg-sidebar-border"></div>
                                <div className="flex-1 space-y-3">
                                    <div className="h-5 w-1/2 bg-sidebar-border rounded"></div>
                                    <div className="h-3 w-3/4 bg-sidebar-border rounded"></div>
                                    <div className="h-6 w-full bg-sidebar-border rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
