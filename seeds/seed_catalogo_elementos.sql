-- ============================================================
-- SEED DATA: catalogo_elementos (Base B)
-- 40+ elementos reales de stands feriales
-- Ejecutar DESPUÉS de tener la empresa creada en Supabase
-- Reemplaza 'UUID-DE-TU-EMPRESA' por el UUID real de tu empresa
-- ============================================================

-- PASO 1: Verificar que tienes el UUID de tu empresa
-- SELECT id FROM empresas LIMIT 1;

-- PASO 2: Ejecutar este INSERT (reemplaza el UUID)

DO $$
DECLARE
  v_empresa UUID := 'd3e113f2-ee3f-46d2-9a21-4af1f46dc5f7'; -- The Titan
  -- IDs de categoría según categorias_matriz
  c_estructura    INT := 1;  -- Madera y Derivados
  c_metal         INT := 2;  -- Metal y Aluminio
  c_iluminacion   INT := 5;  -- Iluminación
  c_suelos        INT := 6;  -- Suelos y Revestimientos
  c_grafica       INT := 7;  -- Textil, Gráfica e Impresión
  c_audiovisual   INT := 8;  -- Audiovisual y Tecnología
  c_mobiliario    INT := 9;  -- Mobiliario y Decoración
  c_transporte    INT := 10; -- Transporte y Logística
  c_montaje       INT := 11; -- Montaje y Mano de Obra
  c_servicios     INT := 12; -- Servicios de Feria y Recinto
  c_diseno        INT := 14; -- Diseño, Proyecto y Dirección
BEGIN

INSERT INTO public.catalogo_elementos
  (id_empresa, codigo_sku, nombre_elemento, id_categoria_matriz, descripcion_comercial,
   ancho_estandar_mm, fondo_estandar_mm, alto_estandar_mm,
   unidad_medida_bloque, precio_venta_unidad, estado_elemento)
VALUES

-- ============================================================
-- ESTRUCTURA Y TARIMA
-- ============================================================
(v_empresa, 'EST-001', 'Tarima DM lacada blanca 10cm', c_estructura,
 'Tarima estructural de tablero DM con acabado lacado blanco mate, altura 10cm para paso oculto de instalaciones eléctricas. Incluye revestimiento superior en vinílico o moqueta a elegir.',
 NULL, NULL, 100, 'm2', 45.00, true),

(v_empresa, 'EST-002', 'Tarima DM lacada negra 10cm', c_estructura,
 'Tarima estructural de tablero DM con acabado lacado negro mate, altura 10cm. Ideal para stands con paleta cromática oscura y acabados premium industriales.',
 NULL, NULL, 100, 'm2', 47.00, true),

(v_empresa, 'EST-003', 'Tarima madera natural roble 12cm', c_estructura,
 'Tarima de madera maciza de roble natural barnizada al agua, altura 12cm. Acabado premium cálido para stands del sector alimentación, vinos, decoración y hogar.',
 NULL, NULL, 120, 'm2', 68.00, true),

(v_empresa, 'EST-004', 'Módulo pared melamina blanca 250cm', c_estructura,
 'Panel divisorio de melamina blanca mate, altura 250cm, espesor 19mm. Sistema de fijación rápida sin tornillos visibles. Superficie lisa pintable o con vinilo adhesivo.',
 NULL, 19, 2500, 'm2', 55.00, true),

(v_empresa, 'EST-005', 'Módulo pared negro mate 250cm', c_estructura,
 'Panel divisorio de melamina negro mate, altura 250cm. Acabado sofisticado para stands premium con paleta oscura. Compatible con sistema de carril LED empotrado.',
 NULL, 19, 2500, 'm2', 58.00, true),

(v_empresa, 'EST-006', 'Estructura tubular aluminio 3x3m', c_metal,
 'Módulo estándar de exposición en perfil de aluminio anodizado plata 40x40mm, dimensiones 3x3m x 2,5m altura. Base con pies regulables. Sistema de clipado rápido para paneles.',
 3000, 3000, 2500, 'ud', 380.00, true),

