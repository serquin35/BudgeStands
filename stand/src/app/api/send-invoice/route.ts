import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { id_factura } = await req.json()

    if (!id_factura) {
      return NextResponse.json({ error: "id_factura is required" }, { status: 400 })
    }

    // Realizamos la llamada desde el servidor de Next.js para saltarnos los bloqueos CORS del navegador
    const response = await fetch("https://n8n.cheosdesign.info/webhook/enviar-factura-cliente-v1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id_factura })
    })

    if (response.ok) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "n8n webhook failed" }, { status: response.status })
    }
  } catch (error: any) {
    console.error("Error sending invoice via n8n:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
