import SharedHeader from '@/components/shared-header'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SharedHeader />

      <main className="flex-1 flex items-center justify-center font-display">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
