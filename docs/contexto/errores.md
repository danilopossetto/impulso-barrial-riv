# Bitácora de Errores, Riesgos Técnicos y Lecciones Aprendidas

Este documento recopila incidencias potenciales, casos de borde y lecciones técnicas aprendidas para el proyecto **Oficios Barriales - Impulso Barrial RIV S.A.S.**, garantizando robustez y degradación elegante.

---

## 1. Riesgos Técnicos Identificados y Soluciones Preventivas

### 1.1 FOUC (Flash of Unstyled Content) en Carga de Modo Oscuro
* **Síntoma**: Parpadeo blanco molesto en pantallas configuradas con tema oscuro antes de que JavaScript termine de evaluar `LocalStorage`.
* **Causa Raíz**: El script de evaluación de tema se ejecuta al final del `<body>` en lugar de en el `<head>`.
* **Solución**: Colocar un script inline mínimo y bloqueante en el `<head>` antes de los estilos:
  ```html
  <script>
    if (localStorage.getItem('ob_theme') === 'dark' || (!('ob_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  </script>
  ```

---

### 1.2 Formateo Incorrecto de Teléfonos Argentinos para WhatsApp
* **Síntoma**: El enlace de WhatsApp abre una conversación vacía o arroja un error *"El número de teléfono no es válido"*.
* **Causa Raíz**: Los números en Argentina suelen escribirse localmente con `0358` o `15`, o con guiones y espacios que la API de `wa.me` rechaza. Para móviles de Argentina se exige el prefijo de país `54`, seguido de `9`, la característica sin el `0` y el número sin el `15`.
* **Solución Preventiva**: Implementar una función sanitizadora en `form.js` y `modal.js`:
  ```javascript
  function formatWhatsAppNumber(phone) {
    // Eliminar todo caracter no numérico
    let clean = phone.replace(/\D/g, '');
    // Si inicia con 0 (ej. 0358...), remover el 0 inicial
    if (clean.startsWith('0')) clean = clean.substring(1);
    // Si inicia con 15 luego del código de área o al inicio, normalizar
    // Asegurar prefijo internacional 549 para móviles argentinos
    if (!clean.startsWith('549')) {
      if (clean.startsWith('54')) {
        clean = '549' + clean.substring(2);
      } else {
        clean = '549' + clean;
      }
    }
    return clean;
  }
  ```

---

### 1.3 Caracteres Especiales y Saltos de Línea en Mensajes de WhatsApp
* **Síntoma**: Mensajes truncados o enlaces rotos al pasar texto con tildes, signos de interrogación o emojis.
* **Causa Raíz**: No aplicar `encodeURIComponent()` al parámetro `text` del enlace `wa.me`.
* **Solución**: Siempre construir la URL mediante:
  ```javascript
  const message = encodeURIComponent(`Hola ${profesional.nombre}, te contacto desde Oficios Barriales por tu servicio de ${profesional.rubro}.`);
  const waUrl = `https://wa.me/${cleanPhone}?text=${message}`;
  ```

---

### 1.4 Corrupción de Datos en `LocalStorage`
* **Síntoma**: La aplicación falla con una pantalla blanca al intentar invocar `.map()` o `.filter()` sobre datos corruptos o valores nulos.
* **Causa Raíz**: Manipulación manual del almacenamiento local por el usuario o parseo de strings JSON inválidos.
* **Solución**: Todo acceso a `LocalStorage` debe usar bloques `try...catch` con valores de respaldo (*fallbacks*) garantizados de tipo `Array` u `Object`.

---

### 1.5 Scroll del Body Bloqueado tras Cerrar Modales
* **Síntoma**: El usuario cierra el modal de perfil o de registro, pero la página principal queda congelada sin poder hacer scroll.
* **Causa Raíz**: Se añade la clase `overflow-hidden` a `document.body` al abrir el modal, pero no se remueve si el usuario cierra el modal presionando la tecla `Escape` o haciendo clic fuera del modal (*backdrop click*).
* **Solución**: Unificar el evento de cierre en una función centralizada `closeModal()` que siempre restaure `document.body.classList.remove('overflow-hidden')` y vincularla a `Esc`, botón de cierre y backdrop.

---

### 1.6 Doble Envío de Formularios
* **Síntoma**: Un trabajador presiona repetidamente el botón "Publicar mi Perfil" y se crean registros duplicados en `LocalStorage`.
* **Solución**: Deshabilitar el botón de submit (`btn.disabled = true`) e insertar un spinner de carga temporal durante el procesamiento de validación y almacenamiento.
