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
        <span className="material-symbols-outlined">light_mode</span>
      ) : (
        <span className="material-symbols-outlined">dark_mode</span>
      )}
    </button>
  )
}
