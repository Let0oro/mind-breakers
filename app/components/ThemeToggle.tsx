'use client'

import { useState, useEffect, useEffectEvent } from 'react'

export function ThemeToggle() {
  // Inicializar isDark correctamente desde el principio
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const theme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return theme === 'dark' || (!theme && systemPrefersDark)
  })
  const [mounted, setMounted] = useState(false)


   // Lógica externa (DOM) - USO CORRECTO de useEffectEvent
  const initializeTheme = useEffectEvent(() => {
    const theme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = theme === 'dark' || (!theme && systemPrefersDark)
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    }
    
    setIsDark(shouldBeDark)
    setMounted(true) // Ahora setMounted está dentro de useEffectEvent que hace más cosas
  })

  useEffect(() => {
    initializeTheme()
  }, [])

  const toggleTheme = async () => {
    const newIsDark = !isDark
    console.log(document.startViewTransition);
    
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsDark(newIsDark)
      document.documentElement.classList.toggle('dark')
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
      return
    }

    const transition = document.startViewTransition(() => {
      setIsDark(newIsDark)
      document.documentElement.classList.toggle('dark')
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
    })

    await transition.ready
  }

  // Evitar hydration mismatch
  if (!mounted) {
    return <div className="h-10 w-10" />
  }

  return (
    <button
      onClick={toggleTheme}
      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  )
}
