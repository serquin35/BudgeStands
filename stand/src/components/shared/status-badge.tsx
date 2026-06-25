interface StatusBadgeProps {
  estado: string
}

export function StatusBadge({ estado }: StatusBadgeProps) {
  switch (estado) {
    case "aceptado":
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Aceptado</span>
    case "presentado":
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Presentado</span>
    case "en_espera":
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">En Espera</span>
    case "en_negociacion":
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">En Negociación</span>
    case "borrador":
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">Borrador</span>
    default:
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">{estado}</span>
  }
}
