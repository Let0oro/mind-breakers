export default function PathDetailLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="mb-10">
                <div className="h-4 w-32 bg-surface-dark mb-4" />
                <div className="h-10 w-80 bg-surface-dark mb-2" />
                <div className="h-4 w-full max-w-xl bg-surface-dark mb-4" />
                <div className="flex items-center gap-6">
                    <div className="h-3 w-20 bg-surface-dark" />
                    <div className="h-3 w-24 bg-surface-dark" />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Sidebar */}
                <div className="space-y-6 order-2 lg:order-1">
                    <div className="border border-border bg-main p-6">
                        <div className="h-4 w-24 bg-surface-dark mb-4" />
                        <div className="h-1 w-full bg-surface-dark mb-2" />
                        <div className="flex justify-between">
                            <div className="h-3 w-12 bg-surface-dark" />
                            <div className="h-3 w-8 bg-surface-dark" />
                        </div>
                    </div>
                    <div className="border border-border bg-main p-6">
                        <div className="h-4 w-32 bg-surface-dark mb-4" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 py-2">
                                <div className="w-5 h-5 bg-surface-dark" />
                                <div className="w-8 h-8 bg-surface-dark" />
                                <div className="flex-1 h-3 bg-surface-dark" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline */}
                <div className="lg:col-span-2 order-1 lg:order-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-start gap-6 pb-8">
                            <div className="w-10 h-10 bg-surface-dark" />
                            <div className="flex-1">
                                <div className="h-4 w-48 bg-surface-dark mb-2" />
                                <div className="h-3 w-32 bg-surface-dark" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
