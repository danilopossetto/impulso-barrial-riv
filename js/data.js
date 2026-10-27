/**
 * Oficios Barriales - Impulso Barrial RIV S.A.S.
 * Semilla inicial de datos para Río Cuarto (Córdoba).
 */

const BARRIOS_RIO_CUARTO = [
  "Todos los barrios",
  "Alberdi",
  "Banda Norte",
  "Centro",
  "IPV Alberdi",
  "Bimaco",
  "Castelli",
  "Las Delicias",
  "Golf Club",
  "Universidad"
];

const RUBROS_OFICIOS = [
  "Todos los rubros",
  "Electricidad",
  "Plomería",
  "Gasista Matriculado",
  "Albañilería",
  "Pintura",
  "Jardinería",
  "Cerrajería",
  "Climatización"
];

const INITIAL_PROFESSIONALS = [
  {
    id: "prof_001",
    nombre: "Carlos \"Tato\" Peralta",
    rubro: "Electricidad",
    barrio: "Alberdi",
    telefono: "3584112233",
    experiencia: "14 años de experiencia",
    descripcion: "Especialista en instalaciones eléctricas residenciales y comerciales, recableado integral, armado de tableros, detección de fugas y urgencias.",
    calificacion: 4.9,
    resenasCount: 38,
    verificado: true,
    destacado: true,
    disponibilidad: "Lunes a Sábado (Urgencias 24hs)",
    servicios: ["Instalaciones domiciliarias", "Tableros eléctricos", "Certificaciones ERSeP", "Iluminación LED"],
    imagenUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prof_002",
    nombre: "Mariana Rossi",
    rubro: "Plomería",
    barrio: "Banda Norte",
    telefono: "3584223344",
    experiencia: "9 años de experiencia",
    descripcion: "Plomería general, reparación de cañerías por termofusión, destape de cloacas y desagües, instalación de griferías y tanques de reserva.",
    calificacion: 4.8,
    resenasCount: 29,
    verificado: true,
    destacado: true,
    disponibilidad: "Lunes a Viernes de 8 a 18 hs",
    servicios: ["Termofusión de agua", "Desagües y cloacas", "Bombas presurizadoras", "Tanques de agua"],
    imagenUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prof_003",
    nombre: "Esteban Gómez",
    rubro: "Albañilería",
    barrio: "IPV Alberdi",
    telefono: "3584334455",
    experiencia: "18 años de oficio",
    descripcion: "Construcción tradicional, ampliaciones de vivienda, colocación de pisos porcelanatos y cerámicos, revoques finos y gruesos, medianeras.",
    calificacion: 4.7,
    resenasCount: 24,
    verificado: true,
    destacado: false,
    disponibilidad: "Lunes a Sábado de 7 a 17 hs",
    servicios: ["Ampliaciones y refacciones", "Colocación de cerámicos", "Revoques y contrapisos", "Mampostería"],
    imagenUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prof_004",
    nombre: "Lucas Benítez",
    rubro: "Pintura",
    barrio: "Centro",
    telefono: "3584556677",
    experiencia: "11 años de experiencia",
    descripcion: "Pintura de frentes y medianeras con silletas/andamios, interiores, tratamiento de humedad, impermeabilizaciones y revestimiento plástico texturado.",
    calificacion: 5.0,
    resenasCount: 45,
    verificado: true,
    destacado: true,
    disponibilidad: "Lunes a Sábado de 8 a 19 hs",
    servicios: ["Pintura interior/exterior", "Impermeabilización de techos", "Revestimiento texturado", "Tratamiento antihumedad"],
    imagenUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prof_005",
    nombre: "Roberto Domínguez",
    rubro: "Jardinería",
    barrio: "Bimaco",
    telefono: "3584667788",
    experiencia: "7 años de oficio",
    descripcion: "Mantenimiento integral de jardines y parques, corte de césped, poda de árboles y cercos vivos, colocación de césped en panes y fumigaciones ecológicas.",
    calificacion: 4.6,
    resenasCount: 18,
    verificado: false,
    destacado: false,
    disponibilidad: "Lunes a Viernes de 7:30 a 18 hs",
    servicios: ["Corte de césped con motoguadaña", "Poda de altura", "Siembra y panes de césped", "Limpieza de terrenos"],
    imagenUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prof_006",
    nombre: "Valeria Toledo",
    rubro: "Cerrajería",
    barrio: "Banda Norte",
    telefono: "3584778899",
    experiencia: "10 años de experiencia",
    descripcion: "Apertura de urgencia de puertas residenciales y de vehículos sin rotura. Cambio y reparación de cerraduras de seguridad, copias y cerrojos multipunto.",
    calificacion: 4.9,
    resenasCount: 31,
    verificado: true,
    destacado: false,
    disponibilidad: "Servicio de Guardia 24 Horas",
    servicios: ["Aperturas de emergencia 24hs", "Cerraduras computarizadas", "Apertura de autos", "Cierrapuertas y cerrojos"],
    imagenUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prof_007",
    nombre: "Martín Sosa",
    rubro: "Gasista Matriculado",
    barrio: "Castelli",
    telefono: "3584889900",
    experiencia: "16 años de experiencia",
    descripcion: "Gasista matriculado ante Ecogas. Habilitación de instalaciones, prueba de hermeticidad manométrica, reparación de calefones, termotanques y cocinas.",
    calificacion: 4.9,
    resenasCount: 36,
    verificado: true,
    destacado: true,
    disponibilidad: "Lunes a Sábado de 8 a 20 hs",
    servicios: ["Habilitaciones ante Ecogas", "Reparación de artefactos", "Pruebas de hermeticidad", "Planos conforme a obra"],
    imagenUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80"
  }
];

// Asignación global para navegador (Zero-Build)
if (typeof window !== 'undefined') {
  window.BARRIOS_RIO_CUARTO = BARRIOS_RIO_CUARTO;
  window.RUBROS_OFICIOS = RUBROS_OFICIOS;
  window.INITIAL_PROFESSIONALS = INITIAL_PROFESSIONALS;
}

// Compatibilidad con entornos Node.js / testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BARRIOS_RIO_CUARTO, RUBROS_OFICIOS, INITIAL_PROFESSIONALS };
}
