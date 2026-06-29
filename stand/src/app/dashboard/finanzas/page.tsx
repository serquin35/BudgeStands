"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Search, 
  Plus, 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Check, 
  X, 
  Calendar, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Loader2,
  Lock
} from "lucide-react"
import { toast } from "sonner"
import type { FacturaProyecto, ProyectoOperacion } from "@/types"
import { ESTADO_COBRO, TIPO_FACTURA, ALERTA_VENCIMIENTO_DIAS, PCT_ANTICIPO_DEFAULT, PCT_FINAL_DEFAULT } from "@/constants"

// Helper to format currency
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)
}

export default function FinanzasPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-6rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <FinanzasContent />
    </Suspense>
  )
}

function FinanzasContent() {
  const searchParams = useSearchParams()
  const initProyectoId = searchParams.get("proyectoId")
  const openNew = searchParams.get("new") === "true"

  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<"clientes" | "proveedores" | "cashflow" | "cierre">("clientes")
  
  // Auth & Empresa
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [userRol, setUserRol] = useState<string>("comercial")
  const [loadingUser, setLoadingUser] = useState(true)

  // Facturas de Clientes State
  const [facturasClientes, setFacturasClientes] = useState<any[]>([])
  const [loadingFacturas, setLoadingFacturas] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")

  // Nueva Factura Form State
  const [proyectosList, setProyectosList] = useState<ProyectoOperacion[]>([])
  const [loadingProyectos, setLoadingProyectos] = useState(false)
  const [isNewFacturaOpen, setIsNewFacturaOpen] = useState(false)
  const [facturaForm, setFacturaForm] = useState({
    id_proyecto: "",
    tipo_factura: "anticipo" as "anticipo" | "final" | "rectificativa",
    porcentaje_facturado: 50,
    fecha_emision: new Date().toISOString().split("T")[0],
    notas: ""
  })
  const [savingFactura, setSavingFactura] = useState(false)
  const [numeroFacturaSugerido, setNumeroFacturaSugerido] = useState("")

  // Block Client Dialog
  const [blockClientDialog, setBlockClientDialog] = useState<{
    open: boolean;
    clienteId: string;
    clienteNombre: string;
    facturaId: string;
  } | null>(null)

  // Facturas de Proveedores State
  const [facturasProveedores, setFacturasProveedores] = useState<any[]>([])
  const [loadingProveedores, setLoadingProveedores] = useState(true)
  const [searchQueryProveedores, setSearchQueryProveedores] = useState("")
  const [statusFilterProveedores, setStatusFilterProveedores] = useState<string>("todos")

  // Nueva Factura Proveedor Form State
  const [isNewFacturaProveedorOpen, setIsNewFacturaProveedorOpen] = useState(false)
  const [savingFacturaProveedor, setSavingFacturaProveedor] = useState(false)
  const [suppliersList, setSuppliersList] = useState<any[]>([])
  const [categoriesList, setCategoriesList] = useState<any[]>([])
  const [facturaProveedorForm, setFacturaProveedorForm] = useState({
    id_proveedor: "",
    numero_factura_proveedor: "",
    fecha_emision: new Date().toISOString().split("T")[0],
    fecha_recepcion: new Date().toISOString().split("T")[0],
    fecha_vencimiento: new Date().toISOString().split("T")[0],
    metodo_pago: "transferencia" as "transferencia" | "confirming" | "tarjeta" | "girado",
    notas: "",
    lineas: [
      {
        descripcion_articulo: "",
        cantidad: 1,
        unidad: "ud",
        precio_unitario_coste: 0,
        id_proyecto: "",
        id_categoria_matriz: ""
      }
    ]
  })

  // Load search parameters
  useEffect(() => {
    if (initProyectoId) {
      setFacturaForm(prev => ({ ...prev, id_proyecto: initProyectoId }))
    }
    if (openNew) {
      setIsNewFacturaOpen(true)
    }
  }, [initProyectoId, openNew])

  // Load User & Empresa
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: dbUser } = await supabase
            .from("usuarios")
            .select("id_empresa, rol")
            .eq("id", user.id)
            .single()
            
          if (dbUser) {
            setEmpresaId(dbUser.id_empresa)
            setUserRol(dbUser.rol)
          }
        }
      } catch (err) {
        console.error("Error al obtener usuario:", err)
      } finally {
        setLoadingUser(false)
      }
    }
    loadUser()
  }, [])

  // Load Invoices once Empresa is known
  useEffect(() => {
    if (!empresaId) return
    loadFacturasClientes()
  }, [empresaId])

  // Load Supplier Invoices
  useEffect(() => {
    if (!empresaId) return
    if (activeTab === "proveedores") {
      loadFacturasProveedores()
    }
  }, [empresaId, activeTab])

  // Fetch Suppliers and Categories when needed
  useEffect(() => {
    if (!empresaId || (!isNewFacturaProveedorOpen && activeTab !== "proveedores")) return

    async function loadSuppliersAndCategories() {
      try {
        // Fetch suppliers
        const { data: suppliers } = await supabase
          .from("proveedores")
          .select("id, nombre_comercial, razon_social, plazo_pago_dias")
          .eq("id_empresa", empresaId)
          .eq("activo", true)
          .order("nombre_comercial")
        setSuppliersList(suppliers || [])

        // Fetch categories
        const { data: categories } = await supabase
          .from("categorias_matriz")
          .select("id, nombre, codigo")
          .eq("activa", true)
          .order("codigo")
        setCategoriesList(categories || [])
        
        // Also load projects if not loaded
        if (proyectosList.length === 0) {
          const { data: projs } = await supabase
            .from("proyectos_operaciones")
            .select(`
              id,
              codigo_proyecto_interno,
              estado_proyecto,
              presupuestos_cabecera (
                id,
                nombre_feria,
                total_presupuesto,
                porcentaje_iva,
                clientes (
                  id,
                  nombre_comercial,
                  plazo_pago_dias
                )
              )
            `)
            .eq("id_empresa", empresaId)
            .order("codigo_proyecto_interno", { ascending: false })
          setProyectosList(projs as any[] || [])
        }
      } catch (err) {
        console.error("Error al cargar proveedores y categorías:", err)
      }
    }
    loadSuppliersAndCategories()
  }, [empresaId, isNewFacturaProveedorOpen, activeTab])

  async function loadFacturasClientes() {
    setLoadingFacturas(true)
    try {
      // Query facturas_proyectos joined with proyectos_operaciones, budgets, and clients
      const { data, error } = await supabase
        .from("facturas_proyectos")
        .select(`
          *,
          proyectos_operaciones!inner (
            id,
            codigo_proyecto_interno,
            id_empresa,
            presupuestos_cabecera (
              id,
              nombre_feria,
              total_presupuesto,
              porcentaje_iva,
              clientes (
                id,
                nombre_comercial,
                razon_social,
                plazo_pago_dias
              )
            )
          )
        `)
        .eq("proyectos_operaciones.id_empresa", empresaId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setFacturasClientes(data || [])
    } catch (err) {
      console.error("Error al cargar facturas de clientes:", err)
      toast.error("Error al cargar las facturas de clientes")
    } finally {
      setLoadingFacturas(false)
    }
  }

  async function loadFacturasProveedores() {
    setLoadingProveedores(true)
    try {
      const { data, error } = await supabase
        .from("facturas_proveedores_cabecera")
        .select(`
          *,
          proveedores (
            id,
            nombre_comercial,
            razon_social
          ),
          facturas_proveedores_lineas (
            id,
            id_proyecto,
            id_categoria_matriz,
            descripcion_articulo,
            cantidad,
            unidad,
            precio_unitario_coste,
            total_linea_coste
          )
        `)
        .eq("id_empresa", empresaId)
        .order("fecha_emision", { ascending: false })

      if (error) throw error
      setFacturasProveedores(data || [])
    } catch (err) {
      console.error("Error al cargar facturas de proveedores:", err)
      toast.error("Error al cargar las facturas de proveedores")
    } finally {
      setLoadingProveedores(false)
    }
  }

  const handleUpdateEstadoProveedor = async (facturaId: string, newEstado: "pendiente" | "pagada" | "disputa_bloqueada") => {
    try {
      const { error } = await supabase
        .from("facturas_proveedores_cabecera")
        .update({ estado_pago: newEstado })
        .eq("id", facturaId)

      if (error) throw error
      toast.success(`Factura del proveedor marcada como ${newEstado === "pagada" ? "pagada" : newEstado === "disputa_bloqueada" ? "en disputa" : "pendiente"}`)
      loadFacturasProveedores()
    } catch (err) {
      console.error("Error al actualizar factura de proveedor:", err)
      toast.error("Error al actualizar la factura de proveedor")
    }
  }

  const handleAddProveedorLinea = () => {
    setFacturaProveedorForm(prev => ({
      ...prev,
      lineas: [
        ...prev.lineas,
        {
          descripcion_articulo: "",
          cantidad: 1,
          unidad: "ud",
          precio_unitario_coste: 0,
          id_proyecto: "",
          id_categoria_matriz: categoriesList[0]?.id?.toString() || ""
        }
      ]
    }))
  }

  const handleRemoveProveedorLinea = (index: number) => {
    setFacturaProveedorForm(prev => {
      if (prev.lineas.length === 1) return prev
      const updated = [...prev.lineas]
      updated.splice(index, 1)
      return { ...prev, lineas: updated }
    })
  }

  const handleProveedorLineaChange = (index: number, key: string, value: any) => {
    setFacturaProveedorForm(prev => {
      const updated = [...prev.lineas]
      updated[index] = { ...updated[index], [key]: value }
      return { ...prev, lineas: updated }
    })
  }

  const handleEmitirFacturaProveedor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!facturaProveedorForm.id_proveedor) {
      toast.error("Selecciona un proveedor")
      return
    }
    
    for (let i = 0; i < facturaProveedorForm.lineas.length; i++) {
      const l = facturaProveedorForm.lineas[i]
      if (!l.descripcion_articulo || !l.id_categoria_matriz) {
        toast.error(`La línea ${i + 1} requiere descripción y categoría de matriz`)
        return
      }
    }

    setSavingFacturaProveedor(true)
    try {
      const baseImponible = facturaProveedorForm.lineas.reduce(
        (sum, l) => sum + (Number(l.cantidad) * Number(l.precio_unitario_coste)), 
        0
      )
      const importeIva = Number((baseImponible * 0.21).toFixed(2))
      const totalFacturaBruto = Number((baseImponible + importeIva).toFixed(2))

      const { data: headerData, error: headerError } = await supabase
        .from("facturas_proveedores_cabecera")
        .insert({
          id_empresa: empresaId,
          id_proveedor: facturaProveedorForm.id_proveedor,
          numero_factura_proveedor: facturaProveedorForm.numero_factura_proveedor,
          fecha_emision: facturaProveedorForm.fecha_emision,
          fecha_recepcion: facturaProveedorForm.fecha_recepcion,
          fecha_vencimiento: facturaProveedorForm.fecha_vencimiento,
          base_imponible: baseImponible,
          importe_iva: importeIva,
          total_factura_bruto: totalFacturaBruto,
          estado_pago: "pendiente",
          metodo_pago: facturaProveedorForm.metodo_pago,
          notas: facturaProveedorForm.notas
        })
        .select()
        .single()

      if (headerError) throw headerError

      const linesToInsert = facturaProveedorForm.lineas.map(l => ({
        id_factura_proveedor: headerData.id,
        id_proyecto: l.id_proyecto || null,
        id_categoria_matriz: Number(l.id_categoria_matriz),
        descripcion_articulo: l.descripcion_articulo,
        cantidad: Number(l.cantidad),
        unidad: l.unidad,
        precio_unitario_coste: Number(l.precio_unitario_coste),
        total_linea_coste: Number((Number(l.cantidad) * Number(l.precio_unitario_coste)).toFixed(2))
      }))

      const { error: linesError } = await supabase
        .from("facturas_proveedores_lineas")
        .insert(linesToInsert)

      if (linesError) throw linesError

      toast.success("Factura de proveedor registrada correctamente")
      setIsNewFacturaProveedorOpen(false)
      loadFacturasProveedores()
      
      setFacturaProveedorForm({
        id_proveedor: "",
        numero_factura_proveedor: "",
        fecha_emision: new Date().toISOString().split("T")[0],
        fecha_recepcion: new Date().toISOString().split("T")[0],
        fecha_vencimiento: new Date().toISOString().split("T")[0],
        metodo_pago: "transferencia",
        notas: "",
        lineas: [
          {
            descripcion_articulo: "",
            cantidad: 1,
            unidad: "ud",
            precio_unitario_coste: 0,
            id_proyecto: "",
            id_categoria_matriz: categoriesList[0]?.id?.toString() || ""
          }
        ]
      })
    } catch (err: any) {
      console.error("Error al registrar factura de proveedor:", err)
      toast.error(err.message || "Error al registrar la factura de proveedor")
    } finally {
      setSavingFacturaProveedor(false)
    }
  }

  // Fetch candidate projects when opening New Factura dialog
  useEffect(() => {
    if (!isNewFacturaOpen || !empresaId) return
    
    async function loadCandidateProjects() {
      setLoadingProyectos(true)
      try {
        // Fetch projects that belong to our company and have budgets
        const { data, error } = await supabase
          .from("proyectos_operaciones")
          .select(`
            id,
            codigo_proyecto_interno,
            estado_proyecto,
            presupuestos_cabecera (
              id,
              nombre_feria,
              total_presupuesto,
              porcentaje_iva,
              clientes (
                id,
                nombre_comercial,
                plazo_pago_dias
              )
            )
          `)
          .eq("id_empresa", empresaId)
          .order("codigo_proyecto_interno", { ascending: false })

        if (error) throw error
        setProyectosList(data as any[] || [])
      } catch (err) {
        console.error("Error al cargar proyectos:", err)
        toast.error("No se pudieron cargar los proyectos activos")
      } finally {
        setLoadingProyectos(false)
      }
    }

    loadCandidateProjects()
    generarSugerenciaNumero()
  }, [isNewFacturaOpen, empresaId])

  async function generarSugerenciaNumero() {
    if (!empresaId) return
    try {
      const { data, error } = await supabase.rpc("generar_numero_factura", { p_id_empresa: empresaId })
      if (error) throw error
      setNumeroFacturaSugerido(data || `F${new Date().getFullYear().toString().slice(-2)}-0001`)
    } catch (err) {
      console.error("Error al generar número de factura:", err)
    }
  }

  // Calculate invoice dates & limits based on selected project
  const selectedProyectoData = proyectosList.find(p => p.id === facturaForm.id_proyecto)
  const budgetData = selectedProyectoData?.presupuestos_cabecera as any
  const clienteData = budgetData?.clientes as any

  // Semáforo Badge Color & Label Helper
  const getBadgeFactura = (factura: any) => {
    if (factura.estado_cobro === 'cobrada') 
      return { color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Cobrada' }
    
    if (factura.estado_cobro === 'impagada_vencida') 
      return { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Impagada' }
    
    const hoy = new Date()
    const vencimiento = new Date(factura.fecha_vencimiento)
    const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / 86400000)
    
    if (diasRestantes < 0)  
      return { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Vencida' }
    if (diasRestantes <= ALERTA_VENCIMIENTO_DIAS) 
      return { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: `Vence en ${diasRestantes}d` }
    
    return { color: 'bg-zinc-800/80 text-zinc-400 border-zinc-700', label: 'Pendiente' }
  }

  // Handle Form changes
  const handleFormChange = (key: string, value: any) => {
    setFacturaForm(prev => {
      const updated = { ...prev, [key]: value }
      // Default standard percentages on type change
      if (key === "tipo_factura") {
        if (value === "anticipo") updated.porcentaje_facturado = PCT_ANTICIPO_DEFAULT
        else if (value === "final") updated.porcentaje_facturado = PCT_FINAL_DEFAULT
        else updated.porcentaje_facturado = 0
      }
      return updated
    })
  }

  // Handle Create Submit
  const handleEmitirFactura = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!facturaForm.id_proyecto) {
      toast.error("Selecciona un proyecto de origen")
      return
    }

    setSavingFactura(true)
    try {
      const proj = proyectosList.find(p => p.id === facturaForm.id_proyecto)
      const bData = proj?.presupuestos_cabecera as any
      const client = bData?.clientes as any
      const totalPres = Number(bData?.total_presupuesto || 0)
      const ivaPct = Number(bData?.porcentaje_iva || 21.0)

      // 1. Validar acumulados para no superar 100% (salvo rectificativas)
      if (facturaForm.tipo_factura !== "rectificativa") {
        const { data: facturasExistentes } = await supabase
          .from("facturas_proyectos")
          .select("porcentaje_facturado")
          .eq("id_proyecto", facturaForm.id_proyecto)
          .neq("tipo_factura", "rectificativa")

        const pctYaFacturado = facturasExistentes?.reduce((sum, f) => sum + Number(f.porcentaje_facturado), 0) ?? 0
        if (pctYaFacturado + Number(facturaForm.porcentaje_facturado) > 100) {
          toast.error(
            `Ya has facturado el ${pctYaFacturado}% de este proyecto. ` +
            `El porcentaje máximo restante que puedes añadir es ${100 - pctYaFacturado}%.`
          )
          setSavingFactura(false)
          return
        }
      }

      // 2. Calcular importes usando iva dinámico del presupuesto
      const baseImponible = Number(((totalPres / (1 + ivaPct / 100)) * (facturaForm.porcentaje_facturado / 100)).toFixed(2))
      const importeIva = Number((baseImponible * (ivaPct / 100)).toFixed(2))
      const totalFacturaBruto = Number((baseImponible + importeIva).toFixed(2))

      // 3. Calcular vencimiento
      const emitDate = new Date(facturaForm.fecha_emision)
      const plazoDias = client?.plazo_pago_dias ?? 30
      emitDate.setDate(emitDate.getDate() + Number(plazoDias))
      const fechaVencimiento = emitDate.toISOString().split("T")[0]

      // 4. Inserción
      const { error } = await supabase
        .from("facturas_proyectos")
        .insert({
          id_proyecto: facturaForm.id_proyecto,
          numero_factura_legal: numeroFacturaSugerido,
          tipo_factura: facturaForm.tipo_factura,
          porcentaje_facturado: facturaForm.porcentaje_facturado,
          base_imponible: baseImponible,
          porcentaje_iva: ivaPct,
          importe_iva: importeIva,
          total_factura_bruto: totalFacturaBruto,
          estado_cobro: "pendiente_cobro",
          fecha_emision: facturaForm.fecha_emision,
          fecha_vencimiento: fechaVencimiento,
          notas: facturaForm.notas
        })

      if (error) throw error

      toast.success("Factura emitida correctamente")
      setIsNewFacturaOpen(false)
      loadFacturasClientes()
    } catch (err: any) {
      console.error("Error al emitir factura:", err)
      toast.error(err.message || "Error al emitir la factura")
    } finally {
      setSavingFactura(false)
    }
  }

  // Update Invoice Status (Cobrada / Impagada)
  const handleUpdateEstado = async (facturaId: string, idProyecto: string, newEstado: "pendiente_cobro" | "cobrada" | "impagada_vencida") => {
    try {
      const updates: any = { estado_cobro: newEstado }
      if (newEstado === "cobrada") {
        updates.fecha_cobro_real = new Date().toISOString().split("T")[0]
      } else {
        updates.fecha_cobro_real = null
      }

      const { error } = await supabase
        .from("facturas_proyectos")
        .update(updates)
        .eq("id", facturaId)

      if (error) throw error
      toast.success(`Factura marcada como ${newEstado === "cobrada" ? "cobrada" : newEstado === "impagada_vencida" ? "impagada" : "pendiente"}`)
      loadFacturasClientes()

      // Block client popup trigger for admin role when setting to Impagada
      if (newEstado === "impagada_vencida" && userRol === "admin") {
        // Fetch client details
        const { data: proj } = await supabase
          .from("proyectos_operaciones")
          .select("presupuestos_cabecera(clientes(id, nombre_comercial))")
          .eq("id", idProyecto)
          .single()

        const clientInfo = (proj?.presupuestos_cabecera as any)?.clientes
        const clientObj = Array.isArray(clientInfo) ? clientInfo[0] : clientInfo
        if (clientObj) {
          setBlockClientDialog({
            open: true,
            clienteId: clientObj.id,
            clienteNombre: clientObj.nombre_comercial,
            facturaId: facturaId
          })
        }
      }
    } catch (err) {
      console.error("Error al actualizar factura:", err)
      toast.error("Error al actualizar la factura")
    }
  }

  // Confirm Block Client
  const handleBlockCliente = async (confirm: boolean) => {
    if (!blockClientDialog) return
    const { clienteId, clienteNombre } = blockClientDialog
    setBlockClientDialog(null)

    if (confirm) {
      try {
        const { error } = await supabase
          .from("clientes")
          .update({ estado_cliente: "bloqueado_impagos" })
          .eq("id", clienteId)

        if (error) throw error
        toast.error(`Cliente "${clienteNombre}" bloqueado debido a impagos`)
      } catch (err) {
        console.error("Error al bloquear cliente:", err)
        toast.error("No se pudo bloquear al cliente")
      }
    }
  }

  // Filters logic
  const filteredFacturas = facturasClientes.filter(f => {
    const pc = f.proyectos_operaciones
    const bData = pc?.presupuestos_cabecera
    const cData = bData?.clientes
    
    const searchString = `${f.numero_factura_legal} ${pc?.codigo_proyecto_interno || ""} ${bData?.nombre_feria || ""} ${cData?.nombre_comercial || ""} ${cData?.razon_social || ""}`.toLowerCase()
    const matchesSearch = searchString.includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "todos" || f.estado_cobro === statusFilter

    return matchesSearch && matchesStatus
  })

  // Totals calculations
  const totalFacturadoSum = filteredFacturas.reduce((acc, f) => acc + Number(f.total_factura_bruto), 0)
  const totalCobradoSum = filteredFacturas.filter(f => f.estado_cobro === 'cobrada').reduce((acc, f) => acc + Number(f.total_factura_bruto), 0)
  const totalPendienteSum = filteredFacturas.filter(f => f.estado_cobro !== 'cobrada').reduce((acc, f) => acc + Number(f.total_factura_bruto), 0)

  if (loadingUser) {
    return (
      <div className="flex h-[calc(100vh-6rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto text-[#fafafa]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-zinc-100 to-indigo-100 bg-clip-text text-transparent">
            Gestión Financiera
          </h1>
          <p className="text-sm text-[#a1a1aa] mt-1">
            Control de cobros, facturación de proyectos, cash flow analítico y cierres operativos.
          </p>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex bg-[#18181b]/50 border border-[#27272a]/60 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("clientes")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "clientes"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-[#a1a1aa] hover:text-[#fafafa]"
            }`}
          >
            Facturas Clientes
          </button>
          <button
            onClick={() => setActiveTab("proveedores")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "proveedores"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-[#a1a1aa] hover:text-[#fafafa]"
            }`}
          >
            Facturas Proveedores
          </button>
          <button
            onClick={() => setActiveTab("cashflow")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "cashflow"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-[#a1a1aa] hover:text-[#fafafa]"
            }`}
          >
            Cash Flow
          </button>
          <button
            onClick={() => setActiveTab("cierre")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "cierre"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-[#a1a1aa] hover:text-[#fafafa]"
            }`}
          >
            Cierre Proyectos
          </button>
        </div>
      </div>

      {/* Main Tabs Container */}
      {activeTab === "clientes" && (
        <div className="space-y-6">
          {/* Dashboard mini-summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-[#09090b]/40 border-[#27272a]/60 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-[#a1a1aa]">Total Facturado</CardTitle>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Receipt className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalFacturadoSum)}</div>
                <div className="text-[10px] text-[#71717a] mt-1">Total bruto facturado acumulado</div>
              </CardContent>
            </Card>

            <Card className="bg-[#09090b]/40 border-[#27272a]/60 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-[#a1a1aa]">Total Cobrado</CardTitle>
                <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{formatCurrency(totalCobradoSum)}</div>
                <div className="text-[10px] text-[#71717a] mt-1">Ingresos reales ingresados</div>
              </CardContent>
            </Card>

            <Card className="bg-[#09090b]/40 border-[#27272a]/60 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-[#a1a1aa]">Total Pendiente</CardTitle>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-400">{formatCurrency(totalPendienteSum)}</div>
                <div className="text-[10px] text-[#71717a] mt-1">Facturas pendientes e impagadas</div>
              </CardContent>
            </Card>
          </div>

          {/* Table list and Filters */}
          <Card className="bg-[#09090b]/30 border-[#27272a]/60 backdrop-blur-md">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
              <div>
                <CardTitle className="text-lg font-bold">Listado de Facturas Emitidas</CardTitle>
                <CardDescription className="text-xs text-[#a1a1aa]">Controla los cobros y vencimientos de tus clientes.</CardDescription>
              </div>

              {/* Action and Search */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#71717a]" />
                  <Input
                    placeholder="Buscar factura, proyecto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-[#18181b]/40 border-[#27272a] focus-visible:ring-indigo-500 text-xs"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#18181b]/60 border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#fafafa] focus:ring-indigo-500"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="pendiente_cobro">Pendiente Cobro</option>
                  <option value="cobrada">Cobrada</option>
                  <option value="impagada_vencida">Impagada</option>
                </select>

                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs px-4 py-2 h-9"
                  onClick={() => setIsNewFacturaOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Emitir Factura
                </Button>

                <Dialog open={isNewFacturaOpen} onOpenChange={setIsNewFacturaOpen}>
                  <DialogContent className="bg-[#09090b] border-[#27272a] text-[#fafafa] max-w-lg">
                    <form onSubmit={handleEmitirFactura}>
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Emitir Nueva Factura</DialogTitle>
                        <DialogDescription className="text-xs text-[#a1a1aa]">
                          Elige el proyecto de origen. Los importes y fecha de vencimiento se calcularán automáticamente según las reglas oficiales.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 my-6">
                        {/* Proyecto Select */}
                        <div className="space-y-2">
                          <Label className="text-xs text-[#a1a1aa]">Proyecto de Origen</Label>
                          <select
                            value={facturaForm.id_proyecto}
                            onChange={(e) => handleFormChange("id_proyecto", e.target.value)}
                            required
                            className="w-full bg-[#18181b]/60 border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#fafafa] focus:ring-indigo-500"
                          >
                            <option value="">Selecciona un proyecto...</option>
                            {proyectosList.map(proj => (
                              <option key={proj.id} value={proj.id}>
                                {proj.codigo_proyecto_interno} - {(proj.presupuestos_cabecera as any)?.clientes?.nombre_comercial} ({proj.estado_proyecto})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Tipo de Factura */}
                        <div className="space-y-2">
                          <Label className="text-xs text-[#a1a1aa]">Tipo de Factura</Label>
                          <select
                            value={facturaForm.tipo_factura}
                            onChange={(e) => handleFormChange("tipo_factura", e.target.value)}
                            required
                            className="w-full bg-[#18181b]/60 border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#fafafa] focus:ring-indigo-500"
                          >
                            <option value="anticipo">Factura de Anticipo (50%)</option>
                            <option value="final">Factura Final (50%)</option>
                            <option value="rectificativa">Factura Rectificativa</option>
                          </select>
                        </div>

                        {/* Porcentaje */}
                        <div className="space-y-2">
                          <Label className="text-xs text-[#a1a1aa]">Porcentaje a Facturar (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={facturaForm.porcentaje_facturado}
                            onChange={(e) => handleFormChange("porcentaje_facturado", Number(e.target.value))}
                            required
                            className="bg-[#18181b]/40 border-[#27272a] text-xs"
                          />
                        </div>

                        {/* Automatic Calculations Preview */}
                        {facturaForm.id_proyecto && budgetData && (
                          <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs">
                            <h4 className="font-semibold text-indigo-400">Desglose de Factura Estimado</h4>
                            <div className="flex justify-between">
                              <span className="text-[#a1a1aa]">Presupuesto Total (con IVA):</span>
                              <span>{formatCurrency(budgetData.total_presupuesto)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#a1a1aa]">IVA Aplicable:</span>
                              <span>{budgetData.porcentaje_iva ?? 21}%</span>
                            </div>
                            <hr className="border-zinc-800 my-1" />
                            <div className="flex justify-between font-semibold">
                              <span className="text-[#a1a1aa]">Base Imponible ({facturaForm.porcentaje_facturado}%):</span>
                              <span>{formatCurrency(
                                Number(((budgetData.total_presupuesto / (1 + (budgetData.porcentaje_iva ?? 21)/100)) * (facturaForm.porcentaje_facturado/100)).toFixed(2))
                              )}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#a1a1aa]">Importe IVA:</span>
                              <span>{formatCurrency(
                                Number((((budgetData.total_presupuesto / (1 + (budgetData.porcentaje_iva ?? 21)/100)) * (facturaForm.porcentaje_facturado/100)) * ((budgetData.porcentaje_iva ?? 21)/100)).toFixed(2))
                              )}</span>
                            </div>
                            <div className="flex justify-between font-bold text-white text-sm mt-1">
                              <span>Total Bruto Factura:</span>
                              <span>{formatCurrency(
                                Number(((budgetData.total_presupuesto / (1 + (budgetData.porcentaje_iva ?? 21)/100)) * (facturaForm.porcentaje_facturado/100) * (1 + (budgetData.porcentaje_iva ?? 21)/100)).toFixed(2))
                              )}</span>
                            </div>
                            {clienteData && (
                              <div className="text-[10px] text-[#71717a] mt-2">
                                Plazo de pago cliente: {clienteData.plazo_pago_dias ?? 30} días. Vencimiento calculado de forma automatizada.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Sugerencia de Número */}
                        <div className="space-y-2">
                          <Label className="text-xs text-[#a1a1aa]">Número de Factura Sugerido (Legal)</Label>
                          <Input
                            value={numeroFacturaSugerido}
                            onChange={(e) => setNumeroFacturaSugerido(e.target.value)}
                            required
                            className="bg-[#18181b]/40 border-[#27272a] text-xs font-mono"
                          />
                        </div>

                        {/* Fecha de Emisión */}
                        <div className="space-y-2">
                          <Label className="text-xs text-[#a1a1aa]">Fecha de Emisión</Label>
                          <Input
                            type="date"
                            value={facturaForm.fecha_emision}
                            onChange={(e) => handleFormChange("fecha_emision", e.target.value)}
                            required
                            className="bg-[#18181b]/40 border-[#27272a] text-xs"
                          />
                        </div>

                        {/* Notas */}
                        <div className="space-y-2">
                          <Label className="text-xs text-[#a1a1aa]">Notas Internas / Observaciones</Label>
                          <Input
                            value={facturaForm.notas}
                            onChange={(e) => handleFormChange("notas", e.target.value)}
                            placeholder="Ej: Emitido según hito de inicio de fabricación..."
                            className="bg-[#18181b]/40 border-[#27272a] text-xs"
                          />
                        </div>
                      </div>

                      <DialogFooter className="flex justify-end gap-2 pt-4 border-t border-[#27272a]">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsNewFacturaOpen(false)}
                          className="text-xs border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={savingFactura}
                          className="text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/40 ring-1 ring-indigo-400/30 transition-all duration-200 px-5"
                        >
                          {savingFactura ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          ✓ Emitir Factura
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingFacturas ? (
                <div className="flex h-48 w-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#a1a1aa]" />
                </div>
              ) : filteredFacturas.length === 0 ? (
                <div className="flex h-36 w-full items-center justify-center border-t border-[#27272a]/60">
                  <div className="text-xs font-semibold text-[#71717a]">No se encontraron facturas emitidas</div>
                </div>
              ) : (
                <div className="overflow-x-auto border-t border-[#27272a]/60">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#18181b]/35 border-b border-[#27272a]/60 text-[#a1a1aa]">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Nº Factura</th>
                        <th className="px-6 py-3 font-semibold">Cliente</th>
                        <th className="px-6 py-3 font-semibold">Proyecto / Feria</th>
                        <th className="px-6 py-3 font-semibold">Porcentaje</th>
                        <th className="px-6 py-3 font-semibold">Base Imponible</th>
                        <th className="px-6 py-3 font-semibold">Importe IVA</th>
                        <th className="px-6 py-3 font-semibold">Importe Bruto</th>
                        <th className="px-6 py-3 font-semibold">Emisión / Vto</th>
                        <th className="px-6 py-3 font-semibold">Estado</th>
                        <th className="px-6 py-3 font-semibold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]/40 bg-[#09090b]/10">
                      {filteredFacturas.map((factura) => {
                        const pc = factura.proyectos_operaciones
                        const bData = pc?.presupuestos_cabecera
                        const cData = bData?.clientes
                        const badgeInfo = getBadgeFactura(factura)

                        return (
                          <tr key={factura.id} className="hover:bg-[#18181b]/15 transition-colors">
                            <td className="px-6 py-4 font-mono font-semibold text-white">{factura.numero_factura_legal}</td>
                            <td className="px-6 py-4 font-medium text-[#fafafa]">{cData?.nombre_comercial || "Cliente Desconocido"}</td>
                            <td className="px-6 py-4">
                              <div>{pc?.codigo_proyecto_interno || "N/A"}</div>
                              <div className="text-[10px] text-[#71717a] mt-0.5">{bData?.nombre_feria || "Feria"}</div>
                            </td>
                            <td className="px-6 py-4 text-center font-semibold">{factura.porcentaje_facturado}%</td>
                            <td className="px-6 py-4">{formatCurrency(factura.base_imponible)}</td>
                            <td className="px-6 py-4">{formatCurrency(factura.importe_iva)} ({factura.porcentaje_iva}%)</td>
                            <td className="px-6 py-4 font-semibold text-white">{formatCurrency(factura.total_factura_bruto)}</td>
                            <td className="px-6 py-4">
                              <div>{factura.fecha_emision}</div>
                              <div className="text-[10px] text-[#71717a] mt-0.5">Vto: {factura.fecha_vencimiento}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-semibold border ${badgeInfo.color}`}>
                                {badgeInfo.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                              {factura.estado_cobro === 'pendiente_cobro' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateEstado(factura.id, pc.id, "cobrada")}
                                    className="bg-green-600 hover:bg-green-700 h-7 text-[10px] px-2"
                                  >
                                    Cobrar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleUpdateEstado(factura.id, pc.id, "impagada_vencida")}
                                    className="bg-red-600 hover:bg-red-700 h-7 text-[10px] px-2"
                                  >
                                    Impagar
                                  </Button>
                                </>
                              )}
                              {factura.estado_cobro !== 'pendiente_cobro' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateEstado(factura.id, pc.id, "pendiente_cobro")}
                                  className="border-[#27272a] hover:bg-[#18181b]/30 h-7 text-[10px] px-2 text-[#a1a1aa]"
                                >
                                  Revertir
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB: FACTURAS DE PROVEEDORES ── */}
      {activeTab === "proveedores" && (
        <div className="space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-[#09090b]/40 border-[#27272a]/60 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-[#a1a1aa]">Total Recibido</CardTitle>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400"><ArrowDownRight className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-400">
                  {formatCurrency(facturasProveedores.reduce((s: number, f: any) => s + Number(f.total_factura_bruto || 0), 0))}
                </div>
                <div className="text-[10px] text-[#71717a] mt-1">Coste bruto acumulado de proveedores</div>
              </CardContent>
            </Card>
            <Card className="bg-[#09090b]/40 border-[#27272a]/60 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-[#a1a1aa]">Pagadas</CardTitle>
                <div className="p-2 rounded-lg bg-green-500/10 text-green-400"><Check className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(facturasProveedores.filter((f: any) => f.estado_pago === "pagada").reduce((s: number, f: any) => s + Number(f.total_factura_bruto || 0), 0))}
                </div>
                <div className="text-[10px] text-[#71717a] mt-1">Pagos ya ejecutados</div>
              </CardContent>
            </Card>
            <Card className="bg-[#09090b]/40 border-[#27272a]/60 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-[#a1a1aa]">Pendiente de Pago</CardTitle>
                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400"><AlertCircle className="w-4 h-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">
                  {formatCurrency(facturasProveedores.filter((f: any) => f.estado_pago === "pendiente").reduce((s: number, f: any) => s + Number(f.total_factura_bruto || 0), 0))}
                </div>
                <div className="text-[10px] text-[#71717a] mt-1">Facturas pendientes de pagar</div>
              </CardContent>
            </Card>
          </div>

          {/* List + Actions */}
          <Card className="bg-[#09090b]/30 border-[#27272a]/60 backdrop-blur-md">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
              <div>
                <CardTitle className="text-lg font-bold">Facturas Recibidas de Proveedores</CardTitle>
                <CardDescription className="text-xs text-[#a1a1aa]">Gestiona los costes imputados a proyectos.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#71717a]" />
                  <Input
                    placeholder="Buscar proveedor, nº factura..."
                    value={searchQueryProveedores}
                    onChange={(e) => setSearchQueryProveedores(e.target.value)}
                    className="pl-9 bg-[#18181b]/40 border-[#27272a] focus-visible:ring-indigo-500 text-xs"
                  />
                </div>
                <select
                  value={statusFilterProveedores}
                  onChange={(e) => setStatusFilterProveedores(e.target.value)}
                  className="bg-[#18181b]/60 border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#fafafa] focus:ring-indigo-500"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="pendiente">Pendiente Pago</option>
                  <option value="pagada">Pagada</option>
                  <option value="disputa_bloqueada">En Disputa</option>
                </select>
                {/* New Supplier Invoice Dialog */}
                <Button
                  className="text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 shadow-lg shadow-rose-500/30 ring-1 ring-rose-400/20 transition-all duration-200 whitespace-nowrap"
                  onClick={() => setIsNewFacturaProveedorOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Registrar Factura
                </Button>

                <Dialog open={isNewFacturaProveedorOpen} onOpenChange={setIsNewFacturaProveedorOpen}>

                  <DialogContent className="bg-[#09090b] border-[#27272a] text-[#fafafa] max-w-2xl max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleEmitirFacturaProveedor}>
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Registrar Factura de Proveedor</DialogTitle>
                        <DialogDescription className="text-xs text-[#a1a1aa]">
                          Paso 1: datos de cabecera. Paso 2: líneas de detalle con imputación a proyecto y categoría técnica.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-5 my-5">
                        {/* ── STEP 1: HEADER ── */}
                        <div className="rounded-lg border border-[#27272a] p-4 space-y-4">
                          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">① Cabecera de Factura</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Proveedor */}
                            <div className="space-y-1 sm:col-span-2">
                              <Label className="text-xs text-[#a1a1aa]">Proveedor *</Label>
                              <select
                                value={facturaProveedorForm.id_proveedor}
                                onChange={(e) => setFacturaProveedorForm(p => ({ ...p, id_proveedor: e.target.value }))}
                                required
                                className="w-full bg-[#18181b]/60 border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#fafafa] focus:ring-indigo-500"
                              >
                                <option value="">Selecciona un proveedor...</option>
                                {suppliersList.map((s: any) => (
                                  <option key={s.id} value={s.id}>{s.nombre_comercial}</option>
                                ))}
                              </select>
                            </div>
                            {/* Nº Factura */}
                            <div className="space-y-1">
                              <Label className="text-xs text-[#a1a1aa]">Nº Factura del Proveedor *</Label>
                              <Input
                                value={facturaProveedorForm.numero_factura_proveedor}
                                onChange={(e) => setFacturaProveedorForm(p => ({ ...p, numero_factura_proveedor: e.target.value }))}
                                placeholder="Ej: FP-2026-0042"
                                required
                                className="bg-[#18181b]/40 border-[#27272a] text-xs focus-visible:ring-indigo-500"
                              />
                            </div>
                            {/* Método Pago */}
                            <div className="space-y-1">
                              <Label className="text-xs text-[#a1a1aa]">Método de Pago</Label>
                              <select
                                value={facturaProveedorForm.metodo_pago}
                                onChange={(e) => setFacturaProveedorForm(p => ({ ...p, metodo_pago: e.target.value as any }))}
                                className="w-full bg-[#18181b]/60 border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#fafafa] focus:ring-indigo-500"
                              >
                                <option value="transferencia">Transferencia</option>
                                <option value="confirming">Confirming</option>
                                <option value="tarjeta">Tarjeta</option>
                                <option value="girado">Pagaré / Girado</option>
                              </select>
                            </div>
                            {/* Fechas */}
                            <div className="space-y-1">
                              <Label className="text-xs text-[#a1a1aa]">Fecha Emisión *</Label>
                              <Input type="date" value={facturaProveedorForm.fecha_emision} onChange={(e) => setFacturaProveedorForm(p => ({ ...p, fecha_emision: e.target.value }))} required className="bg-[#18181b]/40 border-[#27272a] text-xs focus-visible:ring-indigo-500" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-[#a1a1aa]">Fecha Recepción</Label>
                              <Input type="date" value={facturaProveedorForm.fecha_recepcion} onChange={(e) => setFacturaProveedorForm(p => ({ ...p, fecha_recepcion: e.target.value }))} className="bg-[#18181b]/40 border-[#27272a] text-xs focus-visible:ring-indigo-500" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-[#a1a1aa]">Fecha Vencimiento *</Label>
                              <Input type="date" value={facturaProveedorForm.fecha_vencimiento} onChange={(e) => setFacturaProveedorForm(p => ({ ...p, fecha_vencimiento: e.target.value }))} required className="bg-[#18181b]/40 border-[#27272a] text-xs focus-visible:ring-indigo-500" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-[#a1a1aa]">Notas Internas</Label>
                              <Input value={facturaProveedorForm.notas} onChange={(e) => setFacturaProveedorForm(p => ({ ...p, notas: e.target.value }))} placeholder="Opcional..." className="bg-[#18181b]/40 border-[#27272a] text-xs focus-visible:ring-indigo-500" />
                            </div>
                          </div>
                        </div>

                        {/* ── STEP 2: LINE ITEMS ── */}
                        <div className="rounded-lg border border-[#27272a] p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">② Líneas de Detalle e Imputación</p>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddProveedorLinea} className="h-7 text-[10px] border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a] hover:text-white">
                              <Plus className="w-3 h-3 mr-1" /> Añadir Línea
                            </Button>
                          </div>

                          {facturaProveedorForm.lineas.map((linea, idx) => (
                            <div key={idx} className="rounded-md border border-[#3f3f46]/50 bg-[#18181b]/30 p-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-[#71717a]">Línea {idx + 1}</span>
                                {facturaProveedorForm.lineas.length > 1 && (
                                  <button type="button" onClick={() => handleRemoveProveedorLinea(idx)} className="text-[#71717a] hover:text-red-400 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1 sm:col-span-2">
                                  <Label className="text-[10px] text-[#a1a1aa]">Descripción *</Label>
                                  <Input
                                    value={linea.descripcion_articulo}
                                    onChange={(e) => handleProveedorLineaChange(idx, "descripcion_articulo", e.target.value)}
                                    placeholder="Ej: Paneles de madera chapada..."
                                    required
                                    className="bg-[#18181b]/60 border-[#27272a] text-xs focus-visible:ring-rose-500 h-8"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-[#a1a1aa]">Cantidad</Label>
                                  <Input type="number" min="0.01" step="0.01" value={linea.cantidad} onChange={(e) => handleProveedorLineaChange(idx, "cantidad", e.target.value)} className="bg-[#18181b]/60 border-[#27272a] text-xs focus-visible:ring-rose-500 h-8" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-[#a1a1aa]">Unidad</Label>
                                  <Input value={linea.unidad} onChange={(e) => handleProveedorLineaChange(idx, "unidad", e.target.value)} placeholder="ud / m² / h" className="bg-[#18181b]/60 border-[#27272a] text-xs focus-visible:ring-rose-500 h-8" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-[#a1a1aa]">Precio Unit. Coste (€)</Label>
                                  <Input type="number" min="0" step="0.01" value={linea.precio_unitario_coste} onChange={(e) => handleProveedorLineaChange(idx, "precio_unitario_coste", e.target.value)} className="bg-[#18181b]/60 border-[#27272a] text-xs focus-visible:ring-rose-500 h-8" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-[#a1a1aa] flex items-center gap-1">
                                    Total Línea
                                    <span className="text-rose-400 font-semibold">
                                      {formatCurrency(Number(linea.cantidad) * Number(linea.precio_unitario_coste))}
                                    </span>
                                  </Label>
                                  <div className="h-8" /> {/* spacer */}
                                </div>
                                <div className="space-y-1 sm:col-span-2 grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-[10px] text-[#a1a1aa]">Imputar a Proyecto</Label>
                                    <select
                                      value={linea.id_proyecto}
                                      onChange={(e) => handleProveedorLineaChange(idx, "id_proyecto", e.target.value)}
                                      className="w-full bg-[#18181b]/60 border border-[#27272a] rounded-lg px-2 py-1.5 text-xs text-[#fafafa] focus:ring-rose-500"
                                    >
                                      <option value="">Sin proyecto específico</option>
                                      {proyectosList.map((p: any) => (
                                        <option key={p.id} value={p.id}>
                                          {p.codigo_proyecto_interno} — {(p.presupuestos_cabecera as any)?.clientes?.nombre_comercial || ""}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px] text-[#a1a1aa]">Categoría Técnica *</Label>
                                    <select
                                      value={linea.id_categoria_matriz}
                                      onChange={(e) => handleProveedorLineaChange(idx, "id_categoria_matriz", e.target.value)}
                                      required
                                      className="w-full bg-[#18181b]/60 border border-[#27272a] rounded-lg px-2 py-1.5 text-xs text-[#fafafa] focus:ring-rose-500"
                                    >
                                      <option value="">Selecciona categoría...</option>
                                      {categoriesList.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Running total preview */}
                          <div className="flex justify-end gap-6 pt-2 border-t border-[#27272a] text-xs">
                            <span className="text-[#a1a1aa]">Base imponible: <span className="text-white font-semibold">{formatCurrency(facturaProveedorForm.lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precio_unitario_coste), 0))}</span></span>
                            <span className="text-[#a1a1aa]">IVA 21%: <span className="text-white font-semibold">{formatCurrency(facturaProveedorForm.lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precio_unitario_coste), 0) * 0.21)}</span></span>
                            <span className="text-rose-400 font-bold">Total: {formatCurrency(facturaProveedorForm.lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precio_unitario_coste), 0) * 1.21)}</span>
                          </div>
                        </div>
                      </div>

                      <DialogFooter className="flex justify-end gap-2 pt-4 border-t border-[#27272a]">
                        <Button type="button" variant="outline" onClick={() => setIsNewFacturaProveedorOpen(false)} className="text-xs border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a] hover:text-white">
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={savingFacturaProveedor} className="text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 shadow-lg shadow-rose-500/30 ring-1 ring-rose-400/20 transition-all duration-200 px-5">
                          {savingFacturaProveedor ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          ✓ Registrar Factura
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {loadingProveedores ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
              ) : facturasProveedores.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-10 h-10 text-[#3f3f46] mx-auto mb-3" />
                  <p className="text-sm text-[#71717a]">No hay facturas de proveedores registradas.</p>
                  <p className="text-xs text-[#52525b] mt-1">Registra la primera usando el botón superior.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#27272a] text-[#71717a]">
                        <th className="text-left py-2 px-2 font-medium">Nº Factura</th>
                        <th className="text-left py-2 px-2 font-medium">Proveedor</th>
                        <th className="text-left py-2 px-2 font-medium">Base / IVA / Total</th>
                        <th className="text-left py-2 px-2 font-medium">Vencimiento</th>
                        <th className="text-left py-2 px-2 font-medium">Estado</th>
                        <th className="text-left py-2 px-2 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturasProveedores
                        .filter((f: any) => {
                          const matchStatus = statusFilterProveedores === "todos" || f.estado_pago === statusFilterProveedores
                          const matchSearch = !searchQueryProveedores || 
                            (f.numero_factura_proveedor || "").toLowerCase().includes(searchQueryProveedores.toLowerCase()) ||
                            (f.proveedores?.nombre_comercial || "").toLowerCase().includes(searchQueryProveedores.toLowerCase())
                          return matchStatus && matchSearch
                        })
                        .map((fac: any) => {
                          const hoy = new Date()
                          const vence = new Date(fac.fecha_vencimiento)
                          const dias = Math.ceil((vence.getTime() - hoy.getTime()) / 86400000)
                          const badge =
                            fac.estado_pago === "pagada"
                              ? { color: "bg-green-500/10 text-green-400 border-green-500/20", label: "Pagada" }
                              : fac.estado_pago === "disputa_bloqueada"
                              ? { color: "bg-orange-500/10 text-orange-400 border-orange-500/20", label: "Disputa" }
                              : dias < 0
                              ? { color: "bg-rose-500/10 text-rose-400 border-rose-500/20", label: "Vencida" }
                              : dias <= ALERTA_VENCIMIENTO_DIAS
                              ? { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", label: `Vence en ${dias}d` }
                              : { color: "bg-zinc-800/80 text-zinc-400 border-zinc-700", label: "Pendiente" }

                          return (
                            <tr key={fac.id} className="border-b border-[#27272a]/40 hover:bg-[#18181b]/30 transition-colors">
                              <td className="py-3 px-2 font-mono text-indigo-300">{fac.numero_factura_proveedor}</td>
                              <td className="py-3 px-2 text-[#fafafa]">{fac.proveedores?.nombre_comercial || "—"}</td>
                              <td className="py-3 px-2">
                                <div className="text-[#a1a1aa]">{formatCurrency(fac.base_imponible)} + {formatCurrency(fac.importe_iva)}</div>
                                <div className="font-semibold text-rose-300">{formatCurrency(fac.total_factura_bruto)}</div>
                              </td>
                              <td className="py-3 px-2 text-[#a1a1aa]">
                                {new Date(fac.fecha_vencimiento).toLocaleDateString("es-ES")}
                              </td>
                              <td className="py-3 px-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex gap-1 flex-wrap">
                                  {fac.estado_pago !== "pagada" && (
                                    <Button size="sm" onClick={() => handleUpdateEstadoProveedor(fac.id, "pagada")} className="bg-green-600 hover:bg-green-700 h-7 text-[10px] px-2">Pagar</Button>
                                  )}
                                  {fac.estado_pago !== "disputa_bloqueada" && fac.estado_pago !== "pagada" && (
                                    <Button size="sm" variant="outline" onClick={() => handleUpdateEstadoProveedor(fac.id, "disputa_bloqueada")} className="border-orange-600/40 text-orange-400 hover:bg-orange-900/20 h-7 text-[10px] px-2">Disputa</Button>
                                  )}
                                  {fac.estado_pago !== "pendiente" && (
                                    <Button size="sm" variant="outline" onClick={() => handleUpdateEstadoProveedor(fac.id, "pendiente")} className="border-[#27272a] hover:bg-[#18181b]/30 h-7 text-[10px] px-2 text-[#a1a1aa]">Revertir</Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "cashflow" && (
        <Card className="bg-[#09090b]/40 border-[#27272a]/60 backdrop-blur-md p-12 text-center">
          <TrendingUp className="w-12 h-12 text-[#71717a] mx-auto mb-4" />
          <h3 className="text-base font-bold text-white mb-2">Dashboard de Cash Flow (Sprint 3)</h3>
          <p className="text-xs text-[#a1a1aa] max-w-md mx-auto">
            El control previsional e histórico de tesorería, alertas de márgenes y previsiones a 30/60/90 días se desarrollará en el Sprint 3.
          </p>
        </Card>
      )}

      {activeTab === "cierre" && (
        <Card className="bg-[#09090b]/40 border-[#27272a]/60 backdrop-blur-md p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-[#71717a] mx-auto mb-4" />
          <h3 className="text-base font-bold text-white mb-2">Cierre de Proyectos y Rentabilidad (Sprint 4)</h3>
          <p className="text-xs text-[#a1a1aa] max-w-md mx-auto">
            El cierre económico de proyectos (ingresos cobrados vs gastos de compras reales), valoración del cliente, lecciones aprendidas e indexación semántica en Qdrant se desarrollará en el Sprint 4.
          </p>
        </Card>
      )}

      {/* Block Client dialog confirmation */}
      {blockClientDialog && (
        <Dialog open={blockClientDialog.open} onOpenChange={(isOpen) => !isOpen && setBlockClientDialog(null)}>
          <DialogContent className="bg-[#09090b] border-[#27272a] text-[#fafafa] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-400">
                <ShieldAlert className="w-5 h-5 text-red-400" /> ¿Bloquear cliente por impago?
              </DialogTitle>
              <DialogDescription className="text-xs text-[#a1a1aa] mt-2">
                Has marcado una factura como <strong>Impagada</strong>. Como administrador, tienes la opción de bloquear al cliente <strong>{blockClientDialog.clienteNombre}</strong> en la plataforma para evitar que se puedan emitir nuevos presupuestos o licitaciones.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => handleBlockCliente(false)}
                className="text-xs border-[#27272a]"
              >
                No bloquear, solo registrar impago
              </Button>
              <Button
                onClick={() => handleBlockCliente(true)}
                className="bg-red-600 hover:bg-red-700 text-xs"
              >
                Bloquear cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
