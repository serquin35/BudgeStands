# Análisis: Visión por IA para presupuestación de stands

## Resumen ejecutivo

Sí, es posible y ya está parcialmente construido. GPT-4o Vision puede analizar imágenes de stands y extraer información estructural para generar un presupuesto. La pregunta clave no es *si se puede*, sino *con qué precisión* y *qué datos necesita el usuario aportar* para cerrar el presupuesto.

---

## Estado actual del nodo GPT-4 Vision en Jarvis

### Configuración actual

| Parámetro | Valor |
|---|---|
| Modelo | `gpt-4o` |
| max_tokens | 600 |
| System prompt | `Eres experto en stands feriales. Analiza la imagen. Responde SOLO JSON sin markdown: { tipo_stand, materiales_visibles, m2_estimado, altura_estimada, estilo, elementos_destacados, descripcion }` |
| Imagen | `$json.body.content` (URL de la imagen) |
| Contexto adicional | `Feria: $json.body.feria` |

### Problemas detectados en la configuración actual

1. **`$json.body` puede estar vacío** — Igual que ocurría con el nodo de audio, después del nodo HTTP Request que descarga/redirige, el `body` original del webhook puede perderse. Debería usar `$("Webhook Entrada").first().json.body.content` y `.feria`.

2. **max_tokens: 600 es bajo** — Para analizar una imagen y extraer materiales, elementos, m², estilo, descripción, 600 tokens pueden quedarse cortos. Recomendable 1000-1500.

3. **No se pasa `promptText`** — Si el usuario escribe instrucciones adicionales ("Calcula el presupuesto basándote en esta imagen"), ese texto no se envía al modelo de visión. Debería incluirse.

4. **El schema JSON es mejorable** — Faltan campos útiles para presupuestar: `densidad`, `numero_frentes`, `tiene_grafica`, `complejidad`.

---

## Qué puede detectar GPT-4o con alta fiabilidad

| Categoría | Campos detectables | Precisión |
|---|---|---|
| Tipo de stand | modular, carpintería, híbrido, doble planta, retail | Alta |
| Estilo | moderno, industrial, rústico, tecnológico, corporativo | Alta |
| Materiales visibles | madera, metal, metacrilato, cristal, laminado, tela, moqueta | Alta |
| Elementos | mostrador, vitrina, almacén, pantallas, lobby, zona reunión, barra | Alta |
| Nº de frentes abiertos | 1, 2, 3 o 4 frentes | Alta |
| Color y paleta | colores dominantes y de acento | Alta |
| Presencia de gráfica | impresión directa, lonas, vinilos, LED | Alta |
| Iluminación | focos direccionales, tiras LED, panel retroiluminado | Media-Alta |
| Densidad/complejidad | baja, media, alta (según cantidad de elementos) | Media |

## Qué detecta con media-baja fiabilidad

| Campo | Problema |
|---|---|
| m² estimado | Sin referencia de escala, el error puede ser >50% |
| Altura estimada | Similar, sin referencia se estima muy gruesa |
| Espesor de materiales | Imposible sin ver el canto |
| Calidad específica | No distingue DM de melamina o madera maciza |
| Marcas concretas | No identifica modelos de muebles o luminarias |

---

## La clave: los m²

El modelo **no puede** medir metros cuadrados con precisión a partir de una foto sin referencia de escala. Esto es una limitación física, no de IA.

### Opciones para resolverlo

**Opción A (recomendada)** — El usuario indica los m² al subir la imagen.

```
Formulario:
  ┌─────────────────────────────────────────┐
  │  📎 Imagen de referencia                │
  │  Superficie: [____] m² *               │
  │  Feria: [________________]              │
  │  Instrucciones: [________________]      │
  │  [Generar presupuesto]                  │
  └─────────────────────────────────────────┘
```
Esto ya está casi implementado en el formulario actual de Presustand IA.

**Opción B** — GPT-4o estima por proporciones y Jarvis pide confirmación.

> "Estimo que este stand tiene entre 25-35 m². ¿Es correcto?"

**Opción C** — Detección automática si la imagen contiene referencias conocidas.

> Una puerta (0.80m), una silla, una persona (1.70m), panel modular (1×2.5m).

---

## Flujo propuesto para presupuesto desde imagen

