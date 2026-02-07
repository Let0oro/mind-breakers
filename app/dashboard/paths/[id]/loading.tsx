export default function PathDetailLoading() {
    return (
        <div className="min-h-screen bg-surface animate-pulse">
            {/* Header */}
            <div className="border-b bg-main">
                <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                            <div className="h-4 w-32 bg-main-dark rounded"></div>
                            <div className="h-8 w-2/3 bg-main-dark rounded"></div>
                            <div className="h-4 w-1/2 bg-main-dark rounded"></div>
                            <div className="h-4 w-40 bg-main-dark rounded"></div>
                        </div>

                        <div className="ml-4 flex gap-2">
                            <div className="h-10 w-24 bg-main-dark rounded-lg"></div>
                            <div className="h-10 w-24 bg-main-dark rounded-lg"></div>
                        </div>
                    </div>

                    {/* Progreso */}
                    <div className="mt-6">
                        <div className="h-4 w-full bg-main-dark rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="rounded-lg bg-main p-6 shadow h-64 space-y-4">
                            <div className="h-6 w-32 bg-main-dark rounded"></div>
                            <div className="h-4 w-full bg-main-dark rounded"></div>
                            <div className="h-4 w-full bg-main-dark rounded"></div>
                            <div className="h-32 w-full bg-surface rounded"></div>
                        </div>
                    </div>

                    {/* Main List */}
                    <div className="lg:col-span-2">
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="rounded-lg border-2 border-border bg-main p-6 h-32 flex gap-4">
                                    <div className="h-24 w-40 bg-main-dark rounded shrink-0"></div>
                                    <div className="flex-1 space-y-3">
                                        <div className="h-6 w-3/4 bg-main-dark rounded"></div>
                                        <div className="h-4 w-full bg-main-dark rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
