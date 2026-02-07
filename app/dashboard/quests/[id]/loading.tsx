export default function CourseDetailLoading() {
    return (
        <div className="min-h-screen bg-surface animate-pulse">
            {/* Header */}
            <div className="border-b bg-main">
                <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="h-4 w-32 bg-main-dark rounded mb-4"></div>

                    <div className="flex items-start justify-between mt-2">
                        <div className="flex-1">
                            <div className="h-8 w-3/4 bg-main-dark rounded mb-4"></div>
                            <div className="h-4 w-1/2 bg-main-dark rounded mb-4"></div>

                            <div className="flex gap-4">
                                <div className="h-4 w-24 bg-main-dark rounded"></div>
                                <div className="h-4 w-16 bg-main-dark rounded"></div>
                                <div className="h-4 w-24 bg-main-dark rounded"></div>
                            </div>
                        </div>

                        <div className="h-10 w-32 bg-main-dark rounded-lg"></div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Video Placeholder */}
                        <div className="rounded-lg bg-main p-6 shadow h-64 bg-main-dark"></div>

                        {/* Description */}
                        <div className="rounded-lg bg-main p-6 shadow space-y-3">
                            <div className="h-6 w-32 bg-main-dark rounded mb-4"></div>
                            <div className="h-4 w-full bg-main-dark rounded"></div>
                            <div className="h-4 w-full bg-main-dark rounded"></div>
                            <div className="h-4 w-3/4 bg-main-dark rounded"></div>
                        </div>

                        {/* Exercises */}
                        <div className="rounded-lg bg-main p-6 shadow">
                            <div className="h-6 w-40 bg-main-dark rounded mb-6"></div>
                            <div className="space-y-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="rounded-lg border-2 border-border p-4 h-32 bg-surface"></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="rounded-lg bg-main p-6 shadow h-48"></div>
                        <div className="rounded-lg bg-main p-6 shadow h-64"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
