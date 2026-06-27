"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, ChevronDown, MapPin, MoreHorizontal, Plus, Star, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProyectoOperacion, EstadoProyecto } from "@/types";
import { KANBAN_COLUMNAS } from "@/constants";

const KANBAN_COLUMNS = [
  { id: "pendiente",   title: "Pendiente",   dot: "bg-slate-400",   border: "border-slate-400/30",   bg: "bg-slate-800/30" },
  { id: "diseno",      title: "Diseño",      dot: "bg-blue-400",    border: "border-blue-400/30",    bg: "bg-blue-900/20"  },
  { id: "fabricacion", title: "Fabricación", dot: "bg-amber-400",   border: "border-amber-400/30",   bg: "bg-amber-900/20" },
  { id: "montaje",     title: "Montaje",     dot: "bg-purple-400",  border: "border-purple-400/30",  bg: "bg-purple-900/20"},
  { id: "finalizado",  title: "Finalizado",  dot: "bg-emerald-400", border: "border-emerald-400/30", bg: "bg-emerald-900/20"},
];

const MOCK_PROYECTOS: ProyectoOperacion[] = [
  {
    id: "mock-1",
    id_empresa: "mock",
    id_presupuesto: "mock-p1",
    codigo_proyecto_interno: "PRJ-2026-001",
    fecha_creacion_proyecto: new Date().toISOString(),
    id_director_obra: null,
    estado_proyecto: "pendiente" as EstadoProyecto,
    notas_produccion: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    presupuestos_cabecera: {
      nombre_feria: "Mobile World Congress",
      recinto_ferial: "Fira Barcelona",
      fecha_inicio_feria: "2027-02-28",
      total_presupuesto: 45000,
      imagen_stand_url: "https://images.unsplash.com/photo-1558466184-7a31b9d4df96?q=80&w=400&auto=format&fit=crop",
    },
  },
  {
    id: "mock-2",
    id_empresa: "mock",
    id_presupuesto: "mock-p2",
    codigo_proyecto_interno: "PRJ-2026-002",
    fecha_creacion_proyecto: new Date().toISOString(),
    id_director_obra: null,
    estado_proyecto: "diseno" as EstadoProyecto,
    notas_produccion: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    presupuestos_cabecera: {
      nombre_feria: "ARCO Madrid",
      recinto_ferial: "IFEMA",
      fecha_inicio_feria: "2027-03-05",
      total_presupuesto: 28500,
      imagen_stand_url: null,
    },
  },
  {
    id: "mock-3",
    id_empresa: "mock",
    id_presupuesto: "mock-p3",
    codigo_proyecto_interno: "PRJ-2026-003",
    fecha_creacion_proyecto: new Date().toISOString(),
    id_director_obra: null,
    estado_proyecto: "fabricacion" as EstadoProyecto,
    notas_produccion: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    presupuestos_cabecera: {
      nombre_feria: "Alimentaria",
      recinto_ferial: "Fira Barcelona",
      fecha_inicio_feria: "2027-04-12",
      total_presupuesto: 62000,
      imagen_stand_url: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=400&auto=format&fit=crop",
    },
  },
];

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);

