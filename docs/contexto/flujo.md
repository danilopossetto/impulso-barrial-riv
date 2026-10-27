# Flujos de Usuario e Interacción del Sistema

Este documento describe los flujos operativos fundamentales de **Oficios Barriales - Impulso Barrial RIV S.A.S.** utilizando diagramas de secuencia y estados.

---

## 1. Flujo Principal: Búsqueda, Filtrado y Contacto vía WhatsApp

El vecino ingresa a la plataforma, filtra por necesidad geográfica y técnica, examina las credenciales del profesional y se comunica directamente.

```mermaid
sequenceDiagram
    autonumber
    actor Vecino as Vecino de Río Cuarto
    participant UI as Catálogo SPA (index.html)
    participant Filters as Módulo de Filtros (filters.js)
    participant Modal as Modal de Detalle (modal.js)
    participant WhatsApp as WhatsApp Web / App

    Vecino->>UI: Ingresa a la plataforma
    UI->>UI: Renderiza catálogo inicial (Destacados + Base)
    Vecino->>UI: Selecciona Rubro (ej. "Electricidad") y Barrio (ej. "Alberdi")
    UI->>Filters: Dispara evento de cambio en selectores
    Filters->>Filters: Aplica intersección de criterios (Rubro && Barrio)
    alt Existen profesionales que coinciden
        Filters->>UI: Retorna lista filtrada
        UI->>UI: Renderiza tarjetas en grid
    else No hay coincidencias
        Filters->>UI: Retorna array vacío []
        UI->>UI: Renderiza Vista "Empty State" (con botón para restablecer filtros)
    end

    Vecino->>UI: Clic en "Ver Perfil y Contactar"
    UI->>Modal: Abre modal con biografía, rating y reseñas
    Vecino->>Modal: Clic en botón "Contactar por WhatsApp"
    Modal->>WhatsApp: Redirige a wa.me/+549358...?text=Hola...
    WhatsApp-->>Vecino: Abre conversación directa con el profesional
```

---

## 2. Flujo de Registro: "Sumate como Profesional"

Permite a los trabajadores de oficios incorporarse a la plataforma de forma autónoma.

```mermaid
sequenceDiagram
    autonumber
    actor Profesional as Trabajador de Oficio
    participant Form as Formulario de Registro (form.js)
    participant Storage as Gestor de Persistencia (storage.js)
    participant UI as Catálogo y UI (ui.js)
    participant Toast as Notificación Toast

    Profesional->>Form: Clic en botón "Sumate como Profesional"
    Form->>Form: Despliega modal o sección de registro
    Profesional->>Form: Completa datos (Nombre, Rubro, Barrio, Teléfono, Descripción)
    Profesional->>Form: Clic en "Publicar mi Perfil"

    alt Datos inválidos o campos vacíos
        Form->>Form: Marca inputs en rojo y muestra mensajes de error (Error State)
    else Datos válidos
        Form->>Storage: saveProfessional(nuevoRegistro)
        Storage->>Storage: Serializa y guarda en LocalStorage ('ob_profesionales')
        Storage-->>UI: Notifica nuevo registro disponible
        UI->>UI: Inserta dinámicamente la nueva tarjeta en el catálogo
        Form->>Toast: Muestra notificación emergente (Success State)
        Form->>Form: Limpia y cierra el formulario
    end
```

---

## 3. Flujo de Alternancia de Tema (Dark / Light Mode)

```mermaid
graph TD
    A[Inicio / Carga de Página] --> B{Existe 'ob_theme' en LocalStorage?}
    B -- Sí --> C[Aplica preferencia guardada: 'dark' o 'light']
    B -- No --> D{Preferencia del SO 'prefers-color-scheme'?}
    D -- Dark --> E[Aplica clase 'dark' a html]
    D -- Light --> F[Remueve clase 'dark']
    
    G[Usuario pulsa botón Theme Toggle] --> H{html tiene clase 'dark'?}
    H -- Sí --> I[Remueve 'dark' y guarda 'light' en LocalStorage]
    H -- No --> J[Agrega 'dark' y guarda 'dark' en LocalStorage]
    I --> K[Actualiza icono Sol/Luna en UI]
    J --> K
```

---

## 4. Matriz de Estados de la Interfaz (DoD)

```text
[Interacción / Evento]
       |
       +---> Transición asíncrona / Filtrado -----> ⏳ LOADING STATE (Skeleton / Spinner)
       |
       +---> Filtro sin coincidencias ------------> 📭 EMPTY STATE (Mensaje + Reset button)
       |
       +---> Formulario con datos inválidos ------> ⚠️ ERROR STATE (Bordes rojos + feedback)
       |
       +---> Registro exitoso / Acción OK --------> ✅ SUCCESS STATE (Toast flotante)
```
