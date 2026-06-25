"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Search, Plus, Edit2, Loader2, Database, DollarSign, Tag, Layers, Wrench, RotateCcw } from "lucide-react"

import type { TarifaMacro, ElementoCatalogo, TarifaServicio, CategoriaMatriz } from "@/types"
import { TIPO_STAND_LIST, NIVEL_DENSIDAD_LIST } from "@/constants"

const tipoProyectoList = TIPO_STAND_LIST
const nivelDensidadList = NIVEL_DENSIDAD_LIST

export default function CatalogosPage() {
  const supabase = createClient()
  
  const [activeCatalog, setActiveCatalog] = useState<"basea" | "baseb" | "basec">("basea")
  const [loading, setLoading] = useState(true)
  
  // Data States
  const [tarifas, setTarifas] = useState<TarifaMacro[]>([])
  const [elementos, setElementos] = useState<ElementoCatalogo[]>([])
  const [categorias, setCategorias] = useState<CategoriaMatriz[]>([
    { id: 1, nombre_categoria: "Madera" },
    { id: 2, nombre_categoria: "Metal" },
    { id: 3, nombre_categoria: "Plástico/Metacrilato" },
    { id: 4, nombre_categoria: "Electricidad" },
    { id: 5, nombre_categoria: "Iluminación" },
    { id: 6, nombre_categoria: "Suelos" },
    { id: 7, nombre_categoria: "Textil/Gráfica" },
    { id: 8, nombre_categoria: "Audiovisual" },
    { id: 9, nombre_categoria: "Mobiliario" },
    { id: 10, nombre_categoria: "Transporte" },
    { id: 11, nombre_categoria: "Montaje" },
    { id: 12, nombre_categoria: "Servicios Recinto" },
    { id: 13, nombre_categoria: "Seguridad/CAE" },
    { id: 14, nombre_categoria: "Diseño/Renders" },
    { id: 15, nombre_categoria: "Varios" }
  ])
  
  // Data States Base C
  const [servicios, setServicios] = useState<TarifaServicio[]>([])

  // Filter States
  const [searchSKU, setSearchSKU] = useState("")
  const [filterTipoProyecto, setFilterTipoProyecto] = useState("todos")
  const [filterCategoriaC, setFilterCategoriaC] = useState("todos")

  // Sheet States
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingItemType, setEditingItemType] = useState<"basea" | "baseb" | "basec">("basea")
  const [editingTarifa, setEditingTarifa] = useState<TarifaMacro | null>(null)
  const [editingElemento, setEditingElemento] = useState<ElementoCatalogo | null>(null)
  const [editingServicio, setEditingServicio] = useState<TarifaServicio | null>(null)
  
  // Form State Base A
  const [formA, setFormA] = useState({
    tipo_proyecto: "modular" as TarifaMacro["tipo_proyecto"],
    nivel_densidad: "media_estandar" as TarifaMacro["nivel_densidad"],
    precio_venta_m2: 350,
    margen_beneficio_sugerido: 35.00,
    descripcion_incluido: "",
  })

  // Form State Base C
  const [formC, setFormC] = useState({
    id_categoria_matriz: 1,
    nombre_tecnico: "",
    descripcion_compra: "",
    medida_ancho_mm: 0,
    medida_fondo_mm: 0,
    medida_alto_mm: 0,
    unidad_medida: "ud" as TarifaServicio["unidad_medida"],
    precio_coste_unidad_medida: 0,
    unidad_tiempo: null as TarifaServicio["unidad_tiempo"],
    precio_unidad_tiempo: 0,
    rendimiento_mecanico_hora: 0,
    aplica_coeficiente_desperdicio: false,
    coeficiente_desperdicio: 1.000,
    estado_tarifa: "activa" as TarifaServicio["estado_tarifa"],
  })

  // Form State Base B
  const [formB, setFormB] = useState({
    codigo_sku: "",
    nombre_elemento: "",
    id_categoria_matriz: 1,
    descripcion_comercial: "",
    ancho_estandar_mm: 0,
    fondo_estandar_mm: 0,
    alto_estandar_mm: 0,
    unidad_medida_bloque: "ud" as ElementoCatalogo["unidad_medida_bloque"],
    precio_venta_unidad: 0,
  })

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [syncingB, setSyncingB] = useState(false)
  const [syncingC, setSyncingC] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: dbUser } = await supabase
            .from("usuarios")
            .select("id_empresa")
            .eq("id", user.id)
            .single()

          if (dbUser) {
            setEmpresaId(dbUser.id_empresa)
            
            // Cargar Base A (Tarifas m2)
            const { data: dbTarifas } = await supabase
              .from("tarifas_macros_m2")
              .select("*")
              .eq("id_empresa", dbUser.id_empresa)
            setTarifas(dbTarifas || [])

            // Cargar Base B (Elementos)
            const { data: dbElementos } = await supabase
              .from("catalogo_elementos")
              .select("*")
              .eq("id_empresa", dbUser.id_empresa)
              .order("codigo_sku")
            setElementos(dbElementos || [])

            // Cargar Base C (Servicios/Despiece)
            const { data: dbServicios } = await supabase
              .from("tarifas_servicios")
              .select("*")
              .eq("id_empresa", dbUser.id_empresa)
              .order("nombre_tecnico")
            setServicios(dbServicios || [])
          }
        }
      } catch (err) {
        console.error("Error al cargar catálogos:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Sincronización con Qdrant
  const syncCatalogo = async (tipo: "b" | "c") => {
    if (!empresaId) return
    const setSyncing = tipo === "b" ? setSyncingB : setSyncingC
    setSyncing(true)
    try {
      const webhookUrl = tipo === "b"
        ? (process.env.NEXT_PUBLIC_N8N_SYNC_B_WEBHOOK || "https://n8n.cheosdesign.info/webhook/sync-catalogo-b")
        : (process.env.NEXT_PUBLIC_N8N_SYNC_C_WEBHOOK || "https://n8n.cheosdesign.info/webhook/sync-catalogo-c")
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_empresa: empresaId })
      })
      if (!res.ok) throw new Error("Error en sync")
      const data = await res.json()
      alert(`✅ Catálogo ${tipo === "b" ? "B" : "C"} sincronizado con Qdrant`)
    } catch (e) {
      alert("Error al sincronizar con Qdrant")
    } finally {
      setSyncing(false)
    }
  }

  // Filtrados
  const filteredTarifas = tarifas.filter(t => 
    filterTipoProyecto === "todos" || t.tipo_proyecto === filterTipoProyecto
  )

  const filteredElementos = elementos.filter(e => 
    e.nombre_elemento.toLowerCase().includes(searchSKU.toLowerCase()) || 
    e.codigo_sku.toLowerCase().includes(searchSKU.toLowerCase())
  )

  const filteredServicios = servicios.filter(s =>
    filterCategoriaC === "todos" || s.id_categoria_matriz === Number(filterCategoriaC)
  ).filter(s =>
    !searchSKU ||
    s.nombre_tecnico.toLowerCase().includes(searchSKU.toLowerCase()) ||
    s.descripcion_compra.toLowerCase().includes(searchSKU.toLowerCase())
  )

  // Handlers Editar Base A
  const handleEditA = (tarifa: TarifaMacro) => {
    setEditingItemType("basea")
    setEditingTarifa(tarifa)
    setFormA({
      tipo_proyecto: tarifa.tipo_proyecto,
      nivel_densidad: tarifa.nivel_densidad,
      precio_venta_m2: Number(tarifa.precio_venta_m2),
      margen_beneficio_sugerido: Number(tarifa.margen_beneficio_sugerido),
      descripcion_incluido: tarifa.descripcion_incluido,
    })
    setFormError(null)
    setIsSheetOpen(true)
  }

  const handleAddNewA = () => {
    setEditingItemType("basea")
    setEditingTarifa(null)
    setFormA({
      tipo_proyecto: "modular",
      nivel_densidad: "media_estandar",
      precio_venta_m2: 350,
      margen_beneficio_sugerido: 35.00,
      descripcion_incluido: "",
    })
    setFormError(null)
    setIsSheetOpen(true)
  }

  // Handlers Editar Base C
  const handleEditC = (serv: TarifaServicio) => {
    setEditingItemType("basec")
    setEditingServicio(serv)
    setFormC({
      id_categoria_matriz: serv.id_categoria_matriz,
      nombre_tecnico: serv.nombre_tecnico,
      descripcion_compra: serv.descripcion_compra,
      medida_ancho_mm: serv.medida_ancho_mm,
      medida_fondo_mm: serv.medida_fondo_mm,
      medida_alto_mm: serv.medida_alto_mm,
      unidad_medida: serv.unidad_medida,
      precio_coste_unidad_medida: Number(serv.precio_coste_unidad_medida),
      unidad_tiempo: serv.unidad_tiempo,
      precio_unidad_tiempo: Number(serv.precio_unidad_tiempo),
      rendimiento_mecanico_hora: Number(serv.rendimiento_mecanico_hora),
      aplica_coeficiente_desperdicio: serv.aplica_coeficiente_desperdicio,
      coeficiente_desperdicio: Number(serv.coeficiente_desperdicio),
      estado_tarifa: serv.estado_tarifa,
    })
    setFormError(null)
    setIsSheetOpen(true)
  }

  const handleAddNewC = () => {
    setEditingItemType("basec")
    setEditingServicio(null)
    setFormC({
      id_categoria_matriz: 1,
      nombre_tecnico: "",
      descripcion_compra: "",
      medida_ancho_mm: 0,
      medida_fondo_mm: 0,
      medida_alto_mm: 0,
      unidad_medida: "ud",
      precio_coste_unidad_medida: 0,
      unidad_tiempo: null,
      precio_unidad_tiempo: 0,
      rendimiento_mecanico_hora: 0,
      aplica_coeficiente_desperdicio: false,
      coeficiente_desperdicio: 1.000,
      estado_tarifa: "activa",
    })
    setFormError(null)
    setIsSheetOpen(true)
  }

  // Handlers Editar Base B
  const handleEditB = (elem: ElementoCatalogo) => {
    setEditingItemType("baseb")
    setEditingElemento(elem)
    setFormB({
      codigo_sku: elem.codigo_sku,
      nombre_elemento: elem.nombre_elemento,
      id_categoria_matriz: elem.id_categoria_matriz || 1,
      descripcion_comercial: elem.descripcion_comercial,
      ancho_estandar_mm: elem.ancho_estandar_mm,
      fondo_estandar_mm: elem.fondo_estandar_mm,
      alto_estandar_mm: elem.alto_estandar_mm,
      unidad_medida_bloque: elem.unidad_medida_bloque,
      precio_venta_unidad: Number(elem.precio_venta_unidad),
    })
    setFormError(null)
    setIsSheetOpen(true)
  }

  const handleAddNewB = () => {
    setEditingItemType("baseb")
    setEditingElemento(null)
    setFormB({
      codigo_sku: `SKU-${Date.now().toString().slice(-6)}`,
      nombre_elemento: "",
      id_categoria_matriz: 1,
      descripcion_comercial: "",
      ancho_estandar_mm: 0,
      fondo_estandar_mm: 0,
      alto_estandar_mm: 0,
      unidad_medida_bloque: "ud",
      precio_venta_unidad: 0,
    })
    setFormError(null)
    setIsSheetOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresaId) return
    setSaving(true)
    setFormError(null)

    try {
      if (editingItemType === "basea") {
        const payload = {
          ...formA,
          id_empresa: empresaId,
        }

        if (editingTarifa) {
          const { data, error } = await supabase
            .from("tarifas_macros_m2")
            .update(payload)
            .eq("id", editingTarifa.id)
            .select()
            .single()

          if (error) throw error
          setTarifas(prev => prev.map(t => t.id === editingTarifa.id ? data : t))
        } else {
          const { data, error } = await supabase
            .from("tarifas_macros_m2")
            .insert([payload])
            .select()
            .single()

          if (error) throw error
          setTarifas(prev => [...prev, data])
        }
      } else if (editingItemType === "basec") {
        const payload = {
          ...formC,
          id_empresa: empresaId,
        }

        if (editingServicio) {
          const { data, error } = await supabase
            .from("tarifas_servicios")
            .update(payload)
            .eq("id", editingServicio.id)
            .select()
            .single()

          if (error) throw error
          setServicios(prev => prev.map(s => s.id === editingServicio.id ? data : s))
        } else {
          const { data, error } = await supabase
            .from("tarifas_servicios")
            .insert([payload])
            .select()
            .single()

          if (error) throw error
          setServicios(prev => [...prev, data])
        }
      } else {
        const payload = {
          ...formB,
          id_empresa: empresaId,
        }

        if (editingElemento) {
          const { data, error } = await supabase
            .from("catalogo_elementos")
            .update(payload)
            .eq("id", editingElemento.id)
            .select()
            .single()

          if (error) throw error
          setElementos(prev => prev.map(el => el.id === editingElemento.id ? data : el))
        } else {
          const { data, error } = await supabase
            .from("catalogo_elementos")
            .insert([payload])
            .select()
            .single()

          if (error) throw error
          setElementos(prev => [...prev, data])
        }
      }

      setIsSheetOpen(false)
    } catch (err: any) {
      setFormError(err?.message || "Ocurrió un error al guardar el ítem")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-[#fafafa] to-[#a1a1aa]">
            Catálogos Técnicos
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Parámetros base del motor de estimación macro e inventario de elementos constructivos (Base A y B).
          </p>
        </div>
        
        <Button 
          onClick={activeCatalog === "basea" ? handleAddNewA : activeCatalog === "baseb" ? handleAddNewB : handleAddNewC}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-xs rounded-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span>Añadir {activeCatalog === "basea" ? "Tarifa m²" : activeCatalog === "baseb" ? "Elemento" : "Tarifa Despiece"}</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#27272a]/70 pb-px">
        <button
          onClick={() => setActiveCatalog("basea")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all duration-200 ${
            activeCatalog === "basea" 
              ? "border-indigo-500 text-indigo-400" 
              : "border-transparent text-[#71717a] hover:text-[#fafafa]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>Base A: Tarifas Macros (m²)</span>
          </div>
        </button>
        <button
          onClick={() => setActiveCatalog("baseb")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all duration-200 ${
            activeCatalog === "baseb" 
              ? "border-indigo-500 text-indigo-400" 
              : "border-transparent text-[#71717a] hover:text-[#fafafa]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Base B: Catálogo Elementos (Partidas)</span>
          </div>
        </button>
        <button
          onClick={() => setActiveCatalog("basec")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all duration-200 ${
            activeCatalog === "basec" 
              ? "border-indigo-500 text-indigo-400" 
              : "border-transparent text-[#71717a] hover:text-[#fafafa]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span>Base C: Tarifas Despiece Técnico</span>
          </div>
        </button>
      </div>

      {/* Sync buttons */}
      {activeCatalog !== "basea" && (
        <div className="flex justify-end gap-2">
          {activeCatalog === "baseb" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => syncCatalogo("b")}
              disabled={syncingB}
              className="text-xs border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]"
            >
              {syncingB ? <><RotateCcw className="h-3 w-3 mr-1 animate-spin" /> Sincronizando...</> : "Sync Qdrant Catálogo B"}
            </Button>
          )}
          {activeCatalog === "basec" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => syncCatalogo("c")}
              disabled={syncingC}
              className="text-xs border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]"
            >
              {syncingC ? <><RotateCcw className="h-3 w-3 mr-1 animate-spin" /> Sincronizando...</> : "Sync Qdrant Catálogo C"}
            </Button>
          )}
        </div>
      )}

      {/* Filters Card */}
      <Card className="border-[#27272a]/70 bg-[#09090b]/40">
        <CardContent className="p-4">
          {activeCatalog === "basea" ? (
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-tipo" className="text-xs text-[#a1a1aa]">Tipo de Stand:</Label>
              <select
                id="filter-tipo"
                value={filterTipoProyecto}
                onChange={(e) => setFilterTipoProyecto(e.target.value)}
                className="bg-[#09090b]/80 border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3 w-48"
              >
                <option value="todos">Todos los tipos</option>
                {tipoProyectoList.map(t => (
                  <option key={t} value={t} className="capitalize">{t.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          ) : activeCatalog === "basec" ? (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717a]" />
                <Input 
                  placeholder="Buscar por nombre técnico..."
                  value={searchSKU}
                  onChange={(e) => setSearchSKU(e.target.value)}
                  className="pl-9 bg-[#09090b]/80 border-[#27272a] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs text-[#fafafa]"
                />
              </div>
              <select
                value={filterCategoriaC}
                onChange={(e) => setFilterCategoriaC(e.target.value)}
                className="bg-[#09090b]/80 border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3 w-48"
              >
                <option value="todos">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre_categoria}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717a]" />
              <Input 
                placeholder="Buscar por SKU o Nombre..."
                value={searchSKU}
                onChange={(e) => setSearchSKU(e.target.value)}
                className="pl-9 bg-[#09090b]/80 border-[#27272a] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs text-[#fafafa]"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Catalog Render */}
      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : activeCatalog === "basea" ? (
        // Base A Render
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTarifas.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-[#71717a]">
              No hay ratios m² registrados. Crea tarifas macros para habilitar la estimación rápida.
            </div>
          ) : (
            filteredTarifas.map((tarifa) => (
              <Card key={tarifa.id} className="border-[#27272a]/70 bg-[#09090b]/30 hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-[#fafafa] capitalize">
                        Stand {tarifa.tipo_proyecto.replace("_", " ")}
                      </h3>
                      <p className="text-[10px] text-[#71717a] font-medium uppercase tracking-wider mt-0.5">
                        Densidad: {tarifa.nivel_densidad.replace("_", " ")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditA(tarifa)}
                      className="h-7 w-7 text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b]"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <p className="text-xs text-[#e4e4e7] line-clamp-3 min-h-[48px] leading-relaxed">
                    {tarifa.descripcion_incluido || "Sin descripción de partidas incluidas."}
                  </p>
                  
                  <div className="flex items-end justify-between pt-3 border-t border-[#27272a]/30">
                    <div className="text-xs font-semibold text-[#fafafa] flex items-center gap-0.5">
                      <DollarSign className="h-4 w-4 text-[#71717a]" />
                      <span className="text-lg font-bold text-indigo-400">{Number(tarifa.precio_venta_m2).toLocaleString()}</span>
                      <span className="text-[10px] text-[#71717a]">/m²</span>
                    </div>
                    
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Margen: {tarifa.margen_beneficio_sugerido}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : activeCatalog === "basec" ? (
        // Base C Render (Table)
        <Card className="border-[#27272a]/70 bg-[#09090b]/40">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a]/70 text-[#a1a1aa] font-medium">
                    <th className="py-3 px-4">Nombre Técnico</th>
                    <th className="py-3 px-2">Categoría</th>
                    <th className="py-3 px-2 text-right w-20">Coste/ud</th>
                    <th className="py-3 px-2 text-center w-16">Ud.</th>
                    <th className="py-3 px-2 text-right w-20">Coste/hora/día</th>
                    <th className="py-3 px-2 text-center w-14">Desp.</th>
                    <th className="py-3 px-2 text-center w-16">Estado</th>
                    <th className="py-3 px-4 text-center w-12">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]/40">
                  {filteredServicios.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-[#71717a]">
                        No hay tarifas de despiece registradas en Base C.
                      </td>
                    </tr>
                  ) : (
                    filteredServicios.map((serv) => {
                      const catName = categorias.find(c => c.id === serv.id_categoria_matriz)?.nombre_categoria || "Varios"
                      return (
                        <tr key={serv.id} className="hover:bg-[#18181b]/30">
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-[#fafafa]">{serv.nombre_tecnico}</div>
                            <div className="text-[10px] text-[#71717a] font-normal mt-0.5 line-clamp-1">{serv.descripcion_compra}</div>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-500/10 border border-zinc-500/20 px-1.5 py-0.5 rounded">
                              {catName}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right font-mono text-[#fafafa] font-semibold">
                            {Number(serv.precio_coste_unidad_medida).toFixed(2)} €
                          </td>
                          <td className="py-3.5 px-2 text-center font-bold text-[#fafafa] uppercase text-[10px]">
                            {serv.unidad_medida}
                            {serv.unidad_tiempo && (
                              <span className="block text-[9px] text-[#71717a] font-normal">{serv.unidad_tiempo.replace("_", " ")}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-2 text-right text-[#a1a1aa]">
                            {serv.precio_unidad_tiempo > 0 ? (
                              <span className="font-mono">{Number(serv.precio_unidad_tiempo).toFixed(2)} €</span>
                            ) : (
                              <span className="text-[#52525b]">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-2 text-center">
                            {serv.aplica_coeficiente_desperdicio ? (
                              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                ×{Number(serv.coeficiente_desperdicio).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-[#52525b]">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-2 text-center">
                            {serv.estado_tarifa === "activa" ? (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">Activa</span>
                            ) : (
                              <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-500/10 border border-zinc-500/20 px-1.5 py-0.5 rounded">Inactiva</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditC(serv)}
                              className="h-7 w-7 text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b]"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Base B Render (Table)
        <Card className="border-[#27272a]/70 bg-[#09090b]/40">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a]/70 text-[#a1a1aa] font-medium">
                    <th className="py-3 px-4 w-28">SKU / Código</th>
                    <th className="py-3 px-2">Nombre Elemento</th>
                    <th className="py-3 px-2">Categoría Matriz</th>
                    <th className="py-3 px-2 text-right">Dimensiones (AxFxH)</th>
                    <th className="py-3 px-2 text-center w-16">U.M.</th>
                    <th className="py-3 px-2 text-right w-24">Precio Venta</th>
                    <th className="py-3 px-4 text-center w-12">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]/40">
                  {filteredElementos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-[#71717a]">
                        No hay elementos registrados en el catálogo Base B.
                      </td>
                    </tr>
                  ) : (
                    filteredElementos.map((elem) => {
                      const catName = categorias.find(c => c.id === elem.id_categoria_matriz)?.nombre_categoria || "Varios"
                      return (
                        <tr key={elem.id} className="hover:bg-[#18181b]/30">
                          <td className="py-3.5 px-4 font-bold text-indigo-400">
                            {elem.codigo_sku}
                          </td>
                          <td className="py-3.5 px-2 font-medium text-[#fafafa]">
                            {elem.nombre_elemento}
                            <div className="text-[10px] text-[#71717a] font-normal mt-0.5 line-clamp-1">{elem.descripcion_comercial}</div>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 bg-zinc-500/10 border border-zinc-500/20 px-1.5 py-0.5 rounded">
                              <Tag className="h-3 w-3" />
                              <span>{catName}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right font-mono text-[#a1a1aa]">
                            {elem.ancho_estandar_mm}x{elem.fondo_estandar_mm}x{elem.alto_estandar_mm}
                          </td>
                          <td className="py-3.5 px-2 text-center font-bold text-[#fafafa] uppercase">
                            {elem.unidad_medida_bloque}
                          </td>
                          <td className="py-3.5 px-2 text-right font-extrabold text-[#fafafa]">
                            {Number(elem.precio_venta_unitario || elem.precio_venta_unidad).toLocaleString("es-ES")} €
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditB(elem)}
                              className="h-7 w-7 text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b]"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-[#09090b] text-[#fafafa] border-l border-[#27272a] sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-[#fafafa]">
              {editingItemType === "basea" 
                ? editingTarifa ? "Editar Tarifa m²" : "Nueva Tarifa m²" 
                : editingItemType === "basec"
                ? editingServicio ? "Editar Tarifa Despiece" : "Nueva Tarifa Despiece"
                : editingElemento ? "Editar Elemento" : "Nuevo Elemento"}
            </SheetTitle>
            <SheetDescription className="text-[#a1a1aa]">
              {editingItemType === "basec"
                ? "Costes reales de materiales, MO y servicios para despiece técnico (Base C)."
                : "Ingresa los costes y especificaciones técnicas para los cálculos del sistema."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-4 px-6 pb-6">
            
            {/* Form Base C */}
            {editingItemType === "basec" ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Nombre Técnico *</Label>
                  <Input 
                    value={formC.nombre_tecnico}
                    onChange={(e) => setFormC(prev => ({ ...prev, nombre_tecnico: e.target.value }))}
                    required
                    placeholder="Ej: Tablero DM 19mm lacado blanco"
                    className="bg-[#09090b] border-[#27272a] text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Descripción de Compra *</Label>
                  <textarea
                    value={formC.descripcion_compra}
                    onChange={(e) => setFormC(prev => ({ ...prev, descripcion_compra: e.target.value }))}
                    required
                    rows={3}
                    placeholder="Texto descriptivo que se vectorizará para búsquedas semánticas en Qdrant..."
                    className="w-full bg-[#09090b] border-[#27272a] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs text-[#fafafa] p-3 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Categoría Matriz *</Label>
                    <select
                      value={formC.id_categoria_matriz}
                      onChange={(e) => setFormC(prev => ({ ...prev, id_categoria_matriz: Number(e.target.value) }))}
                      className="w-full bg-[#09090b] border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3"
                    >
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre_categoria}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Unidad de Medida *</Label>
                    <select
                      value={formC.unidad_medida}
                      onChange={(e) => setFormC(prev => ({ ...prev, unidad_medida: e.target.value as TarifaServicio["unidad_medida"] }))}
                      className="w-full bg-[#09090b] border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3"
                    >
                      <option value="ud">Unidad (ud)</option>
                      <option value="m2">Metro Cuadrado (m²)</option>
                      <option value="ml">Metro Lineal (ml)</option>
                      <option value="kg">Kilogramo (kg)</option>
                      <option value="l">Litro (l)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Coste por Unidad de Medida (€) *</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={formC.precio_coste_unidad_medida}
                      onChange={(e) => setFormC(prev => ({ ...prev, precio_coste_unidad_medida: Number(e.target.value) }))}
                      required
                      className="bg-[#09090b] border-[#27272a] text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Rendimiento Mecánico (ud/hora)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={formC.rendimiento_mecanico_hora}
                      onChange={(e) => setFormC(prev => ({ ...prev, rendimiento_mecanico_hora: Number(e.target.value) }))}
                      className="bg-[#09090b] border-[#27272a] text-xs"
                    />
                  </div>
                </div>

                <div className="border-t border-[#27272a]/50 my-4 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">Unidad de Tiempo (MO / Alquileres)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Tipo de Tiempo</Label>
                      <select
                        value={formC.unidad_tiempo || ""}
                        onChange={(e) => setFormC(prev => ({ ...prev, unidad_tiempo: (e.target.value || null) as TarifaServicio["unidad_tiempo"] }))}
                        className="w-full bg-[#09090b] border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3"
                      >
                        <option value="">Sin tiempo asociado</option>
                        <option value="hora">Por Hora</option>
                        <option value="dia_montaje">Día de Montaje</option>
                        <option value="dia_feria">Día de Feria</option>
                        <option value="evento_completo">Evento Completo</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Precio por Unidad de Tiempo (€)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={formC.precio_unidad_tiempo}
                        onChange={(e) => setFormC(prev => ({ ...prev, precio_unidad_tiempo: Number(e.target.value) }))}
                        className="bg-[#09090b] border-[#27272a] text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#27272a]/50 my-4 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">Parámetros de Producción</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#18181b]/40 border border-[#27272a]/30">
                      <input
                        type="checkbox"
                        id="aplica_desp"
                        checked={formC.aplica_coeficiente_desperdicio}
                        onChange={(e) => setFormC(prev => ({ ...prev, aplica_coeficiente_desperdicio: e.target.checked }))}
                        className="rounded border-[#27272a] bg-[#09090b] text-indigo-500 focus:ring-indigo-500"
                      />
                      <Label htmlFor="aplica_desp" className="text-xs">Aplica Coeficiente de Desperdicio</Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Coeficiente de Desperdicio</Label>
                      <Input 
                        type="number"
                        step="0.001"
                        value={formC.coeficiente_desperdicio}
                        onChange={(e) => setFormC(prev => ({ ...prev, coeficiente_desperdicio: Number(e.target.value) }))}
                        disabled={!formC.aplica_coeficiente_desperdicio}
                        className="bg-[#09090b] border-[#27272a] text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Dimensiones (mm): Ancho</Label>
                      <Input 
                        type="number"
                        value={formC.medida_ancho_mm}
                        onChange={(e) => setFormC(prev => ({ ...prev, medida_ancho_mm: Number(e.target.value) }))}
                        className="bg-[#09090b] border-[#27272a] text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Dimensiones (mm): Fondo</Label>
                      <Input 
                        type="number"
                        value={formC.medida_fondo_mm}
                        onChange={(e) => setFormC(prev => ({ ...prev, medida_fondo_mm: Number(e.target.value) }))}
                        className="bg-[#09090b] border-[#27272a] text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Dimensiones (mm): Alto</Label>
                      <Input 
                        type="number"
                        value={formC.medida_alto_mm}
                        onChange={(e) => setFormC(prev => ({ ...prev, medida_alto_mm: Number(e.target.value) }))}
                        className="bg-[#09090b] border-[#27272a] text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Estado</Label>
                      <select
                        value={formC.estado_tarifa}
                        onChange={(e) => setFormC(prev => ({ ...prev, estado_tarifa: e.target.value as TarifaServicio["estado_tarifa"] }))}
                        className="w-full bg-[#09090b] border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3"
                      >
                        <option value="activa">Activa</option>
                        <option value="inactiva">Inactiva</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            ) : /* Form Base A */
            editingItemType === "basea" ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Tipo Stand *</Label>
                    <select
                      value={formA.tipo_proyecto}
                      onChange={(e) => setFormA(prev => ({ ...prev, tipo_proyecto: e.target.value as TarifaMacro["tipo_proyecto"] }))}
                      className="w-full bg-[#09090b] border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3"
                    >
                      {tipoProyectoList.map(t => (
                        <option key={t} value={t} className="capitalize">{t.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Nivel Densidad *</Label>
                    <select
                      value={formA.nivel_densidad}
                      onChange={(e) => setFormA(prev => ({ ...prev, nivel_densidad: e.target.value as TarifaMacro["nivel_densidad"] }))}
                      className="w-full bg-[#09090b] border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3"
                    >
                      {nivelDensidadList.map(n => (
                        <option key={n} value={n} className="capitalize">{n.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Precio Venta / m² *</Label>
                    <Input 
                      type="number"
                      value={formA.precio_venta_m2}
                      onChange={(e) => setFormA(prev => ({ ...prev, precio_venta_m2: Number(e.target.value) }))}
                      required
                      className="bg-[#09090b] border-[#27272a] text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Margen Sugerido (%) *</Label>
                    <Input 
                      type="number"
                      value={formA.margen_beneficio_sugerido}
                      onChange={(e) => setFormA(prev => ({ ...prev, margen_beneficio_sugerido: Number(e.target.value) }))}
                      required
                      className="bg-[#09090b] border-[#27272a] text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Conceptos Incluidos (Descriptivo)</Label>
                  <textarea
                    value={formA.descripcion_incluido}
                    onChange={(e) => setFormA(prev => ({ ...prev, descripcion_incluido: e.target.value }))}
                    rows={4}
                    placeholder="Describe detalladamente qué partidas cubre esta tarifa..."
                    className="w-full bg-[#09090b] border-[#27272a] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs text-[#fafafa] p-3 rounded-md"
                  />
                </div>
              </>
            ) : (
              // Form Base B
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Código SKU *</Label>
                    <Input 
                      value={formB.codigo_sku}
                      onChange={(e) => setFormB(prev => ({ ...prev, codigo_sku: e.target.value }))}
                      required
                      className="bg-[#09090b] border-[#27272a] text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Categoría Matriz *</Label>
                    <select
                      value={formB.id_categoria_matriz}
                      onChange={(e) => setFormB(prev => ({ ...prev, id_categoria_matriz: Number(e.target.value) }))}
                      className="w-full bg-[#09090b] border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3"
                    >
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre_categoria}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Nombre Elemento *</Label>
                  <Input 
                    value={formB.nombre_elemento}
                    onChange={(e) => setFormB(prev => ({ ...prev, nombre_elemento: e.target.value }))}
                    required
                    placeholder="Ej: Mostrador curvo de madera DM"
                    className="bg-[#09090b] border-[#27272a] text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Descripción Comercial *</Label>
                  <textarea
                    value={formB.descripcion_comercial}
                    onChange={(e) => setFormB(prev => ({ ...prev, descripcion_comercial: e.target.value }))}
                    required
                    rows={3}
                    placeholder="Introduce la descripción vectorizada para búsquedas semánticas..."
                    className="w-full bg-[#09090b] border-[#27272a] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs text-[#fafafa] p-3 rounded-md"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Ancho (mm)</Label>
                    <Input 
                      type="number"
                      value={formB.ancho_estandar_mm}
                      onChange={(e) => setFormB(prev => ({ ...prev, ancho_estandar_mm: Number(e.target.value) }))}
                      className="bg-[#09090b] border-[#27272a] text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Fondo (mm)</Label>
                    <Input 
                      type="number"
                      value={formB.fondo_estandar_mm}
                      onChange={(e) => setFormB(prev => ({ ...prev, fondo_estandar_mm: Number(e.target.value) }))}
                      className="bg-[#09090b] border-[#27272a] text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Alto (mm)</Label>
                    <Input 
                      type="number"
                      value={formB.alto_estandar_mm}
                      onChange={(e) => setFormB(prev => ({ ...prev, alto_estandar_mm: Number(e.target.value) }))}
                      className="bg-[#09090b] border-[#27272a] text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Unidad de Medida *</Label>
                    <select
                      value={formB.unidad_medida_bloque}
                      onChange={(e) => setFormB(prev => ({ ...prev, unidad_medida_bloque: e.target.value as ElementoCatalogo["unidad_medida_bloque"] }))}
                      className="w-full bg-[#09090b] border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3"
                    >
                      <option value="ud">Unidad (ud)</option>
                      <option value="ml">Metro Lineal (ml)</option>
                      <option value="m2">Metro Cuadrado (m²)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Precio Venta Unidad *</Label>
                    <Input 
                      type="number"
                      value={formB.precio_venta_unidad}
                      onChange={(e) => setFormB(prev => ({ ...prev, precio_venta_unidad: Number(e.target.value) }))}
                      required
                      className="bg-[#09090b] border-[#27272a] text-xs"
                    />
                  </div>
                </div>
              </>
            )}

            {formError && (
              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSheetOpen(false)}
                className="w-1/3 bg-transparent border-[#27272a] hover:bg-[#18181b] text-[#fafafa]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
