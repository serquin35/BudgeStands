"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitar hidration mismatch: solo renderizar en cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Placeholder con las mismas dimensiones para evitar layout shift
    return (
      <div
        className={cn(
          "h-8 w-8 rounded-lg border border-transparent",
          className
        )}
      />
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={cn(
        "relative h-8 w-8 rounded-lg flex items-center justify-center",
        "border border-border",
        "bg-secondary/60 hover:bg-secondary",
        "text-muted-foreground hover:text-foreground",
        "transition-all duration-200 group",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {/* Sol — visible en dark mode (acción: ir a light) */}
      <Sun
        className={cn(
          "absolute h-4 w-4 transition-all duration-300",
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-0 opacity-0"
        )}
      />
      {/* Luna — visible en light mode (acción: ir a dark) */}
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all duration-300",
          isDark
            ? "-rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        )}
      />
    </button>
  )
}
