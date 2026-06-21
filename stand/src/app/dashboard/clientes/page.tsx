"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Search, Plus, Edit2, ShieldAlert, CheckCircle, Ban, Loader2, Globe, Phone, Mail, User } from "lucide-react"

interface Cliente {
  id: string
  razon_social: string
  nombre_comercial: string
  cif_nif: string
  domicilio_fiscal: string
  nombre_contacto_principal: string
  email_contacto: string
  telefono_contacto: string
  sector_industrial: string
  web_cliente: string
  recinto_ferial_habitual: string
  estado_cliente: 'activo' | 'bloqueado_impagos' | 'inactivo'
  forma_pago_habitual: 'transferencia' | 'confirming' | 'pagare' | 'tarjeta'
  plazo_pago_dias: number
  tarifa_asignada: 'estandar' | 'premium' | 'distribuidor'
}

export default function ClientesPage() {
  const supabase = createClient()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedSector, setSelectedSector] = useState("todos")
  
  // Form State
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({
    razon_social: "",
    nombre_comercial: "",
    cif_nif: "",
    domicilio_fiscal: "",
    nombre_contacto_principal: "",
    email_contacto: "",
    telefono_contacto: "",
    sector_industrial: "",
    web_cliente: "",
    recinto_ferial_habitual: "",
    estado_cliente: "activo",
    forma_pago_habitual: "transferencia",
    plazo_pago_dias: 30,
    tarifa_asignada: "estandar",
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Obtener la empresa del usuario actual para asociar el cliente
  const [empresaId, setEmpresaId] = useState<string | null>(null)

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
            // Cargar clientes de esa empresa
            const { data: dbClientes, error } = await supabase
              .from("clientes")
              .select("*")
              .eq("id_empresa", dbUser.id_empresa)
              .order("nombre_comercial", { ascending: true })

            if (error) throw error
            setClientes(dbClientes || [])
          }
        }
      } catch (err) {
        console.error("Error al cargar clientes:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filtrar clientes
  const filteredClientes = clientes.filter(c => {
    const matchesSearch = 
      c.nombre_comercial.toLowerCase().includes(search.toLowerCase()) ||
      c.razon_social.toLowerCase().includes(search.toLowerCase()) ||
      c.cif_nif.toLowerCase().includes(search.toLowerCase())
    
    const matchesSector = selectedSector === "todos" || c.sector_industrial === selectedSector

    return matchesSearch && matchesSector
  })

  // Obtener lista de sectores únicos para el filtro
  const sectores = Array.from(new Set(clientes.map(c => c.sector_industrial).filter(Boolean)))

  // Manejar edición de formulario
  const handleEditClick = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      razon_social: cliente.razon_social,
      nombre_comercial: cliente.nombre_comercial,
      cif_nif: cliente.cif_nif,
      domicilio_fiscal: cliente.domicilio_fiscal || "",
      nombre_contacto_principal: cliente.nombre_contacto_principal || "",
      email_contacto: cliente.email_contacto || "",
      telefono_contacto: cliente.telefono_contacto || "",
      sector_industrial: cliente.sector_industrial || "",
      web_cliente: cliente.web_cliente || "",
      recinto_ferial_habitual: cliente.recinto_ferial_habitual || "",
      estado_cliente: cliente.estado_cliente,
      forma_pago_habitual: cliente.forma_pago_habitual,
      plazo_pago_dias: cliente.plazo_pago_dias,
      tarifa_asignada: cliente.tarifa_asignada,
    })
    setFormError(null)
    setIsSheetOpen(true)
  }

  const handleAddNewClick = () => {
    setEditingCliente(null)
    setFormData({
      razon_social: "",
      nombre_comercial: "",
      cif_nif: "",
      domicilio_fiscal: "",
      nombre_contacto_principal: "",
      email_contacto: "",
      telefono_contacto: "",
      sector_industrial: "",
      web_cliente: "",
      recinto_ferial_habitual: "",
      estado_cliente: "activo",
      forma_pago_habitual: "transferencia",
      plazo_pago_dias: 30,
      tarifa_asignada: "estandar",
    })
    setFormError(null)
    setIsSheetOpen(true)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: id === "plazo_pago_dias" ? Number(value) : value
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresaId) return
    setSaving(true)
    setFormError(null)

    try {
      const payload = {
        ...formData,
        id_empresa: empresaId,
      }

      if (editingCliente) {
        // Actualizar
        const { data, error } = await supabase
          .from("clientes")
          .update(payload)
          .eq("id", editingCliente.id)
          .select()
          .single()

        if (error) throw error

        setClientes(prev => prev.map(c => c.id === editingCliente.id ? data : c))
      } else {
        // Insertar nuevo
        const { data, error } = await supabase
          .from("clientes")
          .insert([payload])
          .select()
          .single()

        if (error) throw error

        setClientes(prev => [...prev, data])
      }

      setIsSheetOpen(false)
    } catch (err: any) {
      setFormError(err?.message || "Ocurrió un error al guardar el cliente")
    } finally {
      setSaving(false)
    }
  }

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case "activo":
        return <CheckCircle className="h-4 w-4 text-emerald-400" />
      case "bloqueado_impagos":
        return <ShieldAlert className="h-4 w-4 text-rose-500 animate-pulse" />
      case "inactivo":
        return <Ban className="h-4 w-4 text-zinc-400" />
      default:
        return null
    }
  }

  const getStatusLabel = (estado: string) => {
    switch (estado) {
      case "activo":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Activo</span>
      case "bloqueado_impagos":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Bloqueado Impagos</span>
      case "inactivo":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">Inactivo</span>
      default:
        return estado
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-[#fafafa] to-[#a1a1aa]">
            Clientes CRM
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Gestión de datos de clientes, histórico de facturación y alertas comerciales.
          </p>
        </div>
        
        <Button 
          onClick={handleAddNewClick}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-xs rounded-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span>Añadir Cliente</span>
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="border-[#27272a]/70 bg-[#09090b]/40">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717a]" />
            <Input 
              placeholder="Buscar cliente, CIF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#09090b]/80 border-[#27272a] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs text-[#fafafa]"
            />
          </div>

          {/* Sector filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label htmlFor="filter-sector" className="text-xs text-[#a1a1aa] shrink-0">
              Sector Industrial:
            </Label>
            <select
              id="filter-sector"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full sm:w-44 bg-[#09090b]/80 border-[#27272a] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs text-[#fafafa] rounded-md h-9 px-3"
            >
              <option value="todos">Todos los sectores</option>
              {sectores.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Client Cards */}
      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-[#27272a]/70 bg-[#09090b]/20">
          <div className="text-sm font-semibold text-[#71717a]">No se encontraron clientes</div>
          <div className="text-xs text-[#52525b] mt-1">Crea un cliente nuevo o ajusta los filtros de búsqueda</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClientes.map((cliente) => (
            <Card key={cliente.id} className="border-[#27272a]/70 bg-[#09090b]/30 hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#fafafa] group-hover:text-indigo-400 transition-colors">
                        {cliente.nombre_comercial}
                      </h3>
                      {getStatusIcon(cliente.estado_cliente)}
                    </div>
                    <p className="text-[10px] text-[#71717a] font-medium leading-none">{cliente.razon_social}</p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(cliente)}
                    className="h-7 w-7 text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b]"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                {/* Contact info list */}
                <div className="space-y-2 text-xs border-t border-[#27272a]/40 pt-3">
                  <div className="flex items-center gap-2 text-[#e4e4e7]">
                    <User className="h-3.5 w-3.5 text-[#71717a] shrink-0" />
                    <span className="truncate">{cliente.nombre_contacto_principal || "Sin contacto principal"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#e4e4e7]">
                    <Mail className="h-3.5 w-3.5 text-[#71717a] shrink-0" />
                    <span className="truncate">{cliente.email_contacto || "Sin email"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#e4e4e7]">
                    <Phone className="h-3.5 w-3.5 text-[#71717a] shrink-0" />
                    <span>{cliente.telefono_contacto || "Sin teléfono"}</span>
                  </div>
                  {cliente.web_cliente && (
                    <div className="flex items-center gap-2 text-[#e4e4e7]">
                      <Globe className="h-3.5 w-3.5 text-[#71717a] shrink-0" />
                      <a href={cliente.web_cliente} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline truncate">
                        {cliente.web_cliente}
                      </a>
                    </div>
                  )}
                </div>

                {/* Sub info */}
                <div className="flex items-center justify-between pt-2 border-t border-[#27272a]/30 text-[10px] text-[#71717a]">
                  <span>CIF: {cliente.cif_nif}</span>
                  <span>Tarifa: <b className="capitalize text-[#fafafa]">{cliente.tarifa_asignada}</b></span>
                </div>
              </CardContent>
              <div className="px-6 py-2.5 border-t border-[#27272a]/40 bg-[#09090b]/50 rounded-b-xl flex items-center justify-between">
                {getStatusLabel(cliente.estado_cliente)}
                <span className="text-[10px] font-semibold text-[#a1a1aa] bg-[#18181b] px-2 py-0.5 rounded border border-[#27272a]">
                  {cliente.sector_industrial || "Otros"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-[#09090b] text-[#fafafa] border-l border-[#27272a] sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-[#fafafa]">{editingCliente ? "Editar Cliente" : "Nuevo Cliente"}</SheetTitle>
            <SheetDescription className="text-[#a1a1aa]">
              Ingresa los datos fiscales y de contacto comercial del cliente.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-4 px-6 pb-6">
            <div className="space-y-2">
              <Label htmlFor="nombre_comercial" className="text-xs">Nombre Comercial *</Label>
              <Input 
                id="nombre_comercial" 
                value={formData.nombre_comercial} 
                onChange={handleFormChange}
                required
                className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="razon_social" className="text-xs">Razón Social *</Label>
              <Input 
                id="razon_social" 
                value={formData.razon_social} 
                onChange={handleFormChange}
                required
                className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cif_nif" className="text-xs">CIF/NIF *</Label>
                <Input 
                  id="cif_nif" 
                  value={formData.cif_nif} 
                  onChange={handleFormChange}
                  required
                  className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector_industrial" className="text-xs">Sector Industrial</Label>
                <Input 
                  id="sector_industrial" 
                  placeholder="Ej: Turismo"
                  value={formData.sector_industrial} 
                  onChange={handleFormChange}
                  className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domicilio_fiscal" className="text-xs">Domicilio Fiscal</Label>
              <Input 
                id="domicilio_fiscal" 
                value={formData.domicilio_fiscal} 
                onChange={handleFormChange}
                className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
              />
            </div>

            <div className="border-t border-[#27272a]/50 my-4 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">Contacto Principal</h4>
              
              <div className="space-y-2">
                <Label htmlFor="nombre_contacto_principal" className="text-xs">Nombre</Label>
                <Input 
                  id="nombre_contacto_principal" 
                  value={formData.nombre_contacto_principal} 
                  onChange={handleFormChange}
                  className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email_contacto" className="text-xs">Correo Electrónico</Label>
                  <Input 
                    id="email_contacto" 
                    type="email"
                    value={formData.email_contacto} 
                    onChange={handleFormChange}
                    className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono_contacto" className="text-xs">Teléfono</Label>
                  <Input 
                    id="telefono_contacto" 
                    value={formData.telefono_contacto} 
                    onChange={handleFormChange}
                    className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="web_cliente" className="text-xs">Página Web</Label>
                <Input 
                  id="web_cliente" 
                  value={formData.web_cliente} 
                  onChange={handleFormChange}
                  className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
                />
              </div>
            </div>

            <div className="border-t border-[#27272a]/50 my-4 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">Financiero y Gestión</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estado_cliente" className="text-xs">Estado Cliente</Label>
                  <select
                    id="estado_cliente"
                    value={formData.estado_cliente}
                    onChange={handleFormChange}
                    className="w-full bg-[#09090b] border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3"
                  >
                    <option value="activo">Activo</option>
                    <option value="bloqueado_impagos">Bloqueado Impagos</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tarifa_asignada" className="text-xs">Tarifa Asignada</Label>
                  <select
                    id="tarifa_asignada"
                    value={formData.tarifa_asignada}
                    onChange={handleFormChange}
                    className="w-full bg-[#09090b] border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3"
                  >
                    <option value="estandar">Estándar</option>
                    <option value="premium">Premium</option>
                    <option value="distribuidor">Distribuidor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="forma_pago_habitual" className="text-xs">Forma Pago</Label>
                  <select
                    id="forma_pago_habitual"
                    value={formData.forma_pago_habitual}
                    onChange={handleFormChange}
                    className="w-full bg-[#09090b] border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3"
                  >
                    <option value="transferencia">Transferencia</option>
                    <option value="confirming">Confirming</option>
                    <option value="pagare">Pagaré</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plazo_pago_dias" className="text-xs">Plazo Pago (Días)</Label>
                  <Input 
                    id="plazo_pago_dias" 
                    type="number"
                    value={formData.plazo_pago_dias} 
                    onChange={handleFormChange}
                    className="bg-[#09090b] border-[#27272a] text-xs text-[#fafafa]"
                  />
                </div>
              </div>
            </div>

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
                  "Guardar Cliente"
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
