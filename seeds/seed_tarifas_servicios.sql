-- ============================================================
-- SEED DATA: tarifas_servicios (Base C - Despiece Técnico)
-- Costes reales de mercado del sector ferial España 2025-2026
-- Ejecutar DESPUÉS de tener la empresa creada en Supabase
-- Reemplaza 'UUID-DE-TU-EMPRESA' por el UUID real de tu empresa
-- ============================================================

DO $$
DECLARE
  v_empresa UUID := 'd3e113f2-ee3f-46d2-9a21-4af1f46dc5f7'; -- The Titan
  -- IDs de categoría según categorias_matriz
  c_madera        INT := 1;
  c_metal         INT := 2;
  c_plastico      INT := 3;
  c_electricidad  INT := 4;
  c_iluminacion   INT := 5;
  c_suelos        INT := 6;
  c_grafica       INT := 7;
  c_audiovisual   INT := 8;
  c_mobiliario    INT := 9;
  c_transporte    INT := 10;
  c_montaje       INT := 11;
  c_servicios     INT := 12;
  c_seguridad     INT := 13;
  c_diseno        INT := 14;
  c_varios        INT := 15;
BEGIN

 INSERT INTO public.tarifas_servicios
   (id_empresa, id_categoria_matriz, nombre_tecnico, descripcion_compra,
    medida_ancho_mm, medida_fondo_mm, medida_alto_mm,
    unidad_medida, precio_coste_unidad_medida,
    unidad_tiempo, precio_unidad_tiempo,
    rendimiento_mecanico_hora, aplica_coeficiente_desperdicio, coeficiente_desperdicio,
    estado_tarifa)
 VALUES

-- ============================================================
-- MADERA Y DERIVADOS (cat 1)
-- ============================================================
(v_empresa, c_madera, 'Tablero DM 19mm lacado blanco',
 'Tablero de densidad media (DM) de 19mm espesor con acabado lacado blanco mate a dos caras. Corte y canteado incluidos. Para fabricación de paneles, tarimas y mobiliario de stand.',
 2440, 1220, 19, 'm2', 9.80,
 NULL, 0, 1.50, true, 1.10, 'activa'),

(v_empresa, c_madera, 'Tablero DM 19mm lacado negro',
 'Tablero DM 19mm con lacado negro mate a dos caras. Corte y canteado incluidos. Para stands con paleta cromática oscura y acabados premium.',
 2440, 1220, 19, 'm2', 11.50,
 NULL, 0, 1.50, true, 1.10, 'activa'),

(v_empresa, c_madera, 'Tablero DM ignífugo 15mm',
 'Tablero DM ignífugo M1 (clase B-s2,d0) de 15mm. Certificado de reacción al fuego incluido. Obligatorio en recintos feriales para stands de madera. Corte y canteado.',
 2440, 1220, 15, 'm2', 14.20,
 NULL, 0, 1.50, true, 1.10, 'activa'),

(v_empresa, c_madera, 'Contrachapado fenólico 15mm',
 'Tablero contrachapado fenólico 15mm ignífugo. Alta resistencia mecánica y humedad. Para suelos de tarima técnica y bases de estructura.',
 2440, 1220, 15, 'm2', 16.80,
 NULL, 0, 1.20, true, 1.05, 'activa'),

(v_empresa, c_madera, 'Listón madera maciza pino 70x45mm',
 'Listón de madera maciza de pino nórdico cepillado, sección 70x45mm. Para estructura portante de stands y refuerzos de tarima.',
 4000, 45, 70, 'ml', 4.20,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_madera, 'Melamina blanca 19mm',
 'Tablero aglomerado revestido en melamina blanca 19mm. Acabado estándar para paneles divisores económicos. Corte incluido.',
 2440, 1220, 19, 'm2', 6.50,
 NULL, 0, 2.00, true, 1.05, 'activa'),

(v_empresa, c_madera, 'Perfil aluminio escuadra 20x20mm',
 'Perfil de aluminio anodizado en escuadra 20x20mm, pared 2mm. Para estructura de módulos exposition. Corte a medida incluido.',
 6000, 20, 20, 'ml', 3.80,
 NULL, 0, 0, false, 1.00, 'activa'),

