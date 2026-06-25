"use client"

import { useRef, useState, useEffect } from "react"
import { Mic, Square, Play, Trash2, Loader2 } from "lucide-react"

interface Props {
  value: string
  onUpload: (url: string) => void
  disabled?: boolean
}

type RecorderState = "idle" | "recording" | "paused" | "done"

export function AudioRecorder({ value, onUpload, disabled }: Props) {
  const [state, setState] = useState<RecorderState>("idle")
  const [audioUrl, setAudioUrl] = useState(value || "")
  const [uploading, setUploading] = useState(false)
  const [duration, setDuration] = useState(0)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      mediaRecorder.current = recorder
      chunks.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setState("done")
        if (timerRef.current) clearInterval(timerRef.current)
        setDuration(0)

        const blob = new Blob(chunks.current, { type: "audio/webm" })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)

        await uploadAudio(blob)
      }

      recorder.start(200)
      setState("recording")
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch (err: any) {
      alert("No se pudo acceder al micrófono: " + err.message)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop()
    }
  }

  const uploadAudio = async (blob: Blob) => {
    setUploading(true)
    try {
      const file = new File([blob], `audio-${Date.now()}.webm`, { type: "audio/webm" })
      const formData = new FormData()
      formData.append("file", file)
      formData.append("tipo", "audio")

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      onUpload(data.url)
    } catch (err: any) {
      alert("Error al subir audio: " + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setAudioUrl("")
    setState("idle")
    setDuration(0)
    onUpload("")
    if (audioUrl && audioUrl.startsWith("blob:")) {
      URL.revokeObjectURL(audioUrl)
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-2">
      <label className="text-xs text-[#a1a1aa] font-medium">Audio descriptivo (opcional)</label>

      <div className="flex items-center gap-2 p-2.5 rounded-md border border-[#27272a] bg-[#09090b]/60">
        {state === "idle" && !audioUrl && (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mic className="h-4 w-4" />
            Grabar audio
          </button>
        )}

        {state === "recording" && (
          <>
            <span className="flex items-center gap-2 text-xs font-medium text-rose-400 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Grabando {formatTime(duration)}
            </span>
            <button
              type="button"
              onClick={stopRecording}
              className="ml-auto p-1.5 rounded-md bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              <Square className="h-4 w-4" />
            </button>
          </>
        )}

        {state === "done" && audioUrl && (
          <>
            <audio ref={audioRef} src={audioUrl} controls className="h-8 w-full max-w-[200px]" />
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
            ) : (
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-md text-[#a1a1aa] hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>

      <p className="text-[10px] text-[#52525b]">
        Describe verbalmente el stand que necesitas. El audio se subirá a n8n para procesamiento.
      </p>
    </div>
  )
}
