export default function SettingsLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <header className="mb-8">
                <div className="h-8 w-32 bg-white dark:bg-[#1a232e] rounded-lg mb-2"></div>
                <div className="h-4 w-64 bg-white dark:bg-[#1a232e] rounded-lg"></div>
            </header>

            <div className="max-w-3xl space-y-6">
                {/* Profile Section Skeleton (as SettingsForm) */}
                <section className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-6">
                    <div className="h-6 w-32 bg-[#3b4754] rounded mb-6"></div>

                    <div className="space-y-4">
                        {/* Avatar Field */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 rounded-full bg-[#3b4754]"></div>
                            <div className="h-9 w-32 bg-[#3b4754] rounded-lg"></div>
                        </div>

                        {/* Input Fields */}
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 w-24 bg-[#3b4754] rounded"></div>
                                <div className="h-11 w-full bg-[#3b4754] rounded-lg"></div>
                            </div>
                        ))}

                        {/* Save Button */}
                        <div className="pt-4">
                            <div className="h-11 w-full bg-[#3b4754] rounded-lg"></div>
                        </div>
                    </div>
                </section>

                {/* Admin Request Section */}
                <section className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-[#3b4754] rounded"></div>
                        <div className="h-6 w-48 bg-[#3b4754] rounded"></div>
                    </div>
                    <div className="h-4 w-full bg-[#3b4754] rounded mb-4"></div>
                    <div className="h-24 w-full bg-[#3b4754] rounded-lg"></div>
                </section>

                {/* Danger Zone */}
                <section className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-6 opacity-60">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-[#3b4754] rounded"></div>
                        <div className="h-6 w-32 bg-[#3b4754] rounded"></div>
                    </div>
                    <div className="h-4 w-full bg-[#3b4754] rounded mb-4"></div>
                    <div className="h-12 w-32 bg-[#3b4754] rounded-lg"></div>
                </section>
            </div>
        </div>
    )
}