(v_empresa, 'EST-007', 'Estructura tubular aluminio 6x3m', c_metal,
 'Módulo doble de exposición en perfil aluminio anodizado, dimensiones 6x3m x 2,5m altura. Estructura autoportante con refuerzo central. Para stands con dos frentes o isla pequeña.',
 6000, 3000, 2500, 'ud', 680.00, true),

(v_empresa, 'EST-008', 'Pared backlit retroiluminada 100x250cm', c_estructura,
 'Caja de luz con perfil de aluminio extruido y lona tensada mediante sistema de silicona. Iluminación LED uniforme por toda la superficie. Cambio de gráfica sin herramientas. Ideal para fondos corporativos.',
 1000, 120, 2500, 'ud', 420.00, true),

(v_empresa, 'EST-009', 'Pared backlit retroiluminada 200x250cm', c_estructura,
 'Caja de luz doble anchura con perfil aluminio y lona tensada por silicona. LED de alto brillo, uniformidad >85%. Para cabeceras de stand y fondos de escenario.',
 2000, 120, 2500, 'ud', 780.00, true),

-- ============================================================
-- SUELOS Y REVESTIMIENTOS
-- ============================================================
(v_empresa, 'SUE-001', 'Moqueta ferial bucle estándar', c_suelos,
 'Moqueta ferial de bucle de nylon, peso 350g/m², más de 20 colores disponibles. Incluye cinta doble cara para fijación. Sin necesidad de tarima. Instalación rápida directamente sobre el pavimento de pabellón.',
 NULL, NULL, NULL, 'm2', 12.00, true),

(v_empresa, 'SUE-002', 'Moqueta velour premium', c_suelos,
 'Moqueta de terciopelo alto tráfico, 550g/m², tacto suave y aspecto lujoso. Amplia paleta cromática. Recomendada para stands premium, farmacéutico, lujo y cosmética.',
 NULL, NULL, NULL, 'm2', 19.00, true),

(v_empresa, 'SUE-003', 'Pavimento vinílico imitación madera', c_suelos,
 'Vinílico laminado 5mm con capa de uso 0,7mm, patrón madera natural en varios tonos (roble, nogal, wengué). Instalación sin pegamento sobre tarima. Resistente a ruedas y tacones.',
 NULL, NULL, NULL, 'm2', 24.00, true),

(v_empresa, 'SUE-004', 'Pavimento vinílico imitación hormigón', c_suelos,
 'Vinílico laminado con textura hormigón pulido, tonos gris claro, gris oscuro y beige. Muy solicitado para stands del sector tecnológico, industrial e interiorismo.',
 NULL, NULL, NULL, 'm2', 26.00, true),

(v_empresa, 'SUE-005', 'Baldosa porcelánica 60x60 gris', c_suelos,
 'Porcelánico rectificado 60x60cm gris antracita mate, espesor 10mm. Instalado sobre tarima técnica con adhesivo de fijación provisional. Acabado máximo nivel premium para stands de lujo.',
 600, 600, 10, 'm2', 45.00, true),

-- ============================================================
-- ILUMINACIÓN
-- ============================================================
(v_empresa, 'ILU-001', 'Foco LED carril 30W orientable', c_iluminacion,
 'Proyector LED de carril orientable 30W, 3000K luz cálida o 4000K neutra, apertura 24°. CRI>90. Carcasa negra o blanca. Para iluminación de producto y zonas de exposición. Incluye adaptador de carril estándar.',
 NULL, NULL, NULL, 'ud', 48.00, true),

(v_empresa, 'ILU-002', 'Carril electrificado superficie 2m', c_iluminacion,
 'Carril monofásico de superficie, longitud 2m, color negro o blanco. Incluye tapas terminales y conector de alimentación lateral. Compatible con todos los focos de carril estándar del mercado.',
 2000, NULL, NULL, 'ud', 38.00, true),

