import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import OverviewChart from "@/components/dashboard/overview-chart"
import { 
  Sparkles, 
  FileText, 
  TrendingUp, 
  Layers,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = createClient()

  // Obtener los presupuestos con información del cliente
  const { data: presupuestos, error } = await supabase
    .from("presupuestos_cabecera")
    .select(`
      id,
      numero_presupuesto,
      nombre_feria,
      m2_superficie,
      total_presupuesto,
      estado_presupuesto,
      created_at,
      clientes (
        nombre_comercial
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error al cargar presupuestos en dashboard:", error)
  }

  const items = presupuestos || []

  // Obtener hitos próximos a vencer (o vencidos sin completar)
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + 7)
  const targetDateStr = targetDate.toISOString().split('T')[0]

  const { data: hitosData, error: hitosError } = await supabase
    .from("proyectos_hitos")
    .select(`
      id,
      id_proyecto,
      tipo_hito,
      fecha_programada,
      estado_hito,
      notas,
      proyectos_operaciones (
        id,
        codigo_proyecto_interno,
        presupuestos_cabecera (
          nombre_feria,
          clientes (
            nombre_comercial
          )
        )
      )
    `)
    .in("estado_hito", ["pendiente", "en_progreso", "retrasado"])
    .lte("fecha_programada", targetDateStr)
    .order("fecha_programada", { ascending: true })

  if (hitosError) {
    console.error("Error al cargar hitos en el dashboard:", hitosError)
  }

  const hitosAlertas = (hitosData || []) as any[]

  // Calcular KPIs
  const totalPresupuestos = items.length
  const totalFacturado = items
    .filter(p => p.estado_presupuesto === "aceptado")
    .reduce((sum, p) => sum + Number(p.total_presupuesto), 0)

  const totalPendientes = items
    .filter(p => ["presentado", "en_espera", "en_negociacion"].includes(p.estado_presupuesto))
    .reduce((sum, p) => sum + Number(p.total_presupuesto), 0)

  const m2Medio = totalPresupuestos > 0 
    ? (items.reduce((sum, p) => sum + Number(p.m2_superficie), 0) / totalPresupuestos).toFixed(1)
    : "0"

  // Helper para pintar badges de estado

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-[#fafafa] to-[#a1a1aa]">
            Resumen Operativo
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Métricas clave y estado de las propuestas feriales activas.
          </p>
        </div>
        <Link href="/dashboard/presustand">
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-xs rounded-lg transition-all duration-200 shadow-md shadow-indigo-500/10">
            <Sparkles className="h-4 w-4" />
            <span>Presupuestar con IA</span>
          </button>
        </Link>
        <Link href="/dashboard/gerencial">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] font-medium text-xs rounded-lg transition-all duration-200 border border-[#27272a]/70">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </button>
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
        {/* KPI 1 */}
        <Card className="border-[#27272a]/70 bg-[#09090b]/40 hover:border-indigo-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              Aceptado (Facturado)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#fafafa]">
              {totalFacturado.toLocaleString("es-ES")} €
            </div>
            <p className="text-[10px] text-[#71717a] mt-1">
              Presupuestos ganados y aprobados
            </p>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="border-[#27272a]/70 bg-[#09090b]/40 hover:border-indigo-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              En Negociación / Presentados
            </CardTitle>
            <Clock className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#fafafa]">
              {totalPendientes.toLocaleString("es-ES")} €
            </div>
            <p className="text-[10px] text-[#71717a] mt-1">
              Cartera activa en seguimiento
            </p>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="border-[#27272a]/70 bg-[#09090b]/40 hover:border-indigo-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              Propuestas Generadas
            </CardTitle>
            <FileText className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#fafafa]">{totalPresupuestos}</div>
            <p className="text-[10px] text-[#71717a] mt-1">
              Total de presupuestos registrados
            </p>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="border-[#27272a]/70 bg-[#09090b]/40 hover:border-indigo-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              Superficie Media Stand
            </CardTitle>
            <Layers className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#fafafa]">{m2Medio} m²</div>
            <p className="text-[10px] text-[#71717a] mt-1">
              Superficie promedio solicitada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid Chart + Side Panel */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-7 w-full max-w-full overflow-hidden">
        {/* Main Chart */}
        <Card className="md:col-span-4 border-[#27272a]/70 bg-[#09090b]/40 w-full min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#fafafa]">
              Evolución Mensual (2026)
            </CardTitle>
            <CardDescription className="text-xs text-[#a1a1aa]">
              Comparativa entre facturación aprobada y volumen de presupuestos presentados.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <OverviewChart presupuestos={items} />
          </CardContent>
        </Card>

        {/* Action Panel / Alertas */}
        <Card className="md:col-span-3 border-[#27272a]/70 bg-[#09090b]/40 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#fafafa]">
              Panel de Control Rápido
            </CardTitle>
            <CardDescription className="text-xs text-[#a1a1aa]">
              Acciones de IA y alertas de presupuestos pendientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {/* AI Prompts Widget */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Jarvis IA Stand Constructor</span>
              </div>
              <p className="text-xs text-[#e4e4e7] leading-relaxed">
                &quot;Diseña un stand de 80m² para Iberia en FITUR con estilo rústico y sostenible usando madera reciclada.&quot;
              </p>
              <div className="mt-3 flex justify-end">
                <Link href="/dashboard/presustand">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer">
                    Ir a generar <ArrowUpRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Hitos Críticos y Alertas */}
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">
                Hitos Críticos (Próximos 7 días)
              </div>
              {hitosAlertas.length === 0 ? (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#18181b]/30 border border-[#27272a]/20 text-xs text-[#a1a1aa]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No hay hitos críticos programados para esta semana.</span>
                </div>
              ) : (
                hitosAlertas.slice(0, 3).map((hito) => {
                  const diasRestantes = Math.ceil(
                    (new Date(hito.fecha_programada).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  )
                  const isOverdue = diasRestantes < 0
                  const isToday = diasRestantes === 0

                  let colorText = "text-amber-400"
                  let colorBg = "bg-amber-500/10 border-amber-500/20"
                  let labelTime = `Quedan ${diasRestantes} días`
                  
                  if (isOverdue) {
                    colorText = "text-red-400"
                    colorBg = "bg-red-500/10 border-red-500/20"
                    labelTime = `Retrasado (${Math.abs(diasRestantes)}d)`
                  } else if (isToday) {
                    colorText = "text-orange-400"
                    colorBg = "bg-orange-500/10 border-orange-500/20"
                    labelTime = "Hoy"
                  } else if (diasRestantes === 1) {
                    labelTime = "Mañana"
                  }

                  const proyecto = hito.proyectos_operaciones
                  const client = proyecto?.presupuestos_cabecera?.clientes
                  const feria = proyecto?.presupuestos_cabecera?.nombre_feria

                  return (
                    <Link href={`/dashboard/proyectos/${hito.id_proyecto}`} key={hito.id}>
                      <div className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-all hover:bg-[#18181b]/80 text-xs cursor-pointer ${colorBg}`}>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-[#fafafa] flex items-center gap-1.5 flex-wrap">
                            <span className="capitalize">{hito.tipo_hito.replace(/_/g, " ")}</span>
                            <span className="text-[10px] text-indigo-400 font-mono">({proyecto?.codigo_proyecto_interno})</span>
                          </div>
                          <div className="text-[#a1a1aa] text-[10px] mt-0.5 truncate">
                            {client?.nombre_comercial} — {feria || "Feria"}
                          </div>
                        </div>
                        <div className={`text-[10px] font-bold shrink-0 ${colorText} text-right`}>
                          {labelTime}
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
              {hitosAlertas.length > 3 && (
                <div className="text-right">
                  <Link href="/dashboard/proyectos" className="text-[10px] text-indigo-400 hover:underline">
                    Ver {hitosAlertas.length - 3} alertas más en Kanban →
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Budgets Table */}
      <Card className="border-[#27272a]/70 bg-[#09090b]/40">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-[#fafafa]">
              Presupuestos Recientes
            </CardTitle>
            <CardDescription className="text-xs text-[#a1a1aa]">
              Lista de propuestas enviadas o generadas recientemente.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272a]/70 text-[#a1a1aa] font-medium">
                  <th className="py-3 px-2">Referencia</th>
                  <th className="py-3 px-2">Cliente</th>
                  <th className="py-3 px-2">Feria / Evento</th>
                  <th className="py-3 px-2 text-right">Superficie</th>
                  <th className="py-3 px-2 text-right">Total Presupuesto</th>
                  <th className="py-3 px-2 text-center">Estado</th>
                  <th className="py-3 px-2 text-right">Fecha Emisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/40">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[#71717a]">
                      No hay presupuestos generados en la base de datos.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#18181b]/30 transition-colors">
                      <td className="py-3.5 px-2 font-bold text-indigo-400">
                        {item.numero_presupuesto}
                      </td>
                      <td className="py-3.5 px-2 font-medium text-[#fafafa]">
                        {item.clientes?.nombre_comercial || "Cliente Desconocido"}
                      </td>
                      <td className="py-3.5 px-2 text-[#e4e4e7]">
                        {item.nombre_feria}
                      </td>
                      <td className="py-3.5 px-2 text-right font-medium text-[#e4e4e7]">
                        {Number(item.m2_superficie).toFixed(0)} m²
                      </td>
                      <td className="py-3.5 px-2 text-right font-bold text-[#fafafa]">
                        {Number(item.total_presupuesto).toLocaleString("es-ES")} €
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <StatusBadge estado={item.estado_presupuesto} />
                      </td>
                      <td className="py-3.5 px-2 text-right text-[#a1a1aa]">
                        {new Date(item.created_at).toLocaleDateString("es-ES")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
