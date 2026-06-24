# The Titan — Frontend (Next.js 14)

Aplicación principal del ERP de stands feriales. Ver `Plan-Maestro.md` en la raíz del proyecto para la arquitectura completa.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Estilos:** Tailwind CSS + shadcn/ui
- **Base de datos:** Supabase (PostgreSQL + Auth + Storage)
- **LLM / IA:** Agente Jarvis via n8n (webhook)

## Módulos implementados

| Ruta | Módulo |
|---|---|
| `/dashboard` | Dashboard con KPIs y alertas |
| `/dashboard/clientes` | CRM Clientes (CRUD completo) |
| `/dashboard/presustand` | Presupuestador IA (Métodos 1, 2, 3 + Modo IA) |
| `/dashboard/proyectos` | Kanban de Proyectos (drag & drop) |
| `/dashboard/catalogos` | Catálogos Base A, B y C |
| `/dashboard/proveedores` | Gestión de Proveedores |
| `/login` | Autenticación (email + Google OAuth) |

## Arrancar en desarrollo

```bash
cd stand
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Copia `.env.local` (no está en el repo por seguridad). Variables requeridas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://iqrwhycmgprkfbhuxlnn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Solo server-side
N8N_WEBHOOK_BASE_URL=https://{n8n-domain}/webhook
N8N_WEBHOOK_STAND_BUDGET=stand-budget-agent
```

> **Seguridad:** NUNCA commitear `.env.local`. Las claves de OpenAI/Anthropic/Qdrant van SOLO en n8n.