(v_empresa, 'ILU-003', 'Panel LED empotrado 60x60cm 40W', c_iluminacion,
 'Panel LED cuadrado 60x60cm 40W 4000K para iluminación general de stand. Difusor mate con marco de aluminio blanco. Incluye driver regulable. Para techos de Pladur o estructura de aluminio.',
 600, 600, NULL, 'ud', 68.00, true),

(v_empresa, 'ILU-004', 'Tira LED RGB 5m con controlador', c_iluminacion,
 'Tira LED RGB 14,4W/m IP20, 5 metros con controlador DMX512 y fuente de alimentación incluida. Para iluminación ambiental de zócalos, cornisas y techos flotantes. Programable.',
 5000, NULL, NULL, 'ud', 145.00, true),

(v_empresa, 'ILU-005', 'Proyector LED exterior fachada 50W', c_iluminacion,
 'Proyector LED de 50W para iluminación de fachada exterior y rótulos del stand. Carcasa IP65, color negro. Soporte articulado de pared. Para atraer atención desde pasillo.',
 NULL, NULL, NULL, 'ud', 92.00, true),

(v_empresa, 'ILU-006', 'Tótem luminoso caja de luz 40x180cm', c_iluminacion,
 'Tótem publicitario de doble cara, caja de luz LED con lonas impresas en ambas caras, dimensiones 40x180cm. Estructura aluminio con base lastrada. Visible desde 360°.',
 400, 200, 1800, 'ud', 520.00, true),

-- ============================================================
-- MOBILIARIO
-- ============================================================
(v_empresa, 'MOB-001', 'Mostrador recepción recto lacado blanco 200cm', c_mobiliario,
 'Mostrador de recepción recto, 200cm de largo x 100cm de alto x 50cm de fondo. Lacado blanco mate. Hueco interior con balda y espacio para ordenador. Frontal personalizable con vinilo o gráfica impresa.',
 2000, 500, 1000, 'ud', 520.00, true),

(v_empresa, 'MOB-002', 'Mostrador recepción recto lacado negro 200cm', c_mobiliario,
 'Mostrador recto 200x100x50cm lacado negro alto brillo. Versión premium del mostrador estándar. Muy solicitado para stands de tecnología, automoción y cosmética de lujo.',
 2000, 500, 1000, 'ud', 550.00, true),

(v_empresa, 'MOB-003', 'Mostrador curvo 120cm lacado', c_mobiliario,
 'Mostrador en ángulo curvo de 120cm, lacado a elegir entre 15 colores RAL. Elegante para accesos de stand de esquina o isla. Con balda interior y espacio para equipo informático.',
 1200, 500, 1000, 'ud', 620.00, true),

(v_empresa, 'MOB-004', 'Mesa reuniones cristal 120x80cm', c_mobiliario,
 'Mesa de reuniones con tablero de cristal templado 10mm transparente, patas de acero inoxidable. Dimensiones 120x80cm. Fácil montaje y transporte. Para sala de reuniones dentro del stand.',
 1200, 800, 750, 'ud', 240.00, true),

(v_empresa, 'MOB-005', 'Mesa reuniones cristal 180x90cm', c_mobiliario,
 'Mesa de reuniones grande con cristal templado 12mm y patas de acero cepillado. 180x90cm, para reuniones de hasta 8 personas. Versión premium del modelo estándar.',
 1800, 900, 750, 'ud', 380.00, true),

(v_empresa, 'MOB-006', 'Silla visitante polipropileno apilable', c_mobiliario,
 'Silla de polipropileno inyectado con estructura de varilla cromada, apilable hasta 8 unidades. Disponible en blanco, negro, gris, rojo, azul y verde. Ligera y resistente para uso ferial intensivo.',
 NULL, NULL, NULL, 'ud', 32.00, true),

