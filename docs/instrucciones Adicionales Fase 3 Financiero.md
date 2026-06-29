# The Titan — Documento Técnico Fase 3
## Módulo Financiero — Gaps y Reglas de Negocio
## Instrucciones para Antigravity

> Leer antes de implementar cualquier sprint del módulo financiero.
> Este documento complementa el plan de Fase 3 ya aprobado.
> Fuente de verdad: Plan-Maestro.md + este documento.

---

## GAP 1 — Generación automática del número de factura

### Problema
El formulario de crear factura necesita asignar `numero_factura_legal` automáticamente. El plan no especifica cómo generarlo. El formato definido en el Master Doc es `F26-NNNN` (año 2 dígitos + número correlativo de 4 dígitos por empresa y año).

### Solución: función SQL en Supabase

Ejecutar en el SQL Editor de Supabase **antes de implementar el Sprint 1**:

```sql
CREATE OR REPLACE FUNCTION public.generar_numero_factura(p_id_empresa UUID)
RETURNS TEXT AS $$
DECLARE
  v_año TEXT := TO_CHAR(NOW(), 'YY');
  v_contador INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_contador
  FROM public.facturas_proyectos fp
  JOIN public.proyectos_operaciones po ON po.id = fp.id_proyecto
  WHERE po.id_empresa = p_id_empresa
  AND EXTRACT(YEAR FROM fp.fecha_emision) = EXTRACT(YEAR FROM NOW());
  
  RETURN 'F' || v_año || '-' || LPAD(v_contador::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
```

### Cómo usarla en el frontend

Al abrir el formulario de nueva factura, llamar a la función para pre-rellenar el campo:

```typescript
const generarNumeroFactura = async (idEmpresa: string): Promise<string> => {
  const { data, error } = await supabase
    .rpc('generar_numero_factura', { p_id_empresa: idEmpresa });
  
  if (error) throw error;
  return data; // Ej: "F26-0001"
};

// En el componente, al montar el formulario:
useEffect(() => {
  generarNumeroFactura(empresaId).then(setNumeroFactura);
}, []);
```

El campo `numero_factura_legal` debe mostrarse pre-rellenado y ser editable por si el admin necesita corregirlo.

---

## GAP 2 — Validación: no superar el 100% facturado por proyecto

### Problema
Un proyecto tiene un presupuesto total. La suma de todos los porcentajes de las facturas emitidas no puede superar el 100%. Sin esta validación, se podría facturar 50% + 60% = 110%, lo cual es un error grave.

### Regla de negocio
El flujo estándar es: **50% anticipo + 50% factura final = 100%**. Pero el porcentaje es configurable por proyecto.

### Implementación en el formulario de crear factura

```typescript
const validarPorcentajeFactura = async (
  idProyecto: string,
  nuevoPorcentaje: number
): Promise<{ valido: boolean; pctYaFacturado: number }> => {
  
  const { data: facturasExistentes } = await supabase
    .from('facturas_proyectos')
    .select('porcentaje_facturado')
    .eq('id_proyecto', idProyecto)
    .neq('tipo_factura', 'rectificativa'); // Las rectificativas no cuentan

  const pctYaFacturado = facturasExistentes
    ?.reduce((sum, f) => sum + Number(f.porcentaje_facturado), 0) ?? 0;

  return {
    valido: pctYaFacturado + nuevoPorcentaje <= 100,
    pctYaFacturado
  };
};

// En el submit del formulario:
const handleSubmit = async (formData: FacturaFormData) => {
  const { valido, pctYaFacturado } = await validarPorcentajeFactura(
    formData.id_proyecto,
    formData.porcentaje_facturado
  );

  if (!valido) {
    toast.error(
      `Ya has facturado el ${pctYaFacturado}% de este proyecto. ` +
      `El porcentaje máximo que puedes añadir es ${100 - pctYaFacturado}%.`
    );
    return;
  }

  // Continuar con el INSERT...
};
```

### Cálculo automático del importe

El importe de la factura se calcula automáticamente desde el porcentaje:

```typescript
// Al cambiar el porcentaje en el formulario
const calcularImporte = (
  totalPresupuesto: number,
  porcentaje: number
): { baseImponible: number; iva: number; total: number } => {
  const baseImponible = Number(((totalPresupuesto / 1.21) * (porcentaje / 100)).toFixed(2));
  const iva = Number((baseImponible * 0.21).toFixed(2));
  const total = Number((baseImponible + iva).toFixed(2));
  return { baseImponible, iva, total };
};
```

