-- =============================================================
-- FIX: Triggers updated_at faltantes
-- Añade los 3 triggers que faltan para mantener consistencia
-- =============================================================

-- La función set_updated_at() ya existe, solo añadimos los triggers

-- 1. presupuestos_lineas (solo tenía trg_linea_total, no updated_at)
CREATE TRIGGER trg_presupuestos_lineas_upd
  BEFORE UPDATE ON public.presupuestos_lineas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. facturas_proyectos
CREATE TRIGGER trg_facturas_proyectos_upd
  BEFORE UPDATE ON public.facturas_proyectos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. facturas_proveedores_cabecera
CREATE TRIGGER trg_facturas_prov_cab_upd
  BEFORE UPDATE ON public.facturas_proveedores_cabecera
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- VERIFICACIÓN: confirmar que todos los triggers están
-- =============================================================
SELECT 
  event_object_table AS tabla,
  trigger_name,
  event_manipulation AS evento
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
