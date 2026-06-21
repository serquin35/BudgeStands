"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Search, Plus, Edit2, Loader2, Phone, Mail, User, Briefcase, MapPin, DollarSign } from "lucide-react"

interface Proveedor {
  id: string
  razon_social: string
  nombre_comercial: string
  cif_nif: string
  domicilio_fiscal: string
  email_contacto: string
  telefono_contacto: string
  nombre_contacto: string
  especialidad: string
  categorias_suministro: string[] // Guardado como JSONB
  forma_pago: string
  plazo_pago_dias: number
}

const especialidadesList = [
  "Carpintería",
  "Iluminación y Electricidad",
  "Rotulación e Impresión",
  "Mobiliario",
  "Audiovisuales",
  "Logística y Transporte",
  "Servicios de Feria",
  "Varios"
]

export default function ProveedoresPage() {
  const supabase = createClient()
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedEsp, setSelectedEsp] = useState("todos")

  // Form State
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null)
  const [formData, setFormData] = useState({
    razon_social: "",
    nombre_comercial: "",
    cif_nif: "",
    domicilio_fiscal: "",
    nombre_contacto: "",
    email_contacto: "",
    telefono_contacto: "",
    especialidad: "Carpintería",
    categorias_suministro: [] as string[],
    forma_pago: "transferencia",
    plazo_pago_dias: 30,
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Empresa del usuario
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
            // Cargar proveedores
            const { data: dbProv, error } = await supabase
              .from("proveedores")
              .select("*")
              .eq("id_empresa", dbUser.id_empresa)
              .order("nombre_comercial", { ascending: true })

            if (error) throw error
            setProveedores(dbProv || [])
          }
        }
      } catch (err) {
        console.error("Error al cargar proveedores:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filtrar
  const filteredProveedores = proveedores.filter(p => {
    const matchesSearch = 
      p.nombre_comercial.toLowerCase().includes(search.toLowerCase()) ||
      p.razon_social.toLowerCase().includes(search.toLowerCase()) ||
      p.cif_nif.toLowerCase().includes(search.toLowerCase())
    
    const matchesEsp = selectedEsp === "todos" || p.especialidad === selectedEsp

    return matchesSearch && matchesEsp
  })

  const handleEditClick = (prov: Proveedor) => {
    setEditingProveedor(prov)
    setFormData({
      razon_social: prov.razon_social,
      nombre_comercial: prov.nombre_comercial,
      cif_nif: prov.cif_nif,
      domicilio_fiscal: prov.domicilio_fiscal || "",
      nombre_contacto: prov.nombre_contacto || "",
      email_contacto: prov.email_contacto || "",
      telefono_contacto: prov.telefono_contacto || "",
      especialidad: prov.especialidad || "Carpintería",
      categorias_suministro: Array.isArray(prov.categorias_suministro) ? prov.categorias_suministro : [],
      forma_pago: prov.forma_pago || "transferencia",
      plazo_pago_dias: prov.plazo_pago_dias || 30,
    })
    setFormError(null)
    setIsSheetOpen(true)
  }

  const handleAddNewClick = () => {
    setEditingProveedor(null)
    setFormData({
      razon_social: "",
      nombre_comercial: "",
      cif_nif: "",
      domicilio_fiscal: "",
      nombre_contacto: "",
      email_contacto: "",
      telefono_contacto: "",
      especialidad: "Carpintería",
      categorias_suministro: [],
      forma_pago: "transferencia",
      plazo_pago_dias: 30,
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

      if (editingProveedor) {
        const { data, error } = await supabase
          .from("proveedores")
          .update(payload)
          .eq("id", editingProveedor.id)
          .select()
          .single()

        if (error) throw error
        setProveedores(prev => prev.map(p => p.id === editingProveedor.id ? data : p))
      } else {
        const { data, error } = await supabase
          .from("proveedores")
          .insert([payload])
          .select()
          .single()

        if (error) throw error
        setProveedores(prev => [...prev, data])
      }

      setIsSheetOpen(false)
    } catch (err: any) {
      setFormError(err?.message || "Error al guardar proveedor")
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
            Proveedores
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Homologación de talleres externos, instaladores, transportistas y catálogos de servicios.
          </p>
        </div>
        
        <Button 
          onClick={handleAddNewClick}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-xs rounded-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span>Añadir Proveedor</span>
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="border-[#27272a]/70 bg-[#09090b]/40">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717a]" />
            <Input 
              placeholder="Buscar proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#09090b]/80 border-[#27272a] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs text-[#fafafa]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label htmlFor="filter-esp" className="text-xs text-[#a1a1aa] shrink-0">
              Especialidad:
            </Label>
            <select
              id="filter-esp"
              value={selectedEsp}
              onChange={(e) => setSelectedEsp(e.target.value)}
              className="w-full sm:w-48 bg-[#09090b]/80 border-[#27272a] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs text-[#fafafa] rounded-md h-9 px-3"
            >
              <option value="todos">Todas las especialidades</option>
              {especialidadesList.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : filteredProveedores.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-[#27272a]/70 bg-[#09090b]/20">
          <div className="text-sm font-semibold text-[#71717a]">No se encontraron proveedores</div>
          <div className="text-xs text-[#52525b] mt-1">Crea un proveedor nuevo para empezar a homologar costes</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProveedores.map((prov) => (
            <Card key={prov.id} className="border-[#27272a]/70 bg-[#09090b]/30 hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-[#fafafa] group-hover:text-indigo-400 transition-colors">
                      {prov.nombre_comercial}
                    </h3>
                    <p className="text-[10px] text-[#71717a] font-medium leading-none">{prov.razon_social}</p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(prov)}
                    className="h-7 w-7 text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b]"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <div className="space-y-2 text-xs border-t border-[#27272a]/40 pt-3">
                  <div className="flex items-center gap-2 text-[#e4e4e7]">
                    <User className="h-3.5 w-3.5 text-[#71717a] shrink-0" />
                    <span>{prov.nombre_contacto || "Sin contacto"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#e4e4e7]">
                    <Mail className="h-3.5 w-3.5 text-[#71717a] shrink-0" />
                    <span className="truncate">{prov.email_contacto || "Sin email"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#e4e4e7]">
                    <Phone className="h-3.5 w-3.5 text-[#71717a] shrink-0" />
                    <span>{prov.telefono_contacto || "Sin teléfono"}</span>
                  </div>
                  {prov.domicilio_fiscal && (
                    <div className="flex items-center gap-2 text-[#e4e4e7]">
                      <MapPin className="h-3.5 w-3.5 text-[#71717a] shrink-0" />
                      <span className="truncate">{prov.domicilio_fiscal}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#27272a]/30 text-[10px] text-[#71717a]">
                  <span>CIF: {prov.cif_nif}</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{prov.forma_pago} ({prov.plazo_pago_dias}d)</span>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 py-2.5 border-t border-[#27272a]/40 bg-[#09090b]/50 rounded-b-xl flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                  <Briefcase className="h-3 w-3" />
                  <span>{prov.especialidad}</span>
                </span>
                <span className="text-[10px] text-[#71717a] font-medium">
                  {prov.categorias_suministro?.length || 0} categorías
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
            <SheetTitle className="text-[#fafafa]">{editingProveedor ? "Editar Proveedor" : "Nuevo Proveedor"}</SheetTitle>
            <SheetDescription className="text-[#a1a1aa]">
              Ingresa los datos del proveedor homologado y sus condiciones de pago.
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
                <Label htmlFor="especialidad" className="text-xs">Especialidad *</Label>
                <select
                  id="especialidad"
                  value={formData.especialidad}
                  onChange={handleFormChange}
                  className="w-full bg-[#09090b] border-[#27272a] text-xs text-[#fafafa] rounded-md h-9 px-3"
                >
                  {especialidadesList.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
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
                <Label htmlFor="nombre_contacto" className="text-xs">Nombre Contacto</Label>
                <Input 
                  id="nombre_contacto" 
                  value={formData.nombre_contacto} 
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
            </div>

            <div className="border-t border-[#27272a]/50 my-4 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">Condiciones Pago</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="forma_pago" className="text-xs">Forma Pago</Label>
                  <select
                    id="forma_pago"
                    value={formData.forma_pago}
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
                  "Guardar Proveedor"
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
