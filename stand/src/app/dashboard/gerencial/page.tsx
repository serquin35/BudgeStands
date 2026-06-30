import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Euro,
  Target,
  Building2,
  Hammer,
  ArrowUpRight,
  CheckCircle2,
  Clock
} from "lucide-react"

export const dynamic = "force-dynamic"

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

const fmtPct = (n: number) => `${n.toFixed(1)}%`

export default async function GerencialPage() {
  const supabase = createClient()

  // --- CONSULTAS PARALELAS ---
  const [
    { data: facturasClientes },
    { data: facturasProveedores },
    { data: cierres },
    { data: presupuestos },
    { data: hitosProduccion },
  ] = await Promise.all([
    supabase
      .from("facturas_proyectos")
      .select(`
        total_factura_bruto,
        estado_cobro,
        proyectos_operaciones (
          presupuestos_cabecera (
            clientes ( id, nombre_comercial )
          )
        )
      `),
    supabase
      .from("facturas_proveedores_cabecera")
      .select("total_factura_bruto, estado_pago"),
    supabase
      .from("cierres_proyectos")
      .select(`
        id,
        ingreso_total_real,
        gasto_total_real,
        margen_bruto_real,
        margen_real_porcentaje,
        presupuesto_original,
        desviacion_beneficio_porcentaje,
        valoracion_cliente,
        lecciones_aprendidas,
        fecha_cierre_oficial,
        proyectos_operaciones (
          codigo_proyecto_interno,
          presupuestos_cabecera (
            nombre_feria,
            clientes ( nombre_comercial )
          )
        )
      `)
      .order("fecha_cierre_oficial", { ascending: false }),
    supabase
      .from("presupuestos_cabecera")
      .select("estado_presupuesto, total_presupuesto"),
    supabase
      .from("proyectos_hitos")
      .select(`
        id,
        id_proyecto,
        tipo_hito,
        fecha_programada,
        estado_hito,
        proyectos_operaciones (
          codigo_proyecto_interno,
          presupuestos_cabecera (
            nombre_feria,
            clientes ( nombre_comercial )
          )
        )
      `)
      .in("tipo_hito", ["inicio_fabricacion", "fecha_carga", "inicio_montaje", "fecha_montaje"])
      .in("estado_hito", ["pendiente", "en_progreso"])
      .gte("fecha_programada", new Date().toISOString().split("T")[0])
      .lte("fecha_programada", (() => {
        const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split("T")[0]
      })())
      .order("fecha_programada", { ascending: true }),
  ])

  const allFactClientes = (facturasClientes || []) as any[]
  const allFactProv = (facturasProveedores || []) as any[]
  const allCierres = (cierres || []) as any[]
  const allPresupuestos = (presupuestos || []) as any[]
  const allHitos = (hitosProduccion || []) as any[]

  // --- KPI 1: Cobrado Real ---
  const cobradoReal = allFactClientes
    .filter(f => f.estado_cobro === "cobrada")
    .reduce((s: number, f: any) => s + Number(f.total_factura_bruto || 0), 0)

  // --- KPI 2: Gasto Aprobado ---
  const gastoAprobado = allFactProv
    .filter(f => f.estado_pago === "pagada")
    .reduce((s: number, f: any) => s + Number(f.total_factura_bruto || 0), 0)

  // --- KPI 3: Rentabilidad Media ---
  const rentabilidadMedia =
    allCierres.length > 0
      ? allCierres.reduce((s: number, c: any) => s + Number(c.margen_real_porcentaje || 0), 0) / allCierres.length
      : null

  // --- KPI 4: Tasa de Conversión ---
  const presupuestosAceptados = allPresupuestos.filter((p: any) => p.estado_presupuesto === "aceptado").length
  const presupuestosCerrados = allPresupuestos.filter((p: any) =>
    ["aceptado", "rechazado"].includes(p.estado_presupuesto)
  ).length
  const tasaConversion = presupuestosCerrados > 0
    ? ((presupuestosAceptados / presupuestosCerrados) * 100)
    : null

  // --- Facturación emitida total ---
  const facturacionEmitida = allFactClientes
    .reduce((s: number, f: any) => s + Number(f.total_factura_bruto || 0), 0)

  // --- Objetivo anual ---
  const OBJETIVO_ANUAL = 500000
  const progresoAnual = Math.min((facturacionEmitida / OBJETIVO_ANUAL) * 100, 100)

  // --- Top 5 Clientes ---
  const clientesMap: Record<string, { nombre: string; total: number }> = {}
  for (const f of allFactClientes) {
    const cliente = (f.proyectos_operaciones as any)?.presupuestos_cabecera?.clientes
    if (!cliente?.id) continue
    if (!clientesMap[cliente.id]) clientesMap[cliente.id] = { nombre: cliente.nombre_comercial, total: 0 }
    clientesMap[cliente.id].total += Number(f.total_factura_bruto || 0)
  }
  const top5Clientes = Object.values(clientesMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  const maxClienteTotal = top5Clientes[0]?.total || 1

  const cierresRecientes = allCierres.slice(0, 8)

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-[#fafafa] to-[#a1a1aa]">
            Analytics Gerencial
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Métricas financieras y de rentabilidad en tiempo real.
          </p>
        </div>
        <Link href="/dashboard">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] font-medium text-xs rounded-lg transition-all duration-200 border border-[#27272a]/70">
            ← Vista Operativa
          </button>
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#27272a]/70 bg-[#09090b]/40 hover:border-emerald-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Cobrado Real</CardTitle>
            <Euro className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#fafafa]">{fmt(cobradoReal)}</div>
            <p className="text-[10px] text-[#71717a] mt-1">Facturas de clientes efectivamente cobradas</p>
          </CardContent>
        </Card>

        <Card className="border-[#27272a]/70 bg-[#09090b]/40 hover:border-red-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Gasto Aprobado</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#fafafa]">{fmt(gastoAprobado)}</div>
            <p className="text-[10px] text-[#71717a] mt-1">Facturas de proveedores pagadas</p>
          </CardContent>
        </Card>

        <Card className="border-[#27272a]/70 bg-[#09090b]/40 hover:border-indigo-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Rentabilidad Media</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#fafafa]">
              {rentabilidadMedia !== null ? fmtPct(rentabilidadMedia) : "—"}
            </div>
            <p className="text-[10px] text-[#71717a] mt-1">
              Media de margen real en {allCierres.length} proyectos cerrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#27272a]/70 bg-[#09090b]/40 hover:border-amber-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Conversión de Ventas</CardTitle>
            <Target className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#fafafa]">
              {tasaConversion !== null ? fmtPct(tasaConversion) : "—"}
            </div>
            <p className="text-[10px] text-[#71717a] mt-1">
              {presupuestosAceptados} aceptados de {presupuestosCerrados} cerrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mid: Top Clientes + Objetivo + Taller */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-7">
        <Card className="md:col-span-3 border-[#27272a]/70 bg-[#09090b]/40">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#fafafa] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-400" />
              Top 5 Clientes
            </CardTitle>
            <CardDescription className="text-xs text-[#a1a1aa]">
              Volumen de negocio facturado por cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {top5Clientes.length === 0 ? (
              <p className="text-xs text-[#71717a] text-center py-4">Sin datos de facturación aún.</p>
            ) : (
              top5Clientes.map((c, i) => (
                <div key={c.nombre} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#e4e4e7] flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-400 w-4 text-center">{i + 1}</span>
                      {c.nombre}
                    </span>
                    <span className="font-bold text-[#fafafa]">{fmt(c.total)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#27272a]/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                      style={{ width: `${(c.total / maxClienteTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-4 space-y-4">
          <Card className="border-[#27272a]/70 bg-[#09090b]/40">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#fafafa] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                Progreso Objetivo Anual
              </CardTitle>
              <CardDescription className="text-xs text-[#a1a1aa]">
                Facturación emitida vs objetivo de {fmt(OBJETIVO_ANUAL)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-[#a1a1aa]">Emitido: <span className="font-bold text-[#fafafa]">{fmt(facturacionEmitida)}</span></span>
                <span className="font-bold text-emerald-400">{fmtPct(progresoAnual)}</span>
              </div>
              <div className="h-3 w-full bg-[#27272a]/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progresoAnual}%`,
                    background: progresoAnual >= 80
                      ? "linear-gradient(to right, #10b981, #059669)"
                      : progresoAnual >= 50
                        ? "linear-gradient(to right, #6366f1, #a855f7)"
                        : "linear-gradient(to right, #f59e0b, #d97706)"
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#71717a] mt-1.5">
                <span>0 €</span>
                <span>{fmt(OBJETIVO_ANUAL)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#27272a]/70 bg-[#09090b]/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-[#fafafa] flex items-center gap-2">
                <Hammer className="h-4 w-4 text-orange-400" />
                Carga del Taller (30 días)
              </CardTitle>
              <CardDescription className="text-xs text-[#a1a1aa]">
                Hitos de producción y montaje programados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {allHitos.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-[#71717a] py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Sin cargas de taller programadas para los próximos 30 días.</span>
                </div>
              ) : (
                allHitos.slice(0, 5).map((h: any) => {
                  const proy = h.proyectos_operaciones as any
                  const dias = Math.ceil(
                    (new Date(h.fecha_programada).getTime() - new Date().getTime()) / 86400000
                  )
                  const tipoLabel: Record<string, string> = {
                    inicio_fabricacion: "Fabricación",
                    fecha_carga: "Carga",
                    inicio_montaje: "Montaje",
                    fecha_montaje: "Montaje"
                  }
                  return (
                    <Link href={`/dashboard/proyectos/${h.id_proyecto}`} key={h.id}>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#18181b]/40 border border-[#27272a]/30 hover:border-orange-500/20 transition-all text-xs cursor-pointer">
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="h-3 w-3 text-orange-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-[#fafafa] flex gap-1.5 flex-wrap">
                              <span>{tipoLabel[h.tipo_hito] || h.tipo_hito}</span>
                              <span className="text-indigo-400 font-mono text-[10px]">({proy?.codigo_proyecto_interno})</span>
                            </div>
                            <div className="text-[#71717a] text-[10px] truncate">
                              {proy?.presupuestos_cabecera?.clientes?.nombre_comercial} — {proy?.presupuestos_cabecera?.nombre_feria}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-orange-400 shrink-0 ml-2">
                          {dias === 0 ? "Hoy" : `${dias}d`}
                        </span>
                      </div>
                    </Link>
                  )
                })
              )}
              {allHitos.length > 5 && (
                <p className="text-[10px] text-[#71717a] text-right pt-1">
                  +{allHitos.length - 5} hitos más en el período.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historial Económico de Cierres */}
      <Card className="border-[#27272a]/70 bg-[#09090b]/40">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-[#fafafa]">
              Historial Económico de Proyectos Cerrados
            </CardTitle>
            <CardDescription className="text-xs text-[#a1a1aa]">
              Rentabilidad real, valoración del cliente y lecciones aprendidas por obra.
            </CardDescription>
          </div>
          <Link href="/dashboard/finanzas">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer">
              Gestionar cierres <ArrowUpRight className="h-3 w-3" />
            </span>
          </Link>
        </CardHeader>
        <CardContent>
          {cierresRecientes.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#71717a]">
              No hay proyectos cerrados registrados todavía.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a]/70 text-[#a1a1aa] font-medium">
                    <th className="py-3 px-2">Proyecto</th>
                    <th className="py-3 px-2">Cliente / Feria</th>
                    <th className="py-3 px-2 text-right">Ingreso Real</th>
                    <th className="py-3 px-2 text-right">Gasto Real</th>
                    <th className="py-3 px-2 text-right">Margen %</th>
                    <th className="py-3 px-2 text-right">Desviación</th>
                    <th className="py-3 px-2 text-center">Valoración</th>
                    <th className="py-3 px-2">Fecha Cierre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]/40">
                  {cierresRecientes.map((c: any) => {
                    const proy = c.proyectos_operaciones as any
                    const cliente = proy?.presupuestos_cabecera?.clientes?.nombre_comercial || "—"
                    const feria = proy?.presupuestos_cabecera?.nombre_feria || "—"
                    const margen = Number(c.margen_real_porcentaje || 0)
                    const desv = Number(c.desviacion_beneficio_porcentaje || 0)
                    const val = Number(c.valoracion_cliente || 0)
                    return (
                      <tr key={c.id} className="hover:bg-[#18181b]/30 transition-colors">
                        <td className="py-3 px-2 font-bold text-indigo-400">
                          {proy?.codigo_proyecto_interno || "—"}
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-medium text-[#fafafa]">{cliente}</div>
                          <div className="text-[#71717a] text-[10px]">{feria}</div>
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-emerald-400">
                          {fmt(Number(c.ingreso_total_real || 0))}
                        </td>
                        <td className="py-3 px-2 text-right text-red-400">
                          {fmt(Number(c.gasto_total_real || 0))}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className={`font-bold ${margen >= 20 ? "text-emerald-400" : margen >= 10 ? "text-amber-400" : "text-red-400"}`}>
                            {fmtPct(margen)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className={`text-[10px] font-semibold ${desv >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {desv >= 0 ? "+" : ""}{fmtPct(desv)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-amber-400 tracking-tight">
                            {"★".repeat(val)}{"☆".repeat(5 - val)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-[#71717a]">
                          {c.fecha_cierre_oficial
                            ? new Date(c.fecha_cierre_oficial).toLocaleDateString("es-ES")
                            : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
