export default function SettingsLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="mb-8">
                <div className="h-10 w-40 bg-surface-dark mb-1" />
                <div className="h-4 w-64 bg-surface-dark" />
            </div>

            <div className="max-w-3xl space-y-6">
                {/* Profile Section */}
                <div className="border border-border bg-main p-6">
                    <div className="h-4 w-32 bg-surface-dark mb-6" />
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-surface-dark" />
                            <div className="h-8 w-24 bg-surface-dark" />
                        </div>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-3 w-20 bg-surface-dark" />
                                <div className="h-12 w-full bg-surface-dark" />
                            </div>
                        ))}
                        <div className="pt-4 flex justify-end">
                            <div className="h-10 w-32 bg-surface-dark" />
                        </div>
                    </div>
                </div>

                {/* Admin Request Section */}
                <div className="border border-border bg-main p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-5 h-5 bg-surface-dark" />
                        <div className="h-4 w-40 bg-surface-dark" />
                    </div>
                    <div className="h-4 w-full bg-surface-dark mb-4" />
                    <div className="h-24 w-full bg-surface-dark mb-4" />
                    <div className="h-12 w-full bg-surface-dark" />
                </div>

                {/* Danger Zone */}
                <div className="border border-muted p-6 opacity-60">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-5 h-5 bg-surface-dark" />
                        <div className="h-4 w-28 bg-surface-dark" />
                    </div>
                    <div className="h-4 w-full bg-surface-dark mb-4" />
                    <div className="h-10 w-48 bg-surface-dark" />
                </div>
            </div>
        </div>
    )
}
