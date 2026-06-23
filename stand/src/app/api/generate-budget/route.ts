import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

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
      imageUrl 
    } = body

    if (!clienteId || !nombreFeria || !m2) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    // Generar un número de presupuesto secuencial o temporal
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    const numeroPresupuesto = `PRES-2026-${random.toString().padStart(4, "0")}`

    console.log("Enviando petición a n8n Jarvis...")
    
    // El payload que espera el Webhook de Jarvis según su nodo Switch
    const n8nPayload = {
      type: imageUrl ? "image" : "texto",
      content: imageUrl || promptText || "",
      feria: nombreFeria,
      m2: Number(m2),
      altura: Number(altura || 2.50),
      tipo_stand: tipoStand || "modular",
      estilo: estiloStand || "moderno",
      cliente: clienteId,
      presupuesto_max: 0 // opcional
    }

    // Llamar a n8n Jarvis
    const n8nResponse = await fetch("https://n8n.cheosdesign.info/webhook/stand-budget-agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(n8nPayload)
    })

    if (!n8nResponse.ok) {
      throw new Error(`Error en el servicio IA de n8n: ${n8nResponse.statusText}`)
    }

    const aiResult = await n8nResponse.json()
    console.log("Respuesta de n8n recibida exitosamente:", aiResult)

    let parsedOutput = aiResult.output;
    if (typeof parsedOutput === 'string') {
      try {
        parsedOutput = JSON.parse(parsedOutput);
      } catch (e) {
        console.warn("No se pudo parsear el output como JSON, se usará como texto", e);
      }
    }

    // Insertar el presupuesto en Supabase directamente desde Next.js
    // Esto es mucho más robusto que depender de la IA de n8n para hacer la inserción HTTP
    
    // Fallbacks en caso de que la IA no devuelva el JSON perfecto
    const subConstruccion = Number(parsedOutput?.subtotal_construccion || 0)
    const subServicios = Number(parsedOutput?.subtotal_servicios || 0)
    const subDiseno = Number(parsedOutput?.subtotal_diseno || 0)
    const subTransporte = Number(parsedOutput?.subtotal_transporte || 0)
    
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
        input_ia_tipo: imageUrl ? "image" : "texto",
        input_ia_contenido: promptText,
        subtotal_construccion: subConstruccion,
        subtotal_servicios_feria: subServicios,
        subtotal_diseno_grafica: subDiseno,
        subtotal_transporte_mo: subTransporte,
        base_imponible: baseImponible,
        importe_iva: importeIva,
        total_presupuesto: total,
        estado_presupuesto: "borrador",
        notas_internas: typeof parsedOutput === 'object' ? parsedOutput.mensaje_cliente : parsedOutput
      })
      .select()
      .single()

    if (presError) {
      console.error("Error al guardar presupuesto en BD:", presError)
      throw new Error(`No se pudo guardar el presupuesto en la base de datos: ${presError.message || JSON.stringify(presError)}`)
    }

    // Disparar asíncronamente la generación de imagen en n8n
    // Esto se ejecuta en segundo plano sin bloquear la respuesta a Next.js
    if (!imageUrl) {
      console.log("Disparando generación de imagen asíncrona...");
      fetch("https://n8n.cheosdesign.info/webhook/generate-stand-image", {
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
      output: typeof parsedOutput === 'object' ? parsedOutput.mensaje_cliente : parsedOutput,
      imagen_url: imageUrl || parsedOutput?.imagen_url || null,
      presupuestoId: presCabecera.id
    })
  } catch (error: any) {
    console.error("Error en API generate-budget:", error)
    return NextResponse.json({ 
      error: error?.message || "Ocurrió un error al procesar el presupuesto con la IA" 
    }, { status: 500 })
  }
}
