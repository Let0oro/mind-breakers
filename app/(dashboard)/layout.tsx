import SharedHeader from '@/components/shared-header'

export default function PublicDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <SharedHeader />
            <main className="flex-1 scroll-smooth bg-main/80">
                {children}
            </main>
        </div>
    )
}
