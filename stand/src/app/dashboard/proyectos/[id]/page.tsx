"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { ProyectoOperacion, ProyectoHito } from "@/types"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle2, Clock, AlertCircle, ArrowLeft, Building2, Calendar, MapPin, Maximize, HelpCircle, Receipt, Plus, ExternalLink } from "lucide-react"

export default function ProyectoDetallePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [proyecto, setProyecto] = useState<ProyectoOperacion | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchProyecto = async () => {
      const { data, error } = await supabase
        .from("proyectos_operaciones")
        .select(`
          *,
          presupuestos_cabecera (
            numero_presupuesto,
            nombre_feria,
            recinto_ferial,
            fecha_inicio_feria,
            total_presupuesto,
            m2_superficie,
            tipo_stand,
            clientes ( nombre_comercial, sector_industrial )
          ),
          proyectos_hitos (
            id, id_proyecto, tipo_hito, fecha_programada,
            fecha_real_ejecucion, estado_hito, notas,
            usuarios ( nombre_completo )
          ),
          facturas_proyectos (
            id,
            id_proyecto,
            numero_factura_legal,
            tipo_factura,
            porcentaje_facturado,
            base_imponible,
            porcentaje_iva,
            importe_iva,
            total_factura_bruto,
            estado_cobro,
            fecha_emision,
            fecha_vencimiento
          )
        `)
        .eq("id", params.id)
        .single()

      if (error) {
        console.error("Error fetching project:", error)
      } else {
        // Ordenar hitos cronológicamente
        if (data && data.proyectos_hitos) {
          data.proyectos_hitos.sort((a: any, b: any) => 
            new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime()
          )
        }
        setProyecto(data as unknown as ProyectoOperacion)
      }
      setLoading(false)
    }

    fetchProyecto()
  }, [params.id, supabase])

  const formatCurrency = (amount: number | null | undefined) => {
  if (amount == null) return "0,00 €"
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

const descripcionesHitos: Record<string, string> = {
  cobro_anticipo: "Fecha límite para recibir el pago inicial antes de arrancar producción.",
  compra_materiales: "Día límite para pedir los materiales especiales o de despiece al proveedor.",
  cae_seguridad: "Fecha máxima para subir la documentación de prevención de riesgos (CAE) al recinto ferial.",
  inicio_fabricacion: "Día en que el taller comienza a cortar y ensamblar las piezas estructurales.",
  reserva_logistica: "Fecha límite para contratar camiones, hoteles y dietas del equipo de montaje.",
  fecha_carga: "Día en que el stand terminado se carga en los camiones rumbo a la feria.",
  fecha_montaje: "Primer día de montaje oficial dentro del recinto ferial.",
  fecha_cobro_final: "Fecha límite para emitir y cobrar la factura de liquidación del proyecto."
}

const getSemaforoHito = (hito: ProyectoHito) => {
    if (hito.estado_hito === "completado") return "text-green-500 bg-green-500/10 border-green-500/20"
    if (hito.estado_hito === "retrasado") return "text-red-500 bg-red-500/10 border-red-500/20"
    
    const hoy = new Date()
    const fechaLimite = new Date(hito.fecha_programada)
    const diasRestantes = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / 86400000)
    
    if (diasRestantes < 0) return "text-red-500 bg-red-500/10 border-red-500/20" // Vencido
    if (diasRestantes <= 7) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" // Próximo a vencer
    return "text-slate-400 bg-slate-800/50 border-slate-700" // Pendiente con tiempo
  }

  const formatTipoHito = (tipo: string) => {
    const nombres: Record<string, string> = {
      cobro_anticipo: "Cobro Anticipo",
      compra_materiales: "Compra Materiales",
      cae_seguridad: "CAE Seguridad",
      inicio_fabricacion: "Inicio Fabricación",
      reserva_logistica: "Reserva Logística",
      fecha_carga: "Carga de Camiones",
      fecha_montaje: "Inicio de Montaje",
      fecha_cobro_final: "Cobro Final"
    }
    return nombres[tipo] || tipo.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  }

  const alCompletarHito = async (hito: ProyectoHito) => {
    const today = new Date().toISOString().split("T")[0]
    
    // Update local state optimistically
    setProyecto(prev => {
      if (!prev) return prev
      return {
        ...prev,
        proyectos_hitos: prev.proyectos_hitos?.map(h => 
          h.id === hito.id ? { ...h, estado_hito: "completado", fecha_real_ejecucion: today } : h
        )
      }
    })

    // Update in Supabase
    await supabase.from("proyectos_hitos").update({
      estado_hito: "completado",
      fecha_real_ejecucion: today
    }).eq("id", hito.id)

    // Side effects as per rules
    if (hito.tipo_hito === "fecha_montaje") {
      await supabase.from("proyectos_operaciones")
        .update({ estado_proyecto: "montaje" })
        .eq("id", params.id)
      
      setProyecto(prev => {
        if (!prev) return prev
        return { ...prev, estado_proyecto: "montaje" }
      })
    }
    
    if (hito.tipo_hito === "fecha_cobro_final") {
      alert("Hito final completado. El proyecto está listo para cierre financiero (Modal pendiente de construir).")
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando detalles del proyecto...</div>
  }

  if (!proyecto) {
    return <div className="p-8 text-center text-red-400">Error: Proyecto no encontrado</div>
  }

  const pc = proyecto.presupuestos_cabecera
  const cliente = pc?.clientes
  const clienteNombre = Array.isArray(cliente) ? cliente[0]?.nombre_comercial : cliente?.nombre_comercial

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/proyectos")} className="border-slate-800 hover:bg-slate-800">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            {proyecto.codigo_proyecto_interno}
            <StatusBadge status={proyecto.estado_proyecto} type="proyecto" />
          </h1>
          <p className="text-slate-400">{pc?.numero_presupuesto} - {clienteNombre || "Cliente no asignado"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100">Detalles Generales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-indigo-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-300">Feria</p>
                <p className="text-sm text-slate-400">{pc?.nombre_feria || "Sin nombre"} ({pc?.fecha_inicio_feria || "Sin fecha"})</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-300">Recinto</p>
                <p className="text-sm text-slate-400">{pc?.recinto_ferial || pc?.nombre_feria || "Sin especificar"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Maximize className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-300">Superficie</p>
                <p className="text-sm text-slate-400">{pc?.m2_superficie ? `${pc.m2_superficie} m²` : "No especificado"} - {pc?.tipo_stand ? pc.tipo_stand.replace(/_/g, " ") : ""}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-300">Presupuesto Aprobado</p>
                <p className="text-sm font-semibold text-slate-200">{formatCurrency(pc?.total_presupuesto)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100">Línea de Tiempo - Producción</CardTitle>
            <CardDescription className="text-slate-400">Seguimiento cronológico y estado de los hitos del proyecto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proyecto.proyectos_hitos?.map((hito, index) => {
                const colorClass = getSemaforoHito(hito)
                const isCompletado = hito.estado_hito === "completado"
                
                return (
                  <div key={hito.id} className="relative pl-8 pb-4">
                    {/* Line connection */}
                    {index !== (proyecto.proyectos_hitos?.length || 0) - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-800"></div>
                    )}
                    
                    {/* Dot */}
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${colorClass}`}>
                      {isCompletado ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-slate-200">{formatTipoHito(hito.tipo_hito)}</h4>
                          <div className="group relative flex items-center">
                            <HelpCircle className="h-4 w-4 text-slate-500 cursor-help hover:text-slate-300 transition-colors" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 sm:w-64 p-2.5 bg-slate-800 text-xs text-slate-200 rounded-md shadow-xl z-50 border border-slate-700 pointer-events-none">
                              {descripcionesHitos[hito.tipo_hito] || "Sin descripción disponible."}
                              {/* Triángulo del tooltip */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-slate-400">
                            Programado: <span className="text-slate-300 font-medium">{hito.fecha_programada}</span>
                          </p>
                          {isCompletado && (
                            <p className="text-xs font-medium text-green-400">
                              Realizado: {hito.fecha_real_ejecucion}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {!isCompletado && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full sm:w-auto border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-400"
                          onClick={() => alCompletarHito(hito)}
                        >
                          Marcar Completado
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {(!proyecto.proyectos_hitos || proyecto.proyectos_hitos.length === 0) && (
                <div className="text-center p-8 text-slate-500 bg-slate-950 rounded-lg border border-dashed border-slate-800">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No hay hitos generados para este proyecto.</p>
                  <p className="text-xs mt-1">El trigger SQL debería haberlos creado al aceptar el presupuesto.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facturación y Cobros */}
      <Card className="bg-slate-900 border-slate-800 text-[#fafafa] mt-6">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6">
          <div>
            <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-400" /> Facturación y Cobros
            </CardTitle>
            <CardDescription className="text-slate-400">
              Resumen de facturas emitidas, cobradas e importes pendientes de cobro asociados a este proyecto.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-xs"
              onClick={() => router.push(`/dashboard/finanzas?proyectoId=${proyecto.id}&new=true`)}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Emitir Factura
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-700 hover:bg-slate-800 text-xs text-slate-300"
              onClick={() => router.push(`/dashboard/finanzas?proyectoId=${proyecto.id}`)}
            >
              <ExternalLink className="w-4 h-4 mr-1.5" /> Ir a Finanzas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const facturas = (proyecto as any).facturas_proyectos || []
            const totalPresupuesto = pc?.total_presupuesto || 0
            const totalFacturado = facturas.reduce((sum: number, f: any) => sum + Number(f.total_factura_bruto), 0)
            const totalCobrado = facturas.filter((f: any) => f.estado_cobro === 'cobrada').reduce((sum: number, f: any) => sum + Number(f.total_factura_bruto), 0)
            const totalPendiente = facturas.filter((f: any) => f.estado_cobro !== 'cobrada').reduce((sum: number, f: any) => sum + Number(f.total_factura_bruto), 0)
            const pctFacturadoAcumulado = facturas.filter((f: any) => f.tipo_factura !== 'rectificativa').reduce((sum: number, f: any) => sum + Number(f.porcentaje_facturado), 0)

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Presupuesto</p>
                    <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(totalPresupuesto)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Facturado</p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {formatCurrency(totalFacturado)} <span className="text-[10px] text-indigo-400 font-normal">({pctFacturadoAcumulado}%)</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-green-400 uppercase font-semibold">Total Cobrado</p>
                    <p className="text-sm font-bold text-green-400 mt-0.5">{formatCurrency(totalCobrado)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-red-400 uppercase font-semibold">Pendiente Cobro</p>
                    <p className="text-sm font-bold text-red-400 mt-0.5">{formatCurrency(totalPendiente)}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Progreso Facturación</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(pctFacturadoAcumulado, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-300 font-semibold">{pctFacturadoAcumulado}%</span>
                    </div>
                  </div>
                </div>

                {facturas.length === 0 ? (
                  <div className="text-center p-6 text-slate-500 bg-slate-950 rounded-lg border border-dashed border-slate-800">
                    <p className="text-xs">No se han emitido facturas para este proyecto todavía.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                          <th className="pb-3 text-left">Factura</th>
                          <th className="pb-3 text-left">Tipo</th>
                          <th className="pb-3 text-center">Porcentaje</th>
                          <th className="pb-3 text-right">Base Imponible</th>
                          <th className="pb-3 text-right">Total Bruto</th>
                          <th className="pb-3 text-left pl-6">Vencimiento</th>
                          <th className="pb-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {facturas.map((factura: any) => {
                          let badgeColor = "bg-zinc-800 text-zinc-400 border-zinc-700"
                          let badgeLabel = "Pendiente"
                          
                          if (factura.estado_cobro === 'cobrada') {
                            badgeColor = "bg-green-500/10 text-green-400 border-green-500/20"
                            badgeLabel = "Cobrada"
                          } else if (factura.estado_cobro === 'impagada_vencida') {
                            badgeColor = "bg-red-500/10 text-red-400 border-red-500/20"
                            badgeLabel = "Impagada"
                          } else {
                            const hoy = new Date()
                            const venc = new Date(factura.fecha_vencimiento)
                            const diasRest = Math.ceil((venc.getTime() - hoy.getTime()) / 86400000)
                            if (diasRest < 0) {
                              badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              badgeLabel = "Vencida"
                            } else if (diasRest <= 7) {
                              badgeColor = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              badgeLabel = `Vence en ${diasRest}d`
                            }
                          }

                          return (
                            <tr key={factura.id} className="hover:bg-slate-950/20">
                              <td className="py-3 font-mono font-semibold text-slate-200">{factura.numero_factura_legal}</td>
                              <td className="py-3 capitalize text-slate-300">{factura.tipo_factura}</td>
                              <td className="py-3 text-center text-slate-300 font-semibold">{factura.porcentaje_facturado}%</td>
                              <td className="py-3 text-right text-slate-300">{formatCurrency(factura.base_imponible)}</td>
                              <td className="py-3 text-right text-white font-semibold">{formatCurrency(factura.total_factura_bruto)}</td>
                              <td className="py-3 text-slate-400 pl-6">{factura.fecha_vencimiento}</td>
                              <td className="py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}`}>
                                  {badgeLabel}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}
