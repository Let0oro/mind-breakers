export default function CourseDetailLoading() {
    return (
        <div className="min-h-screen bg-gray-50 animate-pulse">
            {/* Header */}
            <div className="border-b bg-white">
                <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>

                    <div className="flex items-start justify-between mt-2">
                        <div className="flex-1">
                            <div className="h-8 w-3/4 bg-gray-200 rounded mb-4"></div>
                            <div className="h-4 w-1/2 bg-gray-200 rounded mb-4"></div>

                            <div className="flex gap-4">
                                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            </div>
                        </div>

                        <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Video Placeholder */}
                        <div className="rounded-lg bg-white p-6 shadow h-64 bg-gray-200"></div>

                        {/* Description */}
                        <div className="rounded-lg bg-white p-6 shadow space-y-3">
                            <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                            <div className="h-4 w-full bg-gray-200 rounded"></div>
                            <div className="h-4 w-full bg-gray-200 rounded"></div>
                            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                        </div>

                        {/* Exercises */}
                        <div className="rounded-lg bg-white p-6 shadow">
                            <div className="h-6 w-40 bg-gray-200 rounded mb-6"></div>
                            <div className="space-y-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="rounded-lg border-2 border-gray-100 p-4 h-32 bg-gray-50"></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="rounded-lg bg-white p-6 shadow h-48"></div>
                        <div className="rounded-lg bg-white p-6 shadow h-64"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
