-- ==========================================================
-- SEED v3: catalogo_elementos — The Titan / BudgeStands
-- Fixes:
--   ✅ Auto-detect empresa UUID (sin reemplazar manualmente)
--   ✅ IDs de categoría hardcodeados del Master Doc (sin buscar por nombre)
--   ✅ ON CONFLICT idempotente (seguro ejecutar varias veces)
--   ✅ unidad_medida_bloque solo usa: 'ud' | 'ml' | 'm2' (respeta el CHECK)
--
-- IDs categorias_matriz (Master Doc):
--   1=Madera  2=Metal  3=Plástico  4=Electricidad  5=Iluminación
--   6=Suelos  7=Gráfica  8=Audiovisual  9=Mobiliario  10=Transporte
--   11=Montaje  12=Servicios Feria  13=Seguridad  14=Diseño  15=Varios
-- ==========================================================

DO $$
DECLARE
  v_empresa UUID;
BEGIN

  -- Auto-detect: usa la primera empresa creada
  SELECT id INTO v_empresa FROM public.empresas ORDER BY created_at LIMIT 1;
  IF v_empresa IS NULL THEN
    RAISE EXCEPTION 'No hay ninguna empresa en la tabla empresas. Créala primero.';
  END IF;
  RAISE NOTICE 'Usando empresa ID: %', v_empresa;

  INSERT INTO public.catalogo_elementos (
    id_empresa, codigo_sku, nombre_elemento, id_categoria_matriz,
    descripcion_comercial,
    ancho_estandar_mm, fondo_estandar_mm, alto_estandar_mm,
    unidad_medida_bloque, precio_venta_unidad, estado_elemento
  ) VALUES

  -- ── MADERA Y CARPINTERÍA (cat 1) ─────────────────────────
  (v_empresa,'EST-MOD-001','Panel modular melamina blanca 100x250cm',1,
   'Panel de cierre modular en melamina blanca 100x250cm. Incluye perfiles aluminio y herrajes de unión. Para stand tipo modular estándar.',
   1000,30,2500,'ud',85.00,true),

  (v_empresa,'EST-MOD-002','Panel modular melamina blanca 50x250cm',1,
   'Media panel melamina blanca 50x250cm. Para esquinas y ajustes de módulo.',
   500,30,2500,'ud',48.00,true),

  (v_empresa,'EST-CAR-001','Pared carpintería lacada blanca',1,
   'Pared de carpintería en DM lacado blanco mate. Incluye estructura de madera, DM 16mm y acabado pintura al agua. Precio por m².',
   0,0,0,'m2',320.00,true),

  (v_empresa,'EST-CAR-002','Mostrador curvo carpintería lacado 3ml',1,
   'Mostrador curvo 3ml en DM lacado blanco mate. Alto 110cm, fondo 60cm. Interior con baldas y salida de cables.',
   3000,600,1100,'ud',1850.00,true),

  (v_empresa,'EST-CAR-003','Mostrador recto carpintería lacado 2ml',1,
   'Mostrador recto 2ml en DM lacado blanco mate. Alto 110cm, fondo 60cm. Con baldas interiores.',
   2000,600,1100,'ud',1100.00,true),

  (v_empresa,'EST-CAR-004','Pared backlit retroiluminada 100x250cm',1,
   'Caja de luz con perfil aluminio extruido y lona tensada por silicona. LED uniforme. Para fondos corporativos.',
   1000,120,2500,'ud',420.00,true),

  (v_empresa,'EST-CAR-005','Pared backlit retroiluminada 200x250cm',1,
   'Caja de luz doble anchura con LED alto brillo. Para cabeceras de stand y fondos de escenario.',
   2000,120,2500,'ud',780.00,true),

  (v_empresa,'MOB-ARM-001','Almacén modular 2x2m con puerta y cerradura',1,
   'Almacén cerrado 2x2m con puerta, cerradura, balda interior e iluminación LED. Estructura tablero DM lacado blanco.',
   2000,2000,2500,'ud',680.00,true),

  (v_empresa,'MOB-ARM-002','Almacén carpintería 3x2m puerta invisible',1,
   'Almacén carpintería 3x2m con puerta invisible sin marcos visibles y cerradura embutir. Exterior con misma gráfica del stand.',
   3000,2000,2500,'ud',1250.00,true),

  (v_empresa,'MOB-LAM-001','Lamas separadoras madera pino natural',1,
   'Lamas de madera de pino natural 10cm de ancho con separación 5cm entre lamas. Para divisiones semiprivadas. Precio por metro lineal (h=2.5m).',
   0,80,2500,'ml',145.00,true),

  -- ── METAL Y ALUMINIO / TRUSS (cat 2) ────────────────────
  (v_empresa,'MET-TRU-001','Truss cuadrado 6x6m con suspensión',2,
   'Estructura de truss aluminio cuadrado 200x200mm, configuración 6x6m con accesorios de suspensión al techo del recinto. Incluye montaje y desmontaje.',
   6000,6000,500,'ud',2200.00,true),

  (v_empresa,'MET-TRU-002','Truss cuadrado 9x9m con suspensión',2,
   'Truss aluminio 9x9m con suspensión al techo. Para stands de gran formato e isla.',
   9000,9000,500,'ud',3800.00,true),

  (v_empresa,'MET-TRU-003','Torre truss vertical 4m para rótulo',2,
   'Torre truss vertical 4m para soporte de rótulo o bandera. Base lastre incluida.',
   300,300,4000,'ud',450.00,true),

  (v_empresa,'MET-EST-001','Estructura tubular aluminio 3x3m',2,
   'Módulo de exposición en perfil aluminio anodizado 40x40mm, 3x3m x 2,5m altura. Base con pies regulables.',
   3000,3000,2500,'ud',380.00,true),

  (v_empresa,'MET-EST-002','Estructura tubular aluminio 6x3m',2,
   'Módulo doble aluminio anodizado, 6x3m x 2,5m altura. Para stands con dos frentes o isla pequeña.',
   6000,3000,2500,'ud',680.00,true),

  -- ── ILUMINACIÓN (cat 5) ──────────────────────────────────
  (v_empresa,'ILU-FOC-001','Foco LED orientable carril 30W',5,
   'Foco LED orientable 30W montado en carril. 3000K o 4000K. Flujo 2700lm. Para iluminación general y de acento.',
   120,120,200,'ud',48.00,true),

  (v_empresa,'ILU-FOC-002','Foco LED PAR 56 para truss 75W RGB',5,
   'Foco LED PAR 56 de 75W para instalación en truss. RGB programable + blanco. Incluye soporte de omega.',
   200,200,300,'ud',95.00,true),

  (v_empresa,'ILU-CAR-001','Carril iluminación 2m con 4 focos LED',5,
   'Carril de iluminación 2m con 4 focos LED orientables 15W incluidos. 4000K. Para stands modulares.',
   2000,80,80,'ud',145.00,true),

  (v_empresa,'ILU-TIR-001','Tira LED arquitectural',5,
   'Tira LED alta densidad 24V, 14.4W/m. Para iluminación indirecta en remates, zócalos y cornisas. Precio por metro lineal.',
   0,0,10,'ml',22.00,true),

  (v_empresa,'ILU-CAJ-001','Caja de luz tela tensada iluminada',5,
   'Caja de luz con tela tensada impresa en alta resolución. Iluminación LED trasera uniforme. Para imágenes corporativas de gran impacto. Precio por m².',
   0,0,100,'m2',185.00,true),

  -- ── SUELOS Y REVESTIMIENTOS (cat 6) ─────────────────────
  (v_empresa,'SUE-MOQ-001','Moqueta ferial bucle 550g',6,
   'Moqueta ferial de bucle 550g/m². Colores: gris antracita, negro, beige, rojo, azul marino. Incluye colocación y retirada.',
   0,0,8,'m2',14.50,true),

  (v_empresa,'SUE-MOQ-002','Moqueta velour premium tráfico intenso',6,
   'Moqueta de terciopelo alto tráfico 550g/m², aspecto lujoso. Para stands premium.',
   0,0,0,'m2',19.00,true),

  (v_empresa,'SUE-TAR-001','Tarima flotante laminada 5cm',6,
   'Tarima flotante laminada 5cm de altura. Acabado wengué, roble o blanco. Incluye estructura de listones y rodapié.',
   0,0,50,'m2',42.00,true),

  (v_empresa,'SUE-TAR-002','Tarima flotante laminada 10cm para instalaciones',6,
   'Tarima flotante 10cm para paso de instalaciones eléctricas y datos. Incluye estructura, tablero y rodapié.',
   0,0,100,'m2',58.00,true),

  (v_empresa,'SUE-VIN-001','Pavimento vinílico imitación madera',6,
   'Vinílico laminado 5mm, patrón madera natural (roble, nogal, wengué). Sin pegamento sobre tarima.',
   0,0,0,'m2',24.00,true),

  (v_empresa,'SUE-VIN-002','Pavimento vinílico imitación hormigón',6,
   'Vinílico laminado textura hormigón pulido, tonos gris. Para tecnología, industrial e interiorismo.',
   0,0,0,'m2',26.00,true),

  (v_empresa,'SUE-VIN-003','Vinilo impreso suelo antideslizante',6,
   'Vinilo específico para suelo con laminado antideslizante R10. Diseño a medida. Incluye colocación y retirada.',
   0,0,1,'m2',28.00,true),

  -- ── GRÁFICA E IMPRESIÓN (cat 7) ─────────────────────────
  (v_empresa,'GRA-LON-001','Lona gran formato frontlit impresa',7,
   'Lona publicitaria frontlit 440g/m² con impresión digital 1440dpi. Ojales cada 50cm. Para fondos, fachadas y carteles.',
   0,0,0,'m2',18.00,true),

  (v_empresa,'GRA-VIN-001','Vinilo adhesivo impreso para panel',7,
   'Vinilo autoadhesivo con impresión digital, acabado brillo o mate. Sobre paneles, mostradores y cristales. Incluye colocación.',
   0,0,0,'m2',28.00,true),

  (v_empresa,'GRA-VIN-002','Vinilo impreso en pared',7,
   'Vinilo adhesivo con laminado mate o brillo sobre paredes del stand. Alta resolución. Precio por m² instalado.',
   0,0,1,'m2',32.00,true),

  (v_empresa,'GRA-ROT-001','Letras corpóreas lacadas 3D',7,
   'Letras y logotipos tridimensionales en DM lacado, espesor 20mm. Fijación con espárragos ocultos. Para rótulos de cabecera.',
   0,0,0,'ud',185.00,true),

  (v_empresa,'GRA-ROT-002','Rótulo circular suspendido 3m diámetro',7,
   'Rótulo circular 3m diámetro con lona tensada doble cara. Para colgar de truss. Incluye estructura metálica e impresión.',
   3000,3000,200,'ud',1850.00,true),

  (v_empresa,'GRA-ROT-003','Roll-up estándar 85x200cm con impresión',7,
   'Roll-up aluminio 85x200cm con cassette de frenado progresivo y bolsa. Impresión incluida.',
   850,0,2000,'ud',88.00,true),

  (v_empresa,'GRA-TEL-001','Tela tensada frameless',7,
   'Sistema de tela tensada sin marco visible. Impresión sublimación en tela 210g. Precio por m² instalado.',
   0,0,5,'m2',95.00,true),

  -- ── AUDIOVISUAL (cat 8) ──────────────────────────────────
  (v_empresa,'AUD-MON-001','Monitor 55" con soporte de pie',8,
   'Monitor profesional 55" Full HD con soporte de pie regulable. Incluye conexión HDMI y reproductor multimedia.',
   1240,750,1800,'ud',485.00,true),

  (v_empresa,'AUD-MON-002','Monitor 43" pared o barra',8,
   'Monitor profesional 43" Full HD con soporte para pared o barra. Para información y publicidad digital.',
   960,600,550,'ud',320.00,true),

  (v_empresa,'AUD-MON-003','Monitor LED 75" con soporte pared',8,
   'Pantalla LED 75" para grandes presentaciones. Soporte de pared articulado incluido.',
   0,0,0,'ud',680.00,true),

  (v_empresa,'AUD-TAC-001','Pantalla táctil 55" soporte pie',8,
   'Pantalla táctil capacitiva 55" con soporte de pie. PC integrado, Windows 11, WiFi. Para demos interactivas y catálogos digitales.',
   1240,750,1900,'ud',1250.00,true),

  (v_empresa,'AUD-VID-001','Videowall LED 3x2m pitch 2.5mm',8,
   'Videowall LED interiores pitch 2.5mm, formato 3x2m. Incluye procesador de imagen, cableado y controlador.',
   3000,150,2000,'ud',8500.00,true),

  (v_empresa,'AUD-VID-002','Videowall LED 2x1.5m pitch 3.9mm',8,
   'Videowall LED interiores pitch 3.9mm, formato 2x1.5m. Para stands medianos. Incluye procesador.',
   2000,100,1500,'ud',4200.00,true),

  (v_empresa,'AUD-REP-001','Reproductor HDMI bucle automático',8,
   'Reproductor multimedia para bucle automático HDMI. Carga contenido desde USB. Incluye cable HDMI 3m.',
   0,0,0,'ud',68.00,true),

  (v_empresa,'AUD-AUD-001','Sistema audio ambiente para stand',8,
   'Par de altavoces 80W RMS con amplificador y ecualizador. Bluetooth y jack. Para música ambiental y vídeo corporativo.',
   0,0,0,'ud',295.00,true),

  -- ── MOBILIARIO Y DECORACIÓN (cat 9) ─────────────────────
  (v_empresa,'MOB-SIL-001','Silla diseño polipropileno apilable',9,
   'Silla polipropileno inyectado con varilla cromada, apilable hasta 8 unidades. Blanco, negro, gris, rojo, azul.',
   0,0,0,'ud',32.00,true),

  (v_empresa,'MOB-SIL-002','Silla diseño tapizada para reuniones',9,
   'Silla con estructura de haya y tapizado en tela o cuero sintético. Para sala de reuniones y zonas VIP.',
   0,0,0,'ud',78.00,true),

  (v_empresa,'MOB-TAB-001','Taburete alto bar cromado',9,
   'Taburete con asiento giratorio tapizado y estructura cromada. Altura regulable 60-85cm. Para barras y mostradores.',
   0,0,0,'ud',68.00,true),

  (v_empresa,'MOB-SOF-001','Sofá 3 plazas lounge para stand',9,
   'Sofá 3 plazas tapizado en polipiel (negro, blanco, gris). Para zonas lounge y de espera.',
   2100,850,800,'ud',450.00,true),

  (v_empresa,'MOB-SOF-002','Sillón individual diseño',9,
   'Sillón individual tapizado. Para zonas de espera y lounge.',
   850,850,950,'ud',145.00,true),

  (v_empresa,'MOB-MES-001','Mesa reuniones cristal 120x80cm',9,
   'Mesa de reuniones con tablero de cristal templado 10mm, patas de acero inoxidable. 120x80cm.',
   1200,800,750,'ud',240.00,true),

  (v_empresa,'MOB-MES-002','Mesa reuniones cristal 180x90cm',9,
   'Mesa de reuniones grande, cristal 12mm, patas acero cepillado. 180x90cm, hasta 8 personas.',
   1800,900,750,'ud',380.00,true),

  (v_empresa,'MOB-MES-003','Mesa alta cocktail 80cm redonda',9,
   'Mesa alta circular 80cm diámetro, altura 110cm. Tapa lacada blanco o negro. Para networking y degustación.',
   800,800,1100,'ud',68.00,true),

  (v_empresa,'MOB-MES-004','Mesa baja lounge cristal 90x60cm',9,
   'Mesa de centro cristal templado 10mm. 90x60cm, altura 40cm. Estructura metálica cromada. Para lounge.',
   900,600,400,'ud',95.00,true),

  (v_empresa,'MOB-VIT-001','Vitrina expositora cristal iluminada 100cm',9,
   'Vitrina con estructura aluminio anodizado, puertas cristal templado correderas, 4 baldas regulables con LED interior. 100x45x200cm.',
   1000,450,2000,'ud',620.00,true),

  (v_empresa,'MOB-EST-001','Estantería mural 200x100cm 3 baldas',9,
   'Estantería mural 200x100cm con 3 baldas regulables. Melamina blanca o nogal. Para exposición de productos.',
   2000,300,1000,'ud',195.00,true),

  (v_empresa,'MOB-PLT-001','Planta bambú natural en maceta 150-180cm',9,
   'Bambú natural en maceta rectangular de fibra de cemento antracita. Altura 150-180cm. Incluye mantenimiento durante feria.',
   400,200,1600,'ud',85.00,true),

  (v_empresa,'MOB-TOT-001','Tótem portafolletos 3 niveles metacrilato',9,
   'Tótem portafolletos 3 niveles en metacrilato transparente con base acero inox. Para catálogos A4 y DL.',
   320,250,1500,'ud',65.00,true),

  (v_empresa,'MOB-JRD-001','Jardinera rectangular planta artificial',9,
   'Jardinera rectangular 100x40x35cm con plantas artificiales de calidad. Para delimitación de espacios.',
   1000,400,350,'ud',95.00,true),

  -- ── TRANSPORTE Y LOGÍSTICA (cat 10) ─────────────────────
  (v_empresa,'TRA-NAC-001','Transporte peninsular por m² de stand',10,
   'Transporte de materiales desde taller al recinto ferial y vuelta. Cualquier recinto de la Península. Precio por m² de stand contratado.',
   0,0,0,'m2',5.20,true),

  (v_empresa,'TRA-INT-001','Transporte internacional Europa por m²',10,
   'Transporte a recintos europeos (Hannover, Frankfurt, París, Milán). Gestión aduanera incluida para ferias fuera UE.',
   0,0,0,'m2',14.00,true),

  -- ── MONTAJE Y MANO DE OBRA (cat 11) ─────────────────────
  (v_empresa,'MON-EQU-001','Equipo montaje jornada: 2 oficiales',11,
   'Equipo de montaje: 2 oficiales carpintería ferial, 8 horas en recinto. Herramientas, EPIs y CAE incluidos.',
   0,0,0,'ud',595.00,true),

  (v_empresa,'MON-EQU-002','Oficial carpintería ferial por hora',11,
   'Hora de oficial especialista en montaje de stands. Para refuerzo, horas extra o incidencias en recinto.',
   0,0,0,'ud',42.00,true),

  (v_empresa,'MON-EQU-003','Equipo desmontaje jornada completa',11,
   'Equipo desmontaje 2 operarios, 8 horas. Incluye embalaje y carga.',
   0,0,0,'ud',480.00,true),

  (v_empresa,'MON-COO-001','Coordinación y dirección de obra en recinto',11,
   'Jefe de obra presente durante todo el montaje. Coordina con feria, supervisa ejecución y firma visto bueno ante el recinto.',
   0,0,0,'ud',295.00,true),

  -- ── SERVICIOS FERIA (cat 12) ─────────────────────────────
  (v_empresa,'SER-ELE-001','Conexión eléctrica 3kW recinto ferial',12,
   'Contratación de acometida eléctrica 3kW en recinto ferial (IFEMA, Fira, FIBES...). Incluye gestión y cuadro eléctrico básico.',
   0,0,0,'ud',280.00,true),

  (v_empresa,'SER-ELE-002','Conexión eléctrica 6kW recinto ferial',12,
   'Acometida 6kW en recinto ferial. Cuadro con diferencial incluido. Para stands con audiovisual e iluminación completa.',
   0,0,0,'ud',480.00,true),

  (v_empresa,'SER-ELE-003','Potencia eléctrica adicional por kW',12,
   'Potencia adicional por cada kW por encima de la contratación base. Precio unitario por kW adicional.',
   0,0,0,'ud',88.00,true),

  (v_empresa,'SER-AGU-001','Conexión agua y desagüe feria',12,
   'Contratación de puntos de agua y desagüe en recinto ferial. Para stands con barra de café o catering.',
   0,0,0,'ud',380.00,true),

  (v_empresa,'SER-INT-001','Conexión internet fibra feria 50Mbps',12,
   'Conexión a internet por fibra óptica 50Mbps simétrico en recinto ferial. Para demos online y videoconferencias.',
   0,0,0,'ud',650.00,true),

  (v_empresa,'SER-LIM-001','Servicio limpieza diaria del stand',12,
   'Servicio de limpieza profesional cada mañana antes de apertura. Aspirado, vaciado papeleras, cristales y mostradores. Precio por sesión.',
   0,0,0,'ud',48.00,true),

  (v_empresa,'SER-SEG-001','Seguro RC montaje y feria',12,
   'Seguro de Responsabilidad Civil para montaje, feria y desmontaje. Cobertura mínima exigida por la mayoría de recintos. Precio por m² de stand.',
   0,0,0,'m2',0.38,true),

  -- ── DISEÑO Y PROYECTO (cat 14) ───────────────────────────
  (v_empresa,'DIS-3D-001','Proyecto 3D completo con 3 renders',14,
   'Diseño tridimensional en 3ds Max / SketchUp. Incluye 3 renders fotorrealistas de alta resolución. Revisiones ilimitadas hasta aprobación.',
   0,0,0,'ud',880.00,true),

  (v_empresa,'DIS-PLA-001','Planos técnicos de ejecución AutoCAD',14,
   'Planos de planta, alzados, secciones y detalles constructivos en AutoCAD. Incluye memoria técnica para aprobación del recinto.',
   0,0,0,'ud',465.00,true),

  (v_empresa,'DIS-GES-001','Gestión permisos y memoria técnica recinto',14,
   'Tramitación completa ante el recinto ferial. Cálculo de cargas, prevención de incendios, certificado ignífugo y CAE.',
   0,0,0,'ud',335.00,true)

  ON CONFLICT (id_empresa, codigo_sku) DO NOTHING;

  RAISE NOTICE '✅ Seed v3 completado correctamente para empresa: %', v_empresa;

END $$;

-- ── VERIFICACIÓN ─────────────────────────────────────────────
SELECT
  cm.nombre AS categoria,
  COUNT(ce.id) AS total_elementos,
  MIN(ce.precio_venta_unidad) AS precio_min,
  MAX(ce.precio_venta_unidad) AS precio_max
FROM public.catalogo_elementos ce
JOIN public.categorias_matriz cm ON cm.id = ce.id_categoria_matriz
GROUP BY cm.nombre, cm.id
ORDER BY cm.id;
