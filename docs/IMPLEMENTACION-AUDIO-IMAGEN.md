# Implementación: Soporte de Audio e Imagen (Upload) en Presustand IA

## Resumen

Se añadió la capacidad de grabar audio y subir archivos de imagen directamente desde el formulario de generación de presupuestos por IA, en lugar de solo pegar URLs de imagen.

## Cambios Realizados

### 1. Supabase Storage — Bucket `stand-uploads`

- **Bucket público** creado: `stand-uploads`
- **Límite:** 10MB por archivo
- **Tipos permitidos:** PNG, JPG, WebP (imagen) y WebM, MP4, MPEG, WAV, OGG (audio)
- Las URLs públicas se generan automáticamente tras la subida

### 2. Nueva API Route — `/api/upload`

**Archivo:** `stand/src/app/api/upload/route.ts`

- Recibe `multipart/form-data` con campos `file` y `tipo` ("imagen" | "audio")
- Valida autenticación del usuario
- Valida tipo MIME y tamaño del archivo
- Sube a Supabase Storage usando `service_role`
- Devuelve `{ success: true, url: "https://...", fileName: "...", tipo: "..." }`

### 3. Nuevo Componente — `ImageUploader`

**Archivo:** `stand/src/components/shared/image-uploader.tsx`

- Reemplaza el antiguo `<Input>` de texto para URL por un **file picker visual**
- Drag & drop / click para seleccionar archivo
- Preview con miniatura de la imagen seleccionada
- Botón para eliminar imagen
- Indicador de progreso durante la subida

### 4. Nuevo Componente — `AudioRecorder`

**Archivo:** `stand/src/components/shared/audio-recorder.tsx`

- Botón "Grabar audio" que solicita permisos de micrófono
- Usa `MediaRecorder` API del navegador (formato webm)
- Muestra tiempo de grabación en vivo
- Reproductor para escuchar la grabación antes de enviar
- Sube automáticamente a Supabase Storage al detener

### 5. API Route Actualizada — `/api/generate-budget`

**Archivo:** `stand/src/app/api/generate-budget/route.ts`

- Nuevo campo: `audioUrl` en el payload
- Lógica de selección de tipo:
  - `audioUrl` presente → `type: "audio"`, `content: audioUrl`
  - `imageUrl` presente → `type: "image"`, `content: imageUrl`
  - Solo texto → `type: "texto"`, `content: promptText`
- `input_ia_tipo` en Supabase ahora soporta "audio"
- No dispara generación de imagen si hay audio (innecesario)

### 6. Frontend Actualizado — `presustand/page.tsx`

**Archivo:** `stand/src/app/dashboard/presustand/page.tsx`

- Nuevo estado: `audioUrl`
- El formulario IA ahora muestra:
  1. Selector de audio (nuevo)
  2. Subida de imagen (reemplaza input texto)
  3. Prompt de texto (opcional si hay audio/imagen)
- El prompt de texto solo es `required` cuando no hay audio ni imagen
- `audioUrl` se envía al backend en el payload JSON

## Flujo de Datos

```
Usuario graba audio / sube imagen
        │
        ▼
  POST /api/upload
        │
        ▼
  Supabase Storage (stand-uploads)
        │
        ▼
  Devuelve URL pública
        │
        ▼
  POST /api/generate-budget { audioUrl / imageUrl, ... }
        │
        ▼
  POST n8n { type: "audio"|"image"|"texto", content: URL|texto, ... }
        │
        ▼
  n8n procesa según el tipo:
    - "audio" → Whisper (STT) → LLM
    - "image" → Visión LLM
    - "texto" → LLM directo
        │
        ▼
  Se guarda presupuesto en Supabase
```

## Archivos Nuevos

| Archivo | Propósito |
|---------|-----------|
| `stand/src/app/api/upload/route.ts` | API para subir archivos a Storage |
| `stand/src/components/shared/image-uploader.tsx` | Componente de subida de imágenes |
| `stand/src/components/shared/audio-recorder.tsx` | Componente de grabación de audio |
| `Fix_Sqls/fix_storage_rls_policies.sql` | Políticas RLS para Storage |

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `stand/src/app/api/generate-budget/route.ts` | Soporte para `audioUrl`, lógica de tipo mejorada |
| `stand/src/app/dashboard/presustand/page.tsx` | Nuevos imports, estado `audioUrl`, integración de componentes |

## Pruebas Realizadas

- [x] Subida de imagen a Supabase Storage
- [x] Grabación y subida de audio
- [x] Envío de `type: "image"` con URL a n8n
- [x] Envío de `type: "audio"` con URL a n8n
- [x] Prompt de texto opcional cuando hay audio/imagen
- [x] Trigger de creación de proyecto al aceptar presupuesto
- [x] Prevención de duplicados en proyectos
