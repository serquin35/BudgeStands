"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Loader2, Printer, ArrowLeft } from "lucide-react"

export default function PrintPresupuestoPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data State
  const [presupuesto, setPresupuesto] = useState<any>(null)
  const [lineas, setLineas] = useState<any[]>([])
  const [empresa, setEmpresa] = useState<any>(null)

  useEffect(() => {
    if (!id) return

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // 1. Obtener presupuesto
        const { data: presData, error: presError } = await supabase
          .from("presupuestos_cabecera")
          .select(`
            *,
            clientes (
              id,
              razon_social,
              nombre_comercial,
              cif_nif,
              domicilio_fiscal,
              email_contacto,
              telefono_contacto
            )
          `)
          .eq("id", id)
          .single()

        if (presError) throw presError
        if (!presData) throw new Error("Presupuesto no encontrado")

        setPresupuesto(presData)

        // 2. Obtener líneas
        const { data: lineasData, error: lineasError } = await supabase
          .from("presupuestos_lineas")
          .select("*")
          .eq("id_presupuesto", id)
          .order("orden", { ascending: true })

        if (lineasError) throw lineasError
        setLineas(lineasData || [])

        // 3. Obtener datos de la empresa emisora
        if (presData.id_empresa) {
          const { data: empData, error: empError } = await supabase
            .from("empresas")
            .select("*")
            .eq("id", presData.id_empresa)
            .single()

          if (empError) throw empError
          setEmpresa(empData)
        }

      } catch (err: any) {
        console.error("Error al cargar datos de impresión del presupuesto:", err)
        setError(err.message || "Error al cargar el presupuesto")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Disparar auto-impresión si se solicita por parámetro en la URL
  useEffect(() => {
    if (!loading && presupuesto && searchParams.get("autoprint") === "true") {
      const timer = setTimeout(() => {
        window.print()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [loading, presupuesto, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-[#fafafa] gap-3">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold">Generando vista de presupuesto...</p>
      </div>
    )
  }

  if (error || !presupuesto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-[#fafafa] p-4 text-center">
        <div className="text-red-400 text-lg font-semibold mb-2">Error de Carga</div>
        <p className="text-sm text-[#a1a1aa] max-w-md mb-6">{error || "No se ha podido encontrar el presupuesto solicitado."}</p>
        <button 
          onClick={() => window.close()} 
          className="px-4 py-2 bg-[#18181b] border border-[#27272a] text-xs font-semibold rounded-lg hover:bg-[#27272a]"
        >
          Cerrar Ventana
        </button>
      </div>
    )
  }

  const client = presupuesto.clientes || {}

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)
  }

  return (
    <div className="min-h-screen bg-white text-black p-4 sm:p-8 font-sans leading-relaxed selection:bg-neutral-200">
      
      {/* Control panel for screen only */}
      <div className="max-w-4xl mx-auto mb-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.close()} 
            className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded-lg hover:bg-neutral-100 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cerrar</span>
          </button>
        </div>
        <div className="text-xs text-neutral-500 font-medium">
          Presupuesto: <span className="font-mono font-bold text-neutral-800">{presupuesto.numero_presupuesto}</span>
        </div>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/10 transition"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / PDF</span>
        </button>
      </div>

      {/* A4 Content Container */}
      <div className="max-w-4xl mx-auto bg-white p-2">
        
        {/* Header Grid: Company Logo & Info vs Document Meta */}
        <div className="grid grid-cols-2 gap-8 items-start border-b-2 border-neutral-100 pb-6 mb-8">
          <div>
            {empresa?.logo_url ? (
              <img 
                src={empresa.logo_url} 
                alt={empresa.nombre} 
                className="max-h-14 max-w-[200px] object-contain mb-4" 
              />
            ) : (
              <div className="text-xl font-black tracking-tight text-neutral-900 mb-4">
                {empresa?.nombre || "THE TITAN ERP"}
              </div>
            )}
            <div className="text-[11px] text-neutral-500 space-y-0.5">
              <p className="font-bold text-neutral-800">{empresa?.nombre}</p>
              <p>CIF: {empresa?.cif}</p>
              {empresa?.domicilio && <p>{empresa.domicilio}</p>}
              {empresa?.telefono && <p>Tel: {empresa.telefono}</p>}
              {empresa?.email_principal && <p>Email: {empresa.email_principal}</p>}
            </div>
          </div>
          
          <div className="text-right">
            <div className="inline-block bg-neutral-100 text-neutral-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              Propuesta de Presupuesto
            </div>
            <h1 className="text-2xl font-light text-neutral-800 mb-1">
              Ref: <span className="font-bold text-neutral-900">{presupuesto.numero_presupuesto}</span>
            </h1>
            <div className="text-xs text-neutral-500 space-y-1">
              <p>Fecha Emisión: <span className="text-neutral-800 font-semibold">{new Date(presupuesto.created_at).toLocaleDateString("es-ES")}</span></p>
              <p>Feria: <span className="text-neutral-800 font-semibold">{presupuesto.nombre_feria || "N/D"}</span></p>
              {presupuesto.fecha_inicio_feria && (
                <p>Inicio Feria: <span className="text-neutral-800 font-semibold">{new Date(presupuesto.fecha_inicio_feria).toLocaleDateString("es-ES")}</span></p>
              )}
              {presupuesto.recinto_ferial && (
                <p>Recinto: <span className="text-neutral-800 font-semibold">{presupuesto.recinto_ferial}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Customer Address Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
            <h2 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Presentado a:</h2>
            <div className="text-xs text-neutral-700 space-y-1">
              <p className="text-sm font-bold text-neutral-900">{client.razon_social || client.nombre_comercial || "Cliente"}</p>
              {client.cif_nif && <p>CIF / NIF: {client.cif_nif}</p>}
              {client.domicilio_fiscal && <p>{client.domicilio_fiscal}</p>}
              {client.telefono_contacto && <p>Tel: {client.telefono_contacto}</p>}
              {client.email_contacto && <p>Email: {client.email_contacto}</p>}
            </div>
          </div>

          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex flex-col justify-between">
            <div>
              <h2 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Especificaciones del Stand:</h2>
              <div className="grid grid-cols-2 gap-4 text-xs text-neutral-700">
                <div>
                  <p className="text-neutral-400 font-semibold text-[9px] uppercase">Superficie</p>
                  <p className="font-bold text-sm text-neutral-900">{presupuesto.m2_superficie} m²</p>
                </div>
                <div>
                  <p className="text-neutral-400 font-semibold text-[9px] uppercase">Altura</p>
                  <p className="font-bold text-sm text-neutral-900">{presupuesto.altura_stand_m} m</p>
                </div>
                <div className="col-span-2">
                  <p className="text-neutral-400 font-semibold text-[9px] uppercase">Tipo de Stand</p>
                  <p className="font-bold text-sm text-neutral-900 capitalize">{presupuesto.tipo_stand.replace("_", " ")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lines / Concept table */}
        <div className="mb-8">
          <h3 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-3">Partidas y Desglose de Servicios</h3>
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-200 text-neutral-500 font-bold uppercase text-[9px]">
                <th className="py-2.5 px-1 text-center w-8">Nº</th>
                <th className="py-2.5 px-2">Concepto / Descripción</th>
                <th className="py-2.5 px-2 text-right w-20">Cantidad</th>
                <th className="py-2.5 px-2 text-right w-24">Precio Un.</th>
                <th className="py-2.5 px-2 text-right w-28">Total Partida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {lineas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-400 italic">
                    Esta propuesta no incluye desglose de partidas.
                  </td>
                </tr>
              ) : (
                lineas.map((linea) => (
                  <tr key={linea.id} className="hover:bg-neutral-50/50">
                    <td className="py-3 px-1 text-center font-bold text-neutral-400">
                      {linea.orden}
                    </td>
                    <td className="py-3 px-2 text-neutral-800 font-medium">
                      {linea.concepto_descripcion}
                    </td>
                    <td className="py-3 px-2 text-right text-neutral-600 whitespace-nowrap">
                      {Number(linea.cantidad).toLocaleString("es-ES")} <span className="text-[9px] font-bold uppercase text-neutral-400">{linea.unidad || "ud"}</span>
                    </td>
                    <td className="py-3 px-2 text-right text-neutral-600">
                      {formatCurrency(Number(linea.precio_unitario_venta))}
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-neutral-900">
                      {formatCurrency(Number(linea.total_linea))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Breakpage before image if needed in printing, or keep it flowing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end border-t-2 border-neutral-100 pt-6">
          {/* Subtotals & Taxes */}
          <div className="space-y-1.5 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Subtotal Construcción y Taller:</span>
              <span className="font-semibold text-neutral-800">{formatCurrency(Number(presupuesto.subtotal_construccion || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal Servicios de Recinto:</span>
              <span className="font-semibold text-neutral-800">{formatCurrency(Number(presupuesto.subtotal_servicios_feria || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal Diseño y Rotulación:</span>
              <span className="font-semibold text-neutral-800">{formatCurrency(Number(presupuesto.subtotal_diseno_grafica || 0))}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-neutral-100">
              <span>Subtotal Montaje y Logística:</span>
              <span className="font-semibold text-neutral-800">{formatCurrency(Number(presupuesto.subtotal_transporte_mo || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span>Base Imponible:</span>
              <span className="font-bold text-neutral-800">{formatCurrency(Number(presupuesto.base_imponible || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (21%):</span>
              <span className="font-bold text-neutral-800">{formatCurrency(Number(presupuesto.importe_iva || 0))}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t-2 border-neutral-900">
              <span className="font-bold text-indigo-700">Total Presupuesto (Venta):</span>
              <span className="font-black text-indigo-700 text-base">{formatCurrency(Number(presupuesto.total_presupuesto || 0))}</span>
            </div>
          </div>

          {/* Render Conceptual (AI) */}
          {presupuesto.imagen_stand_url && (
            <div className="space-y-2 print:break-inside-avoid">
              <h4 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Diseño Conceptual Sugerido (Renders):</h4>
              <div className="rounded-xl overflow-hidden border border-neutral-200 aspect-video shadow-sm">
                <img 
                  src={presupuesto.imagen_stand_url} 
                  alt="Diseño conceptual de stand" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <p className="text-[9px] text-neutral-400 italic text-center">
                * Diseño 3D preliminar aproximado generado por inteligencia artificial para fines de propuesta comercial.
              </p>
            </div>
          )}
        </div>

        {/* Footer Notes */}
        <div className="mt-12 border-t border-neutral-100 pt-6 text-[10px] text-neutral-400 space-y-1 print:break-inside-avoid">
          <p className="font-bold text-neutral-600">Condiciones Generales:</p>
          <p>1. Este presupuesto es una propuesta comercial y tiene una validez de 30 días naturales desde su emisión.</p>
          <p>2. Los plazos de entrega y montaje están condicionados a la confirmación de la fecha de aceptación.</p>
          <p>3. Forma de pago: 50% a la aceptación y firma del presupuesto, 50% al finalizar el montaje.</p>
        </div>

      </div>
    </div>
  )
}
