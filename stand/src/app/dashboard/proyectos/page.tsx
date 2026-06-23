"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, ChevronDown, MapPin, MoreHorizontal, Plus } from "lucide-react";

const supabase = createClient();

const KANBAN_COLUMNS = [
  { id: "Pendiente",   title: "Pendiente",   dot: "bg-slate-400",   border: "border-slate-400/30",   bg: "bg-slate-800/30" },
  { id: "Diseño",      title: "Diseño",      dot: "bg-blue-400",    border: "border-blue-400/30",    bg: "bg-blue-900/20"  },
  { id: "Fabricación", title: "Fabricación", dot: "bg-amber-400",   border: "border-amber-400/30",   bg: "bg-amber-900/20" },
  { id: "Montaje",     title: "Montaje",     dot: "bg-purple-400",  border: "border-purple-400/30",  bg: "bg-purple-900/20"},
  { id: "Finalizado",  title: "Finalizado",  dot: "bg-emerald-400", border: "border-emerald-400/30", bg: "bg-emerald-900/20"},
];

const MOCK_PROYECTOS = [
  {
    id: "mock-1",
    codigo_proyecto_interno: "PRJ-2026-001",
    estado_proyecto: "Pendiente",
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
    codigo_proyecto_interno: "PRJ-2026-002",
    estado_proyecto: "Diseño",
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
    codigo_proyecto_interno: "PRJ-2026-003",
    estado_proyecto: "Fabricación",
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

// ─── Tarjeta de proyecto (usada en ambas vistas) ─────────────────────────────
function ProyectoCard({ proyecto, onDragStart }: { proyecto: any; onDragStart?: (e: React.DragEvent, id: string) => void }) {
  const presu = proyecto.presupuestos_cabecera || {};
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
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
        <h4 className="font-semibold text-sm line-clamp-2 leading-tight mb-3 text-[#fafafa]">
          {presu.nombre_feria || "Stand sin nombre"}
        </h4>
        <div className="space-y-1.5 text-xs text-[#71717a]">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{presu.recinto_ferial || "Sin recinto"}</span>
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
function MobileView({ proyectos, onStatusChange }: { proyectos: any[]; onStatusChange: (id: string, newStatus: string) => void }) {
  const [openSection, setOpenSection] = useState<string | null>("Pendiente");

  return (
    <div className="space-y-3 pb-6">
      {KANBAN_COLUMNS.map((col) => {
        const items = proyectos.filter((p) => (p.estado_proyecto || "Pendiente") === col.id);
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
  proyectos: any[];
  draggedItem: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
}) {
  return (
    <div className="flex-1 flex gap-4 pb-4 min-h-0">
      {KANBAN_COLUMNS.map((col) => {
        const items = proyectos.filter((p) => (p.estado_proyecto || "Pendiente") === col.id);
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
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => { fetchProyectos(); }, []);

  const fetchProyectos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("proyectos_operaciones")
      .select("*, presupuestos_cabecera(nombre_feria, recinto_ferial, fecha_inicio_feria, total_presupuesto, imagen_stand_url)")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      setProyectos(data);
    } else {
      setProyectos(MOCK_PROYECTOS);
    }
    setLoading(false);
  };

  const changeStatus = async (id: string, newStatus: string) => {
    setProyectos((prev) => prev.map((p) => (p.id === id ? { ...p, estado_proyecto: newStatus } : p)));
    if (!id.startsWith("mock-")) {
      await supabase.from("proyectos_operaciones").update({ estado_proyecto: newStatus }).eq("id", id);
    }
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
      setDraggedItem(null);
    }
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
    </div>
  );
}
