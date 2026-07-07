# The Titan — Historial de Detalles Técnicos y Decisiones de Diseño

Este documento consolida el historial de decisiones de diseño, especificaciones de arquitectura, fórmulas matemáticas, y flujos de integración que fueron implementados en fases anteriores del desarrollo del ERP/SaaS **The Titan**.

---

## 1. Visión por IA y Formulación de Datos (Presustand IA)

### 1.1 Limitaciones Físicas y del Modelo en la Estimación Visual
Durante la conceptualización del análisis de stands mediante visión artificial (usando `gpt-4o` en n8n), se detectó que el modelo no tiene la capacidad de estimar con precisión matemática los metros cuadrados ($m^2$) o la altura del stand de forma aislada a menos que posea referencias físicas de escala (personas, puertas, paneles de 1x2.5m).

Por ello, se determinó la **regla de diseño**:
* El formulario del frontend (`/dashboard/presustand`) solicita de manera explícita y obligatoria el área en metros cuadrados ($m^2$) del stand, mientras que el análisis por IA de la imagen se utiliza exclusivamente para extraer el estilo, la complejidad/densidad, los materiales visibles y los elementos destacados.

### 1.2 Configuración del Nodo de Visión GPT-4o (Jarvis en n8n)
La configuración del payload para el nodo de visión en n8n utiliza un límite de `max_tokens: 1200` y está estructurada de la siguiente manera:

```json
{
  "model": "gpt-4o",
  "max_tokens": 1200,
  "messages": [
    {
      "role": "system",
      "content": "Eres un experto en analisis de stands feriales y construccion de presupuestos. Analiza la imagen de un stand y extrae la siguiente informacion en formato JSON. Responde UNICAMENTE JSON valido, sin markdown, sin explicaciones. Si un campo no es detectable, usa null. Para m2_estimado: si ves elementos de escala conocida (personas, puertas, paneles modulares de 1x2.5m), estima. Si no, usa null.\n\nJSON esperado:\n{\n  \"tipo_stand\": \"modular|carpinteria_diseno|hibrido|doble_planta|retail\",\n  \"estilo\": \"moderno|industrial|corporativo|tecnologico|rustico|elegante\",\n  \"materiales_visibles\": [\"madera\", \"metal\", \"cristal\", \"metacrilato\", \"moqueta\", \"laminado\", \"tela\"],\n  \"elementos_destacados\": [\"mostrador\", \"vitrina\", \"almacen\", \"pantallas\", \"zona_reunion\", \"barra\", \"lobby\"],\n  \"m2_estimado\": null,\n  \"altura_estimada\": null,\n  \"numero_frentes\": 1,\n  \"densidad\": \"baja|media|alta\",\n  \"tiene_grafica\": true,\n  \"tipo_iluminacion\": \"focos|tiras_led|retroiluminado|mixto\",\n  \"colores\": [\"#hex\"],\n  \"descripcion\": \"Descripcion breve del stand en español\"\n}"
    },
    {
      "role": "user",
      "content": [
        { "type": "image_url", "image_url": { "url": "url_de_la_imagen" } },
        { "type": "text", "text": "Feria: feria_nombre\nInstrucciones del cliente: prompt_texto" }
      ]
    }
  ]
}
```

### 1.3 Normalización y Validaciones en n8n
Se implementó un nodo Code para validar y sanear la respuesta JSON del modelo de visión antes de inyectarla al Agente Jarvis principal, aplicando fallbacks seguros en caso de fallo de parsing:

```javascript
const vision = $input.first().json;
const webhook = $("Webhook Entrada").first().json.body;

let p = {};
try {
  const raw = vision.choices[0].message.content;
  p = JSON.parse(raw.replace(/```json|```/g, '').trim());
} catch(e) {
  p = {};
}

const output = {
  tipo_stand: p.tipo_stand || webhook.tipo_stand || "modular",
  estilo: p.estilo || webhook.estilo || "moderno",
  materiales_visibles: p.materiales_visibles || [],
  elementos_destacados: p.elementos_destacados || [],
  m2_estimado: p.m2_estimado || null,
  altura_estimada: p.altura_estimada || null,
  numero_frentes: p.numero_frentes || 1,
  densidad: p.densidad || "media",
  tiene_grafica: p.tiene_grafica ?? false,
  tipo_iluminacion: p.tipo_iluminacion || "no_detectado",
  colores: p.colores || [],
  descripcion: p.descripcion || "",
  m2_real: webhook.m2 || null,
  feria: webhook.feria || "No especificada",
  cliente: webhook.cliente || "Sin especificar",
  promptText: webhook.promptText || "",
};

return [{ json: output }];
```

---

## 2. Ingesta de Audio e Imagen en el Frontend

Para el envío de audios e imágenes desde Presustand sin la necesidad de utilizar URLs externas, se diseñó e implementó la subida multipart/form-data a través de una API route del frontend (`/api/upload`) conectada directamente con Supabase Storage.

