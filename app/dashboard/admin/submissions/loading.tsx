export default function AdminSubmissionsLoading() {
    return (
        <div className="min-h-screen bg-surface animate-pulse">
            <div className="border-b bg-main">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="h-4 w-24 bg-main-dark rounded mb-2"></div>
                    <div className="h-8 w-64 bg-main-dark rounded"></div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-lg border-2 border-border bg-main p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-6 w-48 bg-main-dark rounded"></div>
                                        <div className="h-5 w-24 bg-main-dark rounded-full"></div>
                                    </div>

                                    <div className="h-4 w-32 bg-main-dark rounded mb-4"></div>

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="h-4 w-32 bg-main-dark rounded"></div>
                                        <div className="h-4 w-24 bg-main-dark rounded"></div>
                                        <div className="h-4 w-20 bg-main-dark rounded"></div>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="h-8 w-32 bg-main-dark rounded-lg"></div>
                                        <div className="h-8 w-24 bg-main-dark rounded-lg"></div>
                                    </div>
                                </div>

                                <div className="ml-4 flex gap-2">
                                    <div className="h-9 w-24 bg-main-dark rounded-lg"></div>
                                    <div className="h-9 w-24 bg-main-dark rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
