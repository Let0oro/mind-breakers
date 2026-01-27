import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import '@/globals.css'
import 'material-symbols/outlined.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})
const space_grotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})


export const metadata: Metadata = {
  title: 'MindBreaker - Learning Tracker',
  description: 'Plataforma de seguimiento de cursos y learning paths con gamificación',
  keywords: ['learning', 'courses', 'education', 'tracking', 'gamification'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      {/* <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/> */}
      <body className={`${inter.className} ${space_grotesk.className} bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white transition-colors duration-300`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
