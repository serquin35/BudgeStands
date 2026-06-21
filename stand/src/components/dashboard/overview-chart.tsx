"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const mockData = [
  { name: "Ene", facturacion: 12000, presupuestado: 35000 },
  { name: "Feb", facturacion: 45000, presupuestado: 60000 },
  { name: "Mar", facturacion: 78000, presupuestado: 95000 },
  { name: "Abr", facturacion: 35000, presupuestado: 110000 },
  { name: "May", facturacion: 90992, presupuestado: 145000 },
  { name: "Jun", facturacion: 0, presupuestado: 248165 },
]

export default function OverviewChart() {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={mockData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorFacturacion" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPresupuestado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#71717a" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#09090b", 
              borderColor: "#27272a",
              borderRadius: "8px",
              color: "#fafafa" 
            }}
            formatter={(value: any) => [`${value.toLocaleString()} €`]}
          />
          <Area 
            type="monotone" 
            dataKey="facturacion" 
            stroke="#6366f1" 
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
