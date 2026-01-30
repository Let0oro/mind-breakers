'use client'

import { useState, useEffect, useCallback } from 'react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true) // Default to dark
  const [mounted, setMounted] = useState(false)

  // Initialize theme on mount
  useEffect(() => {
    const theme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    // Default to dark if no preference is set
    const shouldBeDark = theme === 'dark' || (!theme && systemPrefersDark) || !theme

    // Apply theme to document
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(shouldBeDark)
    setMounted(true)
  }, [])

  const toggleTheme = useCallback(async () => {
    const newIsDark = !isDark

    const updateTheme = () => {
      if (newIsDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
      setIsDark(newIsDark)
    }

    // Check if View Transitions API is supported and motion is allowed
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      updateTheme()
      return
    }

    // Use View Transitions for smooth animation
    const transition = document.startViewTransition(() => {
      updateTheme()
    })

    await transition.ready
  }, [isDark])

  // Prevent hydration mismatch
  if (!mounted) {
    return <div className="h-10 w-10" />
  }

  return (
    <button
      onClick={toggleTheme}
      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
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