-- ============================================================
-- METAL Y ALUMINIO (cat 2)
-- ============================================================
(v_empresa, c_metal, 'Perfil aluminio octogonal 40x40mm',
 'Perfil estructural de aluminio extruido 40x40mm octogonal, aleación 6063 T5. Ranura para inserción de paneles de 10mm. Sistema modular de exposición ferial.',
 6000, 40, 40, 'ml', 8.20,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_metal, 'Conector esquina aluminio 40mm',
 'Conector de esquina para perfil de aluminio 40x40mm. Fundición inyectada de zamak, fijación por tornillo Allen M8. Para ensamblaje de estructura modular de stand.',
 0, 0, 0, 'ud', 2.80,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_metal, 'Pletina acero galvanizado 40x4mm',
 'Pletina de acero galvanizado 40x4mm para refuerzos estructurales y anclajes al suelo del pabellón. Corte y taladrado incluidos.',
 6000, 40, 4, 'ml', 2.40,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_metal, 'Tornillo autorroscante hexágonal 4x40mm',
 'Tornillo autorroscante hexágonal 4x40mm acero cincado. Para fijación de paneles a estructura de aluminio/madera. Caja de 100 unidades.',
 0, 0, 0, 'ud', 0.18,
 NULL, 0, 0, false, 1.00, 'activa'),

-- ============================================================
-- PLÁSTICO-METACRILATO (cat 3)
-- ============================================================
(v_empresa, c_plastico, 'Metacrilato transparente 5mm',
 'Plancha de metacrilato (PMMA) extruido transparente cristal 5mm. Doble cara de protección. Corte a medida. Para expositores, letreros y cerramientos decorativos.',
 2000, 1000, 5, 'm2', 28.50,
 NULL, 0, 0, true, 1.10, 'activa'),

(v_empresa, c_plastico, 'Metacrilato traslúcido lechoso 5mm',
 'Plancha metacrilato traslúcido blanco lechoso 5mm. Ideal para cajas de luz y paneles retroiluminados por transmisión difusa de luz.',
 2000, 1000, 5, 'm2', 32.00,
 NULL, 0, 0, true, 1.10, 'activa'),

(v_empresa, c_plastico, 'PVC espumado 10mm blanco',
 'Plancha de PVC espumado (Forex/Komatex) blanco 10mm. Ligero y fácil de cortar. Para cartelería, stands ligeros y expositores temporales. Corte incluido.',
 2440, 1220, 10, 'm2', 14.00,
 NULL, 0, 2.50, true, 1.05, 'activa'),

-- ============================================================
-- INSTALACIÓN ELÉCTRICA (cat 4)
-- ============================================================
(v_empresa, c_electricidad, 'Cuadro eléctrico 4 tomas 16A',
 'Cuadro de distribución eléctrica portátil con 4 bases schuko 16A, diferencial 30mA y magnetotérmico por circuito. Cable de entrada 3G2.5 de 5m incluido.',
 0, 0, 0, 'ud', 65.00,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_electricidad, 'Cable manguera H07RN-F 3G2.5',
 'Cable de manguera de goma H07RN-F 3G2.5mm² (fase+neutro+tierra). Forro exterior de neopreno antipisado. Para distribución eléctrica en stand.',
 0, 0, 0, 'ml', 2.60,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_electricidad, 'Alargadera schuko 10m con 3 tomas',
 'Regleta alargadera schuko 10m con 3 tomas. Cable H05VV-F 3G1.5. Para instalación puntual de equipos en stand.',
 0, 0, 0, 'ud', 18.00,
 NULL, 0, 0, false, 1.00, 'activa'),

-- ============================================================
-- ILUMINACIÓN (cat 5)
-- ============================================================
(v_empresa, c_iluminacion, 'Foco LED carril 30W 4000K',
 'Foco LED para carril electrificado, 30W, temperatura 4000K neutro, CRI>90. Carcasa aluminio inyectado negro o blanco. Driver integrado regulable 0-10V.',
 0, 0, 0, 'ud', 22.00,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_iluminacion, 'Carril electrificado 2200mm negro',
 'Carril monofásico para iluminación, perfil aluminio extrusionado negro mate, 2200mm. Incluye tapas terminales y conector de alimentación lateral.',
 2200, NULL, NULL, 'ud', 15.50,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_iluminacion, 'Tira LED RGB 14,4W/m 5m',
 'Tira LED RGB SMD5050 14,4W/m, 5m, IP20, con controlador DMX y fuente 24V incluidos. Para iluminación ambiental, zócalos y cornisas.',
 5000, NULL, NULL, 'ud', 72.00,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_iluminacion, 'Fuente alimentación 24V 150W',
 'Fuente de alimentación conmutada 24V 150W (6.25A) IP20. Para alimentación de tiras LED y pequeños equipos. Entrada 110-240VAC.',
 0, 0, 0, 'ud', 28.00,
 NULL, 0, 0, false, 1.00, 'activa'),

