"use client"

import { useMemo } from "react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

interface OverviewChartProps {
  presupuestos?: any[]
}

interface MonthData {
  name: string
  facturacion: number
  presupuestado: number
  month: number
  year: number
}

export default function OverviewChart({ presupuestos = [] }: OverviewChartProps) {
  const data = useMemo(() => {
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const today = new Date();
    
    // Generar los últimos 6 meses (incluyendo el actual)
    const months: MonthData[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        name: monthNames[d.getMonth()],
        facturacion: 0,
        presupuestado: 0,
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }

    // Clasificar y sumar presupuestos
    presupuestos.forEach((presu) => {
      if (!presu.created_at) return;
      const date = new Date(presu.created_at);
      const m = date.getMonth();
      const y = date.getFullYear();
      const amount = Number(presu.total_presupuesto || 0);

      // Buscar el mes correspondiente en nuestro array
      const match = months.find((item) => item.month === m && item.year === y);
      if (match) {
        // Presupuestado (Volumen de presupuestos presentados):
        // Incluimos los estados presentados al cliente o ganados
        if (["presentado", "en_espera", "en_negociacion", "aceptado"].includes(presu.estado_presupuesto)) {
          match.presupuestado += amount;
        }
        
        // Facturación (Aprobado):
        // Únicamente los presupuestos aceptados
        if (presu.estado_presupuesto === "aceptado") {
          match.facturacion += amount;
        }
      }
    });

    return months;
  }, [presupuestos]);

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorFacturacion" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopColor={undefined} className="text-primary" style={{ stopColor: "var(--primary)" }} stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--primary)" stopColor={undefined} className="text-primary" style={{ stopColor: "var(--primary)" }} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPresupuestado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
            </linearGradient>
          </defs>
          {/* Grid lines adapt to Tailwind borders */}
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              borderColor: "hsl(var(--border) / 0.4)",
              borderRadius: "8px",
              color: "hsl(var(--foreground))" 
            }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
            labelStyle={{ color: "hsl(var(--muted-foreground))", fontWeight: "bold" }}
            formatter={(value: any) => [`${value.toLocaleString()} €`]}
          />
          <Area 
            type="monotone" 
            dataKey="facturacion" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorFacturacion)" 
            name="Aprobado (Facturado)"
          />
          <Area 
            type="monotone" 
            dataKey="presupuestado" 
            stroke="#a855f7" 
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fillOpacity={1} 
            fill="url(#colorPresupuestado)" 
            name="Presentado (Total)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