```
Usuario sube imagen + m² + feria + texto opcional
                    │
                    ▼
       ┌─────────────────────────┐
       │  /api/generate-budget   │
       │  type: "image"          │
       │  content: imageUrl      │
       │  promptText: "..."      │
       │  m2: 50                 │
       │  feria: "FITUR"         │
       └─────────┬───────────────┘
                 │
                 ▼
       ┌──────────────────────────────┐
       │  Webhook → Switch (type)     │
       │        │                     │
       │  type = "image"              │
       │        │                     │
       │        ▼                     │
       │  GPT-4o Vision              │
       │  Analiza:                   │
       │  • tipo_stand               │
       │  • materiales_visibles      │
       │  • m2_estimado (referencia) │
       │  • altura_estimada          │
       │  • estilo                   │
       │  • elementos_destacados     │
       │  • descripción              │
       └─────────┬───────────────────┘
                 │
                 ▼
       ┌──────────────────────────────┐
       │  Code node: formatear        │
       │  Combina: análisis visión    │
       │  + m² real (del formulario)  │
       │  + feria (del formulario)    │
       │  + promptText                │
       └─────────┬───────────────────┘
                 │
                 ▼
       ┌──────────────────────────────┐
       │  Agente Jarvis               │
       │  Consulta tarifas catálogo B │
       │  Consulta servicios catálogo C│
       │  Busca proyectos similares   │
       │  Genera partidas             │
       │  Calcula presupuesto         │
       └─────────┬───────────────────┘
                 │
                 ▼
       ┌──────────────────────────────┐
       │  Inserta en Supabase         │
       │  (presupuestos_cabecera      │
       │   + presupuestos_lineas)     │
       └──────────────────────────────┘
```

---

## Mejoras necesarias en el nodo GPT-4 Vision

### 1. Corregir la referencia a los datos

Cambiar `$json.body.content` por `$("Webhook Entrada").first().json.body.content` para evitar pérdida de datos tras el HTTP Request.

### 2. Aumentar max_tokens a 1200

Para permitir descripciones más detalladas y extracción completa de elementos.

### 3. Mejorar el system prompt

```
Eres un experto en análisis de stands feriales y construcción de presupuestos.
Analiza la imagen de un stand y extrae la siguiente información en formato JSON.

REGLAS:
- Responde ÚNICAMENTE JSON válido, sin markdown, sin explicaciones.
- Si un campo no es detectable, usa null.
- Para m2_estimado: si ves elementos de escala conocida (personas, puertas, paneles modulares), estima. Si no, usa null.
- Para altura_estimada: similar, estima solo si hay referencia.

JSON esperado:
{
  "tipo_stand": "modular|carpinteria_diseno|hibrido|doble_planta|retail",
  "estilo": "moderno|industrial|corporativo|tecnologico|rustico|elegante",
  "materiales_visibles": ["madera", "metal", "cristal", "metacrilato", "moqueta", "laminado", "tela"],
  "elementos_destacados": ["mostrador", "vitrina", "almacen", "pantallas", "zona_reunion", "barra", "lobby"],
  "m2_estimado": null,
  "altura_estimada": null,
  "numero_frentes": 1,
  "densidad": "baja|media|alta",
  "tiene_grafica": true,
  "tipo_iluminacion": "focos|tiras_led|retroiluminado|mixto",
  "colores": ["#hex"],
  "descripcion": "Descripción breve del stand en español"
}
```

### 4. Incluir promptText en la llamada

Si el usuario escribió instrucciones, pasarlas como contexto adicional al modelo de visión:

```
Texto del usuario: $("Webhook Entrada").first().json.body.promptText
```

### 5. Añadir nodo de validación del JSON de visión

Después de GPT-4 Vision, añadir un Code node que valide que el JSON es completo y tenga valores por defecto para campos nulos:

```javascript
const vision = $input.first().json;
const webhook = $("Webhook Entrada").first().json.body;

let p = {};
try {
  p = JSON.parse(vision.choices[0].message.content.replace(/```json|```/g,'').trim());
} catch(e) {
  p = {};
}

// Valores por defecto seguros
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
  // Datos del formulario (siempre fiables)
  m2_real: webhook.m2 || null,
  feria: webhook.feria || "No especificada",
  cliente: webhook.cliente || "Sin especificar",
  promptText: webhook.promptText || "",
};

return [{ json: output }];
```

---

## Conclusión

Lo que pide tu amigo **es posible y ya tienes el 80% construido**:

- ✅ GPT-4o Vision analizando imágenes
- ✅ Catálogos B y C con precios reales
- ✅ Qdrant con proyectos históricos
- ✅ Presupuestación por partidas
- ✅ Formulario con imagen + m² + feria

Lo que falta:

1. **Afinar el prompt de visión** para que extraiga campos más útiles para presupuestar
2. **Pasar correctamente los datos** del webhook al nodo de visión (usando `$("Webhook Entrada")`)
3. **Validar y normalizar** la salida JSON del modelo de visión
4. **Usar siempre los m² del formulario** como fuente de verdad, no la estimación visual

El caso de uso "el cliente envía una foto y recibe un presupuesto orientativo" es completamente viable hoy. Con los m² confirmados por el cliente, el presupuesto puede ser cerrado y preciso.