-- ============================================================
-- SUELOS (cat 6)
-- ============================================================
(v_empresa, c_suelos, 'Moqueta ferial nylon bucle 350g/m²',
 'Moqueta ferial de bucle de nylon, peso 350g/m². Color a elegir de carta. Incluye entrega en recinto y fijación con cinta doble cara de 50mm.',
 0, 0, 0, 'm2', 5.80,
 NULL, 0, 3.00, true, 1.08, 'activa'),

(v_empresa, c_suelos, 'Moqueta velour premium 550g/m²',
 'Moqueta velour alto tráfico 550g/m². Tacto suave y aspecto lujoso. Ideal para stands premium. Incluye cinta doble cara de fijación.',
 0, 0, 0, 'm2', 8.50,
 NULL, 0, 2.50, true, 1.08, 'activa'),

(v_empresa, c_suelos, 'Tarima técnica DM 100mm altura',
 'Tarima técnica de DM lacado, altura 100mm, con superficie vinílica/moqueta. Incluye estructura portante de rastreles cada 40cm. Permite paso de instalaciones.',
 1000, 1000, 100, 'm2', 24.00,
 NULL, 0, 1.20, true, 1.05, 'activa'),

(v_empresa, c_suelos, 'Vinílico laminado imitación madera 5mm',
 'Suelo vinílico laminado 5mm con capa de uso 0.7mm. Patrón madera natural. Instalación sobre tarima mediante clic sin pegamento.',
 180, 1220, 5, 'm2', 11.00,
 NULL, 0, 1.50, true, 1.08, 'activa'),

-- ============================================================
-- TEXTIL, GRÁFICA E IMPRESIÓN (cat 7)
-- ============================================================
(v_empresa, c_grafica, 'Lona frontlit 440g/m² impresa alta resolución',
 'Lona publicitaria frontlit 440g/m² con impresión digital solvente 1440dpi. Tratamiento UV y antifungicida. Ojales cada 50cm en todo el perímetro.',
 0, 0, 0, 'm2', 6.50,
 NULL, 0, 0, true, 1.05, 'activa'),

(v_empresa, c_grafica, 'Vinilo adhesivo impreso mate/brillo',
 'Vinilo autoadhesivo polimérico blanco 80 micras con impresión digital full color. Acabado mate o brillo + laminado UV. Incluye montaje.',
 0, 0, 0, 'm2', 14.00,
 NULL, 0, 0, true, 1.05, 'activa'),

(v_empresa, c_grafica, 'Lona backlit impresa para caja de luz',
 'Lona microperforada backlit para caja de luz, impresión UV 1440dpi. Permite el paso de luz LED trasera sin pérdida de calidad de imagen.',
 0, 0, 0, 'm2', 11.50,
 NULL, 0, 0, true, 1.05, 'activa'),

(v_empresa, c_grafica, 'Letra corpórea DM lacado 20mm 20-30cm',
 'Letra corpórea tridimensional en DM lacado 20mm espesor, altura 20-30cm. Incluye fijación con espárragos. Color corporativo RAL a elegir.',
 NULL, NULL, 200, 'ud', 28.00,
 NULL, 0, 0.80, false, 1.00, 'activa'),

(v_empresa, c_grafica, 'Impresión vinilo suelo antideslizante R10',
 'Vinilo texturizado antideslizante R10 para suelo. Impresión UV directa gran formato. Para gráfica decorativa en suelo de stand.',
 0, 0, 0, 'm2', 24.00,
 NULL, 0, 0, true, 1.08, 'activa'),

