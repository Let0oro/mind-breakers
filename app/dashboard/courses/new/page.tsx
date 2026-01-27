'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { FileUpload } from '@/components/FileUpload'

export default function NewCoursePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paths, setPaths] = useState<Array<{ id: string; title: string }>>([])
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('')
  const [linkUrl, setLinkUrl] = useState<string>('')
  const [isYouTube, setIsYouTube] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [autoSaveText, setAutoSaveText] = useState('Ready to save')
  const [dragActive, setDragActive] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const pathId = searchParams.get('pathId')
  const supabase = createClient()

  // Detectar YouTube y extraer thumbnail
  useEffect(() => {
    if (linkUrl) {
      const isYT = linkUrl.includes('youtube.com') || linkUrl.includes('youtu.be')
      setIsYouTube(isYT)

      if (isYT && !thumbnailUrl) {
        const videoId = extractYouTubeId(linkUrl)
        if (videoId) {
          setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`)
        }
      }
    }
  }, [linkUrl])

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  // Auto-rellenar desde URL
  const handleAutoFill = async () => {
    if (!linkUrl) return

    setLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fetch-metadata`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ url: linkUrl }),
        }
      )

      const metadata = await response.json()

      if (metadata.error) {
        setError(metadata.error)
        return
      }

      // Auto-rellenar campos
      const titleInput = document.getElementById('title') as HTMLInputElement
      const summaryInput = document.getElementById('summary') as HTMLInputElement
      const descInput = document.getElementById('description') as HTMLTextAreaElement

      if (titleInput && !titleInput.value) titleInput.value = metadata.title
      if (summaryInput && !summaryInput.value) summaryInput.value = metadata.description?.substring(0, 200)
      if (descInput && !descInput.value) descInput.value = metadata.description
      if (metadata.thumbnail) setThumbnailUrl(metadata.thumbnail)

    } catch (err) {
      setError('Error al obtener metadatos')
    } finally {
      setLoading(false)
    }
  }

  // Cargar paths y organizaciones
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: pathsData } = await supabase
      .from('learning_paths')
      .select('id, title')
      .order('title')

    if (pathsData) setPaths(pathsData)

    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name')

    if (orgsData) setOrganizations(orgsData)
  }

  // Manejo de drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageUpload({ target: { files } } as any)
    }
  }

  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setThumbnailUrl(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const changeThumbnail = () => {
    setThumbnailUrl('')
  }

  // Guardar borrador
  const handleSaveDraft = () => {
    const formData = {
      title: (document.getElementById('title') as HTMLInputElement)?.value,
      summary: (document.getElementById('summary') as HTMLInputElement)?.value,
      description: (document.getElementById('description') as HTMLTextAreaElement)?.value,
      link_url: linkUrl,
      thumbnail_url: thumbnailUrl,
      organization_id: (document.getElementById('organization_id') as HTMLSelectElement)?.value,
      xp_reward: (document.getElementById('xp_reward') as HTMLInputElement)?.value,
      saved_at: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }

    localStorage.setItem('courseDraft', JSON.stringify(formData))
    setAutoSaveText(`Guardado a las ${formData.saved_at}`)
    setTimeout(() => {
      setAutoSaveText('Ready to save')
    }, 3000)
  }

  // Cargar borrador al montar
  useEffect(() => {
    const draft = localStorage.getItem('courseDraft')
    if (draft) {
      const data = JSON.parse(draft)
      const titleInput = document.getElementById('title') as HTMLInputElement
      const summaryInput = document.getElementById('summary') as HTMLInputElement
      const descInput = document.getElementById('description') as HTMLTextAreaElement
      const orgSelect = document.getElementById('organization_id') as HTMLSelectElement
      const xpInput = document.getElementById('xp_reward') as HTMLInputElement

      if (titleInput) titleInput.value = data.title || ''
      if (summaryInput) summaryInput.value = data.summary || ''
      if (descInput) descInput.value = data.description || ''
      if (orgSelect) orgSelect.value = data.organization_id || ''
      if (xpInput) xpInput.value = data.xp_reward || '100'
      
      setLinkUrl(data.link_url || '')
      setThumbnailUrl(data.thumbnail_url || '')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const selectedPathId = formData.get('path_id') as string

    if (!selectedPathId) {
      setError('Debes seleccionar un path')
      setLoading(false)
      return
    }

    const { data: existingCourses } = await supabase
      .from('courses')
      .select('order_index')
      .eq('path_id', selectedPathId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrderIndex = existingCourses && existingCourses.length > 0
      ? existingCourses[0].order_index + 1
      : 0

    const { data, error: insertError } = await supabase
      .from('courses')
      .insert({
        path_id: selectedPathId,
        title: formData.get('title') as string,
        summary: formData.get('summary') as string,
        description: formData.get('description') as string,
        link_url: linkUrl,
        thumbnail_url: thumbnailUrl,
        organization_id: formData.get('organization_id') as string || null,
        order_index: nextOrderIndex,
        xp_reward: parseInt(formData.get('xp_reward') as string) || 100,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    localStorage.removeItem('courseDraft')
    router.push(`/dashboard/paths/${selectedPathId}`)
  }

  return (
    <div className="min-h-screen bg-background text-slate-900 dark:text-white">
      {/* Top Navigation Bar */}


      <div className="max-w-360 mx-auto flex min-h-full">
        {/* Sidebar Navigation */}
        <aside className="w-72 border-r border-slate-200 dark:border-[#283039] p-6 hidden lg:block sticky top-4 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Course Builder</h3>
            <div className="space-y-1">
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-white font-medium" href="#">
                <span className="material-symbols-outlined text-[20px]">info</span>
                <span>Basic Information</span>
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c2127] transition-colors" href="#">
                <span className="material-symbols-outlined text-[20px]">menu_book</span>
                <span>Curriculum</span>
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c2127] transition-colors" href="#">
                <span className="material-symbols-outlined text-[20px]">terminal</span>
                <span>Exercises</span>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded-md font-bold">2</span>
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c2127] transition-colors" href="#">
                <span className="material-symbols-outlined text-[20px]">quiz</span>
                <span>Quizzes</span>
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c2127] transition-colors" href="#">
                <span className="material-symbols-outlined text-[20px]">settings</span>
                <span>Settings</span>
              </a>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-sm">stars</span>
              <span className="text-xs font-bold text-primary uppercase">Quality Score</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mb-3">
              <div className="bg-primary h-full rounded-full" style={{width: '45%'}}></div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Add at least 3 exercises and a cover image to increase your score to 80%.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-8 md:px-12 lg:px-20 max-w-[1000px]">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm font-medium mb-6">
            <a className="text-slate-500 hover:text-primary transition-colors" href="#">Dashboard</a>
            <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
            <a className="text-slate-500 hover:text-primary transition-colors" href="#">Courses</a>
            <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
            <span className="text-slate-900 dark:text-white">New Course</span>
          </nav>

          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-black tracking-tight mb-3">Create New Course</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Draft your course content and define the learning path for your students.</p>
          </div>

          {/* Form Sections */}
          <form onSubmit={handleSubmit} className="space-y-12 pb-32">
            {/* Error Alert */}
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Learning Path Selection */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-[#283039]">
                <span className="material-symbols-outlined text-primary">route</span>
                <h2 className="text-xl font-bold">Learning Path</h2>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="path_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Path *</label>
                <select
                  id="path_id"
                  name="path_id"
                  required
                  defaultValue={pathId || ''}
                  className="w-full bg-white dark:bg-[#1c2127] border border-slate-300 dark:border-[#3b4754] rounded-lg h-12 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">Selecciona un path</option>
                  {paths.map((path) => (
                    <option key={path.id} value={path.id}>
                      {path.title}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Basic Details */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-[#283039]">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                <h2 className="text-xl font-bold">General Details</h2>
              </div>
              <div className="grid gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="title" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Course Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    className="w-full bg-white dark:bg-[#1c2127] border border-slate-300 dark:border-[#3b4754] rounded-lg h-12 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="e.g. Advanced UI Design Systems with Figma"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="summary" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Short Summary</label>
                    <span className="text-[11px] text-slate-500 uppercase font-bold tracking-tighter">{charCount} / 200</span>
                  </div>
                  <textarea
                    id="summary"
                    name="summary"
                    rows={3}
                    maxLength={200}
                    onChange={(e) => setCharCount(e.target.value.length)}
                    className="w-full bg-white dark:bg-[#1c2127] border border-slate-300 dark:border-[#3b4754] rounded-lg p-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                    placeholder="Briefly describe what students will achieve..."
                  ></textarea>
                </div>
              </div>
            </section>

            {/* External Link */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-[#283039]">
                <span className="material-symbols-outlined text-primary">language</span>
                <h2 className="text-xl font-bold">External Resources</h2>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="link_url" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Reference Link</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">language</span>
                  <input
                    type="url"
                    id="link_url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full bg-white dark:bg-[#1c2127] border border-slate-300 dark:border-[#3b4754] rounded-lg h-12 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="https://github.com/project-repo or https://youtube.com/watch?v=..."
                  />
                </div>
                {isYouTube && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                    ✓ Video de YouTube detectado - thumbnail cargado automáticamente
                  </p>
                )}
              </div>
            </section>

            {/* Media Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-[#283039]">
                <span className="material-symbols-outlined text-primary">image</span>
                <h2 className="text-xl font-bold">Course Media</h2>
              </div>
              <div id="thumbnailContainer">
                {thumbnailUrl ? (
                  <div className="space-y-3">
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail"
                      className="w-full h-48 object-cover rounded-lg border border-slate-300 dark:border-[#3b4754]"
                    />
                    <button
                      type="button"
                      onClick={changeThumbnail}
                      className="text-sm text-primary hover:text-blue-700 font-medium"
                    >
                      Change image
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`group relative flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-[#3b4754] rounded-2xl p-10 bg-slate-50 dark:bg-slate-900/50 transition-all cursor-pointer ${dragActive ? 'bg-slate-100 dark:bg-slate-900' : 'hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                  >
                    <div className="size-14 rounded-full bg-slate-200 dark:bg-[#283039] flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-3xl">upload_file</span>
                    </div>
                    <p className="font-bold text-center mb-1">Click or drag image to upload</p>
                    <p className="text-slate-500 text-sm text-center">PNG, JPG or WebP (Recommended 16:9 ratio)</p>
                    <input
                      id="imageInput"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Detailed Description */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-[#283039]">
                <span className="material-symbols-outlined text-primary">description</span>
                <h2 className="text-xl font-bold">Detailed Description</h2>
              </div>
              <div className="border border-slate-300 dark:border-[#3b4754] rounded-xl overflow-hidden bg-white dark:bg-[#1c2127]">
                <div className="flex items-center gap-1 p-2 border-b border-slate-300 dark:border-[#3b4754] bg-slate-50 dark:bg-[#283039]">
                  <button type="button" className="p-2 hover:bg-slate-200 dark:hover:bg-[#3b4754] rounded"><span className="material-symbols-outlined text-xl">format_bold</span></button>
                  <button type="button" className="p-2 hover:bg-slate-200 dark:hover:bg-[#3b4754] rounded"><span className="material-symbols-outlined text-xl">format_italic</span></button>
                  <button type="button" className="p-2 hover:bg-slate-200 dark:hover:bg-[#3b4754] rounded border-r border-slate-700 pr-3"><span className="material-symbols-outlined text-xl">format_underlined</span></button>
                  <button type="button" className="p-2 hover:bg-slate-200 dark:hover:bg-[#3b4754] rounded ml-2"><span className="material-symbols-outlined text-xl">format_list_bulleted</span></button>
                  <button type="button" className="p-2 hover:bg-slate-200 dark:hover:bg-[#3b4754] rounded"><span className="material-symbols-outlined text-xl">format_list_numbered</span></button>
                  <button type="button" className="p-2 hover:bg-slate-200 dark:hover:bg-[#3b4754] rounded"><span className="material-symbols-outlined text-xl">link</span></button>
                  <button type="button" className="p-2 hover:bg-slate-200 dark:hover:bg-[#3b4754] rounded"><span className="material-symbols-outlined text-xl">code</span></button>
                </div>
                <textarea
                  id="description"
                  name="description"
                  rows={10}
                  className="w-full bg-transparent border-none focus:ring-0 p-6 resize-y min-h-[300px]"
                  placeholder="Write the full curriculum details, requirements, and outcomes..."
                ></textarea>
              </div>
            </section>

            {/* Organization & XP */}
            <section className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="organization_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Organization/Author</label>
                  <select
                    id="organization_id"
                    name="organization_id"
                    className="w-full bg-white dark:bg-[#1c2127] border border-slate-300 dark:border-[#3b4754] rounded-lg h-12 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="">Sin organización</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="xp_reward" className="text-sm font-semibold text-slate-700 dark:text-slate-300">XP Reward</label>
                  <input
                    type="number"
                    id="xp_reward"
                    name="xp_reward"
                    defaultValue="100"
                    min="10"
                    step="10"
                    className="w-full bg-white dark:bg-[#1c2127] border border-slate-300 dark:border-[#3b4754] rounded-lg h-12 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </section>
          </form>
        </main>
      </div>

      {/* Sticky Footer Actions */}
      <footer className="fixed bottom-0 left-0 right-0 z-[60] border-t border-slate-200 dark:border-[#283039] bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl py-4 shadow-2xl">
        <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="material-symbols-outlined text-sm text-green-500">cloud_done</span>
            <span id="autoSaveText">{autoSaveText}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-[#3b4754] font-bold text-sm hover:bg-slate-100 dark:hover:bg-[#1c2127] transition-all"
            >
              Save Draft
            </button>
            <button
              type="submit"
              form="courseForm"
              disabled={loading}
              className="px-8 py-2.5 rounded-lg bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Course'}
            </button>
          </div>
        </div>
      </footer>

    </div>
  )
}
