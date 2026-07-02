import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // 2. Obtener empresa del usuario
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
    const idProyecto = formData.get("id_proyecto") as string | null

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })
    }

    if (!idProyecto) {
      return NextResponse.json({ error: "ID de proyecto no especificado" }, { status: 400 })
    }

    // 3. Verificar que el proyecto pertenece a la empresa del usuario
    const { data: proyecto, error: proyectoError } = await supabase
      .from("proyectos_operaciones")
      .select("id, id_empresa")
      .eq("id", idProyecto)
      .single()

    if (proyectoError || !proyecto) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })
    }

    if (proyecto.id_empresa !== dbUser.id_empresa) {
      return NextResponse.json({ error: "Acceso denegado a este proyecto" }, { status: 403 })
    }

    // 4. Validar tipo de archivo
    const invalidTypes = [
      "text/html",
      "text/javascript",
      "application/x-javascript",
      "application/javascript",
      "application/ecmascript",
      "application/x-sh",
      "application/x-msdownload", // exe
      "application/x-executable",
    ]

    if (invalidTypes.includes(file.type)) {
      return NextResponse.json({ error: `Tipo de archivo no permitido por seguridad: ${file.type}` }, { status: 400 })
    }

    // Límite de 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo supera el límite de 10MB" }, { status: 400 })
    }

    // Sanitizar nombre de archivo
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const timestamp = Date.now()
    const relativePath = `${idProyecto}/${timestamp}-${safeName}`

    const buffer = Buffer.from(await file.arrayBuffer())

    // Usar service_role para la subida al Storage
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({
        error: "Error de configuración: la variable SUPABASE_SERVICE_ROLE_KEY no está definida."
      }, { status: 500 })
    }

    const storageUrl = `${supabaseUrl}/storage/v1/object/canal-b2b/${relativePath}`
    const uploadResp = await fetch(storageUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": file.type,
      },
      body: buffer,
    })

    if (!uploadResp.ok) {
      const errText = await uploadResp.text()
      console.error("Storage upload error B2B:", uploadResp.status, errText)
      return NextResponse.json({ error: `Error al subir el archivo (código ${uploadResp.status})` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      path: relativePath,
      name: file.name,
      size: file.size,
      type: file.type
    })
  } catch (error: any) {
    console.error("Error en API upload-b2b:", error)
    return NextResponse.json({ error: error?.message || "Error al procesar la subida" }, { status: 500 })
  }
}