### 2.1 Políticas RLS de Storage (`stand-uploads`)
Se configuró un bucket público en Supabase Storage con RLS activo para la subida de archivos:
- **Límite de tamaño:** 10 MB por archivo.
- **MIME Types soportados:**
  - Imágenes: `image/png`, `image/jpeg`, `image/webp`.
  - Audios (grabador de voz): `audio/webm`, `audio/mp4`, `audio/mpeg`, `audio/wav`, `audio/ogg`.
- **Ruta de la API:** `stand/src/app/api/upload/route.ts` (usa el token `service_role` para escribir de forma segura y devuelve la URL pública).

### 2.2 Grabación de Audio en Navegador (`AudioRecorder`)
Usa la API nativa de Javascript `MediaRecorder` del navegador para capturar el micrófono del usuario y codificar la pista en formato WebM antes de subirla de manera transparente al servidor.

---

## 3. Módulo Financiero (Fase 3) — Reglas y Lógicas de Negocio

El módulo financiero maneja facturación de clientes, costos de proveedores, previsión de cash flow y márgenes de cierre.

### 3.1 Generación Automática del Número de Factura (`F26-NNNN`)
Para asignar un identificador legal secuencial por empresa y año, se implementó una función PL/pgSQL en Supabase:

```sql
CREATE OR REPLACE FUNCTION public.generar_numero_factura(p_id_empresa UUID)
RETURNS TEXT AS $$
DECLARE
  v_año TEXT := TO_CHAR(NOW(), 'YY');
  v_contador INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_contador
  FROM public.facturas_proyectos fp
  JOIN public.proyectos_operaciones po ON po.id = fp.id_proyecto
  WHERE po.id_empresa = p_id_empresa
  AND EXTRACT(YEAR FROM fp.fecha_emision) = EXTRACT(YEAR FROM NOW());
  
  RETURN 'F' || v_año || '-' || LPAD(v_contador::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
```
*La función cuenta los registros de facturas creados en el año en curso para esa empresa y le suma 1, formateando con ceros a la izquierda (ej: `F26-0001`).*

### 3.2 Lógicas de Control Financiero en Frontend

#### Validación de porcentaje límite de facturación (Límite 100%):
```typescript
const validarPorcentajeFactura = async (
  idProyecto: string,
  nuevoPorcentaje: number
): Promise<{ valido: boolean; pctYaFacturado: number }> => {
  const { data: facturasExistentes } = await supabase
    .from('facturas_proyectos')
    .select('porcentaje_facturado')
    .eq('id_proyecto', idProyecto)
    .neq('tipo_factura', 'rectificativa'); // Excluir rectificativas

  const pctYaFacturado = facturasExistentes
    ?.reduce((sum, f) => sum + Number(f.porcentaje_facturado), 0) ?? 0;

  return {
    valido: pctYaFacturado + nuevoPorcentaje <= 100,
    pctYaFacturado
  };
};
```

#### Regla de Bloqueo de Clientes por Impagos:
Si una factura de cliente es marcada en estado `impagada_vencida` (estado vencido) por un rol `admin`, el sistema muestra un modal interactivo que le permite suspender al cliente en la base de datos (`estado_cliente = 'bloqueado_impagos'`), imposibilitando la creación de nuevos presupuestos.

#### Fórmulas de Cierre y Cálculo de Márgenes Reales:
Al cerrar oficialmente un proyecto, el sistema extrae:
- **Ingreso Real ($\text{Ingreso}$):** Sumatoria de `total_factura_bruto` de facturas de clientes en estado `cobrada`.
- **Gasto Real ($\text{Gasto}$):** Sumatoria de `total_linea_coste` imputados en la tabla `facturas_proveedores_lineas`.
- **Margen Real Bruto:** $\text{Ingreso} - \text{Gasto}$.
- **Margen Real Porcentual:** $\frac{\text{Ingreso} - \text{Gasto}}{\text{Ingreso}} \times 100$.
- **Desviación de Beneficio:** Margen real porcentual $-$ margen presupuestado original porcentual.

---

## 4. Tipos TypeScript Clave del Módulo Financiero

```typescript
export interface FacturaProyecto {
  id: string;
  id_proyecto: string;
  numero_factura_legal: string;
  tipo_factura: 'anticipo' | 'final' | 'rectificativa';
  porcentaje_facturado: number;
  base_imponible: number;
  porcentaje_iva: number;
  importe_iva: number;
  total_factura_bruto: number;
  estado_cobro: 'pendiente_cobro' | 'cobrada' | 'impagada_vencida';
  fecha_emision: string;
  fecha_vencimiento: string;
  fecha_cobro_real?: string;
  notas?: string;
  pdf_url?: string;
}

export interface FacturaProveedorCabecera {
  id: string;
  id_empresa: string;
  id_proveedor: string;
  numero_factura_proveedor: string;
  fecha_emision: string;
  fecha_recepcion: string;
  fecha_vencimiento: string;
  base_imponible: number;
  importe_iva: number;
  total_factura_bruto: number;
  estado_pago: 'pendiente' | 'pagada' | 'disputa_bloqueada';
  metodo_pago: 'transferencia' | 'confirming' | 'tarjeta' | 'girado';
  pdf_url?: string;
  notas?: string;
}
```
