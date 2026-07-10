"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import {
  Building2,
  Cog,
  Truck,
  Users,
  Wrench,
  Monitor,
  Shield,
  TrendingUp,
  Plus,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type CategoriaGasto =
  | "infraestructura"
  | "maquinaria"
  | "logistica"
  | "personal"
  | "herramientas"
  | "tecnologia"
  | "salud_seguridad"
  | "marketing"

interface GastoEstructura {
  id: string
  id_empresa: string
  categoria: CategoriaGasto
  concepto: string
  importe_mes: number
  importe_anual: number
  activo: boolean
  orden: number
}

interface GastosConfig {
  id: string
  id_empresa: string
  personal_ejecutor: number
  horas_anuales: number
}

// ─────────────────────────────────────────────
// Config de categorías
// ─────────────────────────────────────────────
const CATEGORIAS: Record<CategoriaGasto, { label: string; Icon: React.ElementType; color: string }> = {
  infraestructura: { label: "Infraestructura y Suministros", Icon: Building2,   color: "text-blue-500" },
  maquinaria:      { label: "Amortizaciones Maquinaria",     Icon: Cog,         color: "text-orange-500" },
  logistica:       { label: "Logística y Vehículos",         Icon: Truck,       color: "text-emerald-500" },
  personal:        { label: "Personal y Estructura",         Icon: Users,       color: "text-violet-500" },
  herramientas:    { label: "Herramientas y Consumibles",    Icon: Wrench,      color: "text-amber-500" },
  tecnologia:      { label: "Tecnología y Software",         Icon: Monitor,     color: "text-cyan-500" },
  salud_seguridad: { label: "Salud y Seguridad",             Icon: Shield,      color: "text-rose-500" },
  marketing:       { label: "Marketing y Ventas",            Icon: TrendingUp,  color: "text-indigo-500" },
}

const ORDEN_CATEGORIAS = Object.keys(CATEGORIAS) as CategoriaGasto[]

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

