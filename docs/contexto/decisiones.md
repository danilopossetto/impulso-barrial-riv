# Registro de Decisiones de Arquitectura (ADRs)

Este documento registra las decisiones clave tomadas en el proyecto **Oficios Barriales - Impulso Barrial RIV S.A.S.**, detallando el contexto, las alternativas evaluadas y las justificaciones técnicas.

---

## [ADR-001] Activación del Antigravity Operating System (AOS)
* **Fecha**: 2026-10-26
* **Estado**: Aprobado / En vigor
* **Contexto**: Se requiere un estándar riguroso de ingeniería, comunicación orientada al negocio (explicar el POR QUÉ antes del CÓMO), control de guardas para proteger la lógica de dominio y un ciclo de vida con Definition of Done (DoD) estricto.
* **Decisión**: Implementación de `.agents/rules/antigravity_global_rules.md` vinculada con `GEMINI.md` bajo el trigger `always_on`, gobernando todas las fases de desarrollo.

---

## [ADR-002] Adopción de Arquitectura SPA "Zero-Build" (HTML5 + Tailwind CDN + Vanilla JS)
* **Fecha**: 2026-10-26
* **Estado**: Aprobado
* **Contexto**: El proyecto requiere máxima velocidad de carga, simplicidad operativa y portabilidad sin dependencias complejas de compilación (Node.js runtime serverless/bundlers pesados).
* **Alternativas Evaluadas**:
  1. *React / Vue con Vite*: Mayor sobrecarga inicial, dependencias de build y curva de configuración innecesaria para un MVP de catálogo barrial.
  2. *HTML5 + Tailwind CDN + JS Vanilla modular*: Despliegue estático directo en Vercel/Netlify, depuración transparente y rendimiento óptimo en dispositivos móviles de gama baja.
* **Decisión**: Implementar una Single Page Application (SPA) pura basada en `index.html` con JavaScript ES6+ desacoplado en módulos nativos y TailwindCSS v3 servido vía CDN.

---

## [ADR-003] Modelo de Persistencia Híbrido: Dataset Base (`data.js`) + `LocalStorage`
* **Fecha**: 2026-10-26
* **Estado**: Aprobado
* **Contexto**: Para el MVP no se dispondrá inmediatamente de una base de datos relacional en backend (PostgreSQL/Node/Express), pero se exige persistencia real al registrar nuevos profesionales ("Sumate como Profesional") y guardar favoritos o configuración de tema.
* **Decisión**:
  - Se provee una semilla inicial con perfiles representativos de Río Cuarto (Alberdi, Banda Norte, IPV, etc.) en `data.js`.
  - La capa `storage.js` fusiona en memoria los registros base con los datos agregados por el usuario almacenados en `LocalStorage` (`ob_profesionales`).
  - Esto garantiza interactividad completa sin costos de infraestructura backend en la fase inicial.

---

## [ADR-004] Integración de Contacto Directo vía WhatsApp en lugar de Chat In-App
* **Fecha**: 2026-10-26
* **Estado**: Aprobado
* **Contexto**: Los vecinos y trabajadores barriales en Río Cuarto utilizan WhatsApp como su principal herramienta de comunicación diaria. Un chat interno dentro de la app generaría fricción, requeriría notificaciones push complejas y demoraría la adopción.
* **Decisión**: Cada tarjeta y modal de profesional incluye un botón de acción principal (CTA) que abre un enlace `https://wa.me/{telefono}?text=...` con un mensaje estructurado indicando el rubro y la intención de contratación.

---

## [ADR-005] Identidad Visual: Paleta "Azul Noche" y "Naranja Impulso" con Soporte Dark/Light Mode
* **Fecha**: 2026-10-26
* **Estado**: Aprobado
* **Contexto**: La aplicación debe transmitir confianza, profesionalismo y cercanía barrial. Se debe garantizar accesibilidad y comodidad de lectura tanto de día como de noche.
* **Decisión**:
  - **Color Primario (Fondo/Estructura)**: Azul Noche (`#0f172a`, `slate-900`) para solidez y elegancia.
  - **Color de Acento (CTA/Acciones)**: Naranja Impulso (`#f97316`, `orange-500`) para dinamismo, llamados a la acción y representación de la energía trabajadora.
  - Soporte nativo para alternancia de modo oscuro/claro mediante clases `.dark` en la raíz `<html>`, persistiendo la selección en `LocalStorage`.

