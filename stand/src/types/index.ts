export interface Cliente {
  id: string
  razon_social: string
  nombre_comercial: string
  cif_nif: string
  domicilio_fiscal: string
  nombre_contacto_principal: string
  email_contacto: string
  telefono_contacto: string
  sector_industrial: string
  web_cliente: string
  recinto_ferial_habitual: string
  estado_cliente: "activo" | "bloqueado_impagos" | "inactivo"
  forma_pago_habitual: "transferencia" | "confirming" | "pagare" | "tarjeta"
  plazo_pago_dias: number
  tarifa_asignada: "estandar" | "premium" | "distribuidor"
}

export interface ClienteBasico {
  id: string
  nombre_comercial: string
}

export interface Presupuesto {
  id: string
  numero_presupuesto: string
  nombre_feria: string
  m2_superficie: number
  altura_stand_m: number
  tipo_stand: string
  total_presupuesto: number
  estado_presupuesto: string
  created_at: string
  clientes?: {
    nombre_comercial: string
  }
}

export interface PresupuestoLinea {
  id: string
  orden: number
  concepto_descripcion: string
  cantidad: number
  unidad: string
  precio_unitario_venta: number
  total_linea: number
}

export interface Proveedor {
  id: string
  razon_social: string
  nombre_comercial: string
  cif_nif: string
  domicilio_fiscal: string
  email_contacto: string
  telefono_contacto: string
  nombre_contacto: string
  especialidad: string
  categorias_suministro: string[]
  forma_pago: string
  plazo_pago_dias: number
}

export interface TarifaMacro {
  id: string
  tipo_proyecto: "modular" | "carpinteria_diseno" | "hibrido" | "retail_comercial" | "doble_planta"
  nivel_densidad: "baja_minimalista" | "media_estandar" | "alta_espectacular"
  precio_venta_m2: number
  margen_beneficio_sugerido: number
  descripcion_incluido: string
}

export interface ElementoCatalogo {
  id: string
  codigo_sku: string
  nombre_elemento: string
  id_categoria_matriz: number
  descripcion_comercial: string
  ancho_estandar_mm: number
  fondo_estandar_mm: number
  alto_estandar_mm: number
  unidad_medida_bloque: "ud" | "ml" | "m2"
  precio_venta_unidad: number
}

export interface TarifaServicio {
  id: string
  id_categoria_matriz: number
  id_subcategoria_matriz: number | null
  nombre_tecnico: string
  descripcion_compra: string
  medida_ancho_mm: number
  medida_fondo_mm: number
  medida_alto_mm: number
  unidad_medida: "m2" | "ml" | "ud" | "kg" | "l"
  precio_coste_unidad_medida: number
  unidad_tiempo: "hora" | "dia_montaje" | "dia_feria" | "evento_completo" | null
  precio_unidad_tiempo: number
  rendimiento_mecanico_hora: number
  aplica_coeficiente_desperdicio: boolean
  coeficiente_desperdicio: number
  estado_tarifa: "activa" | "inactiva"
}

export interface CategoriaMatriz {
  id: number
  nombre_categoria: string
}

export type EstadoProyecto =
  | "pendiente"
  | "diseno"
  | "fabricacion"
  | "montaje"
  | "finalizado"
  | "cancelado"

export interface ProyectoOperacion {
  id: string
  id_empresa: string
  id_presupuesto: string
  codigo_proyecto_interno: string
  fecha_creacion_proyecto: string
  id_director_obra: string | null
  estado_proyecto: EstadoProyecto
  notas_produccion: string | null
  created_at: string
  updated_at: string
  presupuestos_cabecera?: {
    nombre_feria: string | null
    recinto_ferial: string | null
    fecha_inicio_feria: string | null
    total_presupuesto: number | null
    imagen_stand_url: string | null
  } | null
}
