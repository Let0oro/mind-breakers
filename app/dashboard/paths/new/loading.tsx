export default function NewPathLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-white dark:bg-[#1a232e] rounded"></div>
                    <div className="h-8 w-64 bg-white dark:bg-[#1a232e] rounded-lg"></div>
                </div>
                <div className="h-4 w-80 bg-white dark:bg-[#1a232e] rounded-lg"></div>
            </div>

            {/* Form Skeleton */}
            <div className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-8 max-w-3xl">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-[#3b4754] rounded"></div>
                        <div className="h-12 w-full bg-[#3b4754] rounded-lg"></div>
                    </div>

                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-[#3b4754] rounded"></div>
                        <div className="h-12 w-full bg-[#3b4754] rounded-lg"></div>
                        <div className="h-3 w-64 bg-[#3b4754] rounded"></div>
                    </div>

                    <div className="space-y-2">
                        <div className="h-4 w-32 bg-[#3b4754] rounded"></div>
                        <div className="h-32 w-full bg-[#3b4754] rounded-lg"></div>
                    </div>

                    <div className="h-24 w-full bg-[#3b4754] rounded-lg"></div>

                    <div className="flex gap-3 pt-4">
                        <div className="flex-1 h-12 bg-[#3b4754] rounded-lg"></div>
                        <div className="flex-1 h-12 bg-[#3b4754] rounded-lg"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
