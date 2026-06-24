"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  Database, 
  Truck,
  LogOut, 
  Menu, 
  X,
  User,
  Briefcase
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  user: {
    nombre_completo: string
    rol: string
  }
  empresa: {
    nombre: string
  }
  onSignOut: () => Promise<void>
}

export default function Sidebar({ user, empresa, onSignOut }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Proyectos Kanban",
      href: "/dashboard/proyectos",
      icon: Briefcase,
    },
    {
      name: "Presustand IA",
      href: "/dashboard/presustand",
      icon: Sparkles,
      highlight: true,
    },
    {
      name: "Clientes CRM",
      href: "/dashboard/clientes",
      icon: Users,
    },
    {
      name: "Proveedores",
      href: "/dashboard/proveedores",
      icon: Truck,
    },
    {
      name: "Catálogos",
      href: "/dashboard/catalogos",
      icon: Database,
    },
  ]

  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <>
      {/* Mobile Toggle Button - inside header zone */}
      <div className="lg:hidden fixed top-0 left-0 z-50 h-14 flex items-center px-3">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 bg-[#09090b]/80 border-[#27272a] text-[#fafafa] backdrop-blur-md hover:bg-[#18181b]"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-40 w-64 border-r border-[#27272a]/70 bg-[#09090b] flex flex-col justify-between transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top Section */}
        <div>
          {/* Logo & Brand */}
          <div className="h-14 border-b border-[#27272a]/70 flex items-center px-6 gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/10">
              <span className="font-extrabold text-sm text-white tracking-wider">T</span>
            </div>
            <div>
              <div className="font-bold text-sm text-[#fafafa] leading-tight">The Titan</div>
              <div className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Presustand</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                    isActive 
                      ? item.highlight 
                        ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30"
                        : "bg-[#18181b] text-[#fafafa] border border-[#27272a]"
                      : "text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b]/50 border border-transparent",
                    item.highlight && !isActive && "text-indigo-400/90 hover:text-indigo-300"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-indigo-400" : "text-[#71717a]",
                    item.highlight && "text-indigo-400"
                  )} />
                  <span>{item.name}</span>
                  
                  {item.highlight && (
                    <span className="absolute right-3 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 uppercase tracking-widest border border-indigo-500/30 animate-pulse">
                      IA
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom Section (User Profile & SignOut) */}
        <div className="p-4 border-t border-[#27272a]/70 space-y-4 bg-[#09090b]/50">
          {/* User Info Card */}
          <Link 
            href="/dashboard/perfil" 
            className="flex items-center gap-3 p-2 rounded-lg bg-[#18181b]/40 border border-[#27272a]/30 hover:bg-[#18181b]/95 hover:border-indigo-500/50 transition-all duration-200 cursor-pointer group/user"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover/user:border-indigo-400/50 transition-colors">
              <User className="h-4 w-4 text-indigo-400 group-hover/user:scale-110 transition-transform" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#fafafa] truncate group-hover/user:text-indigo-300 transition-colors">
                {user.nombre_completo}
              </div>
              <div className="text-[10px] text-[#71717a] truncate font-medium">
                {empresa.nombre}
              </div>
            </div>
          </Link>

          {/* Logout Button */}
          <button
            onClick={() => onSignOut()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#f43f5e] hover:text-[#rose-400] hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay for Mobile */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  )
}