// ─── Tarjeta de proyecto (usada en ambas vistas) ──────────────────────────────────
function ProyectoCard({ proyecto, onDragStart }: { proyecto: ProyectoOperacion; onDragStart?: (e: React.DragEvent, id: string) => void }) {
  const presu = proyecto.presupuestos_cabecera ?? ({} as NonNullable<ProyectoOperacion["presupuestos_cabecera"]>);
  return (
    <Card
      draggable={!!onDragStart}
      onDragStart={onDragStart ? (e) => onDragStart(e, proyecto.id) : undefined}
      className="cursor-grab active:cursor-grabbing border border-white/5 bg-[#18181b] shadow-sm hover:shadow-lg hover:border-white/10 transition-all group"
    >
      {presu.imagen_stand_url && (
        <div className="h-24 w-full bg-muted rounded-t-lg overflow-hidden border-b border-white/5 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={presu.imagen_stand_url}
            alt={presu.nombre_feria || "Stand"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-mono font-medium text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-400/20">
            {proyecto.codigo_proyecto_interno || "PRJ-XXX"}
          </span>
          <Link href={`/dashboard/proyectos/${proyecto.id}`} className="text-muted-foreground hover:text-indigo-400 transition-colors z-10">
            <MoreHorizontal className="h-4 w-4" />
          </Link>
        </div>
        <Link href={`/dashboard/proyectos/${proyecto.id}`} className="hover:underline text-[#fafafa] z-10 block">
          <h4 className="font-semibold text-sm line-clamp-2 leading-tight mb-3">
            {presu.nombre_feria || "Stand sin nombre"}
          </h4>
        </Link>
        <div className="space-y-1.5 text-xs text-[#71717a]">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{presu.recinto_ferial || presu.nombre_feria || "Sin recinto"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              {presu.fecha_inicio_feria
                ? new Date(presu.fecha_inicio_feria).toLocaleDateString("es-ES")
                : "Sin fecha"}
            </span>
          </div>
        </div>
        {presu.total_presupuesto && (
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
            <span className="text-xs text-[#52525b]">Presupuesto</span>
            <span className="font-semibold text-sm text-[#fafafa]">{formatMoney(presu.total_presupuesto)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Vista MÓVIL: acordeón por fase ─────────────────────────────────────────
function MobileView({ proyectos, onStatusChange }: { proyectos: ProyectoOperacion[]; onStatusChange: (id: string, newStatus: string) => void }) {
  const [openSection, setOpenSection] = useState<string | null>("Pendiente");

  return (
    <div className="space-y-3 pb-6">
      {KANBAN_COLUMNS.map((col) => {
        const items = proyectos.filter((p) => (p.estado_proyecto || "pendiente") === col.id);
        const isOpen = openSection === col.id;
        return (
          <div key={col.id} className={`rounded-xl border ${col.border} overflow-hidden`}>
            {/* Header del acordeón */}
            <button
              onClick={() => setOpenSection(isOpen ? null : col.id)}
              className={`w-full flex items-center justify-between px-4 py-3 ${col.bg} transition-colors`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="font-semibold text-sm text-[#fafafa]">{col.title}</span>
                <span className="text-xs bg-white/10 text-[#a1a1aa] px-2 py-0.5 rounded-full font-medium">
                  {items.length}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-[#71717a] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Contenido del acordeón */}
            {isOpen && (
              <div className="p-3 space-y-3 bg-[#09090b]/50">
                {items.length === 0 ? (
                  <div className="h-16 flex items-center justify-center border-2 border-dashed border-white/10 rounded-lg">
                    <span className="text-xs text-[#52525b] flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Sin proyectos en esta fase
                    </span>
                  </div>
                ) : (
                  items.map((p) => (
                    <div key={p.id}>
                      <ProyectoCard proyecto={p} />
                      {/* Selector de fase en móvil */}
                      <div className="mt-2 flex gap-1.5 flex-wrap px-1">
                        {KANBAN_COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => onStatusChange(p.id, c.id)}
                            className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-[#71717a] hover:text-[#fafafa] hover:border-white/30 transition-colors"
                          >
                            → {c.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Vista DESKTOP: Kanban horizontal ───────────────────────────────────────
function DesktopView({
  proyectos,
  draggedItem,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  proyectos: ProyectoOperacion[];
  draggedItem: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
}) {
  return (
    <div className="flex-1 flex gap-4 pb-4 min-h-0">
      {KANBAN_COLUMNS.map((col) => {
        const items = proyectos.filter((p) => (p.estado_proyecto || "pendiente") === col.id);
        return (
          <div
            key={col.id}
            className={`flex-1 min-w-0 rounded-xl border ${col.border} ${col.bg} flex flex-col`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, col.id)}
          >
            {/* Cabecera columna */}
            <div className="p-3 flex items-center justify-between border-b border-white/5 bg-[#09090b]/40 backdrop-blur-sm rounded-t-xl shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <h3 className="font-semibold text-sm text-[#fafafa]">{col.title}</h3>
              </div>
              <span className="bg-white/5 text-xs font-medium px-2 py-0.5 rounded-full border border-white/10 text-[#a1a1aa]">
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2.5 overflow-y-auto flex flex-col gap-2.5">
              {items.map((p) => (
                <ProyectoCard key={p.id} proyecto={p} onDragStart={onDragStart} />
              ))}
              {items.length === 0 && (
                <div className={`flex-1 min-h-[80px] flex items-center justify-center border-2 border-dashed border-white/10 rounded-lg transition-colors ${draggedItem ? "border-white/20 bg-white/5" : ""}`}>
                  <span className="text-xs text-[#52525b] flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Soltar aquí
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function ProyectosPage() {
  // CRÍTICO: el cliente debe crearse dentro del componente para tener sesión disponible
  const supabase = useMemo(() => createClient(), []);

  const [proyectos, setProyectos] = useState<ProyectoOperacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);


  const fetchProyectos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("proyectos_operaciones")
      .select("*, presupuestos_cabecera(nombre_feria, recinto_ferial, fecha_inicio_feria, total_presupuesto, imagen_stand_url)")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      setProyectos(data);
    } else {
      if (error) console.warn("[Kanban] Error al cargar proyectos:", error);
      setProyectos(MOCK_PROYECTOS);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchProyectos(); }, [fetchProyectos]);

  const changeStatus = async (id: string, newStatus: string) => {
    const nuevoEstado = newStatus as EstadoProyecto;

    if (id.startsWith("mock-")) {
      setProyectos((prev) => prev.map((p) => (p.id === id ? { ...p, estado_proyecto: nuevoEstado } : p)));
      return;
    }

    // Obtener estado anterior para rollback
    const proyectoActual = proyectos.find((p) => p.id === id);
    const estadoAnterior = proyectoActual?.estado_proyecto;

    // Evitar actualización innecesaria si el estado es el mismo
    if (estadoAnterior === nuevoEstado) return;

    console.log(`[Kanban] Actualizando proyecto ${id}: ${estadoAnterior} → ${nuevoEstado}`);

    // Optimistic update en UI
    setProyectos((prev) => prev.map((p) => (p.id === id ? { ...p, estado_proyecto: nuevoEstado } : p)));

    // Verificar sesión antes de ejecutar el UPDATE
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error("[Kanban] ERROR: No hay sesión activa. El UPDATE no se ejecutará.");
      alert("Error: Sesión expirada. Recarga la página para volver a iniciar sesión.");
      if (estadoAnterior) {
        setProyectos((prev) => prev.map((p) => (p.id === id ? { ...p, estado_proyecto: estadoAnterior } : p)));
      }
      return;
    }
    console.log(`[Kanban] Sesión activa: ${sessionData.session.user.email}`);

    const { data: updatedData, error, count } = await supabase
      .from("proyectos_operaciones")
      .update({ estado_proyecto: nuevoEstado, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();

    console.log("[Kanban] Respuesta UPDATE:", { updatedData, error, count });

    if (error) {
      console.error("[Kanban] Error al persistir en Supabase:", error);
      // Rollback al estado anterior
      if (estadoAnterior) {
        setProyectos((prev) => prev.map((p) => (p.id === id ? { ...p, estado_proyecto: estadoAnterior } : p)));
      }
      alert(`Error al cambiar estado: ${error.message}\nCódigo: ${error.code}`);
      return;
    }

    if (!updatedData || updatedData.length === 0) {
      console.warn("[Kanban] ADVERTENCIA: El UPDATE no afectó ninguna fila. Posible problema de RLS.");
      alert("Advertencia: No se pudo guardar el cambio. Comprueba que tienes permisos sobre este proyecto.");
      if (estadoAnterior) {
        setProyectos((prev) => prev.map((p) => (p.id === id ? { ...p, estado_proyecto: estadoAnterior } : p)));
      }
      return;
    }

    console.log(`[Kanban] ✅ Estado actualizado correctamente en Supabase: ${nuevoEstado}`);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedItem) {
      await changeStatus(draggedItem, newStatus);
      if (newStatus === "finalizado") {
        const proyecto = proyectos.find((p) => p.id === draggedItem);
        if (proyecto && !proyecto.id.startsWith("mock-")) {
          setClosingProject(proyecto);
          setCloseForm({ valoracion_cliente: 5, lecciones_aprendidas: "", ingreso_total_real: 0, gasto_total_real: 0 });
          setShowCloseModal(true);
        }
      }
      setDraggedItem(null);
    }
  };

  // ─── Cierre de proyecto ──────────────────────────────────────
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingProject, setClosingProject] = useState<ProyectoOperacion | null>(null);
  const [closeForm, setCloseForm] = useState({ valoracion_cliente: 5, lecciones_aprendidas: "", ingreso_total_real: 0, gasto_total_real: 0 });
  const [savingClose, setSavingClose] = useState(false);

  const handleCloseProject = async () => {
    if (!closingProject) return;
    setSavingClose(true);
    const presu = closingProject.presupuestos_cabecera ?? ({} as NonNullable<ProyectoOperacion["presupuestos_cabecera"]>);
    const ingreso = Number(closeForm.ingreso_total_real);
    const gasto = Number(closeForm.gasto_total_real);
    const margenBruto = ingreso - gasto;
    const margenPct = ingreso > 0 ? Number(((margenBruto / ingreso) * 100).toFixed(2)) : 0;
    const presupuestoOriginal = Number(presu.total_presupuesto || 0);
    const desviacion = presupuestoOriginal > 0 ? Number(((margenBruto - presupuestoOriginal) / presupuestoOriginal * 100).toFixed(2)) : 0;

    const { error } = await supabase.from("cierres_proyectos").insert({
      id_proyecto: closingProject.id,
      ingreso_total_real: ingreso,
      gasto_total_real: gasto,
      margen_real_porcentaje: margenPct,
      presupuesto_original: presupuestoOriginal,
      desviacion_beneficio_porcentaje: desviacion,
      valoracion_cliente: closeForm.valoracion_cliente,
      lecciones_aprendidas: closeForm.lecciones_aprendidas,
      fecha_cierre_oficial: new Date().toISOString().split("T")[0],
    });

    if (error) {
      console.error("Error al cerrar proyecto:", error);
      alert("Error al guardar el cierre del proyecto");
      setSavingClose(false);
      return;
    }

    fetch("/api/sync/proyecto-cerrado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_proyecto: closingProject.id }),
    }).catch((err) => console.error("Error al notificar n8n:", err));

    setShowCloseModal(false);
    setClosingProject(null);
    setSavingClose(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 sm:p-6 gap-4 sm:gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fafafa]">Proyectos en Curso</h1>
          <p className="text-[#71717a] mt-1 text-sm">
            Gestiona las fases de producción y montaje de los stands aprobados.
          </p>
        </div>
        <Link
          href="/dashboard/presustand"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-sm shadow-indigo-500/20"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo Proyecto</span>
          <span className="sm:hidden">Nuevo</span>
        </Link>
      </div>

      {/* Vista móvil: acordeón (se oculta en lg+) */}
      <div className="lg:hidden overflow-y-auto flex-1">
        <MobileView proyectos={proyectos} onStatusChange={changeStatus} />
      </div>

      {/* Vista desktop: Kanban horizontal (se oculta en <lg) */}
      <div className="hidden lg:flex flex-col flex-1 min-h-0">
        <DesktopView
          proyectos={proyectos}
          draggedItem={draggedItem}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      </div>

      {/* ─── Modal de cierre de proyecto ────────────────────────── */}
      <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
        <DialogContent className="bg-[#09090b] border-[#27272a] text-[#fafafa] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Cerrar Proyecto</DialogTitle>
            <DialogDescription className="text-xs text-[#a1a1aa]">
              {closingProject?.presupuestos_cabecera?.nombre_feria || "Sin nombre"} — {closingProject?.codigo_proyecto_interno || ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Valoración cliente */}
            <div>
              <Label className="text-xs text-[#a1a1aa] mb-2 block">Valoración del cliente</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setCloseForm((f) => ({ ...f, valoracion_cliente: star }))}>
                    <Star className={`h-5 w-5 ${star <= closeForm.valoracion_cliente ? "text-amber-400 fill-amber-400" : "text-[#52525b]"}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Lecciones aprendidas */}
            <div>
              <Label htmlFor="lecciones" className="text-xs text-[#a1a1aa]">Lecciones aprendidas</Label>
              <textarea
                id="lecciones"
                className="w-full mt-1 px-3 py-2 text-xs bg-[#18181b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-indigo-500/50 resize-none"
                rows={3}
                value={closeForm.lecciones_aprendidas}
                onChange={(e) => setCloseForm((f) => ({ ...f, lecciones_aprendidas: e.target.value }))}
                placeholder="¿Qué salió bien? ¿Qué mejorarías?"
              />
            </div>

            {/* Ingreso y gasto real */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ingreso" className="text-xs text-[#a1a1aa]">Ingreso real (€)</Label>
                <Input
                  id="ingreso"
                  type="number"
                  className="mt-1 text-xs bg-[#18181b] border-[#27272a]"
                  value={closeForm.ingreso_total_real}
                  onChange={(e) => setCloseForm((f) => ({ ...f, ingreso_total_real: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="gasto" className="text-xs text-[#a1a1aa]">Gasto real (€)</Label>
                <Input
                  id="gasto"
                  type="number"
                  className="mt-1 text-xs bg-[#18181b] border-[#27272a]"
                  value={closeForm.gasto_total_real}
                  onChange={(e) => setCloseForm((f) => ({ ...f, gasto_total_real: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Cálculos en vivo */}
            {(() => {
              const i = Number(closeForm.ingreso_total_real);
              const g = Number(closeForm.gasto_total_real);
              const mb = i - g;
              const mp = i > 0 ? ((mb / i) * 100).toFixed(1) : "0.0";
              const po = Number(closingProject?.presupuestos_cabecera?.total_presupuesto || 0);
              return (
                <div className="p-3 rounded-lg bg-[#18181b] border border-[#27272a] space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#71717a]">Margen bruto</span>
                    <span className={`font-semibold ${mb >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{mb.toLocaleString("es-ES")} €</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#71717a]">Margen %</span>
                    <span className={`font-semibold ${Number(mp) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{mp}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#71717a]">Presupuesto original</span>
                    <span className="font-semibold text-[#fafafa]">{po.toLocaleString("es-ES")} €</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1.5 border-t border-[#27272a]">
                    <span className="text-[#71717a]">Desviación vs presupuesto</span>
                    <span className={`font-semibold ${mb >= po ? "text-emerald-400" : "text-rose-400"}`}>
                      {po > 0 ? `${((mb - po) / po * 100).toFixed(1)}%` : "—"}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCloseModal(false)} disabled={savingClose}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCloseProject} disabled={savingClose}>
              {savingClose ? (
                <><RotateCcw className="h-3 w-3 mr-1 animate-spin" /> Guardando...</>
              ) : "Cerrar proyecto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
