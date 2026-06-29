"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Loader2, Printer, ArrowLeft } from "lucide-react"

export default function PrintFacturaPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data State
  const [factura, setFactura] = useState<any>(null)
  const [empresa, setEmpresa] = useState<any>(null)

  useEffect(() => {
    if (!id) return

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // 1. Obtener la factura de cliente con su proyecto, presupuesto y cliente asociados
        const { data: factData, error: factError } = await supabase
          .from("facturas_proyectos")
          .select(`
            *,
            proyectos_operaciones (
              id,
              codigo_proyecto_interno,
              id_empresa,
              presupuestos_cabecera (
                id,
                nombre_feria,
                recinto_ferial,
                fecha_inicio_feria,
                clientes (
                  id,
                  razon_social,
                  nombre_comercial,
                  cif_nif,
                  domicilio_fiscal,
                  forma_pago_habitual,
                  plazo_pago_dias
                )
              )
            )
          `)
          .eq("id", id)
          .single()

        if (factError) throw factError
        if (!factData) throw new Error("Factura no encontrada")

        setFactura(factData)

        // 2. Obtener datos de la empresa emisora (desde el proyecto)
        const empresaId = factData.proyectos_operaciones?.id_empresa
        if (empresaId) {
          const { data: empData, error: empError } = await supabase
            .from("empresas")
            .select("*")
            .eq("id", empresaId)
            .single()

          if (empError) throw empError
          setEmpresa(empData)
        }

      } catch (err: any) {
        console.error("Error al cargar datos de impresión:", err)
        setError(err.message || "Error al cargar la factura")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Disparar auto-impresión si se solicita por parámetro en la URL
  useEffect(() => {
    if (!loading && factura && searchParams.get("autoprint") === "true") {
      // Pequeño timeout para asegurar que el navegador renderice la tipografía
      const timer = setTimeout(() => {
        window.print()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [loading, factura, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-[#fafafa] gap-3">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold">Generando vista de factura...</p>
      </div>
    )
  }

  if (error || !factura) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-[#fafafa] p-4 text-center">
        <div className="text-red-400 text-lg font-semibold mb-2">Error de Carga</div>
        <p className="text-sm text-[#a1a1aa] max-w-md mb-6">{error || "No se ha podido encontrar la factura solicitada."}</p>
        <button 
          onClick={() => window.close()} 
          className="px-4 py-2 bg-[#18181b] border border-[#27272a] text-xs font-semibold rounded-lg hover:bg-[#27272a]"
        >
          Cerrar Ventana
        </button>
      </div>
    )
  }

  const proj = factura.proyectos_operaciones || {}
  const pres = proj.presupuestos_cabecera || {}
  const client = pres.clientes || {}

  // Helper para dar formato de moneda
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)
  }

  return (
    <div className="min-h-screen bg-white text-black p-4 sm:p-8 font-sans leading-relaxed selection:bg-neutral-200">
      
      {/* Barra de control para el usuario en pantalla (se oculta al imprimir) */}
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
          Factura legal: <span className="font-mono font-bold text-neutral-800">{factura.numero_factura_legal}</span>
        </div>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/10 transition"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / PDF</span>
        </button>
      </div>

      {/* Contenedor A4 de la Factura */}
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-12 print:p-0">
        
        {/* CABECERA: Emisor vs Metadatos */}
        <div className="grid grid-cols-2 gap-8 border-b border-neutral-200 pb-8 mb-8 items-start">
          {/* Datos del Emisor */}
          <div>
            {empresa?.logo_url ? (
              <img 
                src={empresa.logo_url} 
                alt={empresa.nombre} 
                className="h-12 w-auto mb-4 object-contain max-w-[200px]"
              />
            ) : (
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center">
                  <span className="text-white font-extrabold text-base tracking-wider">T</span>
                </div>
                <div className="font-extrabold text-base tracking-tight uppercase">{empresa?.nombre || "The Titan"}</div>
              </div>
            )}
            <div className="text-xs font-semibold text-neutral-900">{empresa?.nombre || "The Titan S.L."}</div>
            <div className="text-xs text-neutral-600 mt-1">CIF: {empresa?.cif || "PENDIENTE"}</div>
            <div className="text-xs text-neutral-600 mt-0.5">{empresa?.domicilio || "Dirección no especificada"}</div>
            {empresa?.telefono && <div className="text-xs text-neutral-600 mt-0.5">T: {empresa.telefono}</div>}
            {empresa?.email_principal && <div className="text-xs text-neutral-600 mt-0.5">E: {empresa.email_principal}</div>}
          </div>

          {/* Datos del Documento */}
          <div className="text-right">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 uppercase">Factura</h1>
            <div className="mt-4 space-y-1">
              <div className="text-xs text-neutral-500">Número de Factura:</div>
              <div className="text-sm font-mono font-bold text-neutral-900">{factura.numero_factura_legal}</div>
              
              <div className="text-xs text-neutral-500 mt-2">Fecha Emisión:</div>
              <div className="text-xs font-semibold text-neutral-900">{factura.fecha_emision}</div>
              
              <div className="text-xs text-neutral-500 mt-2">Fecha Vencimiento:</div>
              <div className="text-xs font-semibold text-red-600">{factura.fecha_vencimiento}</div>

              <div className="text-xs text-neutral-500 mt-2">Código Proyecto:</div>
              <div className="text-xs font-mono font-bold text-neutral-900">{proj.codigo_proyecto_interno}</div>
            </div>
          </div>
        </div>

        {/* DATOS DEL CLIENTE (Receptor) */}
        <div className="bg-neutral-50 rounded-xl p-6 mb-8 border border-neutral-100">
          <h2 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Datos del Cliente</h2>
          <div className="text-sm font-bold text-neutral-900">{client.razon_social || client.nombre_comercial || "Cliente"}</div>
          {client.nombre_comercial && client.nombre_comercial !== client.razon_social && (
            <div className="text-xs text-neutral-500 mt-0.5">Nombre Comercial: {client.nombre_comercial}</div>
          )}
          <div className="text-xs text-neutral-700 mt-2">CIF/NIF: <span className="font-semibold">{client.cif_nif || "N/A"}</span></div>
          <div className="text-xs text-neutral-700 mt-0.5">Dirección: {client.domicilio_fiscal || "Dirección no especificada"}</div>
        </div>

        {/* DETALLE / LÍNEAS DE FACTURA */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-300 text-xs font-bold text-neutral-500 uppercase">
                <th className="py-3 pr-4">Concepto / Descripción</th>
                <th className="py-3 text-center w-24">Porcentaje</th>
                <th className="py-3 text-right w-32">Precio Unitario</th>
                <th className="py-3 text-right w-32">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs text-neutral-700">
              <tr className="align-top">
                <td className="py-4 pr-4">
                  <div className="font-bold text-neutral-900 capitalize">
                    {factura.tipo_factura === 'anticipo' ? "Factura de Anticipo" : factura.tipo_factura === 'final' ? "Factura Final" : "Factura Rectificativa"} ({factura.porcentaje_facturado}%)
                  </div>
                  <div className="text-neutral-500 mt-1">
                    Correspondiente al proyecto de arquitectura efímera para la feria **{pres.nombre_feria || "Feria"}** en el recinto {pres.recinto_ferial || "Recinto Ferial"}.
                  </div>
                  {factura.notas && (
                    <div className="text-[10px] text-neutral-400 mt-2 bg-neutral-50 p-2 rounded border border-neutral-100">
                      <strong>Notas adicionales:</strong> {factura.notas}
                    </div>
                  )}
                </td>
                <td className="py-4 text-center font-semibold text-neutral-950">{factura.porcentaje_facturado}%</td>
                <td className="py-4 text-right">{formatCurrency(Number(factura.base_imponible) / (Number(factura.porcentaje_facturado) / 100))}</td>
                <td className="py-4 text-right font-semibold text-neutral-950">{formatCurrency(factura.base_imponible)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BLOQUE DE TOTALES */}
        <div className="flex justify-end mb-12">
          <div className="w-80 border-t border-neutral-300 pt-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>Base Imponible:</span>
              <span className="font-medium text-neutral-900">{formatCurrency(factura.base_imponible)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>IVA ({factura.porcentaje_iva}%):</span>
              <span className="font-medium text-neutral-900">{formatCurrency(factura.importe_iva)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-neutral-900 border-t border-neutral-200 pt-2.5">
              <span>Total Bruto:</span>
              <span>{formatCurrency(factura.total_factura_bruto)}</span>
            </div>
          </div>
        </div>

        {/* PIE DE PÁGINA: Forma de pago e instrucciones */}
        <div className="border-t border-neutral-200 pt-8 text-[11px] text-neutral-500 grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-neutral-700 uppercase tracking-wider text-[9px] mb-1">Método de Pago</h3>
            <p>Transferencia bancaria a la cuenta de la empresa.</p>
            <p className="mt-2 text-neutral-700 font-bold">IBAN: <span className="font-mono">{empresa?.cuenta_bancaria_iban || "ESXX XXXX XXXX XXXX XXXX XXXX"}</span></p>
            <p className="text-[10px] mt-1">Indicar como concepto el número de factura: <span className="font-mono font-bold text-neutral-700">{factura.numero_factura_legal}</span></p>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-neutral-700 uppercase tracking-wider text-[9px] mb-1">Condiciones Comerciales</h3>
            <p>Plazo de pago pactado: <span className="font-semibold text-neutral-700">{client.plazo_pago_dias || 30} días</span>.</p>
            <p className="mt-1">Forma de pago habitual: <span className="font-semibold text-neutral-700 capitalize">{client.forma_pago_habitual || "Transferencia"}</span>.</p>
            <p className="mt-4 text-[9px]">¡Gracias por confiar en {empresa?.nombre || "The Titan"} para vuestra presencia ferial!</p>
          </div>
        </div>

      </div>

      {/* Reglas CSS específicas para impresión */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\:hidden {
            display: none !important;
          }
          /* Asegurar que las tarjetas de fondo gris no se impriman negras */
          .bg-neutral-50 {
            background-color: #f9f9f9 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

    </div>
  )
}