// ─────────────────────────────────────────────
// Subcomponente: TarjetaCategoria
// ─────────────────────────────────────────────
interface TarjetaProps {
  categoria: CategoriaGasto
  gastos: GastoEstructura[]
  onUpdate: (id: string, nuevoImporte: number) => Promise<void>
  onAdd: (categoria: CategoriaGasto, nombre: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function TarjetaCategoria({ categoria, gastos, onUpdate, onAdd, onDelete }: TarjetaProps) {
  const { label, Icon, color } = CATEGORIAS[categoria]
  const [collapsed, setCollapsed] = useState(false)
  const [addingNew, setAddingNew] = useState(false)
  const [newName, setNewName] = useState("")
  const [saving, setSaving] = useState<string | null>(null)

  const totalMes = gastos.reduce((s, g) => s + (g.importe_mes || 0), 0)
  const totalAnual = totalMes * 12

  const handleBlur = async (id: string, val: string) => {
    const num = parseFloat(val) || 0
    setSaving(id)
    await onUpdate(id, num)
    setSaving(null)
  }

  const handleAddConfirm = async () => {
    if (!newName.trim()) return
    const nombre = newName.trim()
    setAddingNew(false)
    setNewName("")
    await onAdd(categoria, nombre)
  }

  return (
    <div className="bg-card border border-border/60 rounded-xl flex flex-col shadow-sm hover:shadow-md hover:border-border transition-all duration-200">
      {/* Header de la card */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={`h-4 w-4 shrink-0 ${color}`} />
          <span className="text-[11px] font-bold uppercase tracking-wide text-foreground truncate">{label}</span>
        </div>
        {collapsed
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        }
      </div>

      {!collapsed && (
        <>
          {/* Cabecera columnas */}
          <div className="flex items-center gap-1 px-4 pb-1">
            <span className="flex-1" />
            <span className="w-[60px] text-right text-[10px] font-semibold text-indigo-400 uppercase">mes</span>
            <span className="w-[70px] text-right text-[10px] font-semibold text-violet-400 uppercase">año</span>
            <span className="w-5" />
          </div>

          {/* Lista de conceptos */}
          <div className="flex flex-col gap-0.5 px-3 pb-2">
            {gastos.map((g) => (
              <div key={g.id} className="flex items-center gap-1 group py-0.5 rounded hover:bg-secondary/30 px-1 transition-colors">
                <span className="flex-1 text-[11px] text-foreground truncate pr-1">{g.concepto}</span>
                {/* Input mes */}
                <input
                  type="number"
                  min={0}
                  defaultValue={g.importe_mes}
                  onBlur={(e) => handleBlur(g.id, e.target.value)}
                  className="w-[60px] text-right text-[11px] border border-border/60 rounded px-1.5 py-0.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
                {/* Año (calculado) */}
                <span className="w-[70px] text-right text-[11px] text-muted-foreground">
                  {saving === g.id
                    ? <Loader2 className="h-3 w-3 animate-spin inline-block" />
                    : fmt(g.importe_mes * 12)
                  }
                </span>
                {/* Botón eliminar */}
                <button
                  onClick={() => onDelete(g.id)}
                  className="w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/70 flex items-center justify-center"
                  title="Eliminar concepto"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {/* Fila de nuevo concepto */}
            {addingNew && (
              <div className="flex items-center gap-1 px-1 mt-1">
                <input
                  autoFocus
                  type="text"
                  placeholder="Nombre del concepto..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddConfirm()
                    if (e.key === "Escape") { setAddingNew(false); setNewName("") }
                  }}
                  className="flex-1 text-[11px] border border-indigo-500/40 rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleAddConfirm}
                  className="text-[10px] px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  OK
                </button>
                <button
                  onClick={() => { setAddingNew(false); setNewName("") }}
                  className="text-[10px] px-2 py-1 bg-secondary text-muted-foreground rounded hover:bg-secondary/80 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Botón añadir */}
          <button
            onClick={() => setAddingNew(true)}
            className="flex items-center gap-1.5 mx-4 mb-3 text-[10px] text-muted-foreground hover:text-indigo-400 transition-colors border border-dashed border-border/50 hover:border-indigo-500/40 rounded-lg py-1.5 px-2 justify-center"
          >
            <Plus className="h-3 w-3" />
            <span>Añadir concepto adicional</span>
          </button>
        </>
      )}

      {/* Footer TOTAL */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 bg-secondary/20 rounded-b-xl mt-auto">
        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Total</span>
        <div className="flex gap-3 items-center">
          <span className="text-[11px] font-semibold text-indigo-400 w-[60px] text-right">{fmt(totalMes)}</span>
          <span className="text-[11px] font-semibold text-violet-400 w-[70px] text-right">{fmt(totalAnual)}</span>
          <span className="w-5" />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────
export default function ConfigurarEmpresaPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [gastos, setGastos] = useState<GastoEstructura[]>([])
  const [config, setConfig] = useState<GastosConfig | null>(null)
  const [configPersonal, setConfigPersonal] = useState(1)
  const [savingConfig, setSavingConfig] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Carga inicial ──────────────────────────
  useEffect(() => {
    async function cargar() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: dbUser } = await supabase
          .from("usuarios")
          .select("id_empresa")
          .eq("id", user.id)
          .single()
        if (!dbUser) return

        const empId = dbUser.id_empresa
        setEmpresaId(empId)

        const [gastosRes, configRes] = await Promise.all([
          supabase
            .from("gastos_estructura_empresa")
            .select("*")
            .eq("id_empresa", empId)
            .eq("activo", true)
            .order("categoria")
            .order("orden"),
          supabase
            .from("gastos_estructura_config")
            .select("*")
            .eq("id_empresa", empId)
            .single(),
        ])

        setGastos((gastosRes.data as GastoEstructura[]) ?? [])

        if (configRes.data) {
          setConfig(configRes.data as GastosConfig)
          setConfigPersonal(configRes.data.personal_ejecutor)
        } else {
          // Crear config por defecto si no existe
          const { data: newConfig } = await supabase
            .from("gastos_estructura_config")
            .insert({ id_empresa: empId, personal_ejecutor: 1, horas_anuales: 1800 })
            .select()
            .single()
          if (newConfig) {
            setConfig(newConfig as GastosConfig)
            setConfigPersonal(1)
          }
        }
      } catch (err: any) {
        console.error(err)
        setError("Error al cargar los datos. Por favor recarga la página.")
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  // ── KPIs calculados ────────────────────────
  const totalMes = gastos.reduce((s, g) => s + (g.importe_mes || 0), 0)
  const totalAnual = totalMes * 12
  const horasAnuales = config?.horas_anuales ?? 1800
  const mediaPonderable = configPersonal > 0 ? totalAnual / (configPersonal * horasAnuales) : 0

  // ── Operaciones CRUD ────────────────────────
  const actualizarGasto = useCallback(async (id: string, nuevoImporte: number) => {
    await supabase
      .from("gastos_estructura_empresa")
      .update({ importe_mes: nuevoImporte })
      .eq("id", id)
    setGastos((prev) =>
      prev.map((g) => (g.id === id ? { ...g, importe_mes: nuevoImporte, importe_anual: nuevoImporte * 12 } : g))
    )
  }, [])

  const añadirConcepto = useCallback(async (categoria: CategoriaGasto, nombre: string) => {
    if (!empresaId || !nombre.trim()) return

    const maxOrden = gastos
      .filter((g) => g.categoria === categoria)
      .reduce((max, g) => Math.max(max, g.orden), 0)

    const { data } = await supabase
      .from("gastos_estructura_empresa")
      .insert({
        id_empresa: empresaId,
        categoria,
        concepto: nombre.trim(),
        importe_mes: 0,
        orden: maxOrden + 1,
      })
      .select()
      .single()

    if (data) setGastos((prev) => [...prev, data as GastoEstructura])
  }, [empresaId, gastos])

  const eliminarConcepto = useCallback(async (id: string) => {
    await supabase
      .from("gastos_estructura_empresa")
      .update({ activo: false })
      .eq("id", id)
    setGastos((prev) => prev.filter((g) => g.id !== id))
  }, [])

  const guardarPersonal = async (valor: number) => {
    if (!config) return
    setSavingConfig(true)
    await supabase
      .from("gastos_estructura_config")
      .update({ personal_ejecutor: valor })
      .eq("id", config.id)
    setConfig((prev) => prev ? { ...prev, personal_ejecutor: valor } : prev)
    setSavingConfig(false)
  }

  // ── Loading / Error states ──────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cargando estructura de costes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertTriangle className="h-8 w-8 text-rose-500" />
        <p className="text-sm text-rose-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
            Configurar Empresa
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Establece los valores de gastos estructurales anuales de la organización
          </p>
        </div>

        {/* KPI Panel */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 p-3 sm:p-4 rounded-xl bg-card border border-border/60 shadow-sm shrink-0">
          {/* Total Gastos */}
          <div className="text-center sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Gastos</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] text-indigo-400 font-semibold">mes</p>
                <p className="text-sm font-bold text-foreground">{fmt(totalMes)}</p>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div>
                <p className="text-[10px] text-violet-400 font-semibold">año</p>
                <p className="text-sm font-bold text-foreground">{fmt(totalAnual)}</p>
              </div>
            </div>
          </div>

          <div className="w-px h-12 bg-border/50 hidden sm:block" />

          {/* Personal Ejecutor */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Personal Ejecutor</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={99}
                value={configPersonal}
                onChange={(e) => setConfigPersonal(Math.max(1, parseInt(e.target.value) || 1))}
                onBlur={() => guardarPersonal(configPersonal)}
                className="w-14 text-center text-sm font-bold border border-border/60 rounded-lg px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
              />
              {savingConfig && <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />}
              <span className="text-xs text-muted-foreground">personas</span>
            </div>
          </div>

          <div className="w-px h-12 bg-border/50 hidden sm:block" />

          {/* Media Ponderable */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Media Ponderable</p>
            <p className="text-sm font-bold text-foreground">
              {mediaPonderable.toFixed(2)}{" "}
              <span className="text-xs font-normal text-muted-foreground">€/hora</span>
            </p>
            <p className="text-[9px] text-muted-foreground">base {horasAnuales}h/año·persona</p>
          </div>
        </div>
      </div>

      {/* ── Grid 4×2 de tarjetas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {ORDEN_CATEGORIAS.map((cat) => (
          <TarjetaCategoria
            key={cat}
            categoria={cat}
            gastos={gastos.filter((g) => g.categoria === cat)}
            onUpdate={actualizarGasto}
            onAdd={añadirConcepto}
            onDelete={eliminarConcepto}
          />
        ))}
      </div>

      {/* ── Nota informativa ── */}
      <div className="text-[10px] text-muted-foreground/60 text-center pb-4">
        Los cambios se guardan automáticamente al salir de cada campo. La Media Ponderable ({mediaPonderable.toFixed(2)} €/hora) puede usarse en Jarvis como coste de mano de obra interna.
      </div>
    </div>
  )
}
