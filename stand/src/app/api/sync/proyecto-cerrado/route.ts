import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const baseUrl = process.env.N8N_WEBHOOK_BASE_URL || "https://n8n.cheosdesign.info/webhook"

  const response = await fetch(`${baseUrl}/proyecto-cerrado-v1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    return NextResponse.json({ error: "Error al notificar cierre a n8n" }, { status: 500 })
  }

  const data = await response.json().catch(() => ({ success: true }))
  return NextResponse.json(data)
}
