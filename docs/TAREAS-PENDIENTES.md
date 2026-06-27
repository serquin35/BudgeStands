# Tareas Pendientes — Lo que debes hacer tú

## 1. Añadir `SUPABASE_SERVICE_ROLE_KEY` en Vercel (OBLIGATORIO)

La API de subida de archivos usa la **service role key** de Supabase en el servidor para subir a Storage. Esta clave **no va en GitHub** (`.env.local` está en `.gitignore`), pero sí necesita estar disponible en el entorno de producción.

1. Ir a [Vercel Dashboard](https://vercel.com/) → proyecto → **Settings** → **Environment Variables**
2. Añadir:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** (el valor que está en `stand/.env.local`, línea 3)
   - **Environments:** Production (y Development si quieres)
3. Guardar y redeploy

En **local** la clave ya está en `.env.local`, funciona sin cambios.

---

## 2. Verificar el Flujo n8n para Audio

La app ahora envía al webhook `stand-budget-agent`:

```json
{
  "type": "audio",
  "content": "https://...url-del-audio-en-supabase...",
  ...
}
```

**Tienes que verificar que el nodo Switch en n8n maneje correctamente `"audio"`**:
- El Switch debe tener un case para `type === "audio"`
- Ese case debe conectar a un nodo **Whisper** (STT) o similar
- La transcripción debe pasarse al LLM junto con los metadatos (feria, m², etc.)

Si el flujo n8n no tiene el nodo Whisper configurado, deberás añadirlo.

---

## 3. Verificar la Tool `consultar_despiece_taller` en n8n

Según `INSTRUCCIONES_PENDIENTES.md`, falta añadir esta tool HTTP al agente Jarvis para que pueda consultar el Catálogo C (tarifas de mano de obra y materiales). Esto es independiente de audio/imagen pero sigue pendiente.

---

## 4. Límites y Consideraciones

### Audio
- Máximo **10MB** por archivo
- Formato: `audio/webm` (grabado por el navegador)
- Se requiere **HTTPS** para acceder al micrófono (en localhost funciona, en producción con HTTPS también)
- Si el usuario deniega el permiso de micrófono, se muestra un mensaje explicativo

### Imagen
- Máximo **10MB** por archivo
- Formatos: PNG, JPG, WebP
- Se muestra preview antes de enviar

### Almacenamiento
- Los archivos se guardan en `stand-uploads/{id_empresa}/{tipo}/{timestamp}-{random}.{ext}`
- Son **públicos** (accesibles por cualquiera con la URL)
- No hay política de limpieza automática (los archivos viejos no se borran)

---

## 5. Prueba Manual Recomendada

1. Abrir la app en `https://presustand.vercel.app/dashboard/presustand`
2. Ir a la pestaña **IA**
3. Hacer clic en **Grabar audio** y hablar unos segundos
4. Detener la grabación → esperar a que suba
5. Opcional: añadir texto adicional
6. Hacer clic en **Generar con Jarvis IA**
7. Verificar que el presupuesto se crea correctamente

---

## 6. Despliegue

Los cambios de código ya están listos. Pasos:

1. Añadir `SUPABASE_SERVICE_ROLE_KEY` en Vercel (paso 1 arriba)
2. Commit y push:
```bash
git add .
git commit -m "feat: soporte de audio y subida de imagenes en generacion de presupuestos IA"
git push
```
3. Vercel desplegará automáticamente
