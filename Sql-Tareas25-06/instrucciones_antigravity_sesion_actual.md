# The Titan — Documento Técnico de Tareas
## Instrucciones para Antigravity | Sesión actual

> Consultar siempre el Plan-Maestro.md antes de implementar cualquier cambio.
> Este documento tiene prioridad sobre conversaciones anteriores cuando haya conflicto.

---

## TAREA 1 — Crítica: Migrar enum `estado_proyecto` y persistir Kanban

### Contexto
El Kanban de Proyectos tiene 5 columnas visuales pero la base de datos tiene un CHECK constraint con valores distintos. El drag & drop actualmente NO persiste en Supabase — al recargar la página los proyectos vuelven a su posición original.

### 1.1 Ejecutar migración SQL en Supabase

Ejecutar en este orden exacto en el SQL Editor de Supabase:

```sql
-- PASO 1: Migrar valores existentes ANTES de cambiar el constraint
UPDATE public.proyectos_operaciones
SET estado_proyecto = CASE estado_proyecto
  WHEN 'en_produccion' THEN 'fabricacion'
  WHEN 'en_montaje'    THEN 'montaje'
  WHEN 'en_feria'      THEN 'montaje'
  WHEN 'desmontado'    THEN 'finalizado'
  WHEN 'cerrado'       THEN 'finalizado'
  WHEN 'cancelado'     THEN 'cancelado'
  ELSE 'pendiente'
END;

-- PASO 2: Eliminar el constraint antiguo
ALTER TABLE public.proyectos_operaciones
DROP CONSTRAINT IF EXISTS proyectos_operaciones_estado_proyecto_check;

-- PASO 3: Añadir el nuevo constraint alineado con el Kanban
ALTER TABLE public.proyectos_operaciones
ADD CONSTRAINT proyectos_operaciones_estado_proyecto_check
CHECK (estado_proyecto IN (
  'pendiente',
  'diseno',
  'fabricacion',
  'montaje',
  'finalizado',
  'cancelado'
));

-- PASO 4: Verificar
SELECT estado_proyecto, COUNT(*) 
FROM public.proyectos_operaciones 
GROUP BY estado_proyecto;
```

### 1.2 Mapeo columnas Kanban → valores DB

```typescript
// /constants/enums.ts — ACTUALIZAR este objeto
export const KANBAN_COLUMNAS = [
  { id: 'pendiente',   label: 'Pendiente',   color: 'gray'   },
  { id: 'diseno',      label: 'Diseño',      color: 'blue'   },
  { id: 'fabricacion', label: 'Fabricación', color: 'yellow' },
  { id: 'montaje',     label: 'Montaje',     color: 'purple' },
  { id: 'finalizado',  label: 'Finalizado',  color: 'green'  },
] as const;

export type EstadoProyecto = 
  'pendiente' | 'diseno' | 'fabricacion' | 'montaje' | 'finalizado' | 'cancelado';
```

### 1.3 Persistir el drag & drop en Supabase

En el handler del drop event del Kanban, añadir la llamada a Supabase:

```typescript
// En el componente KanbanBoard o donde se gestione el onDragEnd
const handleDragEnd = async (result: DropResult) => {
  const { draggableId, destination, source } = result;

  // Si no hay destino o es la misma columna, no hacer nada
  if (!destination || destination.droppableId === source.droppableId) return;

  const nuevoEstado = destination.droppableId as EstadoProyecto;
  const idProyecto = draggableId;

  // 1. Actualizar UI optimistamente (ya lo hace el estado local)
  // 2. Persistir en Supabase
  const { error } = await supabase
    .from('proyectos_operaciones')
    .update({ 
      estado_proyecto: nuevoEstado,
      updated_at: new Date().toISOString()
    })
    .eq('id', idProyecto);

  if (error) {
    console.error('Error actualizando estado proyecto:', error);
    // Revertir el estado local si falla
    // (implementar rollback según la librería de drag & drop usada)
    toast.error('Error al actualizar el estado del proyecto');
    return;
  }

  // 3. Si llega a "finalizado", disparar flujo de cierre
  if (nuevoEstado === 'finalizado') {
    abrirModalCierre(idProyecto);
  }
};
```

---

## TAREA 2 — Importante: Flujo de cierre de proyecto

### Contexto
Cuando una card llega a la columna "Finalizado", hay que ejecutar tres acciones encadenadas:
1. Mostrar un modal para capturar la valoración del cliente y lecciones aprendidas
2. Insertar en `cierres_proyectos`
3. Llamar al webhook de n8n para vectorizar el proyecto en Qdrant (Jarvis aprende)