-- ============================================================
-- AUDIOVISUAL Y TECNOLOGÍA (cat 8)
-- ============================================================
(v_empresa, c_audiovisual, 'Monitor LED 55" 4K con soporte',
 'Monitor LED 55" 4K UHD (3840x2160) 500cd/m². Incluye soporte de suelo/pared articulado, cable HDMI 3m y regleta. Para loop de vídeo y presentaciones.',
 0, 0, 0, 'ud', 185.00,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_audiovisual, 'Monitor LED 86" 4K gran formato',
 'Monitor LED 86" 4K para grandes presentaciones. Brillo 700cd/m² ideal para stands con mucha luz ambiental. Incluye soporte pared y cables.',
 0, 0, 0, 'ud', 420.00,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_audiovisual, 'Reproductor multimedia HDMI bucle',
 'Reproductor multimedia compacto con salida HDMI. Reproduce bucle automático desde USB/SD. Formatos MP4, AVI, MOV. Incluye mando y cable HDMI 3m.',
 0, 0, 0, 'ud', 38.00,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_audiovisual, 'iPad soporte suelo con seguridad antirrobo',
 'Soporte de suelo para iPad (todos los modelos). Altura regulable. Incluye carcasa antirrobo con llave y cable de seguridad. Para catálogos interactivos.',
 0, 0, 0, 'ud', 42.00,
 NULL, 0, 0, false, 1.00, 'activa'),

-- ============================================================
-- MOBILIARIO (cat 9) - costes de fabricación/taller
-- ============================================================
(v_empresa, c_mobiliario, 'Tapizado bancada mostrador polipiel',
 'Material de tapizado en polipiel para mostradores y bancadas de recepción. Color negro/blanco RAL. Incluye espuma HR35 de 5cm y grapas de fijación.',
 0, 0, 0, 'ml', 18.00,
 NULL, 0, 1.00, true, 1.10, 'activa'),

(v_empresa, c_mobiliario, 'Cristal templado transparente 10mm',
 'Plancha de cristal templado transparente 10mm. Cantos pulidos y biselados. Para mesas, vitrinas y expositores. Corte a medida.',
 2000, 1000, 10, 'm2', 42.00,
 NULL, 0, 0, true, 1.05, 'activa'),

(v_empresa, c_mobiliario, 'Herraje bisagra piano latón 1000mm',
 'Bisagra de piano en latón niquelado 1000x30mm. Para puertas de armarios y almacenes en stand. Incluye tornillería de fijación.',
 1000, 30, NULL, 'ud', 8.50,
 NULL, 0, 0, false, 1.00, 'activa'),

-- ============================================================
-- TRANSPORTE Y LOGÍSTICA (cat 10)
-- ============================================================
(v_empresa, c_transporte, 'Transporte peninsular taller-recinto (ida+vuelta)',
 'Transporte de materiales del taller al recinto ferial peninsular y recogida. Incluye carga, descarga, portes y peajes. Precio por m² de stand.',
 0, 0, 0, 'm2', 3.20,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_transporte, 'Transporte internacional Europa (ida+vuelta)',
 'Transporte internacional a recintos europeos. Incluye documentación aduanera para países UE y seguros de transporte. Precio por m² de stand.',
 0, 0, 0, 'm2', 8.50,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_transporte, 'Alquiler furgón 3.5Tn día completo',
 'Furgón Mercedes Sprinter o similar, 3.5Tn PMA, plataforma 3.5x2.2m. Para transporte de materiales de última hora o imprevistos. Combustible y peajes no incluidos.',
 0, 0, 0, 'ud', 85.00,
 'dia_montaje', 85.00, 0, false, 1.00, 'activa'),

-- ============================================================
-- MONTAJE Y MANO DE OBRA (cat 11)
-- ============================================================
(v_empresa, c_montaje, 'Oficial 1ª carpintería ferial (hora)',
 'Oficial de primera especialista en carpintería y montaje de stands feriales. Montaje de estructura, panelería, tarima y mobiliario. Incluye herramientas manuales.',
 0, 0, 0, 'ud', 28.50,
 'hora', 28.50, 1.00, false, 1.00, 'activa'),

(v_empresa, c_montaje, 'Ayudante carpintería ferial (hora)',
 'Ayudante de carpintería ferial para montaje y desmontaje de stands. Trabaja bajo supervisión de oficial 1ª. Tareas: transporte, sujeción, limpieza.',
 0, 0, 0, 'ud', 19.50,
 'hora', 19.50, 1.00, false, 1.00, 'activa'),

(v_empresa, c_montaje, 'Oficial electricista ferial (hora)',
 'Oficial electricista autorizado para instalación eléctrica de stands. Montaje de cuadros, tendido de mangueras, conexión de iluminación y equipos. Carnet BT vigente.',
 0, 0, 0, 'ud', 34.00,
 'hora', 34.00, 1.00, false, 1.00, 'activa'),

