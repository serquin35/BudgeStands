-- =============================================================
-- UPDATE: tarifas_macros_m2 — Descripciones reales para Jarvis
-- Reemplaza el texto genérico por descripciones comerciales
-- reales que aparecerán en los presupuestos al cliente.
-- =============================================================

-- MODULAR BAJA (minimalista)
UPDATE public.tarifas_macros_m2
SET descripcion_incluido = 'Stand modular con estructura de aluminio anodizado y paneles de melamina blanca. Moqueta ferial estándar en suelo. Iluminación LED básica con carril de 4 focos. Sin mobiliario incluido (se presupuesta aparte). Montaje y desmontaje incluidos. Ideal para primeras participaciones en feria o stands de presencia sencilla.'
WHERE tipo_proyecto = 'modular' AND nivel_densidad = 'baja_minimalista';

-- MODULAR MEDIA (estándar)
UPDATE public.tarifas_macros_m2
SET descripcion_incluido = 'Stand modular con estructura de aluminio anodizado, paneles de melamina blanca y tarima laminada. Iluminación LED con carril de 6 focos orientables. Incluye mostrador de recepción estándar, 2 sillas y papelera. Gráfica básica en panel de fondo (lona impresa). Montaje y desmontaje incluidos.'
WHERE tipo_proyecto = 'modular' AND nivel_densidad = 'media_estandar';

-- MODULAR ALTA (espectacular)
UPDATE public.tarifas_macros_m2
SET descripcion_incluido = 'Stand modular premium con estructura aluminio, paneles lacados y tarima con vinílico de diseño. Iluminación LED completa con spots orientables y tiras LED de acento. Incluye mostrador de recepción lacado, mesa de reuniones, 4 sillas de diseño y almacén cerrado. Panel backlit retroiluminado en fondo. Gráfica completa impresa. Montaje y desmontaje incluidos.'
WHERE tipo_proyecto = 'modular' AND nivel_densidad = 'alta_espectacular';

-- CARPINTERÍA DISEÑO BAJA (minimalista)
UPDATE public.tarifas_macros_m2
SET descripcion_incluido = 'Stand de carpintería a medida con diseño minimalista. Construcción en DM lacado en color corporativo, tarima laminada y revestimientos simples. Iluminación LED discreta. Sin elementos audiovisuales. Diseño limpio y funcional. Incluye planos técnicos, fabricación, montaje y desmontaje. Plazo mínimo de fabricación: 3 semanas.'
WHERE tipo_proyecto = 'carpinteria_diseno' AND nivel_densidad = 'baja_minimalista';

-- CARPINTERÍA DISEÑO MEDIA (estándar)
UPDATE public.tarifas_macros_m2
SET descripcion_incluido = 'Stand de carpintería personalizada con acabados de calidad. DM lacado en colores corporativos, tarima con vinílico o laminado de diseño. Iluminación LED con focos de carril y tiras de acento. Incluye mostrador a medida, zona de reuniones con mesa y sillas, almacén integrado y gráfica impresa de alta resolución. Diseño 3D y planos técnicos incluidos. Plazo mínimo: 3-4 semanas.'
WHERE tipo_proyecto = 'carpinteria_diseno' AND nivel_densidad = 'media_estandar';

-- CARPINTERÍA DISEÑO ALTA (espectacular)
UPDATE public.tarifas_macros_m2
SET descripcion_incluido = 'Stand de carpintería premium con diseño de alto impacto visual. Construcción a medida con materiales nobles (madera maciza, metacrilato, cristal, acero). Iluminación arquitectónica completa: focos de carril, tiras LED programables y cajas de luz retroiluminadas. Incluye mostrador premium, sala de reuniones privada, barra de atención, vitrinas de exposición y almacén. Audiovisual básico incluido. Diseño 3D con renders fotorrealistas, planos técnicos y dirección de obra. Plazo mínimo: 4-5 semanas.'
WHERE tipo_proyecto = 'carpinteria_diseno' AND nivel_densidad = 'alta_espectacular';

-- HÍBRIDO BAJO (minimalista)
UPDATE public.tarifas_macros_m2
SET descripcion_incluido = 'Stand híbrido con estructura modular de aluminio como base y elementos puntuales de carpintería para el mostrador y zona de recepción. Moqueta estándar en suelo. Iluminación LED básica. El equilibrio perfecto entre imagen y presupuesto para ferias secundarias o clientes con presencia regular en feria.'
WHERE tipo_proyecto = 'hibrido' AND nivel_densidad = 'baja_minimalista';

-- HÍBRIDO MEDIO (estándar)
UPDATE public.tarifas_macros_m2
SET descripcion_incluido = 'Stand híbrido con estructura modular de aluminio y elementos de carpintería personalizados: mostrador a medida, panel de fondo lacado y zona de reuniones. Tarima laminada, iluminación LED completa con spots y tiras. Gráfica impresa de alta resolución. El 70% del coste de un diseño completo con el 85% del impacto visual. Montaje y desmontaje incluidos.'
WHERE tipo_proyecto = 'hibrido' AND nivel_densidad = 'media_estandar';

