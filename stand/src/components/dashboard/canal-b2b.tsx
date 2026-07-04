"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { MensajeB2B, VinculoB2B } from "@/types"
import { 
  MessageSquare, 
  FileCode2, 
  Settings, 
  Palette, 
  CheckSquare, 
  Send, 
  Paperclip, 
  Download, 
  Loader2, 
  User as UserIcon,
  AlertTriangle,
  ExternalLink,
  Lock,
  ArrowDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CanalB2BProps {
  idProyecto: string
  idEmpresa: string
  usuario: {
    id: string
    nombre_completo: string
    rol: string
  }
}

type TipoMensaje = "mensaje" | "plano_autocad" | "orden_cnc" | "grafica_arte" | "aprobacion_cambio"

// Componente para resolver y renderizar imágenes desde bucket privado
const PrivateImagePreview = ({ path }: { path: string }) => {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let active = true
    const getUrl = async () => {
      try {
        const { data, error } = await supabase.storage
          .from("canal-b2b")
          .createSignedUrl(path, 3600) // 1 hora de validez
        
        if (error) throw error
        if (active && data?.signedUrl) {
          setUrl(data.signedUrl)
        }
      } catch (err) {
        console.error("Error resolviendo imagen privada:", err)
        if (active) setError(true)
      }
    }
    getUrl()
    return () => {
      active = false
    }
  }, [path, supabase])

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 text-xs bg-red-950/30 text-red-400 rounded border border-red-900/30">
        <AlertTriangle className="h-4 w-4" />
        <span>No se pudo cargar la vista previa</span>
      </div>
    )
  }

  if (!url) {
    return <div className="w-48 h-32 bg-slate-800/50 border border-slate-700/50 animate-pulse rounded flex items-center justify-center text-xs text-slate-500">Cargando imagen...</div>
  }

  return (
    <div className="relative group max-w-xs">
      <img
        src={url}
        alt="Arte gráfico"
        className="max-h-48 object-cover rounded border border-border hover:opacity-95 transition-opacity cursor-pointer"
        onClick={() => window.open(url, "_blank")}
      />
      <div className="absolute top-2 right-2 bg-black/75 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="h-3.5 w-3.5 text-white" />
      </div>
    </div>
  )
}