### 2.1 Modal de cierre

Mostrar automáticamente al hacer drop en columna "Finalizado":

```typescript
// Campos del modal
interface CierreProyectoForm {
  valoracion_cliente: 1 | 2 | 3 | 4 | 5;      // Estrellas
  lecciones_aprendidas: string;                  // Textarea libre
  ingreso_total_real: number;                    // Importe real cobrado
  gasto_total_real: number;                      // Coste real total
}
```

El modal debe calcular y mostrar en tiempo real:
- Margen bruto: `ingreso - gasto`
- Margen %: `((ingreso - gasto) / ingreso) * 100`
- Comparación vs presupuesto original (leer de `presupuestos_cabecera.total_presupuesto`)

### 2.2 Al confirmar el cierre

```typescript
const cerrarProyecto = async (idProyecto: string, form: CierreProyectoForm) => {
  const margenBruto = form.ingreso_total_real - form.gasto_total_real;
  const margenPct = (margenBruto / form.ingreso_total_real) * 100;

  // 1. INSERT en cierres_proyectos
  const { error: errorCierre } = await supabase
    .from('cierres_proyectos')
    .insert({
      id_proyecto: idProyecto,
      ingreso_total_real: form.ingreso_total_real,
      gasto_total_real: form.gasto_total_real,
      margen_real_porcentaje: Number(margenPct.toFixed(2)),
      presupuesto_original: presupuestoOriginal, // leer de presupuestos_cabecera
      valoracion_cliente: form.valoracion_cliente,
      lecciones_aprendidas: form.lecciones_aprendidas,
      fecha_cierre_oficial: new Date().toISOString().split('T')[0]
    });

  if (errorCierre) throw errorCierre;

  // 2. Llamar webhook n8n — vectoriza en Qdrant proyectos_historicos
  // Jarvis aprenderá de este proyecto para futuros presupuestos
  await fetch(`${process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE_URL}/proyecto-cerrado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_proyecto: idProyecto })
  });

  toast.success('Proyecto cerrado. Jarvis ha aprendido de este proyecto.');
};
```

### 2.3 Variables de entorno necesarias

Verificar que existen en `.env.local`:
```
NEXT_PUBLIC_N8N_WEBHOOK_BASE_URL=https://n8n.cheosdesign.info/webhook
```

---

## TAREA 3 — Base C: Poblar `tarifas_servicios`

### Contexto
La tabla `tarifas_servicios` está vacía. Se ha generado un seed SQL con ~35 filas de datos de mercado reales. **Ejecutar el archivo `seed_tarifas_servicios_base_c.sql`** en el SQL Editor de Supabase.

Después de ejecutar el seed, lanzar el webhook de sincronización para indexar en Qdrant:

```bash
curl -X POST https://n8n.cheosdesign.info/webhook/sync-catalogo-c \
  -H "Content-Type: application/json" \
  -d '{"id_empresa": "6cf17d47-da2f-4bd4-87b1-4c2d21773a8b"}'
```

---

## TAREA 4 — Jarvis: Añadir Tool Base C

### Contexto
Una vez que `tarifas_servicios` tiene datos, hay que añadir un nuevo Tool al agente Jarvis en n8n para que pueda hacer desgloses técnicos precisos (Método 3).

### 4.1 Nuevo Tool: `consultar_despiece_taller`

En el flujo de n8n de Jarvis (`Stands Feriales — Agente Jarvis`), añadir un nuevo `toolHttpRequest` conectado al AI Agent:

```
Nombre:      consultar_despiece_taller
Descripción: Descarga el catálogo completo de materiales técnicos 
             y tarifas de mano de obra del taller (Base C). 
             Usar cuando el usuario pida un desglose técnico riguroso, 
             presupuesto de Método 3, o cuando necesites precios de 
             materias primas específicas (tableros, lacas, herrajes, 
             horas de oficial). NO usar para estimaciones rápidas — 
             para eso usar Base A.

Método:      GET
URL:         {SUPABASE_URL}/rest/v1/tarifas_servicios
             ?select=nombre_tecnico,descripcion_compra,id_categoria_matriz,
                     unidad_medida,precio_coste_unidad_medida,
                     unidad_tiempo,precio_unidad_tiempo,
                     aplica_coeficiente_desperdicio,coeficiente_desperdicio,
                     requiere_homologacion_previa,incremento_urgencia_porcentaje
             &estado_tarifa=eq.activa
             &order=id_categoria_matriz.asc

Headers:     apikey: {SUPABASE_ANON_KEY}
             Authorization: Bearer {SUPABASE_ANON_KEY}