(v_empresa, 'MOB-007', 'Silla de diseño tapizada', c_mobiliario,
 'Silla de diseño con estructura de madera de haya y tapizado en tela o cuero sintético. Para sala de reuniones y zonas VIP del stand. Disponible en 8 colores de tapizado.',
 NULL, NULL, NULL, 'ud', 78.00, true),

(v_empresa, 'MOB-008', 'Taburete alto bar cromado', c_mobiliario,
 'Taburete de barra con asiento giratorio tapizado y estructura de acero cromado. Altura regulable 60-85cm. Para barras de degustación, zonas de networking y mostradores altos.',
 NULL, NULL, NULL, 'ud', 68.00, true),

(v_empresa, 'MOB-009', 'Vitrina expositora cristal con luz 100cm', c_mobiliario,
 'Vitrina de exposición con estructura de aluminio anodizado, puertas de cristal templado correderas y 4 baldas regulables con iluminación LED interior. 100x45x200cm. Para exposición de producto de alto valor.',
 1000, 450, 2000, 'ud', 620.00, true),

(v_empresa, 'MOB-010', 'Sofá 3 plazas lounge para stand', c_mobiliario,
 'Sofá de 3 plazas tapizado en polipiel, estructura de madera maciza. Disponible en negro, blanco y gris antracita. Para zonas lounge y de espera dentro del stand. Fácil montaje y transporte.',
 2100, 850, 800, 'ud', 450.00, true),

(v_empresa, 'MOB-011', 'Mesa redonda alta 60cm diámetro', c_mobiliario,
 'Mesa alta circular de 60cm de diámetro, tablero lacado blanco o negro y pie de acero cromado o lacado. Altura 105cm para uso con taburetes. Para zonas de networking y degustación.',
 600, 600, 1050, 'ud', 145.00, true),

(v_empresa, 'MOB-012', 'Almacén modular 2x2m con puerta', c_mobiliario,
 'Módulo de almacén cerrado de 2x2m x 2,5m de altura, con puerta de acceso, balda interior y cerradura. Estructura de tablero DM lacado blanco. Para guardar material, ordenadores y objetos de valor.',
 2000, 2000, 2500, 'ud', 680.00, true),

(v_empresa, 'MOB-013', 'Estantería mural 200x100cm 3 baldas', c_mobiliario,
 'Estantería mural de 200cm ancho x 100cm alto con 3 baldas regulables. Tablero de melamina blanca o nogal. Para exposición de productos, catálogos y merchandising.',
 2000, 300, 1000, 'ud', 195.00, true),

-- ============================================================
-- GRÁFICA E IMPRESIÓN
-- ============================================================
(v_empresa, 'GRA-001', 'Lona gran formato impresa frontlit', c_grafica,
 'Lona publicitaria frontlit 440g/m² con impresión digital en alta resolución (1440dpi), ojales cada 50cm. Tratamiento antifungicida UV. Para paneles de fondo, fachadas y carteles de stand.',
 NULL, NULL, NULL, 'm2', 18.00, true),

(v_empresa, 'GRA-002', 'Vinilo adhesivo impreso para panel', c_grafica,
 'Vinilo autoadhesivo con impresión digital en alta resolución, acabado brillo o mate a elegir. Para personalización de paneles, mostradores y cristales del stand. Instalación incluida.',
 NULL, NULL, NULL, 'm2', 28.00, true),

(v_empresa, 'GRA-003', 'Roll-up estándar 85x200cm con impresión', c_grafica,
 'Roll-up de aluminio 85x200cm con cassette de frenado progresivo y bolsa de transporte. Impresión incluida en polipropileno satinado de alta resolución. Montaje en 30 segundos.',
 850, NULL, 2000, 'ud', 88.00, true),

(v_empresa, 'GRA-004', 'Letras corpóreas lacadas 3D', c_grafica,
 'Letras y logotipos tridimensionales en DM lacado en color corporativo, espesor 20mm. Fijación mediante espárragos ocultos. Para rótulos de cabecera y fachada de stand. Precio por pieza de hasta 30cm.',
 NULL, NULL, NULL, 'ud', 185.00, true),

