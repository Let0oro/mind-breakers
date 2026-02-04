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
  authors: [{ name: 'Juan Manuel Montero' }],
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  appleWebApp: {
    title: 'MindBreaker',
    statusBarStyle: 'default',
  },
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                // Default to dark if no preference
                if (theme === 'dark' || (!theme && systemDark) || !theme) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${space_grotesk.className} bg-sidebar dark:bg-sidebar font-display text-slate-900 dark:text-white transition-colors duration-300`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