Nota: `totalPresupuesto` en la tabla `presupuestos_cabecera` ya incluye IVA. Dividir entre 1.21 para obtener la base imponible.

---

## GAP 3 — Regla de cliente bloqueado por impago

### Problema
El Master Doc define que cuando una factura se marca como `impagada_vencida`, el sistema debe ofrecer al administrador bloquear al cliente para impedir nuevos presupuestos. Esta regla no está en el plan de Fase 3.

### Implementación

```typescript
const marcarFacturaImpagada = async (
  facturaId: string,
  idProyecto: string
) => {
  // 1. Actualizar estado de la factura
  const { error } = await supabase
    .from('facturas_proyectos')
    .update({ estado_cobro: 'impagada_vencida' })
    .eq('id', facturaId);

  if (error) {
    toast.error('Error al actualizar la factura');
    return;
  }

  toast.warning('Factura marcada como impagada');

  // 2. Solo el rol 'admin' puede bloquear clientes
  if (userRol !== 'admin') return;

  // 3. Obtener el cliente del proyecto
  const { data: proyecto } = await supabase
    .from('proyectos_operaciones')
    .select('presupuestos_cabecera(id_cliente)')
    .eq('id', idProyecto)
    .single();

  const idCliente = proyecto?.presupuestos_cabecera?.id_cliente;
  if (!idCliente) return;

  // 4. Mostrar diálogo de confirmación para bloquear cliente
  // Usar el sistema de diálogos del proyecto (shadcn/ui AlertDialog)
  const confirmar = await mostrarDialogoConfirmacion({
    titulo: '¿Bloquear cliente?',
    descripcion: 'Esta factura está impagada. ¿Deseas bloquear al cliente ' +
                 'para impedir la creación de nuevos presupuestos?',
    textoConfirmar: 'Sí, bloquear cliente',
    textoCancelar: 'No, solo marcar impagada',
    variante: 'destructive'
  });

  if (confirmar) {
    await supabase
      .from('clientes')
      .update({ estado_cliente: 'bloqueado_impagos' })
      .eq('id', idCliente);

    toast.error('Cliente bloqueado. No se podrán crear nuevos presupuestos.');
  }
};
```

### Dónde mostrar el botón "Marcar impagada"

Solo visible cuando:
- `estado_cobro === 'pendiente_cobro'`
- `fecha_vencimiento < hoy` (factura vencida)
- `userRol === 'admin'`

---

## REGLAS ADICIONALES de negocio para el módulo financiero

### Fechas de vencimiento automáticas

Al crear una factura, calcular `fecha_vencimiento` automáticamente según el `plazo_pago_dias` del cliente:

```typescript
const calcularFechaVencimiento = (
  fechaEmision: Date,
  plazoPagoDias: number
): Date => {
  const fecha = new Date(fechaEmision);
  fecha.setDate(fecha.getDate() + plazoPagoDias);
  return fecha;
};

// Al crear la factura, leer el plazo del cliente:
const { data: cliente } = await supabase
  .from('clientes')
  .select('plazo_pago_dias')
  .eq('id', idCliente)
  .single();

const fechaVencimiento = calcularFechaVencimiento(
  new Date(),
  cliente?.plazo_pago_dias ?? 30
);
```

### Semáforo de estado en la tabla de facturas

```typescript
const getBadgeFactura = (factura: FacturaProyecto) => {
  if (factura.estado_cobro === 'cobrada') 
    return { color: 'green', label: 'Cobrada' };
  
  if (factura.estado_cobro === 'impagada_vencida') 
    return { color: 'red', label: 'Impagada' };
  
  const hoy = new Date();
  const vencimiento = new Date(factura.fecha_vencimiento);
  const diasRestantes = Math.ceil(
    (vencimiento.getTime() - hoy.getTime()) / 86400000
  );
  
  if (diasRestantes < 0)  return { color: 'red',    label: 'Vencida'         };
  if (diasRestantes <= 7) return { color: 'yellow',  label: `Vence en ${diasRestantes}d` };
  return { color: 'blue', label: 'Pendiente' };
};
```

### Fórmulas de cierre de proyecto (Sprint 4)

Al abrir el modal de cierre, calcular automáticamente desde la DB:

```typescript
const calcularCierreProyecto = async (idProyecto: string) => {
  // Ingresos reales: suma de facturas cobradas
  const { data: facturasCobradas } = await supabase
    .from('facturas_proyectos')
    .select('total_factura_bruto')
    .eq('id_proyecto', idProyecto)
    .eq('estado_cobro', 'cobrada');

  const ingresoReal = facturasCobradas
    ?.reduce((sum, f) => sum + Number(f.total_factura_bruto), 0) ?? 0;

  // Gastos reales: suma de líneas de facturas de proveedores imputadas
  const { data: lineasGasto } = await supabase
    .from('facturas_proveedores_lineas')
    .select('total_linea_coste')
    .eq('id_proyecto', idProyecto);

  const gastoReal = lineasGasto
    ?.reduce((sum, l) => sum + Number(l.total_linea_coste), 0) ?? 0;

  const margenBruto = ingresoReal - gastoReal;
  const margenPct = ingresoReal > 0 
    ? Number(((margenBruto / ingresoReal) * 100).toFixed(2)) 
    : 0;

  return { ingresoReal, gastoReal, margenBruto, margenPct };
};
```

Estos valores se muestran en el modal y son **de solo lectura** — calculados automáticamente. Solo son editables `valoracion_cliente` y `lecciones_aprendidas`.

### Webhook al cerrar proyecto

Al confirmar el cierre, disparar el webhook de n8n para indexar en Qdrant:

```typescript
// DESPUÉS del INSERT en cierres_proyectos
await fetch('/api/sync/proyecto-cerrado', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id_proyecto: idProyecto })
});
```

Usar la API Route `/api/sync/proyecto-cerrado` ya existente (creada en Fase 2 para evitar CORS).

---

## Tipos TypeScript a añadir en `types/index.ts`

```typescript
export interface FacturaProyecto {
  id: string;
  id_proyecto: string;
  numero_factura_legal: string;
  tipo_factura: 'anticipo' | 'final' | 'rectificativa';
  porcentaje_facturado: number;
  base_imponible: number;
  porcentaje_iva: number;
  importe_iva: number;
  total_factura_bruto: number;
  estado_cobro: 'pendiente_cobro' | 'cobrada' | 'impagada_vencida';
  fecha_emision: string;
  fecha_vencimiento: string;
  fecha_cobro_real?: string;
  notas?: string;
  pdf_url?: string;
}

export interface FacturaProveedorCabecera {
  id: string;
  id_empresa: string;
  id_proveedor: string;
  numero_factura_proveedor: string;
  fecha_emision: string;
  fecha_recepcion: string;
  fecha_vencimiento: string;
  base_imponible: number;
  importe_iva: number;
  total_factura_bruto: number;
  estado_pago: 'pendiente' | 'pagada' | 'disputa_bloqueada';
  metodo_pago: 'transferencia' | 'confirming' | 'tarjeta' | 'girado';
  pdf_url?: string;
  notas?: string;
  // Joins
  proveedores?: { nombre_comercial: string; razon_social: string };
  lineas?: FacturaProveedorLinea[];
}

export interface FacturaProveedorLinea {
  id: string;
  id_factura_proveedor: string;
  id_proyecto?: string;
  id_categoria_matriz?: number;
  descripcion_articulo: string;
  cantidad: number;
  unidad?: string;
  precio_unitario_coste: number;
  total_linea_coste: number;
}

export interface CierreProyecto {
  id: string;
  id_proyecto: string;
  ingreso_total_real: number;
  gasto_total_real: number;
  margen_bruto_real: number;
  margen_real_porcentaje: number;
  presupuesto_original: number;
  desviacion_beneficio_porcentaje: number;
  valoracion_cliente?: 1 | 2 | 3 | 4 | 5;
  lecciones_aprendidas?: string;
  fecha_cierre_oficial: string;
}
```

## Constantes a añadir en `constants/index.ts`

```typescript
export const ESTADO_COBRO = {
  PENDIENTE: 'pendiente_cobro',
  COBRADA: 'cobrada',
  IMPAGADA: 'impagada_vencida'
} as const;

export const ESTADO_PAGO_PROVEEDOR = {
  PENDIENTE: 'pendiente',
  PAGADA: 'pagada',
  DISPUTA: 'disputa_bloqueada'
} as const;

export const TIPO_FACTURA = {
  ANTICIPO: 'anticipo',
  FINAL: 'final',
  RECTIFICATIVA: 'rectificativa'
} as const;

// Umbrales para alertas de vencimiento
export const ALERTA_VENCIMIENTO_DIAS = 7;

// Porcentajes estándar de facturación
export const PCT_ANTICIPO_DEFAULT = 50;
export const PCT_FINAL_DEFAULT = 50;
```

---

*Documento generado el 29/06/2026 — The Titan arquitectura v1.0*
*Ejecutar el SQL de GAP 1 en Supabase antes de iniciar Sprint 1*
