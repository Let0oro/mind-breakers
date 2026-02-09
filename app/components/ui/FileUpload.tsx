'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface FileUploadProps {
  bucket: string
  path?: string
  accept?: string
  onUploadComplete: (url: string) => void
  maxSizeMB?: number
}

export function FileUpload({
  bucket,
  path = '',
  accept = 'image/*',
  onUploadComplete,
  maxSizeMB = 5,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const supabase = createClient()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      setError(null)

      const file = event.target.files?.[0]
      if (!file) return

      // Validar tamaño
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`El archivo debe ser menor a ${maxSizeMB}MB`)
        setUploading(false)
        return
      }

      // Preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => setPreview(reader.result as string)
        reader.readAsDataURL(file)
      }

      // Generar nombre único
      const fileExt = file.name.split('.').pop()
      const fileName = `${path}${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload a Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      onUploadComplete(publicUrl)
      setUploading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir archivo')
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-border border-dashed rounded-lg cursor-pointer bg-surface hover:bg-surface"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-lg" />
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <span className="material-symbols-outlined text-[40px] text-muted mb-3">
                cloud_upload
              </span>
              <p className="mb-2 text-sm text-muted">
                <span className="font-semibold">Click para subir</span> o arrastra y suelta
              </p>
              <p className="text-xs text-muted">Máximo {maxSizeMB}MB</p>
            </div>
          )}
          <input
            id="dropzone-file"
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && (
        <div className="text-center text-sm text-blue-600">
          Subiendo archivo...
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  )
}
