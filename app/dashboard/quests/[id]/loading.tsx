export default function CourseDetailLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="mb-10">
                <div className="h-4 w-32 bg-surface-dark mb-4" />
                <div className="h-10 w-80 bg-surface-dark mb-2" />
                <div className="h-4 w-full max-w-xl bg-surface-dark mb-4" />
                <div className="flex items-center gap-4">
                    <div className="h-3 w-20 bg-surface-dark" />
                    <div className="h-3 w-16 bg-surface-dark" />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="border border-border bg-main p-6">
                        <div className="aspect-video w-full bg-surface-dark" />
                    </div>
                    <div className="border border-border bg-main p-6">
                        <div className="h-4 w-28 bg-surface-dark mb-4" />
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-surface-dark" />
                            <div className="h-3 w-5/6 bg-surface-dark" />
                            <div className="h-3 w-4/6 bg-surface-dark" />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="border border-border bg-main p-6">
                        <div className="h-4 w-28 bg-surface-dark mb-4" />
                        <div className="h-24 w-full bg-surface-dark" />
                    </div>
                    <div className="border border-border bg-main p-6">
                        <div className="h-4 w-24 bg-surface-dark mb-4" />
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i}>
                                    <div className="h-3 w-20 bg-surface-dark mb-1" />
                                    <div className="h-4 w-32 bg-surface-dark" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
