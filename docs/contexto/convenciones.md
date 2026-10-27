# Convenciones de Código y Estándares de Ingeniería

Este documento establece las pautas de estilo, nomenclatura y buenas prácticas que rigen el desarrollo de **Oficios Barriales - Impulso Barrial RIV S.A.S.**, garantizando consistencia, legibilidad y mantenibilidad.

---

## 1. Principios de Diseño de Código
1. **Responsabilidad Única (SRP)**: Cada función y archivo debe resolver un único problema bien delimitado.
2. **KISS & YAGNI**: Mantener la solución lo más simple posible; no sobrediseñar abstracciones para necesidades futuras hipotéticas.
3. **Inmutabilidad y Funciones Puras**: Privilegiar métodos que no muten datos globales directamente (usar `.map()`, `.filter()`, `.reduce()` o copias con spread operator `...`).
4. **Manejo Defensivo de Errores**: Siempre envolver accesos a APIs del navegador (como `LocalStorage` y `navigator.clipboard`) en bloques `try...catch`.

---

## 2. Nomenclatura en JavaScript (ES6+)

| Elemento | Convención | Ejemplo |
| :--- | :--- | :--- |
| **Variables y Funciones** | `camelCase` | `renderProfessionals()`, `activeFilter`, `isModalOpen` |
| **Constantes Globales** | `SCREAMING_SNAKE_CASE` | `STORAGE_KEYS`, `DEFAULT_THEME`, `MAX_DESCRIPTION_LENGTH` |
| **Clases / Constructores** | `PascalCase` | `ToastNotification`, `StorageService` |
| **Archivos de Script** | `kebab-case.js` o `camelCase.js` | `data.js`, `storage.js`, `ui.js`, `filters.js` |
| **Identificadores DOM** | `kebab-case` | `id="filter-rubro"`, `id="professionals-grid"` |

---

## 3. Estándares de HTML5 y Tailwind CSS

### 3.1 Semántica HTML5
- Usar etiquetas con significado semántico: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`.
- Para botones de acción usar siempre `<button type="button">` y para enlaces a URLs externas usar `<a href="..." target="_blank" rel="noopener noreferrer">`.
- Accesibilidad (A11y): Añadir `aria-label`, `aria-hidden` y roles accesibles en modales, botones de cierre e iconos decorativos.

### 3.2 Organización de Clases Tailwind
Seguir el orden recomendado de utilidades Mobile-First:
1. Posicionamiento (`relative`, `absolute`, `fixed`, `z-10`)
2. Box Model / Display (`flex`, `grid`, `block`, `w-full`, `max-w-md`, `p-4`, `m-2`)
3. Tipografía (`text-sm`, `font-semibold`, `tracking-wide`, `text-slate-900`)
4. Colores y Fondos (`bg-white`, `dark:bg-slate-900`, `border`, `border-orange-500`)
5. Estados interactivos y transiciones (`hover:bg-orange-600`, `transition-all`, `duration-200`, `focus:ring-2`)

### 3.3 Colores de Identidad en Tailwind
- **Fondo / Textos Principales**: `slate-900` (`#0f172a`), `slate-800`, `slate-100`.
- **Acento Primario**: `orange-500` (`#f97316`), `orange-600` (`#ea580c`).
- **Verificación**: `emerald-500` (`#10b981`).
- **Alerta / Error**: `rose-500` (`#f43f5e`).

---

## 4. Convenciones de Persistencia (`LocalStorage`)

1. **Namespace de Claves**: Todas las claves almacenadas en el navegador deben llevar el prefijo `ob_` (Oficios Barriales) para evitar colisiones:
   - `ob_profesionales`: Lista de profesionales creados por el usuario.
   - `ob_theme`: Valor `'dark'` o `'light'`.
   - `ob_favoritos`: Lista de IDs guardados.
2. **Serialización Segura**:
   ```javascript
   function getStoredData(key, fallback = []) {
     try {
       const item = localStorage.getItem(key);
       return item ? JSON.parse(item) : fallback;
     } catch (error) {
       console.error(`Error al leer clave ${key} de LocalStorage:`, error);
       return fallback;
     }
   }
   ```

---

## 5. Implementación de los 4 Estados de UI (DoD)

1. ⏳ **Loading State**: Se activará un spinner o skeleton animado con Tailwind (`animate-pulse`) durante transiciones de filtro o carga inicial.
2. 📭 **Empty State**: Cuando la combinación de `Rubro + Barrio` no arroje profesionales, se debe renderizar un contenedor con icono descriptivo, mensaje claro (*"No encontramos profesionales en este barrio para el rubro seleccionado"*) y botón para limpiar filtros.
3. ⚠️ **Error State**: Validaciones de formulario con feedback visual (borde rojo, texto explicativo debajo del input) y bloqueo de envío hasta corregir.
4. ✅ **Success State**: Notificación Toast flotante temporal (3-5 segundos) con animación de entrada/salida y confirmación visual clara.
