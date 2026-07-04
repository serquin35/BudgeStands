"use client"

import { useRef, useState } from "react"
import { ImageUp, X, Loader2 } from "lucide-react"

interface Props {
  value: string
  onUpload: (url: string) => void
  disabled?: boolean
}

export function ImageUploader({ value, onUpload, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || "")

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const valid = ["image/png", "image/jpeg", "image/webp"]
    if (!valid.includes(file.type)) {
      alert("Solo se permiten imágenes PNG, JPG o WebP")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("La imagen no puede superar los 10MB")
      return
    }

    setUploading(true)
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("tipo", "imagen")

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      onUpload(data.url)
    } catch (err: any) {
      alert("Error al subir imagen: " + err.message)
      setPreview(value || "")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleRemove = () => {
    setPreview("")
    onUpload("")
  }

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground font-medium">Imagen de referencia (opcional)</label>

      {preview ? (
        <div className="relative rounded-md overflow-hidden border border-border aspect-video bg-muted/40">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || uploading}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full h-28 rounded-md border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1.5 bg-muted/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          ) : (
            <>
              <ImageUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Haz clic para subir o arrastra una imagen</span>
              <span className="text-[10px] text-muted-foreground">PNG, JPG, WebP — Máx 10MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
