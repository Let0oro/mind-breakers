export default function NewOrganizationLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-main dark:bg-surface rounded"></div>
                    <div className="h-8 w-56 bg-main dark:bg-surface rounded-lg"></div>
                </div>
                <div className="h-4 w-72 bg-main dark:bg-surface rounded-lg"></div>
            </div>

            {/* Form Skeleton */}
            <div className="bg-main dark:bg-surface rounded-xl border border-border dark:border-border p-8 max-w-2xl">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="h-4 w-32 bg-sidebar-border rounded"></div>
                        <div className="h-12 w-full bg-sidebar-border rounded-lg"></div>
                    </div>

                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-sidebar-border rounded"></div>
                        <div className="h-32 w-full bg-sidebar-border rounded-lg"></div>
                    </div>

                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-sidebar-border rounded"></div>
                        <div className="h-12 w-full bg-sidebar-border rounded-lg"></div>
                    </div>

                    <div className="h-24 w-full bg-sidebar-border rounded-lg"></div>

                    <div className="flex gap-3 pt-4">
                        <div className="flex-1 h-12 bg-sidebar-border rounded-lg"></div>
                        <div className="flex-1 h-12 bg-sidebar-border rounded-lg"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
