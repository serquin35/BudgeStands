import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import type { JarvisOutput, PartidaPresupuesto } from "@/types"

const mapearCategoria = (categoria: string): number => {
  const mapa: Record<string, number> = {
    construccion: 1,
    servicios: 12,
    diseno: 14,
    transporte_mo: 10
  }
  return mapa[categoria] ?? 15
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Validar sesión del usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener datos del usuario de la DB
    const { data: dbUser } = await supabase
      .from("usuarios")
      .select("id_empresa")
      .eq("id", user.id)
      .single()

    if (!dbUser) {
      return NextResponse.json({ error: "Perfil de usuario no encontrado" }, { status: 404 })
    }

    // Validar límites del plan
    const { data: usageData, error: usageError } = await supabase.rpc("get_plan_usage")
    if (usageError) {
      console.error("Error al obtener límites de plan:", usageError)
    } else if (usageData) {
      const { uso, limites } = usageData
      if (limites && limites.ia_calls_mes !== -1 && uso.ia_calls_mes >= limites.ia_calls_mes) {
        return NextResponse.json({ 
          error: `Has superado el límite de créditos Jarvis IA de tu plan (${limites.ia_calls_mes} al mes). Por favor, actualiza tu plan.` 
        }, { status: 403 })
      }
      if (limites && limites.presupuestos_mes !== -1 && uso.presupuestos_mes >= limites.presupuestos_mes) {
        return NextResponse.json({ 
          error: `Has superado el límite de presupuestos creados de tu plan (${limites.presupuestos_mes} al mes). Por favor, actualiza tu plan.` 
        }, { status: 403 })
      }
    }

    // Leer payload del cliente
    const body = await request.json()
    const { 
      clienteId, 
      nombreFeria, 
      m2, 
      altura, 
      tipoStand, 
      estiloStand, 
      promptText, 
      imageUrl,
      audioUrl 
    } = body

    if (!clienteId || !nombreFeria || !m2) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    // Obtener el nombre visible del cliente para el contexto de Jarvis
    const { data: clienteData } = await supabase
      .from("clientes")
      .select("nombre_comercial, razon_social")
      .eq("id", clienteId)
      .single()

    const clienteNombre = clienteData?.nombre_comercial || clienteData?.razon_social || clienteId

    // Generar un número de presupuesto secuencial o temporal
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    const numeroPresupuesto = `PRES-2026-${random.toString().padStart(4, "0")}`

    console.log("Enviando petición a n8n Jarvis...")
    
    // Determinar tipo de contenido según qué inputs llegaron
    // Prioridad: audio > image > texto
    let contentType = "texto"
    let contentValue = promptText || ""

    if (audioUrl) {
      contentType = "audio"
      contentValue = audioUrl
    } else if (imageUrl) {
      contentType = "imagen"
      contentValue = imageUrl
    }

    // El payload que espera el Webhook de Jarvis según su nodo Switch
    const n8nPayload = {
      id_empresa: dbUser.id_empresa,
      type: contentType,
      content: contentValue,
      feria: nombreFeria,
      m2: Number(m2),
      altura: Number(altura || 2.50),
      tipo_stand: tipoStand || "modular",
      estilo: estiloStand || "moderno",
      cliente: clienteNombre,
      presupuesto_max: 0,
      promptText: promptText || ""
    }

    // Llamar a n8n Jarvis
    const n8nUrl = process.env.N8N_BUDGET_AGENT_WEBHOOK || "https://n8n.cheosdesign.info/webhook/stand-budget-agent"
    const n8nResponse = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(n8nPayload)
    })

    // Leer el body como texto primero para evitar "Unexpected end of JSON input"
    const rawBody = await n8nResponse.text()
    console.log("Respuesta cruda de n8n:", rawBody.substring(0, 500))

    if (!n8nResponse.ok) {
      throw new Error(`Error en el servicio IA de n8n (${n8nResponse.status}): ${rawBody.substring(0, 200)}`)
    }

    let aiResult: any = {}
    try {
      aiResult = JSON.parse(rawBody)
    } catch (parseErr) {
      throw new Error(`La respuesta de n8n no es un JSON válido: ${rawBody.substring(0, 200)}`)
    }

    if (aiResult.errorMessage) {
      throw new Error(`Error de ejecución en n8n: ${aiResult.errorMessage}`)
    }

    if (!aiResult.output) {
      throw new Error(`El servicio de IA no retornó un presupuesto válido (output vacío).`)
    }

    console.log("Respuesta de n8n recibida exitosamente:", aiResult)

    let parsedOutput: JarvisOutput | string = aiResult.output;
    if (typeof parsedOutput === 'string') {
      try {
        parsedOutput = JSON.parse(parsedOutput) as JarvisOutput;
      } catch (e) {
        console.warn("No se pudo parsear el output como JSON, se usará como texto", e);
      }
    }

    const output = typeof parsedOutput === 'object' ? parsedOutput : null

    // Fallbacks en caso de que la IA no devuelva el JSON perfecto
    const subConstruccion = Number(output?.subtotal_construccion || 0)
    const subServicios = Number(output?.subtotal_servicios || 0)
    const subDiseno = Number(output?.subtotal_diseno || 0)
    const subTransporte = Number(output?.subtotal_transporte_mo || output?.subtotal_transporte || 0)

    const baseImponible = subConstruccion + subServicios + subDiseno + subTransporte
    const importeIva = baseImponible * 0.21
    const total = baseImponible + importeIva

    // Guardar presupuesto cabecera
    const { data: presCabecera, error: presError } = await supabase
      .from("presupuestos_cabecera")
      .insert({
        id_empresa: dbUser.id_empresa,
        id_usuario_creador: user.id,
        id_cliente: clienteId,
        numero_presupuesto: numeroPresupuesto,
        nombre_feria: nombreFeria,
        m2_superficie: Number(m2),
        altura_stand_m: Number(altura || 2.50),
        tipo_stand: tipoStand || "modular",
        estilo_stand: estiloStand || "moderno",
        metodo_presupuestacion: "metodo_2_bloques",
        input_ia_tipo: contentType,
        input_ia_contenido: promptText || (audioUrl ? "Audio descriptivo" : ""),
        subtotal_construccion: subConstruccion,
        subtotal_servicios_feria: subServicios,
        subtotal_diseno_grafica: subDiseno,
        subtotal_transporte_mo: subTransporte,
        base_imponible: baseImponible,
        importe_iva: importeIva,
        total_presupuesto: total,
        estado_presupuesto: "borrador",
        notas_internas: output?.mensaje_cliente || parsedOutput
      })
      .select()
      .single()

    if (presError) {
      console.error("Error al guardar presupuesto en BD:", presError)
      throw new Error(`No se pudo guardar el presupuesto en la base de datos: ${presError.message || JSON.stringify(presError)}`)
    }

    // Procesar partidas individuales del output de Jarvis
    const partidas: PartidaPresupuesto[] = output?.partidas ?? []
    if (partidas.length > 0) {
      const lineasPayload = partidas.map((p) => ({
        id_presupuesto: presCabecera.id,
        orden: p.numero,
        id_categoria_matriz: mapearCategoria(p.categoria),
        origen_concepto: "ia_generado",
        concepto_descripcion: p.concepto,
        cantidad: Number(p.cantidad || 1),
        unidad: p.unidad || "ud",
        precio_unitario_venta: Number(p.precio_unitario || 0),
        total_linea: Number(p.total || 0),
        es_concepto_nuevo: true,
      }))

      const { error: lineasError } = await supabase
        .from("presupuestos_lineas")
        .insert(lineasPayload)

      if (lineasError) {
        console.error("Error al insertar líneas del presupuesto:", lineasError)
      } else {
        console.log(`${lineasPayload.length} líneas insertadas correctamente`)
      }
    } else {
      // Fallback: insertar líneas macro de resumen cuando no vienen partidas detalladas
      const lineasMacro = [
        { concepto: "Construcción y estructura stand", total: subConstruccion, catId: 1 },
        { concepto: "Servicios técnicos feriales", total: subServicios, catId: 12 },
        { concepto: "Diseño, gráfica y renders 3D", total: subDiseno, catId: 14 },
        { concepto: "Transporte, logística y montaje", total: subTransporte, catId: 10 },
      ].filter(l => l.total > 0)

      if (lineasMacro.length > 0) {
        const lineasPayload = lineasMacro.map((l, idx) => ({
          id_presupuesto: presCabecera.id,
          orden: idx + 1,
          id_categoria_matriz: l.catId,
          origen_concepto: "ia_generado",
          concepto_descripcion: l.concepto,
          cantidad: 1,
          unidad: "ud",
          precio_unitario_venta: l.total,
          total_linea: l.total,
          es_concepto_nuevo: false,
        }))

        const { error: lineasError } = await supabase
          .from("presupuestos_lineas")
          .insert(lineasPayload)

        if (lineasError) {
          console.error("Error al insertar líneas macro:", lineasError)
        }
      }
    }

    // Disparar asíncronamente la generación de imagen en n8n (solo si no hay imagen ni audio de entrada)
    if (!imageUrl && !audioUrl) {
      console.log("Disparando generación de imagen asíncrona...");
      const imageUrlWebhook = process.env.N8N_IMAGE_GEN_WEBHOOK || "https://n8n.cheosdesign.info/webhook/generate-stand-image"
      fetch(imageUrlWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presupuestoId: presCabecera.id,
          prompt: `Photorealistic exhibition stand. Ultra realistic. 3D render. Trade show booth. Professional lighting. Architectural visualization. 8k. ${promptText || (typeof parsedOutput === 'object' ? parsedOutput.mensaje_cliente : '')}`
        })
      }).catch(err => console.error("Error al disparar webhook de imagen:", err));
    }

    return NextResponse.json({ 
      success: true, 
      output: output?.mensaje_cliente || parsedOutput,
      imagen_url: imageUrl || output?.imagen_url || null,
      presupuestoId: presCabecera.id,
      lineasInsertadas: partidas.length || 0
    })
  } catch (error: any) {
    console.error("Error en API generate-budget:", error)
    return NextResponse.json({ 
      error: error?.message || "Ocurrió un error al procesar el presupuesto con la IA" 
    }, { status: 500 })
  }
}