```

### 4.2 Actualizar el System Message de Jarvis

Añadir al final del system message actual:

```
MÉTODO 3 — DESPIECE TÉCNICO:
Cuando el usuario pida presupuesto detallado, desglose de taller o 
Método 3, usar la tool 'consultar_despiece_taller' para obtener 
los costes reales de materias primas y mano de obra.

Para calcular el precio de venta desde el coste:
  precio_venta = precio_coste / (1 - margen_objetivo)
  Margen objetivo por tipo:
    - Modular:           0.30 (30%)
    - Carpintería:       0.35 (35%)
    - Híbrido:           0.32 (32%)
    - Doble planta:      0.38 (38%)

Para materiales con aplica_coeficiente_desperdicio = true:
  cantidad_a_comprar = cantidad_diseño × coeficiente_desperdicio
  
Si la fecha de feria es menor a 21 días desde hoy:
  aplicar incremento_urgencia_porcentaje sobre materiales y MO.
```

---

## TAREA 5 — Botones de Sync en módulo Catálogos

### Contexto
Los workflows de Sync de n8n (Catálogos B y C) se activan por webhook. El módulo de Catálogos debe tener botones que los disparen desde la UI.

### 5.1 En la página `/dashboard/catalogos`

Añadir en la sección de cada catálogo:

```typescript
// Botón Sync Catálogo B
const sincronizarCatalogoB = async () => {
  setLoadingB(true);
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE_URL}/sync-catalogo-b`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_empresa: empresaId })
      }
    );
    const data = await res.json();
    toast.success(`✅ ${data.elementos_indexados} elementos sincronizados con Qdrant`);
  } catch (e) {
    toast.error('Error al sincronizar con Qdrant');
  } finally {
    setLoadingB(false);
  }
};

// Botón Sync Catálogo C — idéntico pero con /sync-catalogo-c
```

Los botones deben mostrar:
- Estado de carga mientras el webhook procesa (puede tardar 20-60s según el número de elementos)
- Badge en cada elemento mostrando si `indexado_qdrant = true` (verde) o `false` (gris)

---

## TAREA 6 — Supabase DB Webhooks (automático)

### Contexto
Para que cada nuevo elemento del catálogo se indexe automáticamente en Qdrant sin necesidad de pulsar el botón de sync, configurar webhooks en Supabase.

### Configuración en Supabase Dashboard

Ir a: **Database → Webhooks → Create a new hook**

**Hook 1 — Auto-sync Catálogo B:**
```
Nombre:   auto_sync_catalogo_b
Tabla:    catalogo_elementos
Eventos:  INSERT, UPDATE
URL:      https://n8n.cheosdesign.info/webhook/sync-catalogo-b
Method:   POST
Headers:  Content-Type: application/json
```

**Hook 2 — Auto-sync Catálogo C:**
```
Nombre:   auto_sync_catalogo_c
Tabla:    tarifas_servicios
Eventos:  INSERT, UPDATE
URL:      https://n8n.cheosdesign.info/webhook/sync-catalogo-c
Method:   POST
Headers:  Content-Type: application/json
```

> Nota: El payload de Supabase DB Webhook incluye `{ record: { id_empresa, ... } }`.
> Los workflows de n8n ya están preparados para recibir tanto el body manual 
> `{ id_empresa }` como el payload automático de Supabase con `record.id_empresa`.
> Verificar el nodo "Split Elementos" en cada workflow si hay errores.

---

## Estado actualizado del proyecto

```
FASE 1 — MVP Core
  ✅ Auth + Login
  ✅ Dashboard con KPIs
  ✅ CRM Clientes
  ✅ Presustand IA (Jarvis + imagen Fal.ai)
  ✅ Proyectos Kanban (visual)
  ✅ Proyectos Kanban (persistencia DB) ← TAREA 1 (Completado y persistiendo en Supabase al usar la cuenta adecuada)
  🔧 Cierre de proyecto con modal       ← TAREA 2
  ✅ Catálogos Base A y B

FASE 2 — Completar core
  🔧 Base C seed + Tool Jarvis          ← TAREAS 3 y 4
  🔧 Botones Sync en Catálogos          ← TAREA 5
  🔧 DB Webhooks Supabase               ← TAREA 6
  🔲 Timeline de hitos por proyecto
  🔲 Vista detalle de proyecto

FASE 3 — Finanzas
  🔲 Facturas a clientes
  🔲 Facturas de proveedores
  🔲 Dashboard cash flow
  🔲 PDF de presupuesto
```

---

*Documento generado el 25/06/2026 — The Titan arquitectura v1.0*
*Fuente de verdad: Plan-Maestro.md + este documento*
