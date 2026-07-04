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
  Briefcase,
  Receipt,
  BarChart3,
  Settings,
  HelpCircle,
  Plus
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
      name: "Kanban Projects",
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
      name: "CRM Clients",
      href: "/dashboard/clientes",
      icon: Users,
    },
    {
      name: "Suppliers",
      href: "/dashboard/proveedores",
      icon: Truck,
    },
    {
      name: "Finance",
      href: "/dashboard/finanzas",
      icon: Receipt,
    },
    {
      name: "Analytics",
      href: "/dashboard/gerencial",
      icon: BarChart3,
    },
    {
      name: "Catalogs",
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
          className="h-8 w-8 bg-sidebar/80 border-sidebar-border text-foreground backdrop-blur-md hover:bg-sidebar"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-40 w-64 border-r border-sidebar-border/70 bg-sidebar flex flex-col justify-between transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top Section */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-hide">
          {/* Logo & Brand - Titan Enterprise Hub style */}
          <div className="h-14 border-b border-sidebar-border/70 flex items-center px-6 gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/10 shrink-0">
              <span className="font-extrabold text-sm text-primary-foreground tracking-wider">T</span>
            </div>
            <div>
              <div className="font-bold text-sm text-foreground leading-tight">The Titan</div>
              <div className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">Enterprise Hub</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1">
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
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent",
                    item.highlight && !isActive && "text-primary/90 hover:text-primary"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom Section (New Project, Settings, Support & Logout) */}
        <div className="p-4 border-t border-sidebar-border/70 space-y-3 bg-sidebar/50 shrink-0">
          {/* New Project CTA Button from Stitch design */}
          <Link
            href="/dashboard/presustand"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Link>

          {/* Settings & Support Sub-navigation */}
          <div className="space-y-1">
            <Link
              href="/dashboard/perfil"
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                pathname === "/dashboard/perfil"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Settings</span>
            </Link>
            <a
              href="mailto:support@thetitan.com"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all duration-200"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Support</span>
            </a>
          </div>

          {/* User Info Card & SignOut */}
          <div className="pt-2 border-t border-sidebar-border/40 flex flex-col gap-2">
            <Link 
              href="/dashboard/perfil" 
              className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20 border border-sidebar-border/30 hover:bg-secondary/40 transition-all duration-200 cursor-pointer group/user"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary group-hover/user:scale-110 transition-transform" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-foreground truncate">
                  {user.nombre_completo}
                </div>
                <div className="text-[10px] text-muted-foreground truncate font-medium">
                  {empresa.nombre}
                </div>
              </div>
            </Link>

            <button
              onClick={() => onSignOut()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all duration-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for Mobile */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  )
}