(v_empresa, c_montaje, 'Equipo montaje completo (2 of. + 1 ayud.) jornada',
 'Equipo completo de montaje: 2 oficiales 1ª y 1 ayudante, jornada 8h en recinto. Incluye herramientas, EPIs y coordinación CAE. Rendimiento estimado: 40-60m²/día.',
 0, 0, 0, 'ud', 595.00,
 'dia_montaje', 595.00, 8.00, false, 1.00, 'activa'),

(v_empresa, c_montaje, 'Encargado coordinación obra (día)',
 'Encargado de obra/coordinador presente en el recinto durante montaje. Supervisión técnica, interlocución con organización ferial y firma de documentación CAE.',
 0, 0, 0, 'ud', 220.00,
 'dia_montaje', 220.00, 0, false, 1.00, 'activa'),

(v_empresa, c_montaje, 'Equipo desmontaje 2 operarios jornada',
 'Equipo de 2 operarios para desmontaje de stand. Incluye embalaje de materiales, desmontaje de estructura y carga en camión. Sin transporte.',
 0, 0, 0, 'ud', 380.00,
 'dia_montaje', 380.00, 6.00, false, 1.00, 'activa'),

-- ============================================================
-- SERVICIOS DE FERIA (cat 12)
-- ============================================================
(v_empresa, c_servicios, 'Derecho montaje IFEMA (m²)',
 'Tasa de acceso y derecho de montaje exigido por IFEMA Madrid. Incluye uso de muelles de carga, zonas de descanso y servicios auxiliares. Pago directo al recinto.',
 0, 0, 0, 'm2', 8.75,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_servicios, 'Tasa CAE coordinación empresarial',
 'Tasa de Coordinación de Actividades Empresariales (CAE) obligatoria en recintos feriales. Incluye plan de seguridad y coordinación de empresas concurrentes.',
 0, 0, 0, 'ud', 185.00,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_servicios, 'Seguro RC stand (montaje+feria+desm.)',
 'Póliza de Responsabilidad Civil por daños a terceros durante montaje, celebración y desmontaje. Cobertura mínima 300.000€ según exigencia de recintos.',
 0, 0, 0, 'm2', 0.35,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_servicios, 'Limpieza diaria stand (mañana)',
 'Limpieza profesional cada mañana: aspirado moqueta, limpieza mostradores, vaciado papeleras, limpieza cristales. 1h aproximada para stand de hasta 50m².',
 0, 0, 0, 'ud', 42.00,
 'dia_feria', 42.00, 0, false, 1.00, 'activa'),

(v_empresa, c_servicios, 'Azafata/o información stand (día)',
 'Personal de azafatería para atención e información en stand. Uniforme corporativo incluido. Jornada 8h con descansos según convenio hostelería.',
 0, 0, 0, 'ud', 145.00,
 'dia_feria', 145.00, 0, false, 1.00, 'activa'),

(v_empresa, c_servicios, 'Conexión eléctrica 3kW recinto nacional',
 'Contratación de suministro eléctrico monofásico 3kW para stand. Incluye cuadro de distribución con 2 bases 16A. Gestión ante el recinto.',
 0, 0, 0, 'ud', 195.00,
 'evento_completo', 195.00, 0, false, 1.00, 'activa'),

(v_empresa, c_servicios, 'Conexión eléctrica por kW adicional',
 'Potencia eléctrica adicional a los 3kW base. Precio por kW extra para stands con alta demanda (clima, audiovisuales, cocina).',
 0, 0, 0, 'ud', 65.00,
 'evento_completo', 65.00, 0, false, 1.00, 'activa'),

(v_empresa, c_servicios, 'Conexión WiFi dedicada stand',
 'Conexión WiFi dedicada con ancho de banda mínimo 50Mbps simétrico. Router corporativo con SSID personalizado. Ideal para demostraciones online.',
 0, 0, 0, 'ud', 165.00,
 'evento_completo', 165.00, 0, false, 1.00, 'activa'),

-- ============================================================
-- SEGURIDAD Y CAE (cat 13)
-- ============================================================
(v_empresa, c_seguridad, 'Redactor plan seguridad CAE',
 'Redacción del Plan de Seguridad y Coordinación CAE exigido por el recinto ferial. Incluye memoria técnica de prevención para empresas concurrentes.',
 0, 0, 0, 'ud', 185.00,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_seguridad, 'Extintor polvo ABC 6kg alquiler',
 'Extintor de polvo polivalente ABC 6kg con soporte y señalización. Alquiler por evento completo con certificado de revisión vigente. Obligatorio según normativa.',
 0, 0, 0, 'ud', 22.00,
 'evento_completo', 22.00, 0, false, 1.00, 'activa'),

