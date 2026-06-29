# Instrucciones Pendientes — The Titan

## 1. Persistencia del Kanban (¡RESUELTO Y FUNCIONANDO! ✅)

### Corrección aplicada
1. **Inicialización de Supabase Client:** Se descubrió que el cliente de Supabase se estaba instanciando a nivel de módulo (`const supabase = createClient()` fuera del componente). Esto provocaba que se ejecutaran llamadas sin sesión activa. Se movió dentro del componente utilizando `useMemo(() => createClient(), [])`.
2. **Cuenta del usuario:** El usuario cambió de cuenta a `echosoubilling@gmail.com` (asociada a la empresa correspondiente de los proyectos en base de datos), permitiendo que la persistencia en Supabase sea exitosa y se dejen de usar datos mock.

### Estado actual
El drag & drop actualiza correctamente la columna en la tabla `proyectos_operaciones` de Supabase al instante y los cambios persisten después de recargar la página.

### Sugerencia para persistencia definitiva en producción
Crear un trigger SQL que cree automáticamente un proyecto cuando un presupuesto pasa a `aceptado`:

```sql
CREATE OR REPLACE FUNCTION public.auto_crear_proyecto()
RETURNS trigger AS $$
BEGIN
  IF NEW.estado_presupuesto = 'aceptado' AND OLD.estado_presupuesto != 'aceptado' THEN
    INSERT INTO public.proyectos_operaciones (
      id_empresa, codigo_proyecto_interno, estado_proyecto, id_presupuesto_origen
    ) VALUES (
      NEW.id_empresa,
      'OP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEW.id::text, 4, '0'),
      'pendiente',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_crear_proyecto
  AFTER UPDATE ON public.presupuestos_cabecera
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_crear_proyecto();
```

---

## 2. Modal de cierre (no se abre con datos mock)

### Causa
El código tiene `if (proyecto && !proyecto.id.startsWith("mock-"))` — los proyectos mock se excluyen a propósito. Solo se abre con proyectos reales de la BD.

### Solución
Una vez ejecutes el INSERT de proyectos reales del paso 1, el modal funcionará al arrastrar una card a la columna "Finalizado".

---

## 3. Botones Sync Qdrant en Catálogos (no probado)

### Dependencias
- Los webhooks `sync-catalogo-b-v1` y `sync-catalogo-c-v1` deben estar activos en n8n
- El flujo de cierre `proyecto-cerrado-v1` debe estar activo en n8n
- Las env vars en `.env.local` ya están configuradas

### Verificar en n8n
Los 3 flujos deben estar en estado "Active":
1. `sync-catalogo-b-v1` (en `/flujosn8n/sync_catalogo_b_qdrant.json`)
2. `sync-catalogo-c-v1` (en `/flujosn8n/sync_catalogo_c_qdrant.json`)
3. `proyecto-cerrado-v1` (en `/flujosn8n/cierre_proyecto_qdrant.json`)

Asegúrate de importarlos en n8n si no lo están.

---

## 4. Tarea 4 — Añadir Tool Base C en n8n (manual)

En el flujo "Stands Feriales — Agente Jarvis" de n8n:

### 4.1 Crear tool HTTP
- **Nombre**: `consultar_despiece_taller`
- **Descripción**: Descarga el catálogo completo de materiales técnicos y tarifas de mano de obra del taller (Base C). Usar para desglose técnico (Método 3).
- **Método**: GET
- **URL**:
  ```
  https://iqrwhycmgprkfbhuxlnn.supabase.co/rest/v1/tarifas_servicios?select=nombre_tecnico,descripcion_compra,id_categoria_matriz,unidad_medida,precio_coste_unidad_medida,unidad_tiempo,precio_unidad_tiempo,aplica_coeficiente_desperdicio,coeficiente_desperdicio,requiere_homologacion_previa,incremento_urgencia_porcentaje&estado_tarifa=eq.activa&order=id_categoria_matriz.asc
  ```
- **Headers**:
  - `apikey`: {SUPABASE_ANON_KEY}
  - `Authorization`: Bearer {SUPABASE_ANON_KEY}

### 4.2 Actualizar System Message de Jarvis
Añadir al final del mensaje del sistema:

```
MÉTODO 3 — DESPIECE TÉCNICO:
Cuando el usuario pida presupuesto detallado, usar la tool 'consultar_despiece_taller'.

Para calcular precio de venta desde el coste:
  precio_venta = precio_coste / (1 - margen_objetivo)
  Margen objetivo: Modular 30%, Carpintería 35%, Híbrido 32%, Doble planta 38%

Para materiales con aplica_coeficiente_desperdicio = true:
  cantidad_a_comprar = cantidad_diseño × coeficiente_desperdicio
```

