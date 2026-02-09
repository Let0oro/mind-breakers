import SharedHeader from '@/components/shared-header'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex-col bg-main text-text-main">
      <SharedHeader />

      <main className="flex items-center font-display">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
