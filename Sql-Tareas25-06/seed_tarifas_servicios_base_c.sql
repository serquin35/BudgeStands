-- =============================================================
-- SEED: tarifas_servicios (Base C) — Datos de mercado reales
-- Materias primas de taller + mano de obra sector ferial España
-- Precios basados en mercado español 2025-2026
-- =============================================================

DO $$
DECLARE
  v_empresa UUID;
BEGIN
  SELECT id INTO v_empresa FROM public.empresas ORDER BY created_at LIMIT 1;
  IF v_empresa IS NULL THEN
    RAISE EXCEPTION 'No hay empresa. Créala primero.';
  END IF;
  RAISE NOTICE 'Usando empresa: %', v_empresa;

  -- Categorías usadas (según categorias_matriz del Master Doc):
  -- 1=Madera  2=Metal  3=Plástico  4=Electricidad  5=Iluminación
  -- 6=Suelos  7=Gráfica  9=Mobiliario  10=Transporte  11=Montaje  12=Servicios

  INSERT INTO public.tarifas_servicios (
    id_empresa, id_categoria_matriz,
    nombre_tecnico, descripcion_compra,
    medida_ancho_mm, medida_fondo_mm, medida_alto_mm,
    unidad_medida, precio_coste_unidad_medida,
    unidad_tiempo, precio_unidad_tiempo,
    aplica_coeficiente_desperdicio, coeficiente_desperdicio,
    requiere_homologacion_previa,
    incremento_urgencia_porcentaje,
    pedido_minimo_servicio,
    fecha_actualizacion_tarifa, estado_tarifa
  ) VALUES

  -- ── MADERA Y TABLEROS (cat 1) ─────────────────────────────

  (v_empresa, 1,
   'Tablero MDF 19mm 244x122cm',
   'Tablero de fibra de densidad media (MDF) de 19mm de espesor, formato 244x122cm. Base para carpintería de stand: paneles, mostradores, estantes. Proveedores: Finsa, Sonae, Kronospan.',
   2440, 19, 1220, 'm2', 18.50, NULL, 0,
   true, 1.12, false, 15.00, 1.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 1,
   'Tablero MDF 10mm 244x122cm',
   'Tablero MDF de 10mm, ligero y manejable. Para forros interiores, traseras de armarios y paneles finos de revestimiento.',
   2440, 10, 1220, 'm2', 11.80, NULL, 0,
   true, 1.10, false, 10.00, 1.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 1,
   'Tablero melamina blanco 19mm 244x122cm',
   'Tablero de partículas revestido en melamina blanca por ambas caras, 19mm. Para estanterías, almacenes y paneles modulares. No requiere pintado.',
   2440, 19, 1220, 'm2', 16.20, NULL, 0,
   true, 1.10, false, 10.00, 1.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 1,
   'Tablero melamina negro 19mm 244x122cm',
   'Tablero de partículas melamina negra, 19mm. Para stands de paleta oscura y acabados premium sin pintar.',
   2440, 19, 1220, 'm2', 17.50, NULL, 0,
   true, 1.10, false, 10.00, 1.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 1,
   'Tablero DM lacado blanco mate 19mm (fabricado)',
   'Tablero MDF 19mm con 2 manos de laca poliuretano blanco mate aplicadas en taller. Listo para montar. Precio incluye material y proceso de lacado.',
   2440, 19, 1220, 'm2', 38.00, NULL, 0,
   true, 1.15, false, 20.00, 1.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 1,
   'Madera maciza pino 90x20mm cepillada',
   'Listón de madera maciza de pino silvestre cepillado a 4 caras, 90x20mm. Para estructura de tarimas y bastidores internos.',
   90, 20, 0, 'ml', 3.20, NULL, 0,
   true, 1.08, false, 5.00, 10.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 1,
   'Madera maciza roble 120x20mm cepillada',
   'Listón de roble americano cepillado 120x20mm. Para elementos de carpintería vista de gama alta: estantes, perfiles decorativos, barras de degustación.',
   120, 20, 0, 'ml', 14.80, NULL, 0,
   true, 1.10, false, 20.00, 5.00,
   CURRENT_DATE, 'activa'),

  -- ── METAL Y ALUMINIO (cat 2) ──────────────────────────────

  (v_empresa, 2,
   'Perfil aluminio cuadrado 40x40mm (barra 6m)',
   'Perfil de aluminio extruido anodizado plata, sección 40x40mm, largo 6m. Para estructura de stands modulares y bastidores de paneles.',
   40, 40, 6000, 'ml', 8.40, NULL, 0,
   false, 1.00, false, 5.00, 6.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 2,
   'Chapa acero inox cepillado 1mm',
   'Chapa de acero inoxidable AISI 304 acabado cepillado, espesor 1mm. Para detalles decorativos premium, frentes de mostrador y remates.',
   1000, 1, 2000, 'm2', 42.00, NULL, 0,
   true, 1.05, false, 15.00, 0.50,
   CURRENT_DATE, 'activa'),

  (v_empresa, 2,
   'Tornillería y herrajes metálicos (estimación por m2 stand)',
   'Estimación de coste en tornillos, escuadras, tirafondos, bisagras, cierres y herrajes varios por m2 de stand construido. Incluye todos los elementos de fijación no vistos.',
   0, 0, 0, 'm2', 4.80, NULL, 0,
   false, 1.00, false, 0.00, 0.00,
   CURRENT_DATE, 'activa'),

  -- ── PLÁSTICO Y METACRILATO (cat 3) ───────────────────────

  (v_empresa, 3,
   'Metacrilato transparente 4mm 205x305cm',
   'Plancha de metacrilato (PMMA) transparente brillante 4mm, formato 205x305cm. Para separaciones, vitrinas, protecciones y elementos decorativos.',
   2050, 4, 3050, 'm2', 32.00, NULL, 0,
   true, 1.08, false, 15.00, 1.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 3,
   'Metacrilato opal blanco 3mm',
   'Plancha metacrilato opalino blanco 3mm. Para difusores de cajas de luz, paneles retroiluminados y elementos decorativos con luz LED.',
   2050, 3, 3050, 'm2', 28.50, NULL, 0,
   true, 1.08, false, 15.00, 1.00,
   CURRENT_DATE, 'activa'),

  -- ── ELECTRICIDAD (cat 4) ──────────────────────────────────

  (v_empresa, 4,
   'Cable eléctrico 3x1.5mm2 manguera',
   'Manguera eléctrica flexible 3x1.5mm², homologada. Para distribución de circuitos de iluminación en stand.',
   0, 0, 0, 'ml', 0.85, NULL, 0,
   false, 1.00, true, 10.00, 10.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 4,
   'Cuadro eléctrico de stand básico (hasta 6kW)',
   'Cuadro de distribución de stand con diferencial 40A, 2 magnetotérmicos 16A y 2 bases de enchufe. Para stands hasta 6kW.',
   0, 0, 0, 'ud', 145.00, NULL, 0,
   false, 1.00, true, 0.00, 1.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 4,
   'Carril electrificado 2m monofásico',
   'Carril monofásico de aluminio 2m para focos de carril. Incluye tapas terminales, conector de alimentación y accesorios de fijación.',
   2000, 0, 0, 'ud', 22.00, NULL, 0,
   false, 1.00, false, 0.00, 1.00,
   CURRENT_DATE, 'activa'),

  -- ── SUELOS Y REVESTIMIENTOS (cat 6) ──────────────────────

  (v_empresa, 6,
   'Moqueta ferial bucle 550g/m2',
   'Moqueta de bucle de nylon 550g/m². Colores: gris antracita, negro, rojo, azul marino, beige. Se compra por rollos de 4m de ancho. Precio coste.',
   4000, 0, 0, 'm2', 6.80, NULL, 0,
   true, 1.12, false, 5.00, 8.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 6,
   'Vinílico laminado 5mm AC4',
   'Suelo laminado vinílico de 5mm clase AC4 (uso intensivo). Varios patrones de madera y piedra. Se instala flotante sobre tarima. Precio coste.',
   0, 5, 0, 'm2', 11.20, NULL, 0,
   true, 1.08, false, 5.00, 5.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 6,
   'Cinta de doble cara para moqueta 50m',
   'Cinta doble cara reforzada específica para fijación de moqueta ferial en pavimento. Rollo 50m x 50mm.',
   50, 0, 0, 'ud', 12.50, NULL, 0,
   false, 1.00, false, 0.00, 1.00,
   CURRENT_DATE, 'activa'),

  -- ── GRÁFICA E IMPRESIÓN (cat 7) ──────────────────────────

  (v_empresa, 7,
   'Lona frontlit 440g impresión digital m2',
   'Impresión digital en lona frontlit 440g/m² en alta resolución (1440dpi). Incluye ojales. Precio coste de impresión (no incluye instalación).',
   0, 0, 0, 'm2', 7.50, NULL, 0,
   true, 1.05, false, 10.00, 2.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 7,
   'Vinilo adhesivo impreso laminado mate m2',
   'Impresión en vinilo autoadhesivo con laminado mate antirreflectante. Para vinilos de pared, vidrios y mobiliario. Precio coste impresión.',
   0, 0, 0, 'm2', 9.80, NULL, 0,
   true, 1.05, false, 10.00, 1.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 7,
   'Tela para caja de luz (lona tensada siliconada)',
   'Tela impresa por sublimación 210g/m² con perfil de silicona para sistemas de tela tensada frameless. Precio coste impresión.',
   0, 0, 0, 'm2', 18.50, NULL, 0,
   true, 1.06, false, 15.00, 1.00,
   CURRENT_DATE, 'activa'),

  -- ── PINTURAS Y ACABADOS (cat 1 — proceso taller) ─────────

  (v_empresa, 1,
   'Laca poliuretano blanco mate (proceso completo)',
   'Proceso completo de lacado en blanco mate: imprimación, lijado, 2 manos de laca PU. Precio por m2 de superficie a lacar en taller. Incluye material y mano de obra de taller.',
   0, 0, 0, 'm2', 22.00, NULL, 0,
   false, 1.00, false, 25.00, 0.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 1,
   'Laca poliuretano color RAL (proceso completo)',
   'Proceso de lacado en color RAL a elegir: imprimación, lijado, 2 manos de laca PU color. Precio m2 en taller. Incluye material y mano de obra.',
   0, 0, 0, 'm2', 26.50, NULL, 0,
   false, 1.00, false, 25.00, 0.00,
   CURRENT_DATE, 'activa'),

  -- ── MANO DE OBRA (cat 11) ─────────────────────────────────

  (v_empresa, 11,
   'Oficial carpintero 1ª — hora taller',
   'Hora de trabajo de oficial de 1ª de carpintería en taller. Incluye cargas sociales y coste empresa. Convenio Colectivo Madera 2025.',
   0, 0, 0, 'ud', 0, 'hora', 32.00,
   false, 1.00, false, 20.00, 0.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 11,
   'Oficial carpintero 1ª — jornada montaje en recinto',
   'Jornada completa (8h) de oficial de 1ª en recinto ferial. Incluye desplazamiento local, dietas y cargas sociales. Para Madrid/Barcelona.',
   0, 0, 0, 'ud', 0, 'dia_montaje', 320.00,
   false, 1.00, true, 20.00, 0.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 11,
   'Ayudante carpintero — hora taller',
   'Hora de ayudante de carpintería en taller. Tareas de apoyo, lijado, ensamblaje y embalaje. Convenio Colectivo Madera 2025.',
   0, 0, 0, 'ud', 0, 'hora', 22.00,
   false, 1.00, false, 15.00, 0.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 11,
   'Ayudante carpintero — jornada montaje en recinto',
   'Jornada completa (8h) de ayudante en recinto ferial. Para apoyo en montaje y desmontaje. Incluye desplazamiento y dietas.',
   0, 0, 0, 'ud', 0, 'dia_montaje', 220.00,
   false, 1.00, true, 15.00, 0.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 11,
   'Electricista autónomo — hora en recinto',
   'Hora de electricista autónomo especializado en instalaciones feriales. Certificado CAE obligatorio. Para cuadros, cableado y conexiones en stand.',
   0, 0, 0, 'ud', 0, 'hora', 45.00,
   false, 1.00, true, 20.00, 0.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 11,
   'Jefe de obra / Director de montaje — jornada',
   'Jornada completa (8-10h) de jefe de obra en recinto ferial. Coordinación, supervisión y firma de documentación técnica ante el recinto.',
   0, 0, 0, 'ud', 0, 'dia_montaje', 380.00,
   false, 1.00, true, 15.00, 0.00,
   CURRENT_DATE, 'activa'),

  -- ── TRANSPORTE (cat 10) ───────────────────────────────────

  (v_empresa, 10,
   'Furgoneta 2t — jornada transporte local',
   'Alquiler con conductor de furgoneta de 2 toneladas para transporte de materiales. Hasta 200km. Para stands pequeños o materiales de refuerzo.',
   0, 0, 0, 'ud', 0, 'dia_montaje', 280.00,
   false, 1.00, false, 30.00, 0.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 10,
   'Camión 7t — jornada transporte peninsular',
   'Alquiler con conductor de camión 7 toneladas para transporte de stand completo. Hasta 500km. Para stands medianos 20-40m2.',
   0, 0, 0, 'ud', 0, 'dia_montaje', 680.00,
   false, 1.00, false, 25.00, 0.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 10,
   'Camión 12t — jornada transporte peninsular',
   'Camión 12 toneladas con conductor para stands grandes. Hasta 700km. Para stands de 40m2 o más y proyectos de doble planta.',
   0, 0, 0, 'ud', 0, 'dia_montaje', 980.00,
   false, 1.00, false, 20.00, 0.00,
   CURRENT_DATE, 'activa'),

  -- ── DIETAS Y DESPLAZAMIENTO (cat 15) ─────────────────────

  (v_empresa, 15,
   'Dieta completa operario desplazado',
   'Dieta completa por día de operario desplazado fuera de su localidad habitual. Incluye alojamiento + manutención según convenio colectivo.',
   0, 0, 0, 'ud', 0, 'dia_montaje', 85.00,
   false, 1.00, false, 0.00, 0.00,
   CURRENT_DATE, 'activa'),

  (v_empresa, 15,
   'Kilometraje vehículo propio operario',
   'Coste por km recorrido en vehículo propio de operario para desplazamiento a recinto ferial. Tarifa Hacienda 2025.',
   0, 0, 0, 'ml', 0.26, NULL, 0,
   false, 1.00, false, 0.00, 0.00,
   CURRENT_DATE, 'activa');

  RAISE NOTICE '✅ Base C seed completado para empresa: %', v_empresa;

END $$;

-- Verificación
SELECT 
  cm.nombre AS categoria,
  COUNT(ts.id) AS tarifas,
  MIN(ts.precio_coste_unidad_medida) FILTER (WHERE ts.precio_coste_unidad_medida > 0) AS coste_min,
  MAX(ts.precio_coste_unidad_medida) FILTER (WHERE ts.precio_coste_unidad_medida > 0) AS coste_max
FROM public.tarifas_servicios ts
JOIN public.categorias_matriz cm ON cm.id = ts.id_categoria_matriz
GROUP BY cm.nombre, cm.id
ORDER BY cm.id;
