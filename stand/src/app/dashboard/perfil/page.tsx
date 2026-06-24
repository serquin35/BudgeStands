"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  User, 
  Building2, 
  CreditCard, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Lock, 
  Sparkles,
  Briefcase,
  Users
} from "lucide-react"

export default function PerfilPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  
  // User Profile State
  const [nombreCompleto, setNombreCompleto] = useState("")
  const [emailUser, setEmailUser] = useState("")
  const [rolUser, setRolUser] = useState("")
  
  // Company Profile State
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [empresaNombre, setEmpresaNombre] = useState("")
  const [empresaCif, setEmpresaCif] = useState("")
  const [empresaDomicilio, setEmpresaDomicilio] = useState("")
  const [empresaTelefono, setEmpresaTelefono] = useState("")
  const [empresaEmail, setEmpresaEmail] = useState("")
  const [empresaLogo, setEmpresaLogo] = useState("")
  const [empresaPlan, setEmpresaPlan] = useState("starter")
  
  // Notification states
  const [savingUser, setSavingUser] = useState(false)
  const [userMsg, setUserMsg] = useState<{ type: "success" | "error", text: string } | null>(null)
  
  const [savingEmpresa, setSavingEmpresa] = useState(false)
  const [empresaMsg, setEmpresaMsg] = useState<{ type: "success" | "error", text: string } | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          setEmailUser(user.email || "")

          // Cargar datos de usuario
          const { data: dbUser, error: userError } = await supabase
            .from("usuarios")
            .select("nombre_completo, rol, id_empresa")
            .eq("id", user.id)
            .single()

          if (userError) throw userError

          if (dbUser) {
            setNombreCompleto(dbUser.nombre_completo || "")
            setRolUser(dbUser.rol || "comercial")
            setEmpresaId(dbUser.id_empresa)

            // Cargar datos de empresa
            const { data: dbEmpresa, error: empresaError } = await supabase
              .from("empresas")
              .select("*")
              .eq("id", dbUser.id_empresa)
              .single()

            if (empresaError) throw empresaError

            if (dbEmpresa) {
              setEmpresaNombre(dbEmpresa.nombre || "")
              setEmpresaCif(dbEmpresa.cif || "")
              setEmpresaDomicilio(dbEmpresa.domicilio || "")
              setEmpresaTelefono(dbEmpresa.telefono || "")
              setEmpresaEmail(dbEmpresa.email_principal || "")
              setEmpresaLogo(dbEmpresa.logo_url || "")
              setEmpresaPlan(dbEmpresa.plan_saas || "starter")
            }
          }
        }
      } catch (err: any) {
        console.error("Error cargando perfil:", err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSavingUser(true)
    setUserMsg(null)

    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          nombre_completo: nombreCompleto.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", userId)

      if (error) throw error
      setUserMsg({ type: "success", text: "Datos de perfil actualizados correctamente." })
    } catch (err: any) {
      console.error(err)
      setUserMsg({ type: "error", text: err.message || "Error al actualizar el usuario." })
    } finally {
      setSavingUser(false)
    }
  }

  const handleSaveEmpresa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresaId) return
    setSavingEmpresa(true)
    setEmpresaMsg(null)

    try {
      const { error } = await supabase
        .from("empresas")
        .update({
          nombre: empresaNombre.trim(),
          cif: empresaCif.trim(),
          domicilio: empresaDomicilio.trim() || null,
          telefono: empresaTelefono.trim() || null,
          email_principal: empresaEmail.trim() || null,
          logo_url: empresaLogo.trim() || null
        })
        .eq("id", empresaId)

      if (error) throw error
      setEmpresaMsg({ type: "success", text: "Configuración de empresa guardada correctamente." })
    } catch (err: any) {
      console.error(err)
      setEmpresaMsg({ type: "error", text: err.message || "Error al actualizar la empresa." })
    } finally {
      setSavingEmpresa(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold">Cargando perfil...</p>
      </div>
    )
  }

  const isUserAdmin = rolUser === "admin"

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-[#fafafa] to-[#a1a1aa]">
          Mi Cuenta y Organización
        </h1>
        <p className="text-xs text-[#a1a1aa] mt-1">
          Configura tus datos personales, las credenciales comerciales de tu empresa y el estado de la suscripción.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Left: User Profile Form */}
        <div className="md:col-span-5 space-y-6">
          <Card className="border-[#27272a]/70 bg-[#09090b]/40">
            <CardHeader>
              <CardTitle className="text-base text-[#fafafa] flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-400" />
                <span>Perfil de Usuario</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#a1a1aa]">
                Tus datos de acceso y tu rol asignado dentro de la plataforma.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveUser}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre_completo" className="text-xs text-[#a1a1aa]">Nombre Completo</Label>
                  <Input
                    id="nombre_completo"
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    required
                    className="bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-[#a1a1aa]">Email (Acceso)</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      value={emailUser}
                      disabled
                      className="bg-[#18181b]/50 border border-[#27272a]/50 text-xs text-[#71717a] cursor-not-allowed pr-8"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#71717a]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-[#a1a1aa]">Rol en la Organización</Label>
                  <div className="flex items-center">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold capitalize border ${
                      isUserAdmin 
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                      {rolUser}
                    </span>
                  </div>
                </div>

                {userMsg && (
                  <div className={`p-3 rounded text-xs flex gap-2 items-center ${
                    userMsg.type === "success" 
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                      : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                  }`}>
                    {userMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                    <span>{userMsg.text}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end border-t border-[#27272a]/50 py-3 bg-[#09090b]/40">
                <Button
                  type="submit"
                  disabled={savingUser}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-4 h-9"
                >
                  {savingUser ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  <span>Guardar Perfil</span>
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Subscription / Plan Card */}
          <Card className="border-[#27272a]/70 bg-[#09090b]/40">
            <CardHeader>
              <CardTitle className="text-base text-[#fafafa] flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-400" />
                <span>Suscripción SaaS</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#a1a1aa]">
                Control de cuotas y límites contratados en tu suscripción de The Titan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="p-4 rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Plan Activo</div>
                  <div className="text-xl font-black text-[#fafafa] tracking-tight uppercase mt-0.5">
                    Plan {empresaPlan}
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase animate-pulse">
                  ACTIVO
                </span>
              </div>

              {/* Progress limit cards */}
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#a1a1aa] flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Créditos Jarvis AI (Mes)</span>
                    <span className="text-[#fafafa]">12 / 100</span>
                  </div>
                  <div className="h-2 w-full bg-[#27272a] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 w-[12%] rounded-full" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#a1a1aa] flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-indigo-400" /> Proyectos Activos</span>
                    <span className="text-[#fafafa]">4 / Ilimitados</span>
                  </div>
                  <div className="h-2 w-full bg-[#27272a] rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[100%] rounded-full" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#a1a1aa] flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-indigo-400" /> Usuarios del Equipo</span>
                    <span className="text-[#fafafa]">2 / 5</span>
                  </div>
                  <div className="h-2 w-full bg-[#27272a] rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[40%] rounded-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Company Profile Form */}
        <div className="md:col-span-7">
          <Card className="border-[#27272a]/70 bg-[#09090b]/40">
            <CardHeader>
              <CardTitle className="text-base text-[#fafafa] flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-400" />
                <span>Configuración de la Empresa</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#a1a1aa]">
                Información fiscal y comercial corporativa que aparecerá en los presupuestos oficiales.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveEmpresa}>
              <CardContent className="space-y-4">
                {!isUserAdmin && (
                  <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex gap-2 items-center">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Solo los usuarios con rol de <strong>Administrador</strong> pueden modificar la configuración de la empresa.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="empresa_nombre" className="text-xs text-[#a1a1aa]">Nombre de Empresa / Razón Social *</Label>
                    <Input
                      id="empresa_nombre"
                      value={empresaNombre}
                      onChange={(e) => setEmpresaNombre(e.target.value)}
                      disabled={!isUserAdmin}
                      required
                      className="bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="empresa_cif" className="text-xs text-[#a1a1aa]">CIF / NIF Identificación *</Label>
                    <Input
                      id="empresa_cif"
                      value={empresaCif}
                      onChange={(e) => setEmpresaCif(e.target.value)}
                      disabled={!isUserAdmin}
                      required
                      className="bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="empresa_domicilio" className="text-xs text-[#a1a1aa]">Domicilio Fiscal (Dirección completa)</Label>
                  <div className="relative">
                    <Input
                      id="empresa_domicilio"
                      value={empresaDomicilio}
                      onChange={(e) => setEmpresaDomicilio(e.target.value)}
                      disabled={!isUserAdmin}
                      placeholder="Dirección, código postal, provincia, país"
                      className="bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:ring-indigo-500 pl-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#71717a]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="empresa_email" className="text-xs text-[#a1a1aa]">Email Principal de Contacto</Label>
                    <div className="relative">
                      <Input
                        id="empresa_email"
                        type="email"
                        value={empresaEmail}
                        onChange={(e) => setEmpresaEmail(e.target.value)}
                        disabled={!isUserAdmin}
                        placeholder="contacto@miempresa.com"
                        className="bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:ring-indigo-500 pl-8 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#71717a]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="empresa_telefono" className="text-xs text-[#a1a1aa]">Teléfono Corporativo</Label>
                    <div className="relative">
                      <Input
                        id="empresa_telefono"
                        value={empresaTelefono}
                        onChange={(e) => setEmpresaTelefono(e.target.value)}
                        disabled={!isUserAdmin}
                        placeholder="+34 900 000 000"
                        className="bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:ring-indigo-500 pl-8 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#71717a]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="empresa_logo" className="text-xs text-[#a1a1aa]">URL del Logotipo Corporativo</Label>
                  <div className="relative">
                    <Input
                      id="empresa_logo"
                      value={empresaLogo}
                      onChange={(e) => setEmpresaLogo(e.target.value)}
                      disabled={!isUserAdmin}
                      placeholder="https://miempresa.com/logo.png"
                      className="bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:ring-indigo-500 pl-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#71717a]" />
                  </div>
                </div>

                {empresaMsg && (
                  <div className={`p-3 rounded text-xs flex gap-2 items-center ${
                    empresaMsg.type === "success" 
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                      : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                  }`}>
                    {empresaMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                    <span>{empresaMsg.text}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end border-t border-[#27272a]/50 py-3 bg-[#09090b]/40">
                <Button
                  type="submit"
                  disabled={savingEmpresa || !isUserAdmin}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-4 h-9 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingEmpresa ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  <span>Guardar Configuración</span>
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