(v_empresa, c_seguridad, 'Certificado ignífugo materiales',
 'Certificado de reacción al fuego clase M1/B-s2,d0 para materiales del stand (DM ignífugo, lonas, moquetas). Emitido por laboratorio acreditado.',
 0, 0, 0, 'ud', 95.00,
 NULL, 0, 0, false, 1.00, 'activa'),

-- ============================================================
-- DISEÑO, PROYECTO Y DIRECCIÓN (cat 14)
-- ============================================================
(v_empresa, c_diseno, 'Diseño 3D SketchUp/3ds Max renders fotorrealistas',
 'Modelado 3D completo del stand en software profesional. 3 renders fotorrealistas. Hasta 3 revisiones. Formato digital. Incluye versión en baja para email.',
 0, 0, 0, 'ud', 480.00,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_diseno, 'Planos ejecución AutoCAD taller y recinto',
 'Planos técnica de ejecución en AutoCAD: planta, alzados, secciones y detalles para taller. Incluye memoria técnica para aprobación del recinto ferial.',
 0, 0, 0, 'ud', 320.00,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_diseno, 'Gestión documental y permisos recinto',
 'Tramitación completa de documentación ante el recinto: memoria CAE, fichas técnicas de materiales, acreditaciones del personal montador y seguro RC.',
 0, 0, 0, 'ud', 220.00,
 NULL, 0, 0, false, 1.00, 'activa'),

-- ============================================================
-- VARIOS Y GASTOS GENERALES (cat 15)
-- ============================================================
(v_empresa, c_varios, 'Cinta doble cara moqueta 50mm 50m',
 'Cinta adhesiva doble cara específica para fijación de moqueta ferial. Ancho 50mm, bobina 50m. Adhesivo acrílico de alta fijación temporal.',
 0, 0, 0, 'ud', 8.50,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_varios, 'Cinta americana negra 50mm 50m',
 'Cinta americana (duct tape) negra 50mm x 50m. Para fijaciones temporales, sujeción de cables y retoques en moqueta.',
 0, 0, 0, 'ud', 3.80,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_varios, 'Brida nylon negra 200mm (100 uds)',
 'Brida de nylon negra 200mm, resistencia a tracción 80kg. Para sujeción de cables y fijaciones ligeras. Bolsa de 100 unidades.',
 0, 0, 0, 'ud', 0.12,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_varios, 'Pieza planta natural decorativa grande',
 'Planta natural decorativa de gran tamaño (Ficus o Kentia) en maceta decorativa. Altura total aprox 180cm. Para decoración de stands. Incluye riego y mantenimiento durante la feria.',
 NULL, NULL, 1800, 'ud', 25.00,
 'dia_feria', 8.00, 0, false, 1.00, 'activa'),

(v_empresa, c_varios, 'Maceta decorativa diseño 40cm diámetro',
 'Maceta decorativa de diseño en fibra de vidrio lacada. 40cm diámetro x 35cm alto. Color blanco/negro. Para plantas decorativas en stand.',
 400, NULL, 350, 'ud', 22.00,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_varios, 'Agua embotellada 50cl (botella)',
 'Agua mineral natural embotellada 50cl. Para zona de reuniones y atención al visitante. Servicio incluye reposición diaria.',
 0, 0, 0, 'ud', 0.45,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_varios, 'Café cápsulas surtido (caja 50 uds)',
 'Cápsulas de café compatibles Nespresso. Surtido: 20 intenso, 20 descafeinado, 10 varietal. Para zona de reuniones y atención a clientes.',
 0, 0, 0, 'ud', 0.35,
 NULL, 0, 0, false, 1.00, 'activa'),

(v_empresa, c_varios, 'Tarjeta visita premium cartón reciclado 350g',
 'Tarjeta de visita en cartón reciclado 350g con impresión offset a una tinta. Personalizada con logo y datos contacto. Pack de 100 unidades.',
 0, 0, 0, 'ud', 0.18,
 NULL, 0, 0, false, 1.00, 'activa');

END $$;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT
  id_categoria_matriz as cat,
  COUNT(*) as total,
  MIN(precio_coste_unidad_medida) as precio_min,
  MAX(precio_coste_unidad_medida) as precio_max
FROM public.tarifas_servicios
GROUP BY id_categoria_matriz
ORDER BY id_categoria_matriz;
