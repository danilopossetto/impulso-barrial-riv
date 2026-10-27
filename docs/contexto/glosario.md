# Glosario de Términos del Dominio - Oficios Barriales

Este glosario define el vocabulario común y los conceptos clave del proyecto para alinear al equipo técnico, stakeholders y usuarios.

---

## 1. Entidades y Actores

### Impulso Barrial RIV S.A.S.
Entidad impulsora y administradora de la plataforma en la ciudad de Río Cuarto (Córdoba). Su objetivo es la inclusión productiva, la formalización y la digitalización de trabajadores de oficios barriales.

### Profesional / Trabajador de Oficio
Trabajador autónomo o cuentapropista que ofrece servicios técnicos, de mantenimiento o mejoras para el hogar en la ciudad de Río Cuarto (gasistas, electricistas, plomeros, albañiles, pintores, jardineros, etc.).

### Vecino / Contratante
Habitante de Río Cuarto que utiliza la plataforma para localizar a profesionales cercanos geográficamente a su domicilio, verificar su reputación y contactarlos de forma directa.

---

## 2. Conceptos de Negocio y Clasificación

### Rubro
Categoría de especialidad técnica a la que pertenece el servicio ofrecido por el profesional. Ejemplos principales:
- **Electricidad**: Instalaciones domiciliarias, tableros, recableado.
- **Plomería**: Cañerías, cloacas, instalación de sanitarios y termotanques.
- **Gasista**: Instalaciones matriculadas, pruebas de hermeticidad, artefactos.
- **Albañilería**: Refacciones, mampostería, revoques, pisos.
- **Pintura**: Pintura de interiores, frentes, impermeabilizaciones.
- **Jardinería**: Mantenimiento de parques, podas, sistemas de riego.
- **Herrería / Cerrajería**: Rejas, portones, aperturas de emergencia.

### Barrio (Localidad Río Cuarto)
División territorial urbana de la ciudad de Río Cuarto para promover la contratación por proximidad:
- **Alberdi**: Barrio histórico con alta demanda de servicios domiciliarios.
- **Banda Norte**: Sector residencial y comercial al norte del río.
- **IPV / Viviendas Sociales**: Conjuntos habitacionales periféricos con necesidad de visibilizar talentos locales.
- **Centro**: Zona céntrica y comercial.
- **Bimaco, Castelli, Golf, Universidad, Las Delicias**: Otros barrios clave de la traza urbana de Río Cuarto.

### Perfil Verificado
Distintivo visual (badge verde con tilde de verificación) otorgado a aquellos profesionales cuyos antecedentes de oficio, identidad o referencias fueron validadas por el equipo de Impulso Barrial RIV S.A.S.

### Perfil Destacado (Freemium)
Profesionales suscritos al modelo de abono mensual. Aparecen destacados en la parte superior del catálogo con un marco de acento, badge de prioridad y mayor visibilidad en búsquedas generales.

---

## 3. Conceptos Técnicos y de Interfaz

### Single Page Application (SPA)
Arquitectura donde la aplicación se ejecuta dentro de un único archivo HTML (`index.html`), navegando y filtrando información dinámicamente mediante JavaScript sin recargas de página completas.

### WhatsApp Direct Link (CTA)
Enlace URI estructurado (`https://wa.me/{telefono}?text=...`) que abre la app de WhatsApp del vecino con un mensaje contextualizado, reduciendo la fricción de contacto a cero.

### Toast Notification
Componente emergente visual transitorio que confirma al usuario el éxito o fracaso de una acción (por ejemplo, registro completado o enlace copiado) sin interrumpir la navegación.

### 4 Estados de UI (DoD)
- **Loading**: Vista de carga inmediata durante transiciones de datos.
- **Empty State**: Vista ilustrada cuando una consulta de filtro no encuentra registros.
- **Error State**: Mensajes de alerta y validación en campos inválidos del formulario.
- **Success State**: Confirmación visual clara y feedback positivo tras completar una acción.
