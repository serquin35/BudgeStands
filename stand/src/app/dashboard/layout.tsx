import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import Sidebar from "@/components/dashboard/sidebar"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { signOut } from "@/app/auth/actions"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Obtener datos del usuario y su empresa
  const { data: dbUser } = await supabase
    .from("usuarios")
    .select("nombre_completo, rol, id_empresa")
    .eq("id", user.id)
    .single()

  let empresaName = "Empresa"
  if (dbUser?.id_empresa) {
    const { data: dbEmpresa } = await supabase
      .from("empresas")
      .select("nombre")
      .eq("id", dbUser.id_empresa)
      .single()
    if (dbEmpresa) {
      empresaName = dbEmpresa.nombre
    }
  }

  const userData = {
    nombre_completo: dbUser?.nombre_completo || "Usuario",
    rol: dbUser?.rol || "comercial",
  }

  const empresaData = {
    nombre: empresaName,
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar Nav */}
      <Sidebar user={userData} empresa={empresaData} onSignOut={signOut} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-border/70 flex items-center justify-between px-4 sm:px-6 bg-header/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Spacer for mobile hamburger button */}
            <div className="w-10 lg:hidden" />
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              MVP v1.0
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Theme Toggle — siempre visible en header */}
            <ThemeToggle />

            <Link 
              href="/dashboard/perfil" 
              className="text-right hidden sm:block hover:opacity-85 hover:text-indigo-400 transition-all duration-200"
            >
              <div className="text-xs font-semibold text-foreground">{userData.nombre_completo}</div>
              <div className="text-[10px] text-muted-foreground capitalize">{userData.rol}</div>
            </Link>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
