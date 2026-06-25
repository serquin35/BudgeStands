"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import { ImageUploader } from "@/components/shared/image-uploader"
import { AudioRecorder } from "@/components/shared/audio-recorder"
import { 
  Sparkles, 
  Layers, 
  History, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Calculator,
  Calendar,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Plus
} from "lucide-react"

import type { ClienteBasico, Presupuesto, PresupuestoLinea } from "@/types"

const loadingMessages = [
  "Iniciando Jarvis IA Stand Constructor...",
  "Analizando las dimensiones y metros cuadrados del espacio...",
  "Consultando las tarifas de servicios del recinto ferial...",
  "Diseñando la distribución espacial óptima...",
  "Generando la estructura en carpintería y aluminio...",
  "Seleccionando materiales y revestimiento para el suelo...",
  "Añadiendo focos LED y calculando potencia requerida...",
  "Agregando mobiliario de diseño y audiovisuales...",
  "Calculando logística de transporte y costes de montaje...",
  "Estructurando el presupuesto final en partidas...",
  "Jarvis está terminando de procesar los datos..."
]

export default function PresustandPage() {
  const supabase = createClient()
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [clientes, setClientes] = useState<ClienteBasico[]>([])
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Form State
  const [activeTab, setActiveTab] = useState<"rapida" | "ia" | "historial">("rapida")
  const [selectedCliente, setSelectedCliente] = useState("")
  const [nombreFeria, setNombreFeria] = useState("")
  const [m2, setM2] = useState("")
  const [altura, setAltura] = useState("2.50")
  const [tipoStand, setTipoStand] = useState("modular")
  const [nivelDensidad, setNivelDensidad] = useState("media_estandar")
  const [estiloStand, setEstiloStand] = useState("moderno")
  const [promptText, setPromptText] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [audioUrl, setAudioUrl] = useState("")

  // Estimation State
  const [estSubtotalConstruccion, setEstSubtotalConstruccion] = useState(0)
  const [estSubtotalServicios, setEstSubtotalServicios] = useState(0)
  const [estSubtotalDiseno, setEstSubtotalDiseno] = useState(0)
  const [estSubtotalTransporte, setEstSubtotalTransporte] = useState(0)
  const [estTotal, setEstTotal] = useState(0)

  // IA Generation State
  const [generating, setGenerating] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Details State
  const [activePresId, setActivePresId] = useState<string | null>(null)
  const [activePres, setActivePres] = useState<Presupuesto | null>(null)
  const [activePresLineas, setActivePresLineas] = useState<PresupuestoLinea[]>([])
  const [loadingLineas, setLoadingLineas] = useState(false)

  // Dialog State for creating a client inline
  const [isNewClientOpen, setIsNewClientOpen] = useState(false)
  const [newClientNombreComercial, setNewClientNombreComercial] = useState("")
  const [newClientRazonSocial, setNewClientRazonSocial] = useState("")
  const [newClientCifNif, setNewClientCifNif] = useState("")
  const [newClientEmail, setNewClientEmail] = useState("")
  const [newClientTelefono, setNewClientTelefono] = useState("")
  const [newClientSaving, setNewClientSaving] = useState(false)
  const [newClientError, setNewClientError] = useState<string | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: dbUser } = await supabase
            .from("usuarios")
            .select("id_empresa")
            .eq("id", user.id)
            .single()

          if (dbUser) {
            setEmpresaId(dbUser.id_empresa)
            // Cargar clientes
            const { data: dbClientes } = await supabase
              .from("clientes")
              .select("id, nombre_comercial")
              .eq("id_empresa", dbUser.id_empresa)
              .order("nombre_comercial")
            setClientes(dbClientes || [])

            // Cargar presupuestos
            loadPresupuestos(dbUser.id_empresa)
          }
        }
      } catch (err) {
        console.error("Error al cargar datos iniciales:", err)
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [])

  async function loadPresupuestos(empresaId: string) {
    const { data: dbPres } = await supabase
      .from("presupuestos_cabecera")
      .select(`
        id,
        numero_presupuesto,
        nombre_feria,
        m2_superficie,
        altura_stand_m,
        tipo_stand,
        total_presupuesto,
        estado_presupuesto,
        created_at,
        clientes (
          nombre_comercial
        )
      `)
      .eq("id_empresa", empresaId)
      .order("created_at", { ascending: false })
    
    setPresupuestos(dbPres || [])
  }

  const handleCreateNewClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresaId) return
    setNewClientSaving(true)
    setNewClientError(null)

    try {
      const payload = {
        id_empresa: empresaId,
        nombre_comercial: newClientNombreComercial.trim(),
        razon_social: newClientRazonSocial.trim(),
        cif_nif: newClientCifNif.trim(),
        email_contacto: newClientEmail.trim() || null,
        telefono_contacto: newClientTelefono.trim() || null,
        estado_cliente: "activo",
        forma_pago_habitual: "transferencia",
        plazo_pago_dias: 30,
        tarifa_asignada: "estandar",
      }

      if (!payload.nombre_comercial || !payload.razon_social || !payload.cif_nif) {
        throw new Error("Por favor, rellena todos los campos obligatorios (*).")
      }

      const { data, error } = await supabase
        .from("clientes")
        .insert([payload])
        .select("id, nombre_comercial")
        .single()

      if (error) throw error

      if (data) {
        setClientes((prev) => [...prev, data].sort((a, b) => a.nombre_comercial.localeCompare(b.nombre_comercial)))
        setSelectedCliente(data.id)
        
        setNewClientNombreComercial("")
        setNewClientRazonSocial("")
        setNewClientCifNif("")
        setNewClientEmail("")
        setNewClientTelefono("")
        setIsNewClientOpen(false)
      }
    } catch (err: any) {
      console.error(err)
      setNewClientError(err?.message || "Error al guardar el cliente")
    } finally {
      setNewClientSaving(false)
    }
  }

  // Recalcular estimación rápida localmente
  useEffect(() => {
    const area = Number(m2) || 0
    if (area <= 0) {
      setEstSubtotalConstruccion(0)
      setEstSubtotalServicios(0)
      setEstSubtotalDiseno(0)
      setEstSubtotalTransporte(0)
      setEstTotal(0)
      return
    }

    // Costes estimados base por m2
    let construccionM2 = 250
    let serviciosM2 = 60
    let disenoBase = 1200
    let transporteM2 = 80

    if (tipoStand === "carpinteria_diseno") {
      construccionM2 = 650
      serviciosM2 = 90
      disenoBase = 3500
      transporteM2 = 140
    } else if (tipoStand === "retail_comercial") {
      construccionM2 = 350
      serviciosM2 = 65
      disenoBase = 1800
      transporteM2 = 90
    } else if (tipoStand === "hibrido") {
      construccionM2 = 450
      serviciosM2 = 75
      disenoBase = 2200
      transporteM2 = 110
    } else if (tipoStand === "doble_planta") {
      construccionM2 = 950
      serviciosM2 = 120
      disenoBase = 5000
      transporteM2 = 200
    }

    const constSub = area * construccionM2
    const servSub = area * serviciosM2
    const disSub = disenoBase
    const transSub = area * transporteM2

    const base = constSub + servSub + disSub + transSub
    const iva = base * 0.21

    setEstSubtotalConstruccion(constSub)
    setEstSubtotalServicios(servSub)
    setEstSubtotalDiseno(disSub)
    setEstSubtotalTransporte(transSub)
    setEstTotal(base + iva)
  }, [m2, tipoStand])

  // Temporizador para mensajes de loading en IA
  useEffect(() => {
    let interval: any
    if (generating) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length)
      }, 3500)
    }
    return () => clearInterval(interval)
  }, [generating])

  // Guardar estimación rápida local
  const [savingEst, setSavingEst] = useState(false)
  const handleSaveEstimation = async () => {
    if (!selectedCliente || !nombreFeria || !m2) {
      alert("Por favor, selecciona un cliente, introduce la feria y la superficie en m².")
      return
    }
    setSavingEst(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      const { data: dbUser } = await supabase
        .from("usuarios")
        .select("id_empresa")
        .eq("id", user.id)
        .single()

      if (!dbUser) throw new Error("Empresa no encontrada")

      const random = Math.floor(Math.random() * 1000)
      const numeroPresupuesto = `PRES-2026-${random.toString().padStart(4, "0")}`

      const base = estSubtotalConstruccion + estSubtotalServicios + estSubtotalDiseno + estSubtotalTransporte
      const iva = base * 0.21

      // 1. Insertar Cabecera
      const { data: pres, error: presError } = await supabase
        .from("presupuestos_cabecera")
        .insert([
          {
            id_empresa: dbUser.id_empresa,
            id_cliente: selectedCliente,
            id_usuario_creador: user.id,
            numero_presupuesto: numeroPresupuesto,
            nombre_feria: nombreFeria,
            m2_superficie: Number(m2),
            altura_stand_m: Number(altura),
            tipo_stand: tipoStand,
            estilo_stand: estiloStand,
            metodo_presupuestacion: "metodo_1_macro",
            subtotal_construccion: estSubtotalConstruccion,
            subtotal_servicios_feria: estSubtotalServicios,
            subtotal_diseno_grafica: estSubtotalDiseno,
            subtotal_transporte_mo: estSubtotalTransporte,
            base_imponible: base,
            importe_iva: iva,
            total_presupuesto: base + iva,
            estado_presupuesto: "borrador"
          }
        ])
        .select()
        .single()

      if (presError) throw presError

      // 2. Insertar Líneas Macro estimadas
      const lineas = [
        { concepto: `Construcción y estructura stand tipo ${tipoStand}`, total: estSubtotalConstruccion, catId: 1 },
        { concepto: "Servicios técnicos feriales contratados", total: estSubtotalServicios, catId: 12 },
        { concepto: "Proyecto de diseño 3D, renders y dirección artística", total: estSubtotalDiseno, catId: 14 },
        { concepto: "Transporte, logística, montaje y desmontaje en recinto", total: estSubtotalTransporte, catId: 11 }
      ]

      const lineasPayload = lineas.map((l, idx) => ({
        id_presupuesto: pres.id,
        orden: idx + 1,
        origen_concepto: "base_a",
        concepto_descripcion: l.concepto,
        cantidad: 1,
        unidad: "ud",
        precio_unitario_venta: l.total,
        total_linea: l.total
      }))

      const { error: lineasError } = await supabase.from("presupuestos_lineas").insert(lineasPayload)
      if (lineasError) throw lineasError

      alert(`Presupuesto ${numeroPresupuesto} guardado en borradores exitosamente.`)
      
      // Recargar histórico
      loadPresupuestos(dbUser.id_empresa)
      setActiveTab("historial")
      handleViewDetails(pres.id)
    } catch (err: any) {
      console.error(err)
      alert("Error al guardar presupuesto: " + err.message)
    } finally {
      setSavingEst(false)
    }
  }

  // Generar presupuesto con IA Jarvis
  const handleGenerateIA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCliente || !nombreFeria || !m2) {
      setGenerationError("Por favor, selecciona un cliente, introduce la feria y los m².")
      return
    }
    setGenerating(true)
    setGenerationError(null)
    setLoadingMsgIdx(0)

    try {
      const response = await fetch("/api/generate-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: selectedCliente,
          nombreFeria,
          m2: Number(m2),
          altura: Number(altura),
          tipoStand,
          estiloStand,
          promptText,
          imageUrl,
          audioUrl
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Error al procesar")

      // Cargar presupuestos actualizados
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: dbUser } = await supabase.from("usuarios").select("id_empresa").eq("id", user.id).single()
        if (dbUser) {
          await loadPresupuestos(dbUser.id_empresa)
        }
      }

      setGenerating(false)
      setActiveTab("historial")
      if (data.presupuestoId) {
        handleViewDetails(data.presupuestoId)
      } else {
        // n8n insertó el presupuesto silenciosamente, no sabemos el ID, mostramos alerta y limpiamos vista
        setActivePresId(null)
        setActivePres(null)
        setActivePresLineas([])
        alert("¡Jarvis ha procesado el presupuesto!\nSe mostrará en la lista del historial. (Puedes recargar si no aparece inmediatamente)")
      }
    } catch (err: any) {
      console.error(err)
      setGenerationError(err.message || "Ocurrió un error con Jarvis IA")
      setGenerating(false)
    }
  }

  // Cargar detalles e importes desglosados del presupuesto
  const handleViewDetails = async (id: string) => {
    setLoadingLineas(true)
    setActivePresId(id)

    try {
      // 1. Obtener cabecera
      const { data: presData } = await supabase
        .from("presupuestos_cabecera")
        .select(`
          *,
          clientes (
            nombre_comercial,
            razon_social
          )
        `)
        .eq("id", id)
        .single()
      
      setActivePres(presData)

      // 2. Obtener líneas
      const { data: lineas } = await supabase
        .from("presupuestos_lineas")
        .select("*")
        .eq("id_presupuesto", id)
        .order("orden", { ascending: true })

      setActivePresLineas(lineas || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingLineas(false)
    }
  }

  // Cambiar el estado comercial del presupuesto en tiempo real
  const handleUpdateStatus = async (nuevoEstado: string) => {
    if (!activePres) return
    try {
      const { error } = await supabase
        .from("presupuestos_cabecera")
        .update({ estado_presupuesto: nuevoEstado })
        .eq("id", activePres.id)

      if (error) throw error

      // Actualizar estados locales
      setActivePres(prev => prev ? { ...prev, estado_presupuesto: nuevoEstado } : null)
      setPresupuestos(prev => prev.map(p => p.id === activePres.id ? { ...p, estado_presupuesto: nuevoEstado } : p))
    } catch (err: any) {
      alert("Error al actualizar estado: " + err.message)
    }
  }

  // getStatusBadge reemplazado por componente compartido StatusBadge

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-[#fafafa] to-[#a1a1aa]">
          Presustand IA
        </h1>
        <p className="text-xs text-[#a1a1aa] mt-1">
          Crea propuestas comerciales automáticas estimando por m² o generando despieces con Inteligencia Artificial.
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-1 sm:gap-2 border-b border-[#27272a]/70 pb-px">
        <button
          onClick={() => { setActiveTab("rapida"); setActivePresId(null); }}
          className={`px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-semibold border-b-2 transition-all duration-200 ${
            activeTab === "rapida" 
              ? "border-indigo-500 text-indigo-400" 
              : "border-transparent text-[#71717a] hover:text-[#fafafa]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span>Estimación Rápida</span>
          </div>
        </button>
        <button
          onClick={() => { setActiveTab("ia"); setActivePresId(null); }}
          className={`px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-semibold border-b-2 transition-all duration-200 ${
            activeTab === "ia" 
              ? "border-indigo-500 text-indigo-400" 
              : "border-transparent text-[#71717a] hover:text-[#fafafa]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Constructor IA (Jarvis)</span>
          </div>
        </button>
        <button
          onClick={() => { setActiveTab("historial"); }}
          className={`px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-semibold border-b-2 transition-all duration-200 ${
            activeTab === "historial" 
              ? "border-indigo-500 text-indigo-400" 
              : "border-transparent text-[#71717a] hover:text-[#fafafa]"
          }`}
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>Historial Propuestas</span>
          </div>
        </button>
      </div>

      {/* Loading Jarvis overlay */}
      {generating && (
        <div className="fixed inset-0 z-50 bg-[#09090b]/80 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-wide">
            PROCESANDO PROPUESTA CON IA
          </h2>
          <div className="text-base font-semibold text-white mt-4 h-6 max-w-md transition-all duration-300 drop-shadow-md">
            {loadingMessages[loadingMsgIdx]}
          </div>
          <p className="text-xs font-medium text-zinc-300 mt-3 max-w-sm leading-relaxed uppercase tracking-wider drop-shadow-sm">
            No cierres esta pestaña. Jarvis está cruzando tarifas de catálogos y estimando despieces de materiales en tiempo real.
          </p>
        </div>
      )}

      {/* Content wrapper */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Form / List */}
        <div className={activePresId ? "lg:col-span-5 space-y-4" : "lg:col-span-12 space-y-4"}>
          
          {/* Rapida Tab */}
          {activeTab === "rapida" && (
            <Card className="border-[#27272a]/70 bg-[#09090b]/40">
              <CardHeader>
                <CardTitle className="text-base text-[#fafafa] flex items-center gap-2 flex-wrap">
                  <Calculator className="h-5 w-5 text-indigo-400 shrink-0" />
                  <span>Método 1: Estimación por Superficie (m²)</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#a1a1aa]">
                  Calcula un coste estimado instantáneo multiplicando m² por tarifas estándar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Form fields */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cliente" className="text-xs">Cliente *</Label>
                        <button
                          type="button"
                          onClick={() => setIsNewClientOpen(true)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Nuevo Cliente</span>
                        </button>
                      </div>
                      <select
                        id="cliente"
                        value={selectedCliente}
                        onChange={(e) => setSelectedCliente(e.target.value)}
                        className="w-full bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Selecciona un cliente</option>
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre_comercial}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="feria" className="text-xs">Feria / Evento *</Label>
                      <Input
                        id="feria"
                        placeholder="Ej: FITUR 2026"
                        value={nombreFeria}
                        onChange={(e) => setNombreFeria(e.target.value)}
                        className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="m2" className="text-xs">Superficie (m²) *</Label>
                      <Input
                        id="m2"
                        type="number"
                        placeholder="50"
                        value={m2}
                        onChange={(e) => setM2(e.target.value)}
                        className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="altura" className="text-xs">Altura Stand (m)</Label>
                      <Input
                        id="altura"
                        type="number"
                        step="0.1"
                        placeholder="2.50"
                        value={altura}
                        onChange={(e) => setAltura(e.target.value)}
                        className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipo" className="text-xs">Tipo Stand</Label>
                      <select
                        id="tipo"
                        value={tipoStand}
                        onChange={(e) => setTipoStand(e.target.value)}
                        className="w-full bg-[#09090b] border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3"
                      >
                        <option value="modular">Modular</option>
                        <option value="carpinteria_diseno">Carpintería de Diseño</option>
                        <option value="hibrido">Híbrido (Estructura + Madera)</option>
                        <option value="retail_comercial">Retail / Comercial</option>
                        <option value="doble_planta">Doble Planta</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Estimate Result Block */}
                {Number(m2) > 0 && (
                  <div className="mt-6 border border-[#27272a] bg-[#18181b]/30 p-4 rounded-xl space-y-3">
                    <h3 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">Desglose Estimado (Venta)</h3>
                    <div className="space-y-2 text-xs text-[#e4e4e7]">
                      <div className="flex justify-between">
                        <span className="text-[#71717a]">Estructura y Acabados:</span>
                        <span className="font-medium">{estSubtotalConstruccion.toLocaleString("es-ES")} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#71717a]">Servicios del Recinto:</span>
                        <span className="font-medium">{estSubtotalServicios.toLocaleString("es-ES")} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#71717a]">Diseño y Renders 3D:</span>
                        <span className="font-medium">{estSubtotalDiseno.toLocaleString("es-ES")} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#71717a]">Logística, Montaje y Transporte:</span>
                        <span className="font-medium">{estSubtotalTransporte.toLocaleString("es-ES")} €</span>
                      </div>
                      <div className="border-t border-[#27272a]/60 pt-2 flex justify-between font-bold text-[#fafafa] text-sm">
                        <span>Total Estimado (c/ IVA 21%):</span>
                        <span className="text-indigo-400">{estTotal.toLocaleString("es-ES")} €</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end border-t border-[#27272a]/50 py-3 bg-[#09090b]/40">
                <Button
                  onClick={handleSaveEstimation}
                  disabled={savingEst || !m2}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-xs"
                >
                  {savingEst ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar en Borradores"
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* IA Tab */}
          {activeTab === "ia" && (
            <Card className="border-[#27272a]/70 bg-[#09090b]/40">
              <CardHeader>
                <CardTitle className="text-base text-[#fafafa] flex items-center gap-2 flex-wrap">
                  <Sparkles className="h-5 w-5 text-indigo-400 shrink-0" />
                  <span>Método 2: Inteligencia Artificial (Jarvis AI)</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#a1a1aa]">
                  Jarvis generará un presupuesto desglosado con partidas a partir de tu prompt de texto o imagen de referencia.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleGenerateIA}>
                <CardContent className="space-y-4">
                  {/* Common inputs */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ia-cliente" className="text-xs">Cliente *</Label>
                        <button
                          type="button"
                          onClick={() => setIsNewClientOpen(true)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Nuevo Cliente</span>
                        </button>
                      </div>
                      <select
                        id="ia-cliente"
                        value={selectedCliente}
                        onChange={(e) => setSelectedCliente(e.target.value)}
                        required
                        className="w-full bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Selecciona un cliente</option>
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre_comercial}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ia-feria" className="text-xs">Feria / Evento *</Label>
                      <Input
                        id="ia-feria"
                        placeholder="Ej: Mobile World Congress 2026"
                        value={nombreFeria}
                        onChange={(e) => setNombreFeria(e.target.value)}
                        required
                        className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
                      />
                    </div>
                  </div>

                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ia-m2" className="text-xs">Superficie (m²) *</Label>
                      <Input
                        id="ia-m2"
                        type="number"
                        placeholder="80"
                        value={m2}
                        onChange={(e) => setM2(e.target.value)}
                        required
                        className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ia-altura" className="text-xs">Altura Stand (m)</Label>
                      <Input
                        id="ia-altura"
                        type="number"
                        step="0.1"
                        placeholder="4.00"
                        value={altura}
                        onChange={(e) => setAltura(e.target.value)}
                        className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ia-tipo" className="text-xs">Tipo Stand</Label>
                      <select
                        id="ia-tipo"
                        value={tipoStand}
                        onChange={(e) => setTipoStand(e.target.value)}
                        className="w-full bg-[#09090b] border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3"
                      >
                        <option value="modular">Modular</option>
                        <option value="carpinteria_diseno">Carpintería de Diseño</option>
                        <option value="hibrido">Híbrido (Estructura + Madera)</option>
                        <option value="retail_comercial">Retail / Comercial</option>
                        <option value="doble_planta">Doble Planta</option>
                      </select>
                    </div>
                    </div>

                  <AudioRecorder
                    value={audioUrl}
                    onUpload={setAudioUrl}
                    disabled={generating}
                  />

                  <ImageUploader
                    value={imageUrl}
                    onUpload={setImageUrl}
                    disabled={generating}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="promptText" className="text-xs">Prompt de diseño IA (materiales, zonas o extras) {!audioUrl && !imageUrl ? '*' : ''}</Label>
                    <textarea
                      id="promptText"
                      placeholder={audioUrl || imageUrl ? "Opcional: añade detalles adicionales al audio o imagen..." : "Ej: Diseña un stand tecnológico con moqueta de velour negra, panelado retroiluminado..."}
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      required={!audioUrl && !imageUrl}
                      rows={4}
                      className="w-full bg-[#09090b] border-[#27272a] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs text-[#fafafa] p-3 rounded-md"
                    />
                  </div>

                  {generationError && (
                    <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2 items-center">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{generationError}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between items-center border-t border-[#27272a]/50 py-3 bg-[#09090b]/40">
                  {generating ? (
                    <div className="flex-1 mr-4">
                      <div className="flex items-center justify-between text-xs text-indigo-400 mb-1.5">
                        <span className="font-medium animate-pulse">{loadingMessages[loadingMsgIdx]}</span>
                        <span>{Math.round(((loadingMsgIdx + 1) / loadingMessages.length) * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#27272a] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out"
                          style={{ width: `${((loadingMsgIdx + 1) / loadingMessages.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <Button
                    type="submit"
                    disabled={generating}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-xs shadow-lg shadow-indigo-500/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    <span>{generating ? "Procesando..." : "Generar con Jarvis IA"}</span>
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Historial Tab */}
          {activeTab === "historial" && (
            <Card className="border-[#27272a]/70 bg-[#09090b]/40">
              <CardHeader>
                <CardTitle className="text-base text-[#fafafa] flex items-center gap-2">
                  <History className="h-5 w-5 text-indigo-400" />
                  <span>Historial de Presupuestos</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#a1a1aa]">
                  Selecciona una propuesta para consultar su despiece de partidas e importes.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[#27272a]/40 max-h-[500px] overflow-y-auto">
                  {presupuestos.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#71717a]">
                      No hay presupuestos generados todavía.
                    </div>
                  ) : (
                    presupuestos.map((item) => {
                      const isActive = activePresId === item.id
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleViewDetails(item.id)}
                          className={`p-4 flex items-center justify-between gap-2 cursor-pointer hover:bg-[#18181b]/30 transition-colors ${
                            isActive ? "bg-indigo-500/5 border-l-4 border-l-indigo-500" : ""
                          }`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-indigo-400 shrink-0">{item.numero_presupuesto}</span>
                              <StatusBadge estado={item.estado_presupuesto} />
                            </div>
                            <div className="text-xs font-semibold text-[#fafafa] truncate w-full">
                              {item.clientes?.nombre_comercial || "Cliente"} - {item.nombre_feria}
                            </div>
                            <div className="text-[10px] text-[#71717a] truncate">
                              {item.m2_superficie} m² | {item.tipo_stand.replace("_", " ")}
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2 sm:gap-3 shrink-0">
                            <div className="space-y-1">
                              <div className="font-bold text-xs text-[#fafafa]">
                                {item.total_presupuesto.toLocaleString("es-ES")} €
                              </div>
                              <div className="text-[9px] text-[#71717a]">
                                {new Date(item.created_at).toLocaleDateString("es-ES")}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[#71717a] hidden sm:block" />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Details Panel */}
        {activePresId && (
          <div className="lg:col-span-7 space-y-4">
            {loadingLineas ? (
              <Card className="border-[#27272a]/70 bg-[#09090b]/40 h-80 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              </Card>
            ) : activePres ? (
              <Card className="border-[#27272a]/70 bg-[#09090b]/40">
                <CardHeader className="border-b border-[#27272a]/50 pb-4 p-6 lg:p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-indigo-400">{activePres.numero_presupuesto}</span>
                        <StatusBadge estado={activePres.estado_presupuesto} />
                      </div>
                      <CardTitle className="text-base text-[#fafafa] mt-1">
                        {activePres.clientes?.nombre_comercial} - {activePres.nombre_feria}
                      </CardTitle>
                      <CardDescription className="text-xs text-[#a1a1aa] mt-0.5">
                        Razón Social: {activePres.clientes?.razon_social}
                      </CardDescription>
                    </div>
                    
                    {/* State Selector */}
                    <div className="space-y-1">
                      <Label className="text-[9px] font-semibold text-[#a1a1aa] uppercase tracking-wider">Estado Comercial</Label>
                      <select
                        value={activePres.estado_presupuesto}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        className="bg-[#09090b] border-[#27272a] text-[11px] font-semibold text-[#fafafa] rounded-md h-8 px-2 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="borrador">Borrador</option>
                        <option value="en_espera">En Espera</option>
                        <option value="presentado">Presentado</option>
                        <option value="en_negociacion">En Negociación</option>
                        <option value="aceptado">Aceptado</option>
                        <option value="rechazado">Rechazado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 p-6 lg:p-8">
                  
                  {/* Stand Physical specs */}
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-[#18181b]/40 border border-[#27272a]/30">
                      <div className="text-[#71717a] text-[9px] font-bold uppercase">Superficie</div>
                      <div className="font-extrabold text-sm text-[#fafafa] mt-0.5">{activePres.m2_superficie} m²</div>
                    </div>
                    <div className="p-2 rounded bg-[#18181b]/40 border border-[#27272a]/30">
                      <div className="text-[#71717a] text-[9px] font-bold uppercase">Altura</div>
                      <div className="font-extrabold text-sm text-[#fafafa] mt-0.5">{activePres.altura_stand_m} m</div>
                    </div>
                    <div className="p-2 rounded bg-[#18181b]/40 border border-[#27272a]/30 col-span-2">
                      <div className="text-[#71717a] text-[9px] font-bold uppercase">Tipo Stand</div>
                      <div className="font-extrabold text-sm text-[#fafafa] mt-0.5 capitalize truncate">{activePres.tipo_stand.replace("_", " ")}</div>
                    </div>
                  </div>

                  {/* AI Generated image if present */}
                  {activePres.imagen_stand_url && (
                    <div className="rounded-xl overflow-hidden border border-[#27272a] aspect-video relative group">
                      <img 
                        src={activePres.imagen_stand_url} 
                        alt="Stand Generado por IA" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                        <div className="text-[10px] text-[#fafafa] font-medium italic">
                          &quot;Diseño renderizado por Jarvis AI en base al prompt comercial&quot;
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Partitioned Lines despiece */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">Desglose de Partidas (Presupuesto)</h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#27272a]/70 text-[#a1a1aa] font-medium">
                            <th className="py-2 px-1 w-8 text-center">Nº</th>
                            <th className="py-2 px-2">Concepto / Partida</th>
                            <th className="py-2 px-2 text-right w-16">Cant.</th>
                            <th className="py-2 px-2 text-right w-16">Unitario</th>
                            <th className="py-2 px-2 text-right w-20">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#27272a]/40">
                          {activePresLineas.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-[#71717a]">
                                Este presupuesto no tiene despiece de partidas asignado.
                              </td>
                            </tr>
                          ) : (
                            activePresLineas.map((linea) => (
                              <tr key={linea.id} className="hover:bg-[#18181b]/30">
                                <td className="py-2.5 px-1 text-center font-bold text-[#71717a]">
                                  {linea.orden}
                                </td>
                                <td className="py-2.5 px-2 font-medium text-[#e4e4e7]">
                                  {linea.concepto_descripcion}
                                </td>
                                <td className="py-2.5 px-2 text-right text-[#a1a1aa] whitespace-nowrap">
                                  {Number(linea.cantidad).toLocaleString()} <span className="text-[9px] uppercase font-bold">{linea.unidad}</span>
                                </td>
                                <td className="py-2.5 px-2 text-right text-[#a1a1aa]">
                                  {Number(linea.precio_unitario_venta).toLocaleString("es-ES")} €
                                </td>
                                <td className="py-2.5 px-2 text-right font-semibold text-[#fafafa]">
                                  {Number(linea.total_linea).toLocaleString("es-ES")} €
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="border-t border-[#27272a]/60 pt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#71717a]">Subtotal Construcción y Remates:</span>
                      <span className="text-[#e4e4e7]">{Number(activePres.subtotal_construccion).toLocaleString("es-ES")} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#71717a]">Subtotal Servicios Recinto Ferial:</span>
                      <span className="text-[#e4e4e7]">{Number(activePres.subtotal_servicios_feria).toLocaleString("es-ES")} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#71717a]">Subtotal Diseño, Renders e Impresiones:</span>
                      <span className="text-[#e4e4e7]">{Number(activePres.subtotal_diseno_grafica).toLocaleString("es-ES")} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#71717a]">Subtotal Montaje, Logística y Transporte:</span>
                      <span className="text-[#e4e4e7]">{Number(activePres.subtotal_transporte_mo).toLocaleString("es-ES")} €</span>
                    </div>
                    
                    <div className="border-t border-[#27272a] pt-3 flex justify-between items-end">
                      <div>
                        <div className="text-[10px] text-[#71717a] uppercase font-bold">Base Imponible</div>
                        <div className="font-semibold text-sm text-[#e4e4e7]">{Number(activePres.base_imponible).toLocaleString("es-ES")} €</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-[#71717a] uppercase font-bold">IVA (21%)</div>
                        <div className="font-semibold text-sm text-[#e4e4e7]">{Number(activePres.importe_iva).toLocaleString("es-ES")} €</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-indigo-400 uppercase font-bold">Importe Venta Total</div>
                        <div className="font-extrabold text-lg text-indigo-400">{Number(activePres.total_presupuesto).toLocaleString("es-ES")} €</div>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </div>

      {/* Dialog para crear nuevo cliente */}
      <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
        <DialogContent className="bg-[#09090b] border border-[#27272a] text-[#fafafa] sm:max-w-md w-full p-6 rounded-xl shadow-2xl">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-lg font-bold text-[#fafafa] flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-400" />
              <span>Nuevo Cliente CRM</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#a1a1aa]">
              Completa los datos del cliente. Se asociará automáticamente a tu empresa y se seleccionará al guardar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNewClient} className="space-y-4 py-2">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="new-nombre" className="text-xs text-[#a1a1aa]">Nombre Comercial *</Label>
                <Input
                  id="new-nombre"
                  placeholder="Ej: Stands Innovadores S.L."
                  value={newClientNombreComercial}
                  onChange={(e) => setNewClientNombreComercial(e.target.value)}
                  required
                  className="bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="new-razon" className="text-xs text-[#a1a1aa]">Razón Social *</Label>
                  <Input
                    id="new-razon"
                    placeholder="Ej: Stands Innovadores S.L."
                    value={newClientRazonSocial}
                    onChange={(e) => setNewClientRazonSocial(e.target.value)}
                    required
                    className="bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-cif" className="text-xs text-[#a1a1aa]">CIF / NIF *</Label>
                  <Input
                    id="new-cif"
                    placeholder="Ej: B12345678"
                    value={newClientCifNif}
                    onChange={(e) => setNewClientCifNif(e.target.value)}
                    required
                    className="bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="new-email" className="text-xs text-[#a1a1aa]">Email de Contacto</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-telefono" className="text-xs text-[#a1a1aa]">Teléfono</Label>
                  <Input
                    id="new-telefono"
                    placeholder="+34 600 000 000"
                    value={newClientTelefono}
                    onChange={(e) => setNewClientTelefono(e.target.value)}
                    className="bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {newClientError && (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2 items-center">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{newClientError}</span>
              </div>
            )}

            <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-[#27272a]/50">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsNewClientOpen(false)}
                disabled={newClientSaving}
                className="text-xs text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={newClientSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 h-9"
              >
                {newClientSaving ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Crear Cliente"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