(v_empresa, 'GRA-005', 'Vinilo suelo con logo o mensaje', c_grafica,
 'Vinilo para suelo de alta resistencia (R10 antideslizante), impresión en alta resolución. Para marcar zonas, indicar recorridos o exhibir el logo de la empresa en el suelo del stand.',
 NULL, NULL, NULL, 'm2', 42.00, true),

-- ============================================================
-- AUDIOVISUAL
-- ============================================================
(v_empresa, 'AUD-001', 'Monitor LED 55" con soporte', c_audiovisual,
 'Monitor LED Samsung o LG de 55 pulgadas, 4K UHD, brillo 500cd/m². Soporte incluido: pie de suelo, soporte de pared o brazo articulado según necesidad. Para presentaciones, loops de vídeo y demostraciones.',
 NULL, NULL, NULL, 'ud', 395.00, true),

(v_empresa, 'AUD-002', 'Monitor LED 75" con soporte pared', c_audiovisual,
 'Pantalla LED de 75 pulgadas para grandes presentaciones. Soporte de pared articulado de alta resistencia incluido. Para stands de gran formato y posiciones de alto impacto visual.',
 NULL, NULL, NULL, 'ud', 680.00, true),

(v_empresa, 'AUD-003', 'Reproductor HDMI bucle automático', c_audiovisual,
 'Reproductor multimedia compacto para bucle automático de vídeo HDMI. Carga contenido desde USB. Ideal para pantallas de stand sin operador. Incluye cable HDMI 3m.',
 NULL, NULL, NULL, 'ud', 68.00, true),

(v_empresa, 'AUD-004', 'iPad Stand con soporte de seguridad', c_audiovisual,
 'Soporte de suelo o mesa para iPad (compatible con todos los modelos desde iPad 6). Sistema de seguridad antirrobo con llave. Para encuestas, catálogos digitales y demostraciones de app.',
 NULL, NULL, NULL, 'ud', 58.00, true),

(v_empresa, 'AUD-005', 'Sistema de audio ambiente para stand', c_audiovisual,
 'Par de altavoces de dos vías 80W RMS con amplificador integrado y ecualizador. Conectores jack y bluetooth. Para música ambiental y reproducción de audio de vídeos corporativos.',
 NULL, NULL, NULL, 'ud', 295.00, true),

-- ============================================================
-- SERVICIOS DE FERIA
-- ============================================================
(v_empresa, 'SER-001', 'Conexión eléctrica 3kW IFEMA', c_servicios,
 'Contratación de suministro eléctrico monofásico 3kW en recinto IFEMA Madrid. Incluye cuadro de distribución estándar con 2 bases 16A. Para stands de hasta 20m² con iluminación estándar.',
 NULL, NULL, NULL, 'ud', 225.00, true),

(v_empresa, 'SER-002', 'Conexión eléctrica adicional por kW', c_servicios,
 'Potencia eléctrica adicional por cada kW contratado más allá de los 3kW base. Precio por kW adicional en recinto ferial nacional (IFEMA, Fira Barcelona, BEC...).',
 NULL, NULL, NULL, 'ud', 88.00, true),

(v_empresa, 'SER-003', 'Limpieza diaria del stand', c_servicios,
 'Servicio de limpieza profesional del stand cada mañana antes de apertura del pabellón. Incluye aspirado de moqueta o fregado de suelo, vaciado de papeleras y limpieza de cristales y mostradores.',
 NULL, NULL, NULL, 'dia', 48.00, true),

(v_empresa, 'SER-004', 'Seguro RC montaje y feria', c_servicios,
 'Seguro de Responsabilidad Civil para montaje, celebración de la feria y desmontaje. Cobertura mínima exigida por la mayoría de recintos feriales nacionales. Precio calculado sobre m² del stand.',
 NULL, NULL, NULL, 'm2', 0.38, true),

