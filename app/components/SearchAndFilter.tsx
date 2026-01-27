'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

interface SearchAndFilterProps {
  organizations: Array<{ id: string; name: string }>
}

export function SearchAndFilter({ organizations }: SearchAndFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [org, setOrg] = useState(searchParams.get('org') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'recent')

  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (org) params.set('org', org)
    if (sort) params.set('sort', sort)

    const newUrl = params.toString() ? `?${params.toString()}` : '/dashboard/paths'
    router.push(newUrl, { scroll: false })
  }, [query, org, sort])

  return (
    <div className="mb-6 space-y-4">
      {/* Barra de búsqueda */}
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar paths por título, descripción..."
          className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
        <svg
          className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          <option value="">Todas las organizaciones</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          <option value="recent">Más recientes</option>
          <option value="popular">Más populares</option>
          <option value="name">Nombre (A-Z)</option>
        </select>

        {(query || org) && (
          <button
            onClick={() => {
              setQuery('')
              setOrg('')
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}