---

## [ADR-006] Estrategia de Monetización Freemium y Publicidad Local
* **Fecha**: 2026-10-26
* **Estado**: Aprobado
* **Contexto**: Impulso Barrial RIV S.A.S. requiere sostenibilidad económica sin cerrar el acceso a trabajadores con menores recursos.
* **Decisión**:
  - **Nivel Básico (Gratuito)**: Registro y aparición en el catálogo general sin costo.
  - **Nivel Destacado (Abono Mensual)**: Pin en los primeros resultados de búsqueda, badge dorado "Destacado", mayor visibilidad en el modal.
  - **Espacios para Comercios Locales**: Banners integrados no invasivos de ferreterías, corralones y repuesteras de Río Cuarto.

---

## [ADR-007] Verificación Visual Obligatoria de 4 Estados de UI (DoD)
* **Fecha**: 2026-10-26
* **Estado**: Aprobado
* **Contexto**: Las interfaces de usuario deben comunicar claramente el estado del sistema para evitar confusión o abandono por parte del vecino.
* **Decisión**: Toda vista o interacción debe implementar:
  1. ⏳ **Loading State**: Feedback ante filtrado o simulación de carga.
  2. 📭 **Empty State**: Ilustración y mensaje motivador cuando no haya resultados en el filtro Rubro + Barrio.
  3. ⚠️ **Error State**: Validación visual de campos con mensajes claros en el formulario de registro.
  4. ✅ **Success State**: Notificación Toast emergente confirmando acciones exitosas (registro, copia de teléfono, guardado).

---

## [ADR-008] Sistema de Autenticación Rápida Demo y Roles Dinámicos (Cliente vs Profesional)
* **Fecha**: 2026-11-03
* **Estado**: Aprobado
* **Contexto**: Para la evaluación académica y demostraciones en vivo sin backend, se requiere simular la experiencia completa de dos roles esenciales: Vecino/Cliente (que busca y califica) y Profesional (que gestiona su propio perfil y muestra su trabajo).
* **Decisión**:
  - Implementar selector visual en la barra de navegación y modal de Login con 1 clic para cuentas pre-cargadas (`sofia@demo.com` rol Cliente, `carlos@demo.com` rol Profesional).
  - Persistencia del usuario activo en `ob_active_user` en `LocalStorage`.
  - Roles adaptativos:
    - **Cliente**: Acceso exclusivo para enviar calificaciones (1 a 5 estrellas) y opiniones en el modal de detalle.
    - **Profesional**: Acceso exclusivo al panel modal "Mi Perfil & Trabajos" con subida múltiple de fotos a la galería de trabajos mediante FileReader API (Base64) y edición de datos técnicos.

---

## [ADR-009] Matrícula Técnica Opcional con Badge Condicional y Reseñas en Tiempo Real
* **Fecha**: 2026-11-03
* **Estado**: Aprobado
* **Contexto**: No todos los trabajadores independientes cuentan con matrícula habilitante (ej. plomeros prácticos, jardineros), pero aquellos que sí la tienen (ej. electricistas ERSeP, gasistas matriculados Ecogas) necesitan certificarla para diferenciarse y generar confianza. Además, las reseñas comunitarias deben recalcular la reputación en vivo.
* **Decisión**:
  - Campo `matricula` estrictamente opcional tanto en el formulario de registro como en la edición de perfil.
  - Si el profesional registra su matrícula (ej. `"ERSeP Cat. III - Mat. 4812"`), se renderiza automáticamente un badge visual destacado `Matriculado` en su modal de detalle. Si no la posee (`null` o vacío), no se muestra badge ni se bloquea el registro con errores.
  - Al recibir una nueva reseña de un cliente autenticado, las estadísticas (`calificacion` promedio y `resenasCount`) se recalculan inmediatamente en memoria y se sincronizan en `LocalStorage` (`ob_reviews`), actualizando las tarjetas del catálogo y el modal sin recargar la página.