-- HÍBRIDO ALTO (espectacular)
UPDATE public.tarifas_macros_m2
SET descripcion_incluido = 'Stand híbrido premium con estructura modular de aluminio y amplia carpintería personalizada de alto nivel. Acabados lacados, vinílicos de diseño, iluminación arquitectónica completa y elementos decorativos singulares. Incluye mostrador premium, sala de reuniones, almacén integrado, audiovisual básico y gráfica completa. Diseño 3D incluido. Opción más equilibrada para stands de 30-60m² con presupuesto optimizado.'
WHERE tipo_proyecto = 'hibrido' AND nivel_densidad = 'alta_espectacular';

-- RETAIL COMERCIAL BAJO
UPDATE public.tarifas_macros_m2
SET descripcion_incluido = 'Espacio retail o punto de venta en recinto ferial o comercial con equipamiento básico. Estructura perimetral, suelo vinílico, iluminación de exposición y mobiliario mínimo de venta. Para pop-ups, showrooms temporales y espacios de venta directa en ferias de consumo.'
WHERE tipo_proyecto = 'retail_comercial' AND nivel_densidad = 'baja_minimalista';

-- RETAIL COMERCIAL MEDIO
UPDATE public.tarifas_macros_m2
SET descripcion_incluido = 'Espacio retail completo con arquitectura interior diferenciada. Expositores y lineales de producto, iluminación de acento dirigida a producto, mostrador de caja o atención, almacén trasero y gráfica de imagen de marca. Para marcas de consumo, moda, cosmética o alimentación en ferias sectoriales.'
WHERE tipo_proyecto = 'retail_comercial' AND nivel_densidad = 'media_estandar';

-- RETAIL COMERCIAL ALTO
UPDATE public.tarifas_macros_m2
SET descripcion_incluido = 'Espacio retail de lujo con diseño interior de alto impacto. Materiales premium (madera noble, mármol técnico, cristal, acero cepillado), iluminación sofisticada y expositores a medida. Para marcas premium, joyería, perfumería, moda de lujo y experiencias de marca en ferias o eventos exclusivos. Incluye diseño de interiorismo, fabricación a medida y dirección de montaje.'
WHERE tipo_proyecto = 'retail_comercial' AND nivel_densidad = 'alta_espectacular';

-- DOBLE PLANTA BAJA
UPDATE public.tarifas_macros_m2
SET descripcion_incluido = 'Stand de dos plantas con estructura metálica autoportante certificada. Planta baja para atención y exposición, planta alta para sala de reuniones privada o almacén. Acabados funcionales sin grandes ornamentos. Requiere proyecto técnico con visado de ingeniero y aprobación del recinto (incluidos). Plazo mínimo de fabricación: 5-6 semanas. Solo para recintos que lo permitan.'
WHERE tipo_proyecto = 'doble_planta' AND nivel_densidad = 'baja_minimalista';

-- DOBLE PLANTA MEDIA
UPDATE public.tarifas_macros_m2
SET descripcion_incluido = 'Stand de dos plantas con presencia destacada en el pabellón. Estructura metálica certificada, acabados de calidad en ambas plantas, iluminación completa, sala de reuniones privada en planta alta y zona de exposición y recepción en planta baja. Incluye proyecto técnico con visado de ingeniero, planos de estructura, montaje especializado y dirección de obra. Plazo: 6-7 semanas.'
WHERE tipo_proyecto = 'doble_planta' AND nivel_densidad = 'media_estandar';

-- DOBLE PLANTA ALTA
UPDATE public.tarifas_macros_m2
SET descripcion_incluido = 'Stand de dos plantas de máximo impacto visual. Estructura metálica de diseño con acabados premium en fachada, iluminación arquitectónica espectacular, planta baja con zona de demos y recepción de lujo, planta alta con sala VIP, barra de catering y terraza perimetral. Tótem o elemento vertical de gran altura (hasta 5m). Incluye proyecto de ingeniería, renders fotorrealistas, fabricación a medida, montaje con grúa y dirección de obra. Plazo mínimo: 7-8 semanas.'
WHERE tipo_proyecto = 'doble_planta' AND nivel_densidad = 'alta_espectacular';

-- =============================================================
-- VERIFICACIÓN: comprobar que todas las descripciones 
-- son distintas y tienen contenido real
-- =============================================================
SELECT 
  tipo_proyecto,
  nivel_densidad,
  precio_venta_m2,
  margen_beneficio_sugerido,
  LEFT(descripcion_incluido, 80) AS descripcion_preview
FROM public.tarifas_macros_m2
ORDER BY tipo_proyecto, 
  CASE nivel_densidad 
    WHEN 'baja_minimalista' THEN 1 
    WHEN 'media_estandar' THEN 2 
    WHEN 'alta_espectacular' THEN 3 
  END;
