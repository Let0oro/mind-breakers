export default function PathDetailLoading() {
    return (
        <div className="min-h-screen bg-gray-50 animate-pulse">
            {/* Header */}
            <div className="border-b bg-white">
                <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            <div className="h-8 w-2/3 bg-gray-200 rounded"></div>
                            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                            <div className="h-4 w-40 bg-gray-200 rounded"></div>
                        </div>

                        <div className="ml-4 flex gap-2">
                            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                        </div>
                    </div>

                    {/* Progreso */}
                    <div className="mt-6">
                        <div className="h-4 w-full bg-gray-200 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="rounded-lg bg-white p-6 shadow h-64 space-y-4">
                            <div className="h-6 w-32 bg-gray-200 rounded"></div>
                            <div className="h-4 w-full bg-gray-200 rounded"></div>
                            <div className="h-4 w-full bg-gray-200 rounded"></div>
                            <div className="h-32 w-full bg-gray-100 rounded"></div>
                        </div>
                    </div>

                    {/* Main List */}
                    <div className="lg:col-span-2">
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="rounded-lg border-2 border-gray-100 bg-white p-6 h-32 flex gap-4">
                                    <div className="h-24 w-40 bg-gray-200 rounded shrink-0"></div>
                                    <div className="flex-1 space-y-3">
                                        <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
                                        <div className="h-4 w-full bg-gray-200 rounded"></div>
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
