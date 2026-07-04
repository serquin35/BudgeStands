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

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Resumen Operativo
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Métricas clave y estado de las propuestas feriales activas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/presustand">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-lg transition-all duration-200 shadow-sm hover:opacity-90">
              <Sparkles className="h-4 w-4" />
              <span>Presupuestar con IA</span>
            </button>
          </Link>
          <Link href="/dashboard/gerencial">
            <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold text-xs rounded-lg transition-all duration-200 border border-border">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
        {/* KPI 1 */}
        <Card className="card-elevated border-border bg-card hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Aceptado (Facturado)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalFacturado.toLocaleString("es-ES")} €
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Presupuestos ganados y aprobados
            </p>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="card-elevated border-border bg-card hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              En Negociación / Presentados
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalPendientes.toLocaleString("es-ES")} €
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Cartera activa en seguimiento
            </p>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="card-elevated border-border bg-card hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Propuestas Generadas
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalPresupuestos}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Total de presupuestos registrados
            </p>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="card-elevated border-border bg-card hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Superficie Media Stand
            </CardTitle>
            <Layers className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{m2Medio} m²</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Superficie promedio solicitada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid Chart + Side Panel */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-7 w-full max-w-full overflow-hidden">
        {/* Main Chart */}
        <Card className="md:col-span-4 card-elevated border-border bg-card w-full min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">
              Evolución Mensual (2026)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Comparativa entre facturación aprobada y volumen de presupuestos presentados.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <OverviewChart presupuestos={items} />
          </CardContent>
        </Card>

        {/* Action Panel / Alertas */}
        <Card className="md:col-span-3 card-elevated border-border bg-card flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">
              Panel de Control Rápido
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Acciones de IA y alertas de presupuestos pendientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {/* AI Prompts Widget */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/15">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wide">Jarvis IA Stand Constructor</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                &quot;Diseña un stand de 80m² para Iberia en FITUR con estilo rústico y sostenible usando madera reciclada.&quot;
              </p>
              <div className="mt-3 flex justify-end">
                <Link href="/dashboard/presustand">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:opacity-85 cursor-pointer">
                    Ir a generar <ArrowUpRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Hitos Críticos y Alertas */}
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-bold text-foreground uppercase tracking-wider">
                Hitos Críticos (Próximos 7 días)
              </div>
              {hitosAlertas.length === 0 ? (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary/20 border border-border/20 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>No hay hitos críticos programados para esta semana.</span>
                </div>
              ) : (
                hitosAlertas.slice(0, 3).map((hito) => {
                  const diasRestantes = Math.ceil(
                    (new Date(hito.fecha_programada).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  )
                  const isOverdue = diasRestantes < 0
                  const isToday = diasRestantes === 0

                  let colorText = "text-amber-500"
                  let colorBg = "bg-amber-500/10 border-amber-500/20"
                  let labelTime = `Quedan ${diasRestantes} días`
                  
                  if (isOverdue) {
                    colorText = "text-rose-500"
                    colorBg = "bg-rose-500/10 border-rose-500/20"
                    labelTime = `Retrasado (${Math.abs(diasRestantes)}d)`
                  } else if (isToday) {
                    colorText = "text-orange-500"
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
                      <div className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-all hover:bg-secondary/40 text-xs cursor-pointer ${colorBg}`}>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                            <span className="capitalize">{hito.tipo_hito.replace(/_/g, " ")}</span>
                            <span className="text-[10px] text-primary font-mono">({proyecto?.codigo_proyecto_interno})</span>
                          </div>
                          <div className="text-muted-foreground text-[10px] mt-0.5 truncate">
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
                  <Link href="/dashboard/proyectos" className="text-[10px] text-primary hover:underline">
                    Ver {hitosAlertas.length - 3} alertas más en Kanban →
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Budgets Table */}
      <Card className="card-elevated border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Presupuestos Recientes
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Lista de propuestas enviadas o generadas recientemente.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-medium">
                  <th className="py-3 px-2">Referencia</th>
                  <th className="py-3 px-2">Cliente</th>
                  <th className="py-3 px-2">Feria / Evento</th>
                  <th className="py-3 px-2 text-right">Superficie</th>
                  <th className="py-3 px-2 text-right">Total Presupuesto</th>
                  <th className="py-3 px-2 text-center">Estado</th>
                  <th className="py-3 px-2 text-right">Fecha Emisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground/60">
                      No hay presupuestos generados en la base de datos.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 px-2 font-bold text-primary">
                        {item.numero_presupuesto}
                      </td>
                      <td className="py-3.5 px-2 font-medium text-foreground">
                        {item.clientes?.nombre_comercial || "Cliente Desconocido"}
                      </td>
                      <td className="py-3.5 px-2 text-foreground/80">
                        {item.nombre_feria}
                      </td>
                      <td className="py-3.5 px-2 text-right font-medium text-foreground/80">
                        {Number(item.m2_superficie).toFixed(0)} m²
                      </td>
                      <td className="py-3.5 px-2 text-right font-bold text-foreground">
                        {Number(item.total_presupuesto).toLocaleString("es-ES")} €
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <StatusBadge estado={item.estado_presupuesto} />
                      </td>
                      <td className="py-3.5 px-2 text-right text-muted-foreground">
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
