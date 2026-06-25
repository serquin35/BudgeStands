export const ESTADO_PRESUPUESTO = {
  BORRADOR: "borrador",
  EN_ESPERA: "en_espera",
  PRESENTADO: "presentado",
  EN_NEGOCIACION: "en_negociacion",
  ACEPTADO: "aceptado",
  RECHAZADO: "rechazado",
  CANCELADO: "cancelado",
} as const

export const METODO_PRESUPUESTACION = {
  MACRO: "metodo_1_macro",
  BLOQUES: "metodo_2_bloques",
  DESPIECE: "metodo_3_despiece",
  COMBINADO: "combinado",
} as const

export const TIPO_STAND = {
  MODULAR: "modular",
  CARPINTERIA: "carpinteria_diseno",
  HIBRIDO: "hibrido",
  RETAIL: "retail_comercial",
  DOBLE_PLANTA: "doble_planta",
} as const

export const ROL_USUARIO = {
  ADMIN: "admin",
  COMERCIAL: "comercial",
  DIRECTOR_OBRA: "director_obra",
  TALLER: "taller",
  CONTABILIDAD: "contabilidad",
} as const

export const TIPO_STAND_LIST = ["modular", "carpinteria_diseno", "hibrido", "retail_comercial", "doble_planta"] as const
export const NIVEL_DENSIDAD_LIST = ["baja_minimalista", "media_estandar", "alta_espectacular"] as const
export const ESPECIALIDADES_LIST = [
  "Carpintería",
  "Iluminación y Electricidad",
  "Rotulación e Impresión",
  "Mobiliario",
  "Audiovisuales",
  "Logística y Transporte",
  "Servicios de Feria",
  "Varios",
] as const

export const IVA_DEFAULT = 21.00
export const NUMERO_PRESUPUESTO_PREFIX = "PRES"
export const NUMERO_PROYECTO_PREFIX = "OP"

export const KANBAN_COLUMNAS = [
  { id: "pendiente",   label: "Pendiente",   color: "gray"   },
  { id: "diseno",      label: "Diseño",      color: "blue"   },
  { id: "fabricacion", label: "Fabricación", color: "yellow" },
  { id: "montaje",     label: "Montaje",     color: "purple" },
  { id: "finalizado",  label: "Finalizado",  color: "green"  },
] as const
