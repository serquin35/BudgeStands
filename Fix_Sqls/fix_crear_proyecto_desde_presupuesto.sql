-- Corrección de la función crear_proyecto_desde_presupuesto
-- Evita errores al aceptar presupuestos que no tienen fecha de feria definida (NULL)
-- Evita errores de clave única duplicada si un presupuesto se vuelve a aceptar

CREATE OR REPLACE FUNCTION public.crear_proyecto_desde_presupuesto()
RETURNS trigger AS $$
DECLARE
  v_proyecto_id UUID;
  v_fecha_feria DATE;
  v_codigo_proyecto TEXT;
BEGIN
  IF NEW.estado_presupuesto = 'aceptado' AND OLD.estado_presupuesto != 'aceptado' THEN
    -- 1. Registrar fecha de aceptación
    NEW.fecha_aceptacion = NOW();
    
    -- 2. Comprobar si ya existe un proyecto para este presupuesto (evitar error UNIQUE)
    SELECT id INTO v_proyecto_id 
    FROM public.proyectos_operaciones 
    WHERE id_presupuesto = NEW.id;

    -- Si no existe, creamos el proyecto y sus hitos correspondientes
    IF v_proyecto_id IS NULL THEN
      -- Generar código de proyecto basado en el número de presupuesto
      v_codigo_proyecto := REPLACE(NEW.numero_presupuesto, 'PRES', 'OP');
      IF v_codigo_proyecto = NEW.numero_presupuesto THEN
        v_codigo_proyecto := 'OP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('presupuestos_seq')::TEXT, 4, '0');
      END IF;

      -- Crear Proyecto
      INSERT INTO public.proyectos_operaciones
        (id_empresa, id_presupuesto, codigo_proyecto_interno)
      VALUES
        (NEW.id_empresa, NEW.id, v_codigo_proyecto)
      RETURNING id INTO v_proyecto_id;
      
      -- 3. Obtener la fecha de la feria (con fallback robusto por si es NULL)
      v_fecha_feria := NEW.fecha_inicio_feria;
      IF v_fecha_feria IS NULL THEN
        -- Fallback: hoy + 30 días para evitar violar la restricción NOT NULL de fecha_programada
        v_fecha_feria := (NOW() + INTERVAL '30 days')::DATE;
      END IF;

      -- Crear Hitos Operacionales por Defecto
      INSERT INTO public.proyectos_hitos (id_proyecto, tipo_hito, fecha_programada) VALUES
        (v_proyecto_id, 'cobro_anticipo',       v_fecha_feria - INTERVAL '30 days'),
        (v_proyecto_id, 'compra_materiales',    v_fecha_feria - INTERVAL '21 days'),
        (v_proyecto_id, 'cae_seguridad',        v_fecha_feria - INTERVAL '14 days'),
        (v_proyecto_id, 'inicio_fabricacion',   v_fecha_feria - INTERVAL '14 days'),
        (v_proyecto_id, 'reserva_logistica',    v_fecha_feria - INTERVAL '7 days'),
        (v_proyecto_id, 'fecha_carga',          v_fecha_feria - INTERVAL '2 days'),
        (v_proyecto_id, 'fecha_montaje',        v_fecha_feria),
        (v_proyecto_id, 'fecha_cobro_final',    v_fecha_feria + INTERVAL '15 days');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