(v_empresa, 'SER-005', 'WiFi corporativo en stand', c_servicios,
 'Conexión WiFi dedicada para el stand con ancho de banda garantizado. Incluye router con contraseña personalizada. Para stands con demostraciones online, videoconferencias o apps conectadas.',
 NULL, NULL, NULL, 'ud', 195.00, true),

-- ============================================================
-- TRANSPORTE Y MONTAJE
-- ============================================================
(v_empresa, 'TRA-001', 'Transporte peninsular ida y vuelta por m²', c_transporte,
 'Transporte de materiales del stand desde el taller al recinto ferial y recogida al finalizar el desmontaje, en cualquier recinto de la Península Ibérica. Precio por m² de superficie del stand.',
 NULL, NULL, NULL, 'm2', 5.20, true),

(v_empresa, 'TRA-002', 'Transporte internacional Europa por m²', c_transporte,
 'Transporte internacional de materiales a recintos feriales europeos (Hannover, Frankfurt, París, Milán, Ámsterdam). Gestión aduanera incluida para ferias fuera de la UE.',
 NULL, NULL, NULL, 'm2', 14.00, true),

(v_empresa, 'MON-001', 'Equipo montaje jornada completa (2 oficiales)', c_montaje,
 'Equipo de montaje compuesto por 2 oficiales de carpintería ferial + 1 ayudante durante jornada de 8 horas en recinto. Incluye herramientas propias, EPIs y cobertura del CAE.',
 NULL, NULL, NULL, 'ud', 595.00, true),

(v_empresa, 'MON-002', 'Oficial de carpintería ferial por hora', c_montaje,
 'Hora de trabajo de oficial de carpintería especialista en montaje de stands feriales. Para trabajos de refuerzo, horas extra o incidencias en recinto.',
 NULL, NULL, NULL, 'ud', 42.00, true),

(v_empresa, 'MON-003', 'Equipo desmontaje jornada completa', c_montaje,
 'Equipo de desmontaje de 2 operarios durante jornada de 8 horas. Incluye embalaje y carga en camión. Precio inferior al montaje por menor complejidad.',
 NULL, NULL, NULL, 'ud', 480.00, true),

(v_empresa, 'MON-004', 'Coordinación y dirección de obra en recinto', c_montaje,
 'Jefe de obra presente en el recinto ferial durante todo el montaje. Coordina con la organización de la feria, supervisa la ejecución técnica y firma el visto bueno del stand ante el recinto.',
 NULL, NULL, NULL, 'ud', 295.00, true),

-- ============================================================
-- DISEÑO Y PROYECTO
-- ============================================================
(v_empresa, 'DIS-001', 'Proyecto 3D completo con renders', c_diseno,
 'Diseño tridimensional completo del stand en software 3D profesional (3ds Max / SketchUp). Incluye 3 renders fotorrealistas de alta resolución desde diferentes ángulos. Revisiones ilimitadas hasta aprobación.',
 NULL, NULL, NULL, 'ud', 880.00, true),

(v_empresa, 'DIS-002', 'Planos técnicos de ejecución', c_diseno,
 'Planos de planta, alzados, secciones y detalles constructivos en AutoCAD para taller y recinto ferial. Incluye memoria técnica requerida por el recinto para obtener la aprobación del proyecto.',
 NULL, NULL, NULL, 'ud', 465.00, true),

(v_empresa, 'DIS-003', 'Gestión de permisos y memoria técnica', c_diseno,
 'Tramitación completa de la documentación técnica ante el recinto ferial. Incluye: cálculo de cargas, memoria de prevención de incendios, certificado ignífugo de materiales y seguro CAE.',
 NULL, NULL, NULL, 'ud', 335.00, true);

END $$;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT
  id_categoria_matriz as cat,
  COUNT(*) as total,
  MIN(precio_venta_unidad) as precio_min,
  MAX(precio_venta_unidad) as precio_max
FROM public.catalogo_elementos
GROUP BY id_categoria_matriz
ORDER BY id_categoria_matriz;
