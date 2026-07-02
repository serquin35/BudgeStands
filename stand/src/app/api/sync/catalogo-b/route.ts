import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id_empresa } = body

    if (!id_empresa) {
      return NextResponse.json({ error: "id_empresa requerido" }, { status: 400 })
    }

    // Verificar que existan datos antes de sincronizar
    const supabase = createClient()
    const { count, error: countError } = await supabase
      .from("catalogo_elementos")
      .select("*", { count: "exact", head: true })
      .eq("id_empresa", id_empresa)

    if (countError) {
      console.error("Error consultando catálogo B:", countError)
      return NextResponse.json({ error: "Error al verificar datos del catálogo" }, { status: 500 })
    }

    if (!count || count === 0) {
      return NextResponse.json(
        { error: "No hay elementos en catálogo B para sincronizar", elementos_indexados: 0 },
        { status: 400 }
      )
    }

    // Llamar a n8n
    const baseUrl = process.env.N8N_WEBHOOK_BASE_URL || "https://n8n.cheosdesign.info/webhook"
    const response = await fetch(`${baseUrl}/sync-catalogo-b-v1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || "Error en sync con n8n" },
        { status: response.status }
      )
    }

    const data = await response.json().catch(() => ({ success: true }))
    return NextResponse.json(data)
  } catch (err: any) {
    console.error("Error en sync catalogo-b:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