export default function CanalB2B({ idProyecto, idEmpresa, usuario }: CanalB2BProps) {
  const [vinculo, setVinculo] = useState<VinculoB2B | null>(null)
  const [mensajes, setMensajes] = useState<MensajeB2B[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [text, setText] = useState("")
  const [tipo, setTipo] = useState<TipoMensaje>("mensaje")
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const feedRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = useMemo(() => createClient(), [])

  // 1. Obtener o crear Vínculo B2B
  useEffect(() => {
    const initCanal = async () => {
      try {
        setLoading(true)
        setError(null)

        // Buscar vinculo existente
        const { data: existente, error: findError } = await supabase
          .from("proyectos_vinculos_b2b")
          .select("*")
          .eq("id_proyecto", idProyecto)
          .maybeSingle()

        if (findError) throw findError

        if (existente) {
          setVinculo(existente)
          await cargarMensajes(existente.id)
        } else {
          // MVP: Crear vínculo con la misma empresa (origen = destino = empresa actual)
          // token_canal_seguro y fecha_activacion_canal son NOT NULL en la BD
          const { data: nuevo, error: createError } = await supabase
            .from("proyectos_vinculos_b2b")
            .insert({
              id_proyecto: idProyecto,
              id_empresa_origen: idEmpresa,
              id_empresa_destino: idEmpresa,
              token_canal_seguro: crypto.randomUUID(),
              fecha_activacion_canal: new Date().toISOString(),
              estado_canal: true
            })
            .select()
            .maybeSingle()

          if (createError) {
            // Si es conflicto de unicidad (23505), otro tab ya lo creó: reintentamos la búsqueda
            if (createError.code === "23505") {
              const { data: reintento } = await supabase
                .from("proyectos_vinculos_b2b")
                .select("*")
                .eq("id_proyecto", idProyecto)
                .maybeSingle()
              if (reintento) {
                setVinculo(reintento)
                await cargarMensajes(reintento.id)
                return
              }
            }
            throw createError
          }
          if (nuevo) {
            setVinculo(nuevo)
            await cargarMensajes(nuevo.id)
          }
        }
      } catch (err: any) {
        console.error("Error al inicializar canal B2B:", err)
        setError("Error al conectar con el Canal B2B: " + (err.message || err))
        setLoading(false)
      }
    }

    if (idProyecto && idEmpresa) {
      initCanal()
    }
  }, [idProyecto, idEmpresa, supabase])

  // 2. Cargar mensajes e inicializar localStorage de leídos
  const cargarMensajes = async (vinculoId: string) => {
    try {
      const { data, error } = await supabase
        .from("proyectos_canal_intercambio")
        .select(`
          *,
          usuarios (
            nombre_completo,
            rol
          )
        `)
        .eq("id_vinculo_b2b", vinculoId)
        .order("fecha_registro", { ascending: true })

      if (error) throw error

      setMensajes(data as unknown as MensajeB2B[])
      
      // Actualizar localStorage indicando que se ha visto el canal ahora
      localStorage.setItem(`canal_b2b_last_seen_${idProyecto}`, Date.now().toString())
      
      // Disparar evento para avisar a la pestaña padre de que ya no hay mensajes nuevos
      window.dispatchEvent(new Event("storage"))

    } catch (err) {
      console.error("Error al cargar mensajes:", err)
    } finally {
      setLoading(false)
      setTimeout(scrollToBottom, 50)
    }
  }

  // 3. Suscripción en Tiempo Real
  useEffect(() => {
    if (!vinculo) return

    const channelName = `b2b-canal-${vinculo.id}`
    const channel = supabase.channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "proyectos_canal_intercambio",
          filter: `id_vinculo_b2b=eq.${vinculo.id}`
        },
        async (payload) => {
          // Para mostrar el autor del mensaje, cargamos los datos del usuario emisor
          const { data: userData } = await supabase
            .from("usuarios")
            .select("nombre_completo, rol")
            .eq("id", payload.new.id_usuario_emisor)
            .single()

          const nuevoMensaje: MensajeB2B = {
            ...(payload.new as MensajeB2B),
            usuarios: userData || undefined
          }

          setMensajes(prev => {
            // Evitar duplicados
            if (prev.some(m => m.id === nuevoMensaje.id)) return prev
            return [...prev, nuevoMensaje]
          })

          // Actualizar marca de leído al estar viendo el canal
          localStorage.setItem(`canal_b2b_last_seen_${idProyecto}`, Date.now().toString())
          window.dispatchEvent(new Event("storage"))

          setTimeout(scrollToBottom, 50)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [vinculo, idProyecto, supabase])

  const scrollToBottom = () => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }

  // Descarga de archivos firmados
  const descargarArchivo = async (ruta: string, originalName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("canal-b2b")
        .createSignedUrl(ruta, 60)

      if (error) throw error
      if (data?.signedUrl) {
        // Abrir en nueva ventana o descargar
        const a = document.createElement("a")
        a.href = data.signedUrl
        a.download = originalName
        a.target = "_blank"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error("Error al descargar archivo:", err)
      alert("No se pudo obtener el enlace de descarga para este archivo.")
    }
  }

  // 4. Enviar Mensaje
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!text.trim() || sending || !vinculo) return

    setSending(true)
    try {
      const { error } = await supabase
        .from("proyectos_canal_intercambio")
        .insert({
          id_vinculo_b2b: vinculo.id,
          id_usuario_emisor: usuario.id,
          tipo_notificacion: tipo,
          contenido_texto: text.trim(),
          ruta_archivo_servidor: null
        })

      if (error) throw error
      setText("")
      setTipo("mensaje") // Resetear tipo
    } catch (err: any) {
      console.error("Error al enviar mensaje:", err)
      alert("Error al enviar el mensaje: " + err.message)
    } finally {
      setSending(false)
    }
  }

  // 5. Subir Archivo
  const uploadFile = async (file: File) => {
    if (uploading || !vinculo) return

    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo supera el límite permitido de 10MB.")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("id_proyecto", idProyecto)

      const resp = await fetch("/api/upload-b2b", {
        method: "POST",
        body: formData
      })

      const resData = await resp.json()
      if (!resp.ok) {
        throw new Error(resData.error || "Error al subir archivo")
      }

      // Auto-enviar mensaje con el archivo
      // Elegir el tipo de notificación basado en la extensión o el selector actual
      let tipoAuto: TipoMensaje = tipo
      if (tipo === "mensaje") {
        const ext = file.name.split(".").pop()?.toLowerCase()
        if (ext === "dwg" || ext === "dxf") {
          tipoAuto = "plano_autocad"
        } else if (ext === "zip" || ext === "rar" || ext === "tar") {
          tipoAuto = "orden_cnc"
        } else if (["png", "jpg", "jpeg", "webp", "svg"].includes(ext || "")) {
          tipoAuto = "grafica_arte"
        } else {
          tipoAuto = "mensaje"
        }
      }

      const { error: insertError } = await supabase
        .from("proyectos_canal_intercambio")
        .insert({
          id_vinculo_b2b: vinculo.id,
          id_usuario_emisor: usuario.id,
          tipo_notificacion: tipoAuto,
          contenido_texto: `Subido archivo técnico: ${file.name}`,
          ruta_archivo_servidor: resData.path
        })

      if (insertError) throw insertError

    } catch (err: any) {
      console.error("Error subiendo archivo:", err)
      alert("Error al subir archivo: " + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0])
    }
  }

  // Estilo del mensaje
  const getTipoStyle = (tipo: TipoMensaje) => {
    switch (tipo) {
      case "plano_autocad":
        return {
          bg: "bg-blue-500/10 border-blue-500/20 text-blue-300",
          badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
          icon: FileCode2,
          name: "Plano CAD"
        }
      case "orden_cnc":
        return {
          bg: "bg-orange-500/10 border-orange-500/20 text-orange-300",
          badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
          icon: Settings,
          name: "Orden CNC"
        }
      case "grafica_arte":
        return {
          bg: "bg-purple-500/10 border-purple-500/20 text-purple-300",
          badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
          icon: Palette,
          name: "Gráfica / Arte"
        }
      case "aprobacion_cambio":
        return {
          bg: "bg-green-500/10 border-green-500/20 text-green-300",
          badge: "bg-green-500/20 text-green-400 border-green-500/30",
          icon: CheckSquare,
          name: "Aprobación"
        }
      default:
        return {
          bg: "bg-muted/40 border-border/50 text-foreground",
          badge: "bg-muted text-muted-foreground border-border",
          icon: MessageSquare,
          name: "Mensaje"
        }
    }
  }

  const getRolBadgeColor = (rol: string) => {
    switch (rol) {
      case "admin":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20"
      case "director_obra":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20"
      case "taller":
        return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20"
    }
  }

  const formatRol = (rol: string) => {
    const roles: Record<string, string> = {
      admin: "Gerente",
      director_obra: "Director Obra",
      taller: "Taller B2B",
      comercial: "Comercial",
      contabilidad: "Administración"
    }
    return roles[rol] || rol
  }

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-muted-foreground gap-3 border border-border/70 rounded-xl bg-background">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <span className="text-sm">Iniciando canal seguro B2B...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 border border-red-900/30 bg-red-950/10 rounded-xl flex items-start gap-4 text-red-400 max-w-2xl mx-auto my-6">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sm">Error en Canal B2B</h3>
          <p className="text-xs text-red-500/90 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-border/70 rounded-xl bg-background flex flex-col h-[50vh] sm:h-[600px] md:h-[650px] shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-border/70 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <div>
            <h3 className="font-semibold text-xs sm:text-sm text-foreground flex items-center gap-2">
              Canal B2B Taller-Oficina
            </h3>
            <p className="text-[10px] text-slate-500">Historial inmutable • RLS activo</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-slate-400 text-xs bg-slate-900 px-2 py-1 rounded border border-slate-800">
          <Lock className="h-3 w-3" />
          <span>Encriptación TLS</span>
        </div>
      </div>

      {/* Message Feed */}
      <div 
        ref={feedRef}
        className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4 bg-zinc-950/20"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        {mensajes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-2 p-8">
            <MessageSquare className="h-10 w-10 text-slate-700" />
            <p className="text-sm font-semibold text-slate-400">Canal vacío</p>
            <p className="text-xs max-w-xs">Arrastra planos, órdenes de trabajo CNC o arte final aquí para compartirlos con el taller.</p>
          </div>
        ) : (
          mensajes.map((msg) => {
            const isMe = msg.id_usuario_emisor === usuario.id
            const config = getTipoStyle(msg.tipo_notificacion)
            const Icon = config.icon

            return (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-border text-xs font-semibold ${
                  isMe ? "bg-indigo-950/40 text-indigo-400" : "bg-slate-900 text-slate-300"
                }`}>
                  {msg.usuarios?.nombre_completo?.slice(0, 2).toUpperCase() || <UserIcon className="h-3 w-3" />}
                </div>

                {/* Content Body */}
                <div className="space-y-1.5">
                  {/* Meta */}
                  <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500 ${isMe ? "justify-end" : ""}`}>
                    <span className="font-semibold text-slate-400">
                      {msg.usuarios?.nombre_completo || "Usuario B2B"}
                    </span>
                    <span className={`px-1 rounded ${getRolBadgeColor(msg.usuarios?.rol || "")}`}>
                      {formatRol(msg.usuarios?.rol || "")}
                    </span>
                    <span>
                      {new Date(msg.fecha_registro).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Message Balloon */}
                  <div className={`p-3 rounded-xl border ${config.bg} text-sm flex flex-col gap-2 relative shadow-md`}>
                    {/* Badge tipo */}
                    {msg.tipo_notificacion !== "mensaje" && (
                      <div className="flex items-center gap-1 self-start">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider flex items-center gap-1 ${config.badge}`}>
                          <Icon className="h-2.5 w-2.5" />
                          {config.name}
                        </span>
                      </div>
                    )}

                    {/* Text */}
                    {msg.contenido_texto && (
                      <p className="whitespace-pre-line text-white/90 break-words leading-relaxed font-sans">{msg.contenido_texto}</p>
                    )}

                    {/* File Attachment */}
                    {msg.ruta_archivo_servidor && (
                      <div className="mt-1">
                        {/* Image Preview if it's a graphical art */}
                        {msg.tipo_notificacion === "grafica_arte" && (
                          <div className="mb-2">
                            <PrivateImagePreview path={msg.ruta_archivo_servidor} />
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 bg-muted/30 rounded-lg border border-border hover:border-border transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="text-xs text-slate-300 break-all sm:truncate font-mono">
                              {msg.ruta_archivo_servidor.split("-").slice(1).join("-") || "archivo_b2b"}
                            </span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => descargarArchivo(msg.ruta_archivo_servidor!, msg.ruta_archivo_servidor!.split("-").slice(1).join("-"))}
                            className="h-7 w-7 sm:shrink-0 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* Drag Active Indicator */}
        {dragActive && (
          <div className="absolute inset-0 bg-indigo-950/80 border-2 border-dashed border-indigo-500/70 rounded-xl m-2 flex flex-col items-center justify-center text-indigo-300 gap-2 pointer-events-none z-20 backdrop-blur-sm transition-all duration-200">
            <ArrowDown className="h-10 w-10 animate-bounce" />
            <p className="font-semibold text-sm">Suelta el archivo para subirlo al taller</p>
            <p className="text-xs text-indigo-400/80">Formatos permitidos: PDF, DWG, DXF, ZIP, imágenes • Máx 10MB</p>
          </div>
        )}
      </div>

      {/* Input Composer */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-border/70 bg-muted/20 space-y-2 sm:space-y-3">
        {uploading && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-950/30 p-2 rounded border border-indigo-900/30 animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Subiendo archivo...</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Selector de tipo - oculto en móvil muy pequeño, visible desde sm */}
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMensaje)}
            className="hidden sm:block h-10 px-2.5 rounded-lg border border-border bg-background text-muted-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary hover:border-border transition-colors"
          >
            <option value="mensaje">💬 Mensaje</option>
            <option value="plano_autocad">📐 Plano CAD</option>
            <option value="orden_cnc">⚙️ Orden CNC</option>
            <option value="grafica_arte">🎨 Gráfica / Arte</option>
            <option value="aprobacion_cambio">✅ Aprobación</option>
          </select>

          {/* Input de texto */}
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Escribe un mensaje..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={sending || uploading}
              className="bg-background border-border text-foreground placeholder-muted-foreground pr-10 focus-visible:ring-primary text-sm"
            />

            {/* Clip de adjuntar */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploading}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 disabled:opacity-50 transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  uploadFile(e.target.files[0])
                }
              }}
              className="hidden"
            />
          </div>

          <Button 
            type="submit"
            disabled={!text.trim() || sending || uploading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shrink-0 px-3 sm:px-4 gap-2 h-10"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">Enviar</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