---

## 5. Tarea 6 — DB Webhooks Supabase (manual)

En supabase.com → Database → Webhooks → Create a new hook:

| Hook | Tabla | Eventos | URL |
|---|---|---|---|
| auto_sync_catalogo_b | catalogo_elementos | INSERT, UPDATE | `https://n8n.cheosdesign.info/webhook/sync-catalogo-b-v1` |
| auto_sync_catalogo_c | tarifas_servicios | INSERT, UPDATE | `https://n8n.cheosdesign.info/webhook/sync-catalogo-c-v1` |

Headers de ambos: `Content-Type: application/json`

---

## 6. Resumen: qué funciona y qué no

### ✅ Funciona ya
- CHECK constraint de `estado_proyecto` migrado a valores Kanban
- Botones "Sync Qdrant" en Catálogos B y C (conectan con n8n)
- Modal de cierre con cálculos en vivo (se abre con proyectos reales)
- Drag & drop persiste en Supabase (con proyectos reales)
- Env vars configuradas en `.env.local`
- Seed Base C ejecutado (34 tarifas de servicio insertadas)
- Tipos y constantes compartidos en `/types/` y `/constants/`
- Componente StatusBadge compartido
- Timeline de hitos con tooltips en detalle de proyecto — `/dashboard/proyectos/[id]`
- Trigger SQL para auto-creación de proyecto + 8 hitos al aceptar presupuesto — `Fix_Sqls/fix_crear_proyecto_desde_presupuesto.sql`
- Botón "Marcar Completado" en hitos con persistencia Supabase y efectos secundarios (montaje, cobro final)

### ❌ Requiere acción tuya
~~1. Importar/activar los 3 flujos n8n si no lo están~~
~~2. Añadir Tool Base C en n8n (paso 4)~~
~~3. Crear DB Webhooks en Supabase (paso 5)~~

✅ **Todo completado — No hay acciones manuales pendientes. Siguiente fase: SaaS y Escala (Fase 4).**

### ✅ Resuelto en Fase 2 / Fase 2.5
- Trigger SQL `fix_crear_proyecto_desde_presupuesto.sql` — Ejecutado en Supabase.
- Vista detalle de proyecto con timeline de 8 hitos — Implementada y funcionando.
- Tooltips descriptivos por cada hito — Implementados.
- Actualización de estado de hitos (Completado) con persistencia Supabase — Funcionando.
- Workflows n8n `sync-catalogo-b-v1`, `sync-catalogo-c-v1`, `proyecto-cerrado-v1` — Importados y activos.
- Tool `consultar_despiece_taller` añadida al Agente Jarvis + System Message Método 3 actualizado.
- DB Webhooks en Supabase (`auto_sync_catalogo_b`, `auto_sync_catalogo_c`) — Configurados y activos.

### ✅ Resuelto en Fase 3 (Módulo Financiero)
- **Sprint 1 (Facturación de Clientes):** Formulario de emisión de facturas a clientes con número secuencial autogenerado (`rpc('generar_numero_factura')`), IVA dinámico del presupuesto de origen, validación asíncrona de facturación acumulada <= 100%, cambio de estado (pendiente/cobrada/impagada) y lógica de bloqueo automático de clientes deudores (solo para rol admin).
- **Sprint 2 (Facturas de Proveedores):** Formulario de 2 pasos (Cabecera + Líneas con imputación a Proyecto y Categoría de Matriz), listado de facturas de proveedores, y acciones para pagar, disputar o revertir estado.
- **Sprint 3 (Analítica de Cash Flow):** Tarjetas de previsión de cobros a 30, 60 y 90 días, gráfico de barras horizontales de ingresos vs gastos reales ejecutados en los últimos 6 meses (CSS puro sin librerías externas), y sección de alertas para vencimientos urgentes de facturas en los próximos 14 días.
- **Sprint 4 (Cierre de Proyectos):** Listado de proyectos finalizados sin cierre, modal de cierre económico con visualización en tiempo real de rentabilidad (Presupuesto original vs Cobrado vs Gastos reales de proveedores y margen bruto real), valoración interactiva del cliente por estrellas (1 a 5), campo para lecciones aprendidas y envío automático al webhook `proyecto-cerrado-v1` de n8n.
- **Bugs resueltos:** Bug de `ReferenceError: base_imponible` resuelto en inserts de facturas de clientes y proveedores; se añadió la columna `updated_at` a la tabla `facturas_proyectos` para corregir la actualización mediante trigger SQL; se corrigió la respuesta del array `clientes` en los joins de Supabase en la página de finanzas y se eliminaron los `DialogTrigger asChild` redundantes para asegurar compatibilidad de tipos TS.
