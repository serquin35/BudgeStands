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
    
    // Llamar a n8n Jarvis
    const n8nResponse = await fetch("https://n8n.cheosdesign.info/webhook/stand-budget-agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: user.id,
        empresaId: dbUser.id_empresa,
        clienteId,
        numeroPresupuesto,
        nombreFeria,
        m2: Number(m2),
        altura: Number(altura || 2.50),
        tipoStand: tipoStand || "modular",
        estiloStand: estiloStand || "moderno",
        promptText,
        imageUrl: imageUrl || ""
      })
    })

    if (!n8nResponse.ok) {
      throw new Error(`Error en el servicio IA de n8n: ${n8nResponse.statusText}`)
    }

    const aiResult = await n8nResponse.json()
    console.log("Respuesta de n8n recibida exitosamente:", aiResult)

    // Nota: El webhook de n8n puede insertar directamente en la base de datos,
    // o bien devolvernos el presupuesto estructurado para insertarlo nosotros.
    // Asumiremos que el webhook nos devuelve un objeto presupuesto con:
    // { subtotal_construccion, subtotal_servicios_feria, subtotal_diseno_grafica, subtotal_transporte_mo, base_imponible, importe_iva, total_presupuesto, partidas: [...] }
    
    // Si n8n ya hizo la inserción en la base de datos por su cuenta, nos devolverá el id del presupuesto.
    if (aiResult.id || aiResult.presupuestoId) {
      return NextResponse.json({ 
        success: true, 
        presupuestoId: aiResult.id || aiResult.presupuestoId 
      })
    }

    // Si no lo insertó, lo insertamos nosotros en base a lo que nos devolvió
    const subtotalConstruccion = Number(aiResult.subtotal_construccion || m2 * 350)
    const subtotalServicios = Number(aiResult.subtotal_servicios_feria || m2 * 80)
    const subtotalDiseno = Number(aiResult.subtotal_diseno_grafica || 2500)
    const subtotalTransporte = Number(aiResult.subtotal_transporte_mo || m2 * 120)
    
    const baseImponible = subtotalConstruccion + subtotalServicios + subtotalDiseno + subtotalTransporte
    const importeIva = baseImponible * 0.21
    const totalPresupuesto = baseImponible + importeIva

    console.log("Insertando cabecera de presupuesto en Supabase...")
    const { data: insertedPres, error: insertError } = await supabase
      .from("presupuestos_cabecera")
      .insert([
        {
          id_empresa: dbUser.id_empresa,
          id_cliente: clienteId,
          id_usuario_creador: user.id,
          numero_presupuesto: numeroPresupuesto,
          nombre_feria: nombreFeria,
          m2_superficie: Number(m2),
          altura_stand_m: Number(altura || 2.50),
          tipo_stand: tipoStand || "modular",
          estilo_stand: estiloStand || "moderno",
          metodo_presupuestacion: "metodo_2_bloques",
          input_ia_tipo: imageUrl ? "imagen" : "texto",
          input_ia_contenido: promptText || imageUrl || "",
          subtotal_construccion: subtotalConstruccion,
          subtotal_servicios_feria: subtotalServicios,
          subtotal_diseno_grafica: subtotalDiseno,
          subtotal_transporte_mo: subtotalTransporte,
          base_imponible: baseImponible,
          importe_iva: importeIva,
          total_presupuesto: totalPresupuesto,
          estado_presupuesto: "en_espera",
          imagen_stand_url: aiResult.imagen_stand_url || imageUrl || ""
        }
      ])
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    console.log("Presupuesto cabecera insertado con ID:", insertedPres.id)

    // Insertar líneas de presupuesto si existen en el resultado de n8n
    const partidas = aiResult.partidas || [
      { categoria: "construccion", concepto: "Estructura de stand modular de aluminio", cantidad: m2, unidad: "m2", precio_unitario: 250, total: m2 * 250 },
      { categoria: "construccion", concepto: "Moqueta ferial bucle", cantidad: m2, unidad: "m2", precio_unitario: 12, total: m2 * 12 },
      { categoria: "iluminacion", concepto: "Focos LED carril 30W", cantidad: Math.ceil(m2 / 5), unidad: "ud", precio_unitario: 45, total: Math.ceil(m2 / 5) * 45 },
      { categoria: "servicios_feria", concepto: "Conexión eléctrica 3kW recinto", cantidad: 1, unidad: "ud", precio_unitario: 220, total: 220 },
      { categoria: "diseno", concepto: "Proyecto 3D y renders", cantidad: 1, unidad: "ud", precio_unitario: 850, total: 850 },
      { categoria: "transporte", concepto: "Transporte y logística", cantidad: 1, unidad: "ud", precio_unitario: 1200, total: 1200 },
      { categoria: "montaje", concepto: "Montaje y desmontaje stand", cantidad: 1, unidad: "ud", precio_unitario: 1800, total: 1800 }
    ]

    const lineasToInsert = partidas.map((p: any, idx: number) => ({
      id_presupuesto: insertedPres.id,
      orden: idx + 1,
      origen_concepto: "ia_generado",
      concepto_descripcion: p.concepto || "Concepto no especificado",
      cantidad: Number(p.cantidad || 1),
      unidad: p.unidad || "ud",
      precio_unitario_venta: Number(p.precio_unitario || 0),
      total_linea: Number(p.total || 0),
      notas_linea: p.notas || ""
    }))

    console.log(`Insertando ${lineasToInsert.length} líneas de presupuesto...`)
    const { error: lineasError } = await supabase
      .from("presupuestos_lineas")
      .insert(lineasToInsert)

    if (lineasError) {
      console.error("Error al insertar líneas de presupuesto:", lineasError)
    }

    return NextResponse.json({ 
      success: true, 
      presupuestoId: insertedPres.id 
    })
  } catch (error: any) {
    console.error("Error en API generate-budget:", error)
    return NextResponse.json({ 
      error: error?.message || "Ocurrió un error al procesar el presupuesto con la IA" 
    }, { status: 500 })
  }
}
