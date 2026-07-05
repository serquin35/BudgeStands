"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Send, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, HelpCircle, MessageSquare, BookOpen, Mail } from "lucide-react"

const FAQ_SECTIONS = [
  {
    module: "Presustand IA",
    icon: "✦",
    questions: [
      {
        q: "¿Cómo genero un presupuesto con Jarvis IA?",
        a: "Ve a Presustand IA → pestaña 'Constructor IA (Jarvis)'. Selecciona el cliente, rellena los datos del proyecto (feria, m², tipo de stand) y describe lo que necesitas. Jarvis generará un despiece completo con partidas, costes y margen."
      },
      {
        q: "¿Qué diferencia hay entre Estimación Rápida e IA?",
        a: "La Estimación Rápida calcula un precio por m² usando las tarifas macros de tu catálogo. Jarvis IA genera un despiece técnico detallado con materiales, mano de obra, logística y diseño. Usa la rápida para presupuestos orientativos y Jarvis para propuestas comerciales formales."
      },
      {
        q: "¿Puedo editar el presupuesto generado por IA?",
        a: "Sí. Una vez generado, puedes editar líneas, ajustar cantidades, cambiar precios y eliminar partidas desde la vista detallada del presupuesto."
      }
    ]
  },
  {
    module: "Proyectos Kanban",
    icon: "▣",
    questions: [
      {
        q: "¿Cómo creo un nuevo proyecto?",
        a: "Haz clic en '+ New Project' en el sidebar o genera un presupuesto en Presustand y apruébalo. El proyecto aparecerá automáticamente en el tablero Kanban en fase 'Pendiente'."
      },
      {
        q: "¿Qué significan las fases del Kanban?",
        a: "Pendiente → Diseño → Fabricación → Montaje → Finalizado. Cada fase representa una etapa del ciclo de vida del stand. Puedes mover tarjetas arrastrándolas o cambiando el estado desde el detalle del proyecto."
      }
    ]
  },
  {
    module: "Finanzas",
    icon: "€",
    questions: [
      {
        q: "¿Cómo facturo un proyecto?",
        a: "Ve a Finanzas → pestaña 'Facturas Clientes' → '+ Emitir Factura'. Selecciona el proyecto, indica el porcentaje a facturar y confirma. La factura se registrará con estado 'Pendiente' hasta que la cobres."
      },
      {
        q: "¿Qué es el Cash Flow y Cierre Proyectos?",
        a: "Cash Flow muestra un desglose de ingresos vs gastos por proyecto. Cierre Proyectos permite cerrar operativamente un proyecto y generar un balance final de rentabilidad."
      }
    ]
  },
  {
    module: "CRM y Clientes",
    icon: "●",
    questions: [
      {
        q: "¿Cómo añado un nuevo cliente?",
        a: "Ve a CRM Clients → '+ Añadir Cliente'. Rellena los datos básicos (nombre, CIF, email, teléfono) y guarda. El cliente estará disponible al crear presupuestos."
      },
      {
        q: "¿Qué significa el estado 'Bloqueado Impagos'?",
        a: "Es un estado manual que indica que el cliente tiene facturas vencidas sin cobrar. No bloquea funcionalidad pero sirve como alerta comercial."
      }
    ]
  },
  {
    module: "Catálogos Técnicos",
    icon: "≡",
    questions: [
      {
        q: "¿Qué son las tarifas macros (Base A)?",
        a: "Son precios por m² según tipo de stand y nivel de densidad. Se usan en la Estimación Rápida para calcular presupuestos orientativos instantáneos."
      },
      {
        q: "¿Para qué sirve sincronizar los catálogos?",
        a: "El botón 'Sincronizar' actualiza la base de datos del motor de estimación con los últimos elementos del catálogo. Debes sincronizar cada vez que añadas o modifiques tarifas en Base B o Base C."
      }
    ]
  }
]

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: "", email: "", modulo: "soporte", asunto: "", mensaje: "" })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleFaq = (key: string) => {
    setOpenFaq(openFaq === key ? null : key)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)

    try {
      const res = await fetch("https://n8n.cheosdesign.info/webhook/support-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          timestamp: new Date().toISOString(),
          app_version: "MVP v1.0",
          source: "The Titan — Support Form"
        })
      })

      if (!res.ok) throw new Error("Error al enviar el formulario")

      setSent(true)
      setForm({ nombre: "", email: "", modulo: "soporte", asunto: "", mensaje: "" })
    } catch (err: any) {
      setError(err?.message || "No se pudo enviar el mensaje. Inténtalo de nuevo.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
          Centro de Soporte
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preguntas frecuentes, guías rápidas y contacto directo con el equipo.
        </p>
        <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
          MVP v1.0
        </span>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="hover:border-primary/30 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Guía de inicio</div>
              <div className="text-[10px] text-muted-foreground">Primeros pasos con The Titan</div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/30 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Chat con Jarvis</div>
              <div className="text-[10px] text-muted-foreground">Asistente IA de la app</div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/30 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Email directo</div>
              <div className="text-[10px] text-muted-foreground">info@thetitan.com</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Sections */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Preguntas Frecuentes</h2>
        <div className="space-y-4">
          {FAQ_SECTIONS.map((section) => (
            <Card key={section.module}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="text-base">{section.icon}</span>
                  {section.module}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-border/50">
                  {section.questions.map((faq, idx) => {
                    const key = `${section.module}-${idx}`
                    const isOpen = openFaq === key
                    return (
                      <div key={idx}>
                        <button
                          onClick={() => toggleFaq(key)}
                          className="w-full flex items-center justify-between py-3 text-left text-sm text-foreground hover:text-primary transition-colors"
                        >
                          <span className="font-medium pr-4">{faq.q}</span>
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="pb-3 text-sm text-muted-foreground leading-relaxed">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Contactar Soporte</h2>
        <Card>
          <CardContent className="p-6">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                <h3 className="text-lg font-bold text-foreground">Mensaje enviado</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Hemos recibido tu consulta. Te responderemos lo antes posible en {form.email || "tu correo electrónico"}.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSent(false)}
                >
                  Enviar otro mensaje
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      placeholder="Tu nombre"
                      required
                      value={form.nombre}
                      onChange={(e) => setForm(p => ({ ...p, nombre: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      value={form.email}
                      onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modulo">Módulo afectado</Label>
                  <select
                    id="modulo"
                    value={form.modulo}
                    onChange={(e) => setForm(p => ({ ...p, modulo: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none"
                  >
                    <option value="presupuestos">Presupuestos IA (Jarvis)</option>
                    <option value="proyectos">Proyectos y Kanban</option>
                    <option value="finanzas">Módulo Financiero</option>
                    <option value="clientes">CRM Clientes</option>
                    <option value="proveedores">Proveedores</option>
                    <option value="catalogos">Catálogos</option>
                    <option value="canal_b2b">Canal B2B</option>
                    <option value="configuracion">Configuración y Perfil</option>
                    <option value="soporte">Soporte / Centro de Ayuda</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asunto">Asunto</Label>
                  <Input
                    id="asunto"
                    placeholder="Ej: Error al generar presupuesto con Jarvis"
                    required
                    value={form.asunto}
                    onChange={(e) => setForm(p => ({ ...p, asunto: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mensaje">Mensaje</Label>
                  <textarea
                    id="mensaje"
                    rows={5}
                    placeholder="Describe tu problema o consulta con el mayor detalle posible..."
                    required
                    value={form.mensaje}
                    onChange={(e) => setForm(p => ({ ...p, mensaje: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none resize-none"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={sending} className="gap-2">
                    {sending ? (
                      <>
                        <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar mensaje
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
