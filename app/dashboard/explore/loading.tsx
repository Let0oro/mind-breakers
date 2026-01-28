export default function ExploreLoading() {
    return (
        <div className="animate-pulse">
            {/* Header Section */}
            <div className="mb-8">
                <div className="h-8 w-48 bg-white dark:bg-[#1a232e] rounded-lg mb-2"></div>
                <div className="h-4 w-96 bg-white dark:bg-[#1a232e] rounded-lg mb-6"></div>

                {/* Search Bar Skeleton */}
                <div className="max-w-2xl">
                    <div className="h-14 w-full bg-white dark:bg-[#1a232e] rounded-lg"></div>
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[#3b4754]">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="px-4 py-2">
                        <div className="h-4 w-24 bg-white dark:bg-[#1a232e] rounded"></div>
                    </div>
                ))}
            </div>

            {/* Results Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] overflow-hidden">
                        {/* Type Badge & Icon area */}
                        <div className="p-5 border-b border-gray-200 dark:border-[#3b4754]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-3 w-20 bg-[#3b4754] rounded"></div>
                                <div className="w-6 h-6 bg-[#3b4754] rounded"></div>
                            </div>
                            <div className="h-6 w-3/4 bg-[#3b4754] rounded mb-1"></div>
                        </div>

                        {/* Content area */}
                        <div className="p-5">
                            <div className="space-y-2 mb-3">
                                <div className="h-3 w-full bg-[#3b4754] rounded"></div>
                                <div className="h-3 w-5/6 bg-[#3b4754] rounded"></div>
                            </div>

                            {/* Metadata */}
                            <div className="flex flex-wrap gap-3">
                                <div className="h-4 w-24 bg-[#3b4754] rounded-full"></div>
                                <div className="h-4 w-16 bg-[#3b4754] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
