# Guía de mejora — Visión GPT-4o en Jarvis (n8n)

## Mi parte (código) ✅ Completo

No requiere cambios. El frontend y la API ya envían correctamente:

| Campo | Origen |
|---|---|
| `type: "image"` | API route detecta imageUrl |
| `content: imageUrl` | URL de Supabase Storage |
| `promptText` | Texto del usuario (opcional) |
| `m2`, `feria`, `altura`, `tipo_stand`, `cliente` | Datos del formulario |

---

## Tu parte — 3 cambios en el workflow de n8n

### Cambio 1 — Nodo GPT-4 Vision (HTTP Request)

**Situación actual** (no tocar `URL`, `Auth`, `Headers`):

```json
{{ JSON.stringify({
  model: 'gpt-4o',
  max_tokens: 600,
  messages: [
    {
      role: 'system',
      content: 'Eres experto en stands feriales. Analiza la imagen. Responde SOLO JSON sin markdown: { tipo_stand, materiales_visibles, m2_estimado, altura_estimada, estilo, elementos_destacados, descripcion }'
    },
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: $json.body.content } },
        { type: 'text', text: 'Feria: ' + ($json.body.feria || 'No especificada') }
      ]
    }
  ]
}) }}
```

**Cámbialo por esto:**

```json
{{ JSON.stringify({
  model: 'gpt-4o',
  max_tokens: 1200,
  messages: [
    {
      role: 'system',
      content: 'Eres un experto en analisis de stands feriales y construccion de presupuestos. Analiza la imagen de un stand y extrae la siguiente informacion en formato JSON. Responde UNICAMENTE JSON valido, sin markdown, sin explicaciones. Si un campo no es detectable, usa null. Para m2_estimado: si ves elementos de escala conocida (personas, puertas, paneles modulares de 1x2.5m), estima. Si no, usa null.\n\nJSON esperado:\n{\n  \"tipo_stand\": \"modular|carpinteria_diseno|hibrido|doble_planta|retail\",\n  \"estilo\": \"moderno|industrial|corporativo|tecnologico|rustico|elegante\",\n  \"materiales_visibles\": [\"madera\", \"metal\", \"cristal\", \"metacrilato\", \"moqueta\", \"laminado\", \"tela\"],\n  \"elementos_destacados\": [\"mostrador\", \"vitrina\", \"almacen\", \"pantallas\", \"zona_reunion\", \"barra\", \"lobby\"],\n  \"m2_estimado\": null,\n  \"altura_estimada\": null,\n  \"numero_frentes\": 1,\n  \"densidad\": \"baja|media|alta\",\n  \"tiene_grafica\": true,\n  \"tipo_iluminacion\": \"focos|tiras_led|retroiluminado|mixto\",\n  \"colores\": [\"#hex\"],\n  \"descripcion\": \"Descripcion breve del stand en español\"\n}'
    },
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: $("Webhook Entrada").first().json.body.content } },
        { type: 'text', text: 'Feria: ' + ($("Webhook Entrada").first().json.body.feria || 'No especificada') + '\nInstrucciones del cliente: ' + ($("Webhook Entrada").first().json.body.promptText || 'Sin instrucciones adicionales') }
      ]
    }
  ]
}) }}
```

**Cambios clave:**
- `$json.body.content` → `$("Webhook Entrada").first().json.body.content`
- `$json.body.feria` → `$("Webhook Entrada").first().json.body.feria`
- Añadido `promptText` del webhook
- `max_tokens`: 600 → 1200
- System prompt más completo con schema enriquecido

---

### Cambio 2 — Nuevo nodo Code: "Validar JSON Visión"

Añádelo **entre** el nodo GPT-4 Vision y el Code node "formatear mensaje-imagen".

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
  // Datos del formulario (siempre fiables)
  m2_real: webhook.m2 || null,
  feria: webhook.feria || "No especificada",
  cliente: webhook.cliente || "Sin especificar",
  promptText: webhook.promptText || "",
};

return [{ json: output }];
```

---

### Cambio 3 — Actualizar el Code node "formatear mensaje-imagen"

Ya lo corregimos antes, pero asegúrate de que tenga exactamente esto:

```javascript
const vision = $input.first().json;
const webhook = $("Webhook Entrada").first().json.body;

let p = {};
try {
  p = JSON.parse(vision.choices[0].message.content.replace(/```json|```/g,'').trim());
} catch(e) {}

return [{ json: {
  chatInput: [
    'SOLICITUD DE PRESUPUESTO (desde imagen)',
    '---',
    'Cliente: ' + (webhook.cliente || 'Sin especificar'),
    'Feria: ' + (webhook.feria || 'IFEMA Madrid'),
    'Superficie estimada: ' + (p.m2_estimado || webhook.m2 || 20) + ' m²',
    'Altura estimada: ' + (p.altura_estimada || webhook.altura || 2.5) + ' m',
    'Tipo de stand: ' + (p.tipo_stand || 'modular'),
    'Estilo: ' + (p.estilo || 'moderno'),
    'Materiales detectados: ' + (p.materiales_visibles || []).join(', '),
    'Elementos: ' + (p.elementos_destacados || []).join(', '),
    'Presupuesto máximo: ' + (webhook.presupuesto_max ? webhook.presupuesto_max + '€' : 'No indicado'),
    'Descripción IA: ' + (p.descripcion || ''),
    '---',
    'Usa consultar_tarifa_base_a primero, luego genera el presupuesto completo.'
  ].join('\n')
}}];
```

---

## Orden final de nodos en la rama "image"

```
Webhook Entrada
    │
    ▼
Switch (type)
    │
    ├── type = "image"
    │       │
    │       ▼
    │   GPT-4o Vision (HTTP Request)   ← Cambio 1
    │       │
    │       ▼
    │   Validar JSON Visión (Code)      ← Cambio 2 (NUEVO)
    │       │
    │       ▼
    │   formatear mensaje-imagen (Code) ← Cambio 3
    │       │
    │       ▼
    │   Agente Jarvis (resto del flujo)
    │
    ├── type = "audio"
    │       └── ... (ya funciona)
    │
    └── type = "texto"
            └── ... (ya funciona)
```
