# Arquitectura del Sistema - Oficios Barriales

## 1. Visión General del Proyecto
**Proyecto**: Oficios Barriales  
**Organización**: Impulso Barrial RIV S.A.S.  
**Dominio de Producción / Fantasía**: `oficiosbarriales.com.ar`  
**Propósito**: Conectar a trabajadores de oficios independientes de barrios periféricos de Río Cuarto (Alberdi, Banda Norte, IPV, etc.) con vecinos que demandan servicios técnicos y de mantenimiento del hogar confiables, rápidos y de cercanía.

---

## 2. Decisiones de Alto Nivel y Enfoque Arquitectónico

### 2.1 Tipo de Aplicación
- **Single Page Application (SPA)**: Aplicación web responsiva basada en un único punto de entrada (`index.html`).
- **Zero-Build Pipeline**: No requiere bundlers (ni Webpack, ni Vite), ni compiladores, garantizando despliegues ultra rápidos, portabilidad absoluta y facilidad de mantenimiento.
- **Client-Side Rendering & State**: Toda la interactividad, filtrado y renderizado dinámico se procesa directamente en el navegador del cliente con respuesta instantánea (0 recargas de página).

### 2.2 Tech Stack
| Capa | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Markup** | HTML5 Semántico | Accesibilidad (ARIA), indexación SEO local y compatibilidad universal. |
| **Estilos** | Tailwind CSS v3 (vía CDN) | Desarrollo ágil, diseño Mobile-First y utilidades estándar de clase para Dark Mode. |
| **Lógica** | JavaScript Vanilla Modular (ES6+) | Máximo rendimiento sin sobrecarga de frameworks, sintaxis moderna y desacoplamiento funcional. |
| **Persistencia** | LocalStorage API | Almacenamiento local para simular base de datos persistente (nuevos registros, favoritos, preferencias de tema). |
| **Hosting & CI/CD** | Vercel / Netlify (Free Plan) + GitHub | Despliegue estático continuo, SSL automático y CDN global. |

---

## 3. Estructura de Directorios del Repositorio

```text
EfiPossetto/
├── index.html                   # Entry point único de la SPA
├── assets/                      # Recursos estáticos
│   ├── css/                     # Estilos complementarios si aplica
│   ├── img/                     # Logotipos de Impulso Barrial e iconos
│   └── icons/                   # SVG icons para rubros y UI
├── js/                          # Lógica modular Vanilla ES6+
│   ├── data.js                  # Dataset inicial semilla (mock de profesionales y barrios)
│   ├── storage.js               # Capa de abstracción sobre LocalStorage (CRUD seguro)
│   ├── ui.js                    # Manipulación del DOM, catálogo y renderizado de estados
│   ├── filters.js               # Lógica de filtrado combinable (Rubro + Barrio)
│   ├── modal.js                 # Control del modal de perfil detallado y contacto
│   ├── form.js                  # Validación del formulario "Sumate como Profesional"
│   ├── theme.js                 # Gestión de Dark/Light mode y persistencia de preferencia
│   └── app.js                   # Coordinador principal / inicializador de la SPA
├── docs/                        # Contexto vivo de ingeniería
│   └── contexto/
│       ├── arquitectura.md      # Este documento
│       ├── decisiones.md        # ADRs y trade-offs
│       ├── convenciones.md      # Estándares de código y buenas prácticas
│       ├── glosario.md          # Dominio y términos clave
│       ├── flujo.md             # Diagramas de secuencia y flujos de usuario
│       └── errores.md           # Bitácora de incidencias y soluciones
└── .agents/                     # Sistema Operativo Antigravity
    ├── rules/
    │   └── antigravity_global_rules.md
    └── memory/
        ├── engram.json
        └── mem_save.md
```

---

## 4. Modelo de Datos del Cliente (Entidades)

### 4.1 Entidad `UsuarioDemo` (Autenticación Demo)
```javascript
{
  id: "user_carlos",
  email: "carlos@demo.com",
  nombre: "Carlos Peralta (Tato)",
  rol: "profesional",             // "cliente" | "profesional"
  linkedProfessionalId: "prof_001", // Solo para rol profesional
  avatar: "https://images.unsplash.com/..."
}
```

### 4.2 Entidad `Profesional`
```javascript
{
  id: "prof_001",
  nombre: "Carlos 'Tato' Peralta",
  rubro: "Electricidad",         // Electricidad, Plomería, Albañilería, Gasista, Pintura, etc.
  barrio: "Alberdi",             // Alberdi, Banda Norte, IPV, Centro, Bimaco, etc.
  telefono: "3584112233",        // Formato local sanitizado a internacional wa.me/549358...
  experiencia: "14 años de experiencia",
  matricula: "ERSeP Cat. III - Mat. 4812", // Opcional (string | null): Muestra badge condicional
  descripcion: "Instalaciones domiciliarias e industriales, recableado y urgencias 24hs.",
  calificacion: 4.9,             // Promedio recalculado dinámicamente según reseñas
  resenasCount: 3,               // Conteo acumulado de reseñas
  verificado: true,              // Badge de verificación por Impulso Barrial RIV S.A.S.
  destacado: true,               // Nivel de membresía (Freemium: true para destacados)
  foto: "data:image/png;base64,...", // Foto de perfil (Base64 o URL)
  galeria: [                     // Galería de trabajos realizados (Base64 o URLs)
    "https://images.unsplash.com/...",
    "data:image/jpeg;base64,..."
  ],
  fechaRegistro: "2026-03-15"
}
```

### 4.3 Entidad `Reseña`
```javascript
{
  id: "rev_001",
  profesionalId: "prof_001",
  autorNombre: "Sofía Martínez",
  autorEmail: "sofia@demo.com",
  calificacion: 5,               // Entero de 1 a 5 estrellas
  comentario: "Excelente electricista, resolvió el cortocircuito en menos de 1 hora.",
  fecha: "2026-10-28"
}
```

### 4.4 Esquema de LocalStorage
- `ob_profesionales`: Array serializado con los profesionales registrados o modificados por el usuario.
- `ob_active_user`: Objeto con la sesión simulada del usuario activo (`sofia@demo.com` o `carlos@demo.com`).
- `ob_reviews`: Array serializado con todas las reseñas comunitarias (semilla + publicadas por clientes).
- `ob_theme`: String `'dark'` | `'light'` indicando la preferencia visual activa.
- `ob_favoritos`: Array de IDs de profesionales marcados como favoritos por el vecino.

---

## 5. Integración con Canales Externos
- **WhatsApp Direct Contact**: Cada ficha de profesional incluye un enlace `https://wa.me/{telefono}?text={mensaje}` con texto predefinido que contextualiza la consulta del vecino.
- **Institucional**: Enlaces al pie para GMail, Facebook, Instagram, YouTube y Google Forms para capturar feedback de la comunidad.
