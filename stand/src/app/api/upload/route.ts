import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: dbUser } = await supabase
      .from("usuarios")
      .select("id_empresa")
      .eq("id", user.id)
      .single()

    if (!dbUser) {
      return NextResponse.json({ error: "Perfil de usuario no encontrado" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const tipo = formData.get("tipo") as string || "imagen"

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })
    }

    const validImageTypes = ["image/png", "image/jpeg", "image/webp"]
    const validAudioTypes = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg"]
    const validTypes = [...validImageTypes, ...validAudioTypes]

    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: `Tipo de archivo no soportado: ${file.type}` }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo supera el límite de 10MB" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || (tipo === "audio" ? "webm" : "jpg")
    const timestamp = Date.now()
    const fileName = `${dbUser.id_empresa}/${tipo}/${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    // Usar service_role key para subir archivos (bypassea RLS)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("stand-uploads")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Error uploading to storage:", uploadError)
      return NextResponse.json({ error: "Error al subir el archivo: " + uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("stand-uploads")
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName,
      tipo,
    })
  } catch (error: any) {
    console.error("Error en API upload:", error)
    return NextResponse.json({ error: error?.message || "Error al procesar la subida" }, { status: 500 })
  }
}
