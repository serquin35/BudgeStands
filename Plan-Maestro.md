# THE TITAN — Documento Maestro de Arquitectura
## Versión 2.0 | Documento de Referencia para Desarrollo con IA

> **Instrucción para el modelo de IA:** Este documento es la fuente de verdad absoluta del proyecto. Antes de generar cualquier código, componente, query o flujo, consulta este documento. Respeta los nombres de tablas, campos, enums y convenciones exactamente como están definidos aquí. Cuando un requerimiento no esté cubierto, pregunta antes de inventar.

---
[!CAUTION]
> **REGLA DE SEGURIDAD CRÍTICA — PREVENCIÓN DE FUGAS DE CREDENCIALES:**
> En sesiones previas, un modelo subió por error claves privadas de Supabase a GitHub, forzando un costoso cambio de claves en todo el proyecto.
> **BAJO NINGUNA CIRCUNSTANCIA** se deben commitear o subir archivos `.env`, `.pem`, `.jks`, o claves sensibles en texto plano. 
> Antes de realizar cualquier comando `git commit` o `git push`, se debe verificar exhaustivamente el estado de los archivos utilizando `git diff` y `git status` para asegurar la absoluta confidencialidad y seguridad del proyecto.

---
## ÍNDICE

1. [Visión del Proyecto](#1-visión-del-proyecto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura General del Sistema](#3-arquitectura-general-del-sistema)
4. [Schema Completo de Supabase](#4-schema-completo-de-supabase)
5. [Arquitectura Qdrant](#5-arquitectura-qdrant)
6. [Arquitectura n8n — Agente Jarvis](#6-arquitectura-n8n--agente-jarvis)
7. [Módulos de la Aplicación](#7-módulos-de-la-aplicación)
8. [Reglas de Negocio Críticas](#8-reglas-de-negocio-críticas)
9. [Convenciones y Estándares de Código](#9-convenciones-y-estándares-de-código)
10. [Estado Actual del Desarrollo](#10-estado-actual-del-desarrollo-actualizado-24-jun-2026)
10-B. [Roadmap por Fases (Resumen)](#10-b-roadmap-por-fases-resumen-ejecutivo)
11. [Variables de Entorno y Credenciales](#11-variables-de-entorno-y-credenciales)

---

## 1. VISIÓN DEL PROYECTO

### 1.1 Nombre y Concepto

**The Titan** es un ERP/SaaS especializado en arquitectura efímera y stands feriales, desarrollado específicamente para empresas que diseñan, presupuestan, construyen y gestionan stands para ferias nacionales e internacionales.

Su módulo central se llama **Presustand**: un motor de presupuestación inteligente con IA que acepta como entrada texto, imagen o audio, y devuelve presupuestos detallados con imagen generada del stand.

### 1.2 Propuesta de Valor

- **Para el comercial:** Genera presupuestos profesionales en minutos en lugar de horas.
- **Para el director de obra:** Controla hitos, compras y rentabilidad real vs estimada en tiempo real.
- **Para el taller:** Canal B2B sincronizado con planos, órdenes CNC y cambios aprobados.
- **Para el gerente:** Dashboard de cash flow, márgenes reales y cierre de cada proyecto.

### 1.3 Usuarios del Sistema

| Rol | Descripción | Acceso Principal |
|---|---|---|
| `admin` | Gerente / Propietario | Todos los módulos + configuración |
| `comercial` | Vendedor / Diseñador | CRM, Presupuestos, Proyectos (lectura) |
| `director_obra` | Jefe de producción | Proyectos, Hitos, Compras |
| `taller` | Operario / Carpintero | Canal B2B, Órdenes de trabajo |
| `contabilidad` | Gestión financiera | Facturas, Pagos, Cierres |
| `cliente_externo` | Cliente final (futuro) | Portal de seguimiento (Fase 3) |

### 1.4 Modelo de Negocio (SaaS Futuro — Fase 4)

- Plan Starter: 1 usuario, hasta 20 presupuestos/mes
- Plan Pro: hasta 5 usuarios, presupuestos ilimitados, IA incluida
- Plan Business: multi-usuario, canal B2B, analytics avanzado
- Plan Enterprise: multi-tenant, white-label, API pública

---

## 2. STACK TECNOLÓGICO

### 2.1 Decisiones de Stack

```
CAPA                TECNOLOGÍA              JUSTIFICACIÓN
────────────────    ──────────────────      ──────────────────────────────────────
IDE de desarrollo   Google Antigravity      IDE agéntico con contexto de proyecto
Frontend            Next.js 14 (App Router) SSR, Server Components, Supabase compat.
Estilos             Tailwind CSS + shadcn/ui Velocidad de desarrollo, consistencia
Base de datos       Supabase (PostgreSQL)   Auth, Realtime, Storage, REST API, RLS
Base vectorial      Qdrant                  Búsqueda semántica, filtros avanzados
Automatización/IA   n8n (self-hosted)       Orquestación de flujos, sin lock-in
LLM Principal       Claude Sonnet 4.6       Razonamiento, JSON estructurado, presupuestos
LLM Visión          GPT-4o                  Análisis de imágenes de stands
STT                 OpenAI Whisper          Transcripción de audio en español
Embeddings          OpenAI text-embedding-3-small  1536 dims, precio/calidad óptimo
Imágenes            DALL-E 3               Renders de stands fotorrealistas
Almacenamiento      Supabase Storage        PDFs, planos, imágenes de proyectos
Autenticación       Supabase Auth           JWT, RLS integrado, OAuth futuro
```

### 2.2 Servicios Externos

```
SERVICIO            URL / ENDPOINT                          USO
────────────────    ──────────────────────────────────────  ──────────────────
Supabase            https://{PROJECT_ID}.supabase.co        DB + Auth + Storage
Qdrant Cloud        https://{CLUSTER}.qdrant.tech           Vector DB
n8n                 https://{N8N_DOMAIN} (self-hosted)      Automatización
OpenAI API          https://api.openai.com/v1               Embeddings, Whisper, DALL-E
Anthropic API       https://api.anthropic.com/v1            Claude Sonnet
Google Drive API    https://www.googleapis.com/drive/v3     Ingesta documentos
```

---

## 3. ARQUITECTURA GENERAL DEL SISTEMA

### 3.1 Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                           │
│  Dashboard │ CRM │ Presustand │ Proyectos │ Finanzas │ Canal B2B   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ REST / Realtime / RPC
┌─────────────────────────▼───────────────────────────────────────────┐
│                    SUPABASE (Backend principal)                      │
│  PostgreSQL │ Auth (JWT+RLS) │ Storage │ Realtime │ Edge Functions  │
└──────┬──────────────────────────────────────────────────────────────┘
       │ Webhooks / HTTP
┌──────▼──────────────────────────────────────────────────────────────┐
│                    n8n (Orquestación e IA)                          │
│                                                                     │
│  ┌─────────────────┐    ┌──────────────────────────────────────┐   │
│  │ Pipeline Ingesta │    │ Agente Jarvis (Presupuestador IA)    │   │
│  │ Drive→PDF→Qdrant │    │ Tools: Qdrant│Supabase│DALL-E│Claude│   │
│  └─────────────────┘    └──────────────────────────────────────┘   │
└──────┬──────────────────────────┬───────────────────────────────────┘
       │                          │
┌──────▼──────────┐    ┌──────────▼──────────────────────────────────┐
│     QDRANT      │    │              APIs EXTERNAS                   │
│                 │    │  OpenAI │ Anthropic │ Google Drive           │
│  Collections:   │    └─────────────────────────────────────────────┘
│  - elementos_b  │
│  - servicios_c  │
│  - proyectos    │
└─────────────────┘
```

### 3.2 Los 3 Métodos de Presupuestación

Este es el núcleo del negocio. El sistema tiene tres métodos de cálculo que pueden usarse de forma independiente o combinada:

```
MÉTODO 1 — ESTIMACIÓN RÁPIDA (Base A: tarifas_macros_m2)
─────────────────────────────────────────────────────────
Input:  tipo_proyecto + nivel_densidad + m²
Output: precio total estimado en segundos
Uso:    Licitaciones telefónicas, primeras reuniones
IA:     No necesaria (cálculo directo)

MÉTODO 2 — CONFIGURADOR POR BLOQUES (Base B: catalogo_elementos)
─────────────────────────────────────────────────────────────────
Input:  Lista de elementos (mostrador x1, vitrina x3, pared 4m...)
Output: Presupuesto por partidas con precios de catálogo
Uso:    Configurador visual, análisis de imagen por IA
IA:     GPT-4o Vision → detecta elementos → busca en Qdrant Base B

MÉTODO 3 — DESPIECE TÉCNICO (Base C: tarifas_servicios_despiece)
─────────────────────────────────────────────────────────────────
Input:  Especificaciones técnicas detalladas de taller
Output: Presupuesto riguroso con materias primas, mermas, MO
Uso:    Proyectos complejos, doble planta, licitaciones formales
IA:     Claude Sonnet razona sobre Base C + historial Qdrant
```

### 3.3 Flujo de Estado de un Presupuesto

```
[en_espera] → [presentado] → [en_negociacion] → [aceptado] → [rechazado]
                                                      │
                                                      ▼
                                              [PROYECTO CREADO]
                                              Hitos generados automáticamente
                                              Precios congelados
                                              Canal B2B activado
```

---

## 4. SCHEMA COMPLETO DE SUPABASE

> **Regla para el desarrollador:** Usar SIEMPRE `UUID` para PKs salvo los casos indicados. Todos los campos monetarios en `NUMERIC(10,2)`. Todos los timestamps en `TIMESTAMPTZ`. Activar RLS en todas las tablas.

### 4.1 Tabla: `empresas` (Multi-tenant base)

```sql
CREATE TABLE public.empresas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre            TEXT NOT NULL,
  cif               TEXT UNIQUE NOT NULL,
  domicilio         TEXT,
  telefono          TEXT,
  email_principal   TEXT,
  logo_url          TEXT,
  plan_saas         TEXT NOT NULL DEFAULT 'starter'
                    CHECK (plan_saas IN ('starter','pro','business','enterprise')),
  activa            BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.2 Tabla: `usuarios`

```sql
-- Extiende auth.users de Supabase Auth
CREATE TABLE public.usuarios (
  id                UUID PRIMARY KEY REFERENCES auth.users(id),
  id_empresa        UUID NOT NULL REFERENCES public.empresas(id),
  nombre_completo   TEXT NOT NULL,
  rol               TEXT NOT NULL DEFAULT 'comercial'
                    CHECK (rol IN ('admin','comercial','director_obra','taller','contabilidad')),
  activo            BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.3 Tabla: `clientes`

```sql
CREATE TABLE public.clientes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa                UUID NOT NULL REFERENCES public.empresas(id),
  -- Datos Fiscales
  razon_social              TEXT NOT NULL,
  nombre_comercial          TEXT NOT NULL,
  cif_nif                   TEXT NOT NULL,
  domicilio_fiscal          TEXT,
  -- Contacto Principal
  nombre_contacto_principal TEXT,
  email_contacto            TEXT,
  telefono_contacto         TEXT,
  departamento_contacto     TEXT,
  -- Perfil Comercial
  sector_industrial         TEXT,
  web_cliente               TEXT,
  recinto_ferial_habitual   TEXT,
  idioma_comunicacion       TEXT NOT NULL DEFAULT 'es'
                            CHECK (idioma_comunicacion IN ('es','en','fr','de')),
  -- Financiero
  forma_pago_habitual       TEXT DEFAULT 'transferencia'
                            CHECK (forma_pago_habitual IN ('transferencia','confirming','pagare','tarjeta')),
  plazo_pago_dias           INTEGER DEFAULT 30,
  cuenta_bancaria_iban      TEXT,
  -- Gestión
  tarifa_asignada           TEXT NOT NULL DEFAULT 'estandar'
                            CHECK (tarifa_asignada IN ('estandar','premium','distribuidor')),
  notas_internas            TEXT,
  estado_cliente            TEXT NOT NULL DEFAULT 'activo'
                            CHECK (estado_cliente IN ('activo','bloqueado_impagos','inactivo')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(id_empresa, cif_nif)
);
```

### 4.4 Tabla: `proveedores`

```sql
CREATE TABLE public.proveedores (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa            UUID NOT NULL REFERENCES public.empresas(id),
  razon_social          TEXT NOT NULL,
  nombre_comercial      TEXT NOT NULL,
  cif_nif               TEXT NOT NULL,
  domicilio_fiscal      TEXT,
  email_contacto        TEXT,
  telefono_contacto     TEXT,
  nombre_contacto       TEXT,
  especialidad          TEXT,
  -- Categoría principal de la Matriz de 15 categorías
  -- 1-Madera, 2-Metal, 3-Plástico/Metacrilato, 4-Electricidad,
  -- 5-Iluminación, 6-Suelos, 7-Textil/Gráfica, 8-Audiovisual,
  -- 9-Mobiliario, 10-Transporte, 11-Montaje/MO, 12-Servicios Feria,
  -- 13-Seguridad/CAE, 14-Diseño, 15-Varios
  categorias_suministro JSONB DEFAULT '[]',
  forma_pago            TEXT DEFAULT 'transferencia',
  plazo_pago_dias       INTEGER DEFAULT 30,
  iban                  TEXT,
  valoracion            INTEGER DEFAULT 3 CHECK (valoracion BETWEEN 1 AND 5),
  homologado            BOOLEAN DEFAULT false,
  notas                 TEXT,
  activo                BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.5 Tabla: `gastos_fijos_empresa`

```sql
CREATE TABLE public.gastos_fijos_empresa (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa        UUID NOT NULL REFERENCES public.empresas(id),
  concepto          TEXT NOT NULL,
  categoria         TEXT NOT NULL
                    CHECK (categoria IN ('alquiler','personal','suministros',
                    'seguros','software','vehiculos','otros')),
  importe_mensual   NUMERIC(10,2) NOT NULL,
  activo            BOOLEAN NOT NULL DEFAULT true,
  notas             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.6 Tabla: `categorias_matriz` (Catálogo de 15 categorías técnicas)

```sql
CREATE TABLE public.categorias_matriz (
  id              SERIAL PRIMARY KEY,
  codigo          TEXT UNIQUE NOT NULL, -- '1', '1.2', '8.1', etc.
  nombre          TEXT NOT NULL,
  nombre_corto    TEXT NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('categoria','subcategoria')),
  id_padre        INTEGER REFERENCES public.categorias_matriz(id),
  activa          BOOLEAN NOT NULL DEFAULT true
);

-- Datos iniciales de las 15 categorías principales
INSERT INTO public.categorias_matriz (codigo, nombre, nombre_corto, tipo) VALUES
('1',  'Madera y Derivados', 'Madera', 'categoria'),
('2',  'Metal y Aluminio', 'Metal', 'categoria'),
('3',  'Plástico y Metacrilato', 'Plástico', 'categoria'),
('4',  'Instalación Eléctrica', 'Electricidad', 'categoria'),
('5',  'Iluminación', 'Iluminación', 'categoria'),
('6',  'Suelos y Revestimientos', 'Suelos', 'categoria'),
('7',  'Textil, Gráfica e Impresión', 'Gráfica', 'categoria'),
('8',  'Audiovisual y Tecnología', 'Audiovisual', 'categoria'),
('9',  'Mobiliario y Decoración', 'Mobiliario', 'categoria'),
('10', 'Transporte y Logística', 'Transporte', 'categoria'),
('11', 'Montaje y Mano de Obra', 'Montaje', 'categoria'),
('12', 'Servicios de Feria y Recinto', 'Servicios Feria', 'categoria'),
('13', 'Seguridad y Prevención (CAE)', 'Seguridad', 'categoria'),
('14', 'Diseño, Proyecto y Dirección', 'Diseño', 'categoria'),
('15', 'Varios y Gastos Generales', 'Varios', 'categoria');
```

### 4.7 Tabla: `tarifas_macros_m2` (Base A — Estimación Rápida)

```sql
CREATE TABLE public.tarifas_macros_m2 (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa                  UUID NOT NULL REFERENCES public.empresas(id),
  tipo_proyecto               TEXT NOT NULL
                              CHECK (tipo_proyecto IN (
                                'modular','carpinteria_diseno','hibrido',
                                'retail_comercial','doble_planta')),
  nivel_densidad              TEXT NOT NULL
                              CHECK (nivel_densidad IN (
                                'baja_minimalista','media_estandar','alta_espectacular')),
  precio_venta_m2             NUMERIC(10,2) NOT NULL,
  margen_beneficio_sugerido   NUMERIC(5,2) NOT NULL DEFAULT 35.00,
  descripcion_incluido        TEXT NOT NULL,
  estado_ratio                BOOLEAN NOT NULL DEFAULT true,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(id_empresa, tipo_proyecto, nivel_densidad)
);

-- Valores de ejemplo para empezar
-- (la empresa deberá calibrar estos según sus costes reales)
INSERT INTO public.tarifas_macros_m2
  (id_empresa, tipo_proyecto, nivel_densidad, precio_venta_m2, margen_beneficio_sugerido, descripcion_incluido)
VALUES
  -- RELLENA con el UUID real de tu empresa en Supabase
  -- ('uuid-empresa', 'modular', 'baja_minimalista', 320.00, 30.00, 'Stand modular estándar...'),
  -- ('uuid-empresa', 'modular', 'media_estandar', 480.00, 35.00, 'Stand modular con elementos...'),
  -- ('uuid-empresa', 'carpinteria_diseno', 'alta_espectacular', 950.00, 40.00, '...')
  ;
```

### 4.8 Tabla: `catalogo_elementos` (Base B — Bloques Constructivos para IA y Configurador)

```sql
CREATE TABLE public.catalogo_elementos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa            UUID NOT NULL REFERENCES public.empresas(id),
  codigo_sku            TEXT NOT NULL,
  nombre_elemento       TEXT NOT NULL,
  id_categoria_matriz   INTEGER NOT NULL REFERENCES public.categorias_matriz(id),
  descripcion_comercial TEXT NOT NULL, -- Este texto se vectoriza para Qdrant
  -- Dimensiones estándar base en milímetros
  ancho_estandar_mm     INTEGER NOT NULL DEFAULT 0,
  fondo_estandar_mm     INTEGER NOT NULL DEFAULT 0,
  alto_estandar_mm      INTEGER NOT NULL DEFAULT 0,
  -- Reglas métricas
  unidad_medida_bloque  TEXT NOT NULL DEFAULT 'ud'
                        CHECK (unidad_medida_bloque IN ('ud','ml','m2')),
  precio_venta_unidad   NUMERIC(10,2) NOT NULL,
  imagen_referencia_url TEXT,
  -- Flag para saber si está indexado en Qdrant
  indexado_qdrant       BOOLEAN NOT NULL DEFAULT false,
  qdrant_point_id       UUID, -- ID del punto en Qdrant
  estado_elemento       BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(id_empresa, codigo_sku)
);
```

### 4.9 Tabla: `tarifas_servicios` (Base C — Despiece Técnico de Taller)

```sql
CREATE TABLE public.tarifas_servicios (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa                      UUID NOT NULL REFERENCES public.empresas(id),
  id_proveedor                    UUID REFERENCES public.proveedores(id),
  id_categoria_matriz             INTEGER NOT NULL REFERENCES public.categorias_matriz(id),
  id_subcategoria_matriz          INTEGER REFERENCES public.categorias_matriz(id),
  nombre_tecnico                  TEXT NOT NULL,
  descripcion_compra              TEXT NOT NULL, -- Se vectoriza para Qdrant
  -- Dimensiones geométricas reales de compra (formato fábrica)
  medida_ancho_mm                 INTEGER NOT NULL DEFAULT 0,
  medida_fondo_mm                 INTEGER NOT NULL DEFAULT 0,
  medida_alto_mm                  INTEGER NOT NULL DEFAULT 0,
  -- Métrica y costes
  unidad_medida                   TEXT NOT NULL DEFAULT 'ud'
                                  CHECK (unidad_medida IN ('m2','ml','ud','kg','l')),
  precio_coste_unidad_medida      NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  -- Tiempo (para MO y alquileres)
  unidad_tiempo                   TEXT
                                  CHECK (unidad_tiempo IN ('hora','dia_montaje','dia_feria','evento_completo')),
  precio_unidad_tiempo            NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  -- Parámetros de producción e IA
  rendimiento_mecanico_hora       NUMERIC(8,2) DEFAULT 0.00,
  pedido_minimo_servicio          NUMERIC(10,2) DEFAULT 0.00,
  incremento_urgencia_porcentaje  NUMERIC(5,2) DEFAULT 0.00,
  aplica_coeficiente_desperdicio  BOOLEAN NOT NULL DEFAULT false,
  coeficiente_desperdicio         NUMERIC(5,3) DEFAULT 1.000, -- ej: 1.10 = 10% merma
  requiere_homologacion_previa    BOOLEAN NOT NULL DEFAULT false,
  -- Flags Qdrant
  indexado_qdrant                 BOOLEAN NOT NULL DEFAULT false,
  qdrant_point_id                 UUID,
  -- Control
  fecha_actualizacion_tarifa      DATE DEFAULT CURRENT_DATE,
  estado_tarifa                   TEXT NOT NULL DEFAULT 'activa'
                                  CHECK (estado_tarifa IN ('activa','inactiva')),
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.10 Tabla: `presupuestos_cabecera`

```sql
CREATE TABLE public.presupuestos_cabecera (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa                UUID NOT NULL REFERENCES public.empresas(id),
  id_cliente                UUID NOT NULL REFERENCES public.clientes(id),
  id_usuario_creador        UUID NOT NULL REFERENCES public.usuarios(id),
  -- Referencia visible
  numero_presupuesto        TEXT NOT NULL, -- Formato: PRES-2026-0001
  -- Datos del evento/feria
  nombre_feria              TEXT NOT NULL,
  recinto_ferial            TEXT,
  fecha_inicio_feria        DATE,
  fecha_fin_feria           DATE,
  -- Datos físicos del stand
  m2_superficie             NUMERIC(8,2) NOT NULL,
  altura_stand_m            NUMERIC(4,2) NOT NULL DEFAULT 2.50,
  tipo_stand                TEXT NOT NULL DEFAULT 'modular'
                            CHECK (tipo_stand IN ('modular','carpinteria_diseno',
                            'hibrido','retail_comercial','doble_planta')),
  nivel_densidad            TEXT DEFAULT 'media_estandar'
                            CHECK (nivel_densidad IN ('baja_minimalista',
                            'media_estandar','alta_espectacular')),
  estilo_stand              TEXT DEFAULT 'moderno',
  -- Método de presupuestación usado
  metodo_presupuestacion    TEXT NOT NULL DEFAULT 'metodo_2'
                            CHECK (metodo_presupuestacion IN (
                            'metodo_1_macro','metodo_2_bloques','metodo_3_despiece','combinado')),
  -- Input IA (si se usó)
  input_ia_tipo             TEXT CHECK (input_ia_tipo IN ('texto','imagen','audio')),
  input_ia_contenido        TEXT, -- URL si imagen/audio, texto si prompt
  -- Totales calculados
  subtotal_construccion     NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  subtotal_servicios_feria  NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  subtotal_diseno_grafica   NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  subtotal_transporte_mo    NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  descuento_porcentaje      NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  descuento_importe         NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  base_imponible            NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  porcentaje_iva            NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  importe_iva               NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_presupuesto         NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  -- Imagen generada por IA
  imagen_stand_url          TEXT,
  imagen_prompt             TEXT,
  -- Estado y control
  estado_presupuesto        TEXT NOT NULL DEFAULT 'en_espera'
                            CHECK (estado_presupuesto IN (
                            'borrador','en_espera','presentado',
                            'en_negociacion','aceptado','rechazado','cancelado')),
  fecha_emision             DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_caducidad           DATE,
  notas_internas            TEXT,
  notas_cliente             TEXT,
  -- Auditoría Qdrant
  qdrant_matches            INTEGER DEFAULT 0,
  -- Cuando se acepta, se congela la versión
  version_congelada         INTEGER DEFAULT 1,
  fecha_aceptacion          TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Secuencia para número de presupuesto
CREATE SEQUENCE presupuestos_seq START 1;
```

### 4.11 Tabla: `presupuestos_lineas`

```sql
CREATE TABLE public.presupuestos_lineas (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_presupuesto            UUID NOT NULL REFERENCES public.presupuestos_cabecera(id) ON DELETE CASCADE,
  orden                     INTEGER NOT NULL DEFAULT 1,
  id_categoria_matriz       INTEGER REFERENCES public.categorias_matriz(id),
  -- Origen del concepto (bidireccionalidad)
  origen_concepto           TEXT NOT NULL DEFAULT 'manual'
                            CHECK (origen_concepto IN (
                            'base_a','base_b','base_c','ia_generado','manual')),
  id_elemento_catalogo      UUID REFERENCES public.catalogo_elementos(id),
  id_tarifa_servicio        UUID REFERENCES public.tarifas_servicios(id),
  -- Contenido de la línea
  concepto_descripcion      TEXT NOT NULL,
  cantidad                  NUMERIC(10,3) NOT NULL DEFAULT 1.000,
  unidad                    TEXT NOT NULL DEFAULT 'ud',
  precio_unitario_venta     NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  descuento_linea_pct       NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  total_linea               NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  notas_linea               TEXT,
  -- Flag de aprendizaje: ¿se debe auto-integrar en catálogos?
  es_concepto_nuevo         BOOLEAN NOT NULL DEFAULT false,
  integrado_en_catalogo     BOOLEAN NOT NULL DEFAULT false,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.12 Tabla: `proyectos_operaciones`

```sql
CREATE TABLE public.proyectos_operaciones (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa                UUID NOT NULL REFERENCES public.empresas(id),
  id_presupuesto            UUID NOT NULL UNIQUE REFERENCES public.presupuestos_cabecera(id),
  codigo_proyecto_interno   TEXT NOT NULL, -- Formato: OP-2026-0084
  fecha_creacion_proyecto   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_director_obra          UUID REFERENCES public.usuarios(id),
  estado_proyecto           TEXT NOT NULL DEFAULT 'en_produccion'
                            CHECK (estado_proyecto IN (
                            'en_produccion','en_montaje','en_feria',
                            'desmontado','cerrado','cancelado')),
  notas_produccion          TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(id_empresa, codigo_proyecto_interno)
);
```

### 4.13 Tabla: `proyectos_hitos`

```sql
CREATE TABLE public.proyectos_hitos (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_proyecto             UUID NOT NULL REFERENCES public.proyectos_operaciones(id) ON DELETE CASCADE,
  tipo_hito               TEXT NOT NULL
                          CHECK (tipo_hito IN (
                          'cobro_anticipo','compra_materiales','inicio_fabricacion',
                          'cae_seguridad','reserva_logistica','fecha_carga',
                          'fecha_montaje','fecha_cobro_final')),
  fecha_programada        DATE NOT NULL,
  fecha_real_ejecucion    DATE,
  responsable             UUID REFERENCES public.usuarios(id),
  estado_hito             TEXT NOT NULL DEFAULT 'pendiente'
                          CHECK (estado_hito IN ('pendiente','en_progreso',
                          'completado','retrasado')),
  notas                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.14 Tabla: `facturas_proyectos` (Cobros a clientes)

```sql
CREATE TABLE public.facturas_proyectos (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_proyecto             UUID NOT NULL REFERENCES public.proyectos_operaciones(id),
  numero_factura_legal    TEXT NOT NULL, -- Formato: F26-0012
  tipo_factura            TEXT NOT NULL
                          CHECK (tipo_factura IN ('anticipo','final','rectificativa')),
  porcentaje_facturado    NUMERIC(5,2) NOT NULL,
  base_imponible          NUMERIC(12,2) NOT NULL,
  porcentaje_iva          NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  importe_iva             NUMERIC(12,2) NOT NULL,
  total_factura_bruto     NUMERIC(12,2) NOT NULL,
  estado_cobro            TEXT NOT NULL DEFAULT 'pendiente_cobro'
                          CHECK (estado_cobro IN ('pendiente_cobro','cobrada','impagada_vencida')),
  fecha_emision           DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento       DATE NOT NULL,
  fecha_cobro_real        DATE,
  notas                   TEXT,
  pdf_url                 TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(id_proyecto, numero_factura_legal)
);
```

### 4.15 Tabla: `facturas_proveedores_cabecera`

```sql
CREATE TABLE public.facturas_proveedores_cabecera (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa                  UUID NOT NULL REFERENCES public.empresas(id),
  id_proveedor                UUID NOT NULL REFERENCES public.proveedores(id),
  numero_factura_proveedor    TEXT NOT NULL,
  fecha_emision               DATE NOT NULL,
  fecha_recepcion             DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento           DATE NOT NULL,
  base_imponible              NUMERIC(10,2) NOT NULL,
  importe_iva                 NUMERIC(10,2) NOT NULL,
  total_factura_bruto         NUMERIC(10,2) NOT NULL,
  estado_pago                 TEXT NOT NULL DEFAULT 'pendiente'
                              CHECK (estado_pago IN ('pendiente','pagada','disputa_bloqueada')),
  metodo_pago                 TEXT DEFAULT 'transferencia'
                              CHECK (metodo_pago IN ('transferencia','confirming','tarjeta','girado')),
  pdf_url                     TEXT,
  notas                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.16 Tabla: `facturas_proveedores_lineas`

```sql
CREATE TABLE public.facturas_proveedores_lineas (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_factura_proveedor      UUID NOT NULL REFERENCES public.facturas_proveedores_cabecera(id) ON DELETE CASCADE,
  id_proyecto               UUID REFERENCES public.proyectos_operaciones(id),
  id_categoria_matriz       INTEGER REFERENCES public.categorias_matriz(id),
  descripcion_articulo      TEXT NOT NULL,
  cantidad                  NUMERIC(10,3) NOT NULL,
  unidad                    TEXT,
  precio_unitario_coste     NUMERIC(10,2) NOT NULL,
  total_linea_coste         NUMERIC(12,2) NOT NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.17 Tabla: `cierres_proyectos`

```sql
CREATE TABLE public.cierres_proyectos (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_proyecto                     UUID NOT NULL UNIQUE REFERENCES public.proyectos_operaciones(id),
  ingreso_total_real              NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  gasto_total_real                NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  margen_bruto_real               NUMERIC(12,2) GENERATED ALWAYS AS
                                  (ingreso_total_real - gasto_total_real) STORED,
  margen_real_porcentaje          NUMERIC(5,2),
  presupuesto_original            NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  desviacion_beneficio_porcentaje NUMERIC(5,2),
  valoracion_cliente              INTEGER CHECK (valoracion_cliente BETWEEN 1 AND 5),
  lecciones_aprendidas            TEXT,
  fecha_cierre_oficial            DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.18 Tabla: `proyectos_canal_b2b`

```sql
CREATE TABLE public.proyectos_vinculos_b2b (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_proyecto             UUID NOT NULL REFERENCES public.proyectos_operaciones(id),
  id_empresa_origen       UUID NOT NULL REFERENCES public.empresas(id),
  id_empresa_destino      UUID NOT NULL REFERENCES public.empresas(id),
  token_canal_seguro      TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  fecha_activacion_canal  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado_canal            BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.proyectos_canal_intercambio (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_vinculo_b2b          UUID NOT NULL REFERENCES public.proyectos_vinculos_b2b(id),
  id_usuario_emisor       UUID NOT NULL REFERENCES public.usuarios(id),
  tipo_notificacion       TEXT NOT NULL
                          CHECK (tipo_notificacion IN (
                          'mensaje','plano_autocad','orden_cnc',
                          'grafica_arte','aprobacion_cambio')),
  contenido_texto         TEXT,
  ruta_archivo_servidor   TEXT,
  fecha_registro          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.19 Triggers y Funciones

```sql
-- Trigger updated_at universal
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER trg_clientes_upd BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_presupuestos_upd BEFORE UPDATE ON public.presupuestos_cabecera FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_proyectos_upd BEFORE UPDATE ON public.proyectos_operaciones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- (repetir para todas las tablas)

-- Función: al aceptar presupuesto → crear proyecto + hitos automáticos
CREATE OR REPLACE FUNCTION public.crear_proyecto_desde_presupuesto()
RETURNS TRIGGER AS $$
DECLARE
  v_proyecto_id UUID;
  v_fecha_feria DATE;
BEGIN
  IF NEW.estado_presupuesto = 'aceptado' AND OLD.estado_presupuesto != 'aceptado' THEN
    -- Congelar fecha de aceptación
    NEW.fecha_aceptacion = NOW();

    -- Crear proyecto
    INSERT INTO public.proyectos_operaciones
      (id_empresa, id_presupuesto, codigo_proyecto_interno)
    VALUES
      (NEW.id_empresa, NEW.id,
       'OP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('presupuestos_seq')::TEXT, 4, '0'))
    RETURNING id INTO v_proyecto_id;

    v_fecha_feria := NEW.fecha_inicio_feria;

    -- Crear hitos automáticos (retrocediendo desde fecha de feria)
    INSERT INTO public.proyectos_hitos (id_proyecto, tipo_hito, fecha_programada) VALUES
      (v_proyecto_id, 'cobro_anticipo',       v_fecha_feria - INTERVAL '30 days'),
      (v_proyecto_id, 'compra_materiales',    v_fecha_feria - INTERVAL '21 days'),
      (v_proyecto_id, 'cae_seguridad',        v_fecha_feria - INTERVAL '14 days'),
      (v_proyecto_id, 'inicio_fabricacion',   v_fecha_feria - INTERVAL '14 days'),
      (v_proyecto_id, 'reserva_logistica',    v_fecha_feria - INTERVAL '7 days'),
      (v_proyecto_id, 'fecha_carga',          v_fecha_feria - INTERVAL '2 days'),
      (v_proyecto_id, 'fecha_montaje',        v_fecha_feria),
      (v_proyecto_id, 'fecha_cobro_final',    v_fecha_feria + INTERVAL '15 days');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_presupuesto_aceptado
  BEFORE UPDATE ON public.presupuestos_cabecera
  FOR EACH ROW EXECUTE FUNCTION public.crear_proyecto_desde_presupuesto();

-- Función: calcular total línea automáticamente
CREATE OR REPLACE FUNCTION public.calcular_total_linea()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_linea := ROUND(
    NEW.cantidad * NEW.precio_unitario_venta * (1 - NEW.descuento_linea_pct / 100), 2
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_linea_total
  BEFORE INSERT OR UPDATE ON public.presupuestos_lineas
  FOR EACH ROW EXECUTE FUNCTION public.calcular_total_linea();
```

---

## 5. ARQUITECTURA QDRANT

### 5.1 Colecciones

```
COLECCIÓN                   FUENTE DE DATOS         QUÉ SE VECTORIZA
──────────────────────────  ──────────────────────  ─────────────────────────────────────
elementos_catalogo_b        catalogo_elementos       descripcion_comercial
servicios_despiece_c        tarifas_servicios        nombre_tecnico + descripcion_compra
proyectos_historicos        presupuestos aceptados   descripción completa del proyecto
documentacion_tecnica       PDFs / MDs de Drive      chunks de documentos técnicos
```

### 5.2 Configuración de Colecciones

```json
{
  "elementos_catalogo_b": {
    "vectors": { "size": 1536, "distance": "Cosine" },
    "payload_schema": {
      "id_supabase": "uuid",
      "codigo_sku": "keyword",
      "nombre_elemento": "text",
      "descripcion_comercial": "text",
      "id_categoria_matriz": "integer",
      "nombre_categoria": "keyword",
      "unidad_medida_bloque": "keyword",
      "precio_venta_unidad": "float",
      "activo": "bool"
    }
  },
  "servicios_despiece_c": {
    "vectors": { "size": 1536, "distance": "Cosine" },
    "payload_schema": {
      "id_supabase": "uuid",
      "nombre_tecnico": "text",
      "descripcion_compra": "text",
      "id_categoria_matriz": "integer",
      "nombre_categoria": "keyword",
      "unidad_medida": "keyword",
      "precio_coste_unidad_medida": "float",
      "aplica_desperdicio": "bool",
      "requiere_homologacion": "bool",
      "activo": "bool"
    }
  },
  "proyectos_historicos": {
    "vectors": { "size": 1536, "distance": "Cosine" },
    "payload_schema": {
      "id_presupuesto": "uuid",
      "nombre_feria": "keyword",
      "tipo_stand": "keyword",
      "nivel_densidad": "keyword",
      "m2": "float",
      "total_proyecto": "float",
      "sector_cliente": "keyword",
      "año": "integer",
      "activo": "bool"
    }
  },
  "documentacion_tecnica": {
    "vectors": { "size": 1536, "distance": "Cosine" },
    "payload_schema": {
      "fuente": "keyword",
      "tipo_doc": "keyword",
      "chunk_index": "integer",
      "contenido": "text",
      "activo": "bool"
    }
  }
}
```

### 5.3 Texto que se vectoriza por colección

```
elementos_catalogo_b:
  texto = nombre_elemento + ". " + descripcion_comercial

servicios_despiece_c:
  texto = nombre_tecnico + ". " + descripcion_compra

proyectos_historicos:
  texto = "Stand " + tipo_stand + " de " + m2 + "m2 nivel " +
          nivel_densidad + " para " + nombre_feria + ". " +
          descripcion_completa_del_proyecto

documentacion_tecnica:
  texto = chunk de ~500 tokens del documento original
```

### 5.4 Score Threshold por Colección

```
elementos_catalogo_b    → score_threshold: 0.70
servicios_despiece_c    → score_threshold: 0.65
proyectos_historicos    → score_threshold: 0.60
documentacion_tecnica   → score_threshold: 0.65
```

---

## 6. ARQUITECTURA n8n — AGENTE JARVIS

### 6.1 Workflows Existentes

```
WORKFLOW 1: Ingesta de Documentos (Pipeline)
  Drive (carpeta MDs) → Loop por archivo → Convertir a PDF
  → Subir a Drive (carpeta PDFs) → Sub-workflow:
  → Crear colección Qdrant → Eliminar duplicados
  → Chunking + Embeddings → Subir puntos a Qdrant

WORKFLOW 2: Agente Jarvis (Presupuestador IA) ← PRINCIPAL
  Webhook POST /stand-budget-agent
  → Switch (texto | imagen | audio)
  → [GPT-4 Vision | Whisper | Edit Fields]
  → AI Agent Jarvis (Claude Sonnet)
      Tools:
      - buscar_en_qdrant (Vector Store Tool)
      - consultar_base_a_macros (HTTP → Supabase)
      - consultar_catalogo_b (HTTP → Supabase)
      - consultar_despiece_c (HTTP → Supabase + Qdrant)
      - generar_imagen_stand (HTTP → DALL-E 3)
      - guardar_presupuesto (HTTP → Supabase)
      - Calculator
      - Think
  → Respond to Webhook
```

### 6.2 Endpoint del Agente

```
POST https://{N8N_DOMAIN}/webhook/stand-budget-agent

Body:
{
  "type": "texto" | "imagen" | "audio",
  "content": "string | url | base64",
  "id_cliente": "uuid",
  "id_empresa": "uuid",
  "nombre_feria": "IFEMA Madrid",
  "m2": 30,
  "altura": 2.5,
  "tipo_stand": "modular",
  "nivel_densidad": "media_estandar",
  "metodo_presupuestacion": "metodo_2_bloques",
  "presupuesto_max": 20000
}

Response:
{
  "success": true,
  "id_presupuesto": "uuid",
  "numero_presupuesto": "PRES-2026-0001",
  "total": 18750.00,
  "imagen_stand_url": "https://...",
  "partidas": [...],
  "recomendaciones": [...]
}
```

### 6.3 Variables de Entorno en n8n

```
OPENAI_API_KEY          → sk-proj-...
ANTHROPIC_API_KEY       → sk-ant-api03-...
QDRANT_URL              → https://{cluster}.qdrant.tech
QDRANT_API_KEY          → ...
SUPABASE_URL            → https://{project}.supabase.co
SUPABASE_ANON_KEY       → eyJ...
SUPABASE_SERVICE_KEY    → eyJ... (para operaciones admin)
N8N_WEBHOOK_URL         → https://{n8n_domain}/webhook
```

---

## 7. MÓDULOS DE LA APLICACIÓN

### 7.1 Módulo: Dashboard

- KPIs en tiempo real: presupuestos activos, proyectos en curso, facturas pendientes, cash flow
- Alertas: hitos próximos a vencer, facturas impagadas, proveedores con pagos vencidos
- Gráficas: facturación mensual vs año anterior, margen por proyecto, pipeline comercial

### 7.2 Módulo: CRM — Clientes

- CRUD completo de clientes con todos los campos de la tabla `clientes`
- Historial de presupuestos por cliente
- Bloqueo automático si `estado_cliente = 'bloqueado_impagos'`
- Indicador de rentabilidad histórica por cliente

### 7.3 Módulo: Presustand — Presupuestador IA

- **Método 1:** Slider de m² + selección tipo + densidad → precio instantáneo
- **Método 2:** Configurador visual drag & drop de elementos del catálogo B
- **Método 3:** Tabla editable de líneas con autocomplete desde catálogos A, B, C
- **Modo IA:** Input de texto, imagen o audio → Agente Jarvis → presupuesto completo
- **Bidireccionalidad:** Conceptos nuevos → flag `es_concepto_nuevo = true` → revisión → integrar
- Generación de PDF del presupuesto
- Estado del presupuesto con máquina de estados visual

### 7.4 Módulo: Proyectos

- Vista Kanban de proyectos por estado
- Timeline de hitos con semáforo (verde/amarillo/rojo)
- Vista de rentabilidad en curso (ingresos facturados vs gastos imputados)
- Canal B2B integrado (chat + adjuntos técnicos)

### 7.5 Módulo: Finanzas

- Control de facturas emitidas a clientes (anticipo + final)
- Control de facturas de proveedores con imputación analítica
- Cash flow previsional (cobros próximos - pagos próximos)
- Cierre de proyectos: margen real vs estimado

### 7.6 Módulo: Catálogos (Admin)

- CRUD de Base A (tarifas macro m²)
- CRUD de Base B (catálogo de elementos) con sync a Qdrant
- CRUD de Base C (tarifas de despiece) con sync a Qdrant
- CRUD de proveedores
- CRUD de gastos fijos
- Panel de indexación Qdrant (estado de sincronización)

### 7.7 Módulo: Canal B2B

- Feed de mensajes y archivos por proyecto
- Upload de planos DWG, órdenes CNC, arte gráfico
- Sistema de aprobación de cambios con firma digital básica
- Historial inmutable con timestamp de cada intercambio

---

## 8. REGLAS DE NEGOCIO CRÍTICAS

### 8.1 Bidireccionalidad del Presupuesto

```
REGLA: Cuando se guarda una línea de presupuesto con es_concepto_nuevo = true,
el sistema debe mostrar en el módulo Catálogos una cola de "conceptos pendientes
de integrar". El administrador revisa y decide a qué base (A, B o C) añadir
el concepto y con qué precio de tarifa oficial. Una vez aprobado, se marca
integrado_en_catalogo = true y se indexa en Qdrant si corresponde.
```

### 8.2 Congelación de Precios al Aceptar

```
REGLA: Cuando estado_presupuesto cambia a 'aceptado', los precios de todas
las líneas quedan congelados en presupuestos_lineas. Cualquier cambio posterior
de precio en los catálogos NO afecta a presupuestos ya aceptados.
El campo version_congelada registra la versión del catálogo usada.
```

### 8.3 Bloqueo de Clientes con Impagos

```
REGLA: Si estado_cliente = 'bloqueado_impagos', el sistema debe:
1. Impedir crear nuevos presupuestos para ese cliente.
2. Mostrar alerta visual en cualquier pantalla donde aparezca el cliente.
3. Solo el rol 'admin' puede cambiar el estado del cliente.
```

### 8.4 Cálculo del Coeficiente de Desperdicio

```
REGLA: Para materiales con aplica_coeficiente_desperdicio = true,
la cantidad real a presupuestar = cantidad_diseño * coeficiente_desperdicio.
Ejemplo: 30m² de moqueta con coeficiente 1.10 = presupuestar 33m².
```

### 8.5 Urgencia en Materiales

```
REGLA: Si la fecha de carga es menor a 3 días desde hoy,
aplicar incremento_urgencia_porcentaje a todas las tarifas de Base C
de ese presupuesto/proyecto.
```

### 8.6 Generación Automática de Hitos

```
REGLA: Al cambiar estado_presupuesto a 'aceptado' (trigger SQL):
- cobro_anticipo       = fecha_inicio_feria - 30 días
- compra_materiales    = fecha_inicio_feria - 21 días
- cae_seguridad        = fecha_inicio_feria - 14 días
- inicio_fabricacion   = fecha_inicio_feria - 14 días
- reserva_logistica    = fecha_inicio_feria - 7 días
- fecha_carga          = fecha_inicio_feria - 2 días
- fecha_montaje        = fecha_inicio_feria
- fecha_cobro_final    = fecha_inicio_feria + 15 días
```

### 8.7 Rentabilidad en Cierre

```
FÓRMULA:
ingreso_total_real      = SUM(total_factura_bruto) WHERE id_proyecto AND estado_cobro = 'cobrada'
gasto_total_real        = SUM(total_linea_coste) de facturas_proveedores_lineas WHERE id_proyecto
margen_real_porcentaje  = ((ingreso - gasto) / ingreso) * 100
desviacion              = margen_real_porcentaje - margen_presupuestado_porcentaje
```

---

## 9. CONVENCIONES Y ESTÁNDARES DE CÓDIGO

### 9.1 Nomenclatura General

```
Base de datos:      snake_case          (presupuestos_cabecera, id_cliente)
Componentes React:  PascalCase          (PresupuestoForm, ClienteCard)
Funciones/hooks:    camelCase           (calcularTotal, usePresupuesto)
Constantes:         UPPER_SNAKE_CASE    (ESTADO_PRESUPUESTO, IVA_DEFAULT)
Archivos:           kebab-case          (presupuesto-form.tsx, use-cliente.ts)
```

### 9.2 Formato de Números y Fechas

```
Moneda:      Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
Fecha:       Intl.DateTimeFormat('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' })
Porcentaje:  valor.toFixed(2) + '%'
```

---

## 10. ESTADO ACTUAL DEL DESARROLLO (Actualizado: 30-Jun-2026)

> **Este apartado es la ÚNICA referencia de estado válida.** Los ficheros `INSTRUCCIONES_PENDIENTES.md`, `TAREAS-PENDIENTES.md` y `ANALISIS-FASES-3-4.md` han sido eliminados por estar obsoletos. Consultar solo este §10 antes de planificar cualquier funcionalidad.

### ✅ MÓDULOS COMPLETADOS

#### Frontend — `/stand/src/app/dashboard/`

| Ruta | Módulo | Estado | Notas |
|---|---|---|---|
| `/dashboard` | Dashboard principal | ✅ Completo | KPIs, gráfica de facturación, alertas de hitos |
| `/dashboard/clientes` | CRM Clientes | ✅ Completo | CRUD completo con todos los campos de la tabla |
| `/dashboard/presustand` | Presustand (Presupuestador) | ✅ Completo | Métodos 1, 2 y 3 + Modo IA (texto/imagen/audio) + bloqueo por límites de plan |
| `/dashboard/proyectos` | Kanban de Proyectos | ✅ Completo | Kanban drag & drop (desktop) + acordeón (móvil), conectado a Supabase |
| `/dashboard/proyectos/[id]` | Detalle de Proyecto e Hitos | ✅ Completo | Timeline 8 hitos automáticos, tooltips, botón Completar, colores semáforo (≤7 días = amarillo) |
| `/dashboard/catalogos` | Catálogos Técnicos | ✅ Completo | CRUD Base A (tarifas m²), Base B (elementos), Base C (despiece) + botones Sync Qdrant |
| `/dashboard/proveedores` | Gestión Proveedores | ✅ Completo | CRUD de proveedores con categorías matriz |
| `/dashboard/finanzas` | Módulo Financiero | ✅ Completo | Facturas clientes (auto F26-NNNN, validación ≤100%, bloqueo deudores), facturas proveedores (cabecera+líneas, imputación analítica), Cash Flow previsional 30/60/90d + gráfico 6 meses + alertas 14d, Cierre Económico con rentabilidad real, estrellas, lecciones y webhook n8n |
| `/dashboard/perfil` | Perfil y Suscripción | ✅ Completo | Edición de datos de usuario y empresa, card Suscripción SaaS con plan activo y 4 barras de uso (IA calls, presupuestos/mes, proyectos activos, usuarios). Llama a `get_plan_usage()` RPC. |
| `/print/factura/[id]` | Template de factura imprimible | ✅ Completo | Página de impresión con datos fiscales |
| `/print/presupuesto/[id]` | Template de presupuesto imprimible | ✅ Completo | Vista imprimible (A4 y PDF) con despiece y render IA |
| `/api/send-invoice` | Envío email de factura | ✅ Completo | API route para envío de facturas por email |
| `/login` | Autenticación | ✅ Completo | Login con email/contraseña + Google OAuth |

#### Infraestructura

| Componente | Estado | Notas |
|---|---|---|
| Supabase Auth | ✅ Configurado | JWT + Google OAuth via GCP |
| RLS (Row Level Security) | ✅ Activo | Todas las 19 tablas del proyecto tienen RLS habilitado |
| Middleware de protección de rutas | ✅ Implementado | `stand/src/middleware.ts` |
| Schema completo de Supabase | ✅ Ejecutado | Todas las tablas del §4 están creadas |
| Variables de entorno en Vercel | ✅ Configuradas | `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `N8N_WEBHOOK_BASE_URL`, `Name` — todas en Production y Preview |
| Seeds Base B (catalogo_elementos) | ✅ Ejecutados | `seeds/seed_catalogo_elementos.sql` |
| Seeds Base C (tarifas_servicios) | ✅ Ejecutados | `seeds/seed_tarifas_servicios.sql` (34 tarifas insertadas) |
| Workflow Agente Jarvis n8n | ✅ Activo | `/flujosn8n/` + `/stand budget/n8n_stands_presupuestador.json` |
| Workflow sync Qdrant Base B | ✅ Activo | `sync-catalogo-b-v1` activo en n8n |
| Workflow sync Qdrant Base C | ✅ Activo | `sync-catalogo-c-v1` activo en n8n |
| Workflow cierre proyecto → Qdrant | ✅ Activo | `proyecto-cerrado-v1` activo en n8n |
| Workflow Supabase Keep-Alive | ✅ Activo | `supabase_keep_alive.json` — Schedule semanal en n8n, última ejecución exitosa Jun 29 |
| Tool Base C en Agente Jarvis | ✅ Configurado | `consultar_despiece_taller` añadida + System Message Método 3 |
| DB Webhooks Supabase → n8n | ✅ Configurados | `auto_sync_catalogo_b` y `auto_sync_catalogo_c` activos en Supabase |
| Función RPC `get_plan_usage()` | ✅ Activa | Devuelve uso actual vs límites por plan (ia_calls, presupuestos, proyectos, usuarios) |
| Función RPC `generar_numero_factura()` | ✅ Activa | Genera secuencial F26-NNNN para facturas de clientes |
| Trigger SQL auto-proyecto+hitos | ✅ Activo | `Fix_Sqls/fix_crear_proyecto_desde_presupuesto.sql` — al aceptar presupuesto crea proyecto + 8 hitos |
| API route `/api/generate-budget` | ✅ Implementada | Proxy al webhook n8n con límites de plan |
| API route `/api/upload` | ✅ Implementada | Subida de archivos a Supabase Storage (máx 10MB) |
| Tipos compartidos (`/types/index.ts`) | ✅ Creado | Interfaces: Cliente, Proveedor, Presupuesto, Tarifas, FacturaProyecto, CierreProyecto, etc. |
| Constantes (`/constants/index.ts`) | ✅ Creado | ESTADO_PRESUPUESTO, TIPO_STAND, ROL_USUARIO (incluye `cliente_externo`), KANBAN_COLUMNAS, ESTADO_COBRO, TIPO_FACTURA |
| StatusBadge componente compartido | ✅ Creado | `components/shared/status-badge.tsx` |

---

### 🐛 DEUDA TÉCNICA CONOCIDA (bugs menores, no bloqueantes)

| Bug | Archivo | Descripción | Estado Real |
|---|---|---|---|
| `EstadoProyecto` incompleto | `types/index.ts` L110-116 | El union type solo tenía 6 valores pero el código usaba también `"desmontado"`, `"facturado"`, `"cerrado"` | **Resuelto (Fijado ✅)** |
| Alert obsoleto | `proyectos/[id]/page.tsx` L151 | Decía "Modal pendiente de construir" pero el modal ya existe en `/finanzas` | **Resuelto (Redirecciona y alerta correctamente ✅)** |

---

### ⏳ PENDIENTE — Fase 4 (SaaS y Escala)

> La infraestructura multi-tenant (RLS, `id_empresa`, `plan_saas`) ya está en la BD. Lo que falta es la lógica de negocio de escala.

```
- [x] Analytics avanzado para gerente
      → Implementado en /dashboard/gerencial: KPIs financieros (cobrado real, gasto aprobado,
        rentabilidad media, conversión), Top 5 clientes, progreso objetivo anual, carga del
        taller 30d, historial económico de cierres con margen, desviación y valoración cliente.
        Acceso desde sidebar y botón en dashboard operativo. (Completado: 30-Jun-2026)

- [x] Widget de hitos próximos en dashboard principal
      → Implementado con carga dinámica desde Supabase en tiempo real (vencidos o programados para ≤7 días) y enlaces directos al proyecto. (Completado: 30-Jun-2026)

- [x] Canal B2B básico
      → Mensajería + adjuntos por proyecto (taller ↔ oficina técnica). Integración de subidas de archivos técnicos (DWG, DXF, PDF, ZIP), previsualización de imágenes, RLS de inmutabilidad y notificaciones n8n activadas por disparador de base de datos. (Completado: 01-Jul-2026)

- [ ] API pública documentada (baja prioridad)
      → REST endpoints + API Key + Swagger. Solo si hay clientes que lo pidan.

- [ ] Internacionalización i18n (baja prioridad)
      → next-intl para es/en/fr/de. Solo si hay clientes internacionales.
```

---

### 🗂️ ESTRUCTURA DE ARCHIVOS DEL PROYECTO

```
budgeStands/
├── Plan-Maestro.md          ← Este documento (fuente de verdad)
├── DatosImportantes.txt     ← Credenciales locales (NO COMMITEAR)
├── stand/                   ← App Next.js 14 (frontend principal)
│   └── src/
│       ├── app/
│       │   ├── dashboard/   ← Módulos principales (ver tabla arriba)
│       │   ├── login/       ← Autenticación
│       │   └── api/generate-budget/  ← Proxy a n8n
│       ├── components/      ← shadcn/ui + componentes propios
│       └── middleware.ts    ← Protección de rutas
├── flujosn8n/               ← Workflows n8n exportados
│   ├── sync_catalogo_b_qdrant.json
│   ├── sync_catalogo_c_qdrant.json
│   └── cierre_proyecto_qdrant.json
├── seeds/                   ← SQL de datos iniciales
│   ├── seed_catalogo_elementos.sql   ← Base B
│   ├── seed_tarifas_servicios.sql    ← Base C
│   └── historico_proyectos/
├── stand budget/            ← LEGACY: prototipo inicial n8n (referencia)
│   ├── n8n_stands_presupuestador.json  ← Workflow agente Jarvis original
│   ├── supabase_schema.sql             ← Schema inicial (sustituido por Plan-Maestro §4)
│   └── README.md                       ← Guía de setup n8n (referencia)
└── supabase/                ← Config local Supabase CLI (vacío por ahora)
```

> **Nota sobre `/stand budget/`:** Es el directorio del prototipo original (pre-The Titan). El workflow de n8n ahí contenido sigue siendo válido como referencia del Agente Jarvis. El `supabase_schema.sql` dentro está **obsoleto** — usar el schema del §4 de este documento.

---

## 10-B. ROADMAP POR FASES (Resumen ejecutivo)

| Fase | Descripción | Estado |
|---|---|---|
| **Fase 1** | MVP Core — Presupuestador IA | ✅ **Completada** |
| **Fase 1.5** | Autenticación (Google OAuth + middleware) | ✅ **Completada** |
| **Fase 2** | Gestión de Proyectos (kanban, hitos, timeline, trigger SQL) | ✅ **Completada** |
| **Fase 2.5** | Infraestructura n8n/Qdrant (workflows activos, Tool Base C, DB Webhooks) | ✅ **Completada** |
| **Fase 3** | Módulo Financiero (facturas, cash flow, cierre) | ✅ **Completada** |
| **Fase 4** | SaaS multi-tenant y escala | ⏳ En desarrollo (Canal B2B completado) |

---

## 11. VARIABLES DE ENTORNO Y CREDENCIALES

```env
# .env.local (Next.js)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Solo en server-side, nunca en cliente

# n8n (Agente Jarvis)
N8N_BUDGET_AGENT_WEBHOOK=https://{tu-n8n-domain}/webhook/stand-budget-agent
N8N_IMAGE_GEN_WEBHOOK=https://{tu-n8n-domain}/webhook/generate-stand-image

# Qdrant (solo para server-side / n8n)
QDRANT_URL=https://{cluster}.qdrant.tech
QDRANT_API_KEY=...

# OpenAI (solo en n8n, no en frontend)
OPENAI_API_KEY=sk-proj-...

# Anthropic (solo en n8n, no en frontend)
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Regla de seguridad:** Las claves de OpenAI, Anthropic y Qdrant NUNCA van en el frontend ni en variables `NEXT_PUBLIC_`. Todas las llamadas a estas APIs pasan por n8n o por Supabase Edge Functions.

---

## GLOSARIO

| Término | Definición |
|---|---|
| Arquitectura Efímera | Construcciones temporales para eventos: stands, escenarios, pop-ups |
| Base A | Tabla `tarifas_macros_m2`: precios por m² para estimación rápida |
| Base B | Tabla `catalogo_elementos`: bloques constructivos precalculados |
| Base C | Tabla `tarifas_servicios`: materias primas y MO para despiece técnico |
| CAE | Coordinación de Actividades Empresariales (prevención de riesgos) |
| Chunking | División de documentos en fragmentos para indexar en Qdrant |
| Densidad | Complejidad visual y decorativa del stand (baja/media/alta) |
| Despiece | Presupuestación unitaria de cada material y hora de trabajo |
| Hito | Evento clave del ciclo de vida de un proyecto con fecha límite |
| Presustand | Módulo de presupuestación inteligente de The Titan |
| RAG | Retrieval-Augmented Generation: IA que busca en BD antes de responder |
| Stand | Espacio expositivo construido en una feria o evento |

---

*Versión 1.6 — Actualizado 30-Jun-2026. Eliminados documentos obsoletos: INSTRUCCIONES_PENDIENTES.md, TAREAS-PENDIENTES.md, ANALISIS-FASES-3-4.md.*
*Actualizar la sección §10 ante cualquier cambio de estado de los módulos.*
*El modelo de IA debe consultar este documento antes de generar cualquier código.*