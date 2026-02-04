export default function LeaderboardLoading() {
    return (
        <div className="animate-pulse">
            {/* Header Section */}
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex flex-wrap justify-between items-end gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="h-8 w-48 bg-white dark:bg-[#1a232e] rounded-lg"></div>
                        <div className="h-4 w-64 bg-white dark:bg-[#1a232e] rounded-lg"></div>
                    </div>
                    <div className="h-9 w-32 bg-white dark:bg-[#1a232e] rounded-lg"></div>
                </div>
            </div>

            {/* Leaderboard Table Skeleton */}
            <div className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-sidebar-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#283039]">
                            <tr>
                                {[1, 2, 3, 4].map((i) => (
                                    <th key={i} className="px-6 py-4">
                                        <div className="h-3 w-16 bg-sidebar-border rounded"></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3b4754]">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                                <tr key={i}>
                                    {/* Rank */}
                                    <td className="px-6 py-4">
                                        <div className="w-8 h-8 bg-sidebar-border rounded-lg"></div>
                                    </td>
                                    {/* Player */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-sidebar-border"></div>
                                            <div className="h-4 w-32 bg-sidebar-border rounded"></div>
                                        </div>
                                    </td>
                                    {/* Level */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-sidebar-border rounded"></div>
                                            <div className="h-4 w-16 bg-sidebar-border rounded"></div>
                                        </div>
                                    </td>
                                    {/* Total XP */}
                                    <td className="px-6 py-4">
                                        <div className="h-4 w-20 bg-sidebar-border rounded"></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Podium Skeleton */}
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-3xl mx-auto opacity-50">
                <div className="flex flex-col items-center pt-12">
                    <div className="w-16 h-16 rounded-full bg-sidebar-border mb-3"></div>
                    <div className="h-4 w-24 bg-sidebar-border rounded mb-1"></div>
                    <div className="h-3 w-16 bg-sidebar-border rounded"></div>
                </div>
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-sidebar-border mb-3"></div>
                    <div className="h-4 w-24 bg-sidebar-border rounded mb-1"></div>
                    <div className="h-3 w-16 bg-sidebar-border rounded"></div>
                </div>
                <div className="flex flex-col items-center pt-16">
                    <div className="w-14 h-14 rounded-full bg-sidebar-border mb-3"></div>
                    <div className="h-4 w-24 bg-sidebar-border rounded mb-1"></div>
                    <div className="h-3 w-16 bg-sidebar-border rounded"></div>
                </div>
            </div>
        </div>
    )
}
