import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PartidaPresupuesto } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface GrupoCategoria {
  categoria: string
  etiqueta: string
  items: PartidaPresupuesto[]
  subtotal: number
}

const ETIQUETAS_CATEGORIA: Record<string, string> = {
  construccion: "Construcción y Materiales",
  servicios: "Servicios de Feria y Recinto",
  diseno: "Diseño, Gráfica y Dirección",
  transporte_mo: "Transporte, Montaje y Desmontaje"
}

export function agruparPorCategoria(partidas: PartidaPresupuesto[]): GrupoCategoria[] {
  const grupos = partidas.reduce((acc, partida) => {
    const cat = partida.categoria
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(partida)
    return acc
  }, {} as Record<string, PartidaPresupuesto[]>)

  return Object.entries(grupos).map(([categoria, items]) => ({
    categoria,
    etiqueta: ETIQUETAS_CATEGORIA[categoria] || categoria,
    items,
    subtotal: items.reduce((sum, p) => sum + p.total, 0)
  }))
}

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)
}
