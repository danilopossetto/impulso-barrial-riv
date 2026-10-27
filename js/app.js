/**
 * Oficios Barriales - Impulso Barrial RIV S.A.S.
 * Script Principal de la SPA (Zero-Build Modular Vanilla JS)
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. CONSTANTES Y ESTADO GLOBAL
  // ==========================================
  const STORAGE_KEYS = {
    PROFESIONALES: 'ob_profesionales',
    THEME: 'ob_theme',
    FAVORITOS: 'ob_favoritos'
  };

  const state = {
    professionals: [],
    selectedRubro: 'Todos los rubros',
    selectedBarrio: 'Todos los barrios',
    searchQuery: '',
    onlyFavorites: false,
    favorites: getStoredData(STORAGE_KEYS.FAVORITOS, []),
    selectedProfessional: null,
    isLoading: false
  };

  // Elementos del DOM
  const elements = {
    grid: document.getElementById('professionals-grid'),
    emptyState: document.getElementById('empty-state'),
    loadingState: document.getElementById('loading-state'),
    counter: document.getElementById('results-counter'),
    searchField: document.getElementById('search-input'),
    rubroSelect: document.getElementById('rubro-filter'),
    barrioSelect: document.getElementById('barrio-filter'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    clearFiltersEmptyBtn: document.getElementById('empty-reset-btn'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeIconLight: document.getElementById('theme-icon-light'),
    themeIconDark: document.getElementById('theme-icon-dark'),
    // Modal de Detalle
    detailModal: document.getElementById('detail-modal'),
    detailModalBackdrop: document.getElementById('detail-modal-backdrop'),
    detailModalCloseBtn: document.getElementById('detail-modal-close'),
    detailModalContent: document.getElementById('detail-modal-content'),
    // Modal de Registro
    registerModal: document.getElementById('register-modal'),
    registerModalBackdrop: document.getElementById('register-modal-backdrop'),
    registerModalCloseBtn: document.getElementById('register-modal-close'),
    openRegisterBtns: document.querySelectorAll('.open-register-btn'),
    registerForm: document.getElementById('register-form'),
    registerRubroSelect: document.getElementById('reg-rubro'),
    registerBarrioSelect: document.getElementById('reg-barrio'),
    fotoInput: document.getElementById('foto-input'),
    fotoPreviewImg: document.getElementById('foto-preview-img'),
    fotoPreviewIcon: document.getElementById('foto-preview-icon'),
    // Toast Container
    toastContainer: document.getElementById('toast-container')
  };

  let selectedPhotoBase64 = null;

  // ==========================================
  // 2. UTILIDADES DE PERSISTENCIA (LOCALSTORAGE)
  // ==========================================
  function getStoredData(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (err) {
      console.warn(`Error al leer ${key} de LocalStorage:`, err);
      return fallback;
    }
  }

  function setStoredData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Error al guardar ${key} en LocalStorage:`, err);
    }
  }

  // ==========================================
  // 3. SANITIZACIÓN DE WHATSAPP (ARGENTINA)
  // ==========================================
  function formatWhatsAppNumber(phone) {
    if (!phone) return '5493584000000';
    let clean = phone.toString().replace(/\D/g, '');
    if (clean.startsWith('0')) clean = clean.substring(1);
    if (!clean.startsWith('549')) {
      if (clean.startsWith('54')) {
        clean = '549' + clean.substring(2);
      } else {
        clean = '549' + clean;
      }
    }
    return clean;
  }

  function getWhatsAppUrl(phone, nombre, rubro) {
    const cleanNumber = formatWhatsAppNumber(phone);
    const text = `Hola ${nombre}, vi tu perfil en Oficios Barriales (Impulso Barrial RIV S.A.S.) y me interesa consultar por un servicio de ${rubro}. ¿Tenés disponibilidad?`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  }

  // ==========================================
  // 4. GESTIÓN DEL TEMA (DARK / LIGHT MODE)
  // ==========================================
  function initTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    updateThemeIcons(isDark);
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    setStoredData(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    updateThemeIcons(isDark);
    showToast(isDark ? 'Modo Oscuro activado' : 'Modo Claro activado', 'info');
  }

  function updateThemeIcons(isDark) {
    if (elements.themeIconLight && elements.themeIconDark) {
      if (isDark) {
        elements.themeIconLight.classList.remove('hidden');
        elements.themeIconDark.classList.add('hidden');
      } else {
        elements.themeIconLight.classList.add('hidden');
        elements.themeIconDark.classList.remove('hidden');
      }
    }
  }

  // ==========================================
  // 5. CARGA DE DATOS Y FILTRADO COMBINADO
  // ==========================================
  function loadInitialData() {
    const userProfessionals = getStoredData(STORAGE_KEYS.PROFESIONALES, []);
    const initialList = window.INITIAL_PROFESSIONALS || [];
    state.professionals = [...userProfessionals, ...initialList];
    populateFilterSelects();
    applyFilters();
  }

  function populateFilterSelects() {
    const barrios = window.BARRIOS_RIO_CUARTO || ['Todos los barrios', 'Alberdi', 'Banda Norte', 'Centro'];
    const rubros = window.RUBROS_OFICIOS || ['Todos los rubros', 'Electricidad', 'Plomería'];

    // Filtros de búsqueda
    elements.rubroSelect.innerHTML = rubros
      .map(r => `<option value="${r}">${r}</option>`)
      .join('');
    elements.barrioSelect.innerHTML = barrios
      .map(b => `<option value="${b}">${b}</option>`)
      .join('');

    // Selects del formulario de registro (excluyendo "Todos...")
    elements.registerRubroSelect.innerHTML = '<option value="">Seleccioná tu oficio...</option>' +
      rubros
        .filter(r => !r.startsWith('Todos'))
        .map(r => `<option value="${r}">${r}</option>`)
        .join('');

    elements.registerBarrioSelect.innerHTML = '<option value="">Seleccioná tu barrio...</option>' +
      barrios
        .filter(b => !b.startsWith('Todos'))
        .map(b => `<option value="${b}">${b}</option>`)
        .join('');
  }

  function applyFilters() {
    // Activar estado de carga transitorio (DoD Loading State)
    showLoadingState(true);

    setTimeout(() => {
      const q = state.searchQuery.toLowerCase().trim();
      const rubro = state.selectedRubro;
      const barrio = state.selectedBarrio;

      const filtered = state.professionals.filter(p => {
        // Filtro por Rubro
        const matchesRubro = (rubro === 'Todos los rubros') || (p.rubro === rubro);

        // Filtro por Barrio
        const matchesBarrio = (barrio === 'Todos los barrios') || (p.barrio === barrio);

        // Búsqueda por texto (nombre, rubro, barrio, descripción o servicios)
        const matchesQuery = !q ||
          p.nombre.toLowerCase().includes(q) ||
          p.rubro.toLowerCase().includes(q) ||
          p.barrio.toLowerCase().includes(q) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
          (p.servicios && p.servicios.some(s => s.toLowerCase().includes(q)));

        return matchesRubro && matchesBarrio && matchesQuery;
      });

      // Ordenar: Destacados primero, luego por calificación
      filtered.sort((a, b) => {
        if (a.destacado && !b.destacado) return -1;
        if (!a.destacado && b.destacado) return 1;
        return (b.calificacion || 0) - (a.calificacion || 0);
      });

      showLoadingState(false);
      renderCards(filtered);
    }, 180);
  }

  function resetFilters() {
    state.selectedRubro = 'Todos los rubros';
    state.selectedBarrio = 'Todos los barrios';
    state.searchQuery = '';
    elements.rubroSelect.value = 'Todos los rubros';
    elements.barrioSelect.value = 'Todos los barrios';
    elements.searchField.value = '';
    applyFilters();
  }

  // ==========================================
  // 6. RENDERIZADO DE ESTADOS UI (DoD)
  // ==========================================
  function showLoadingState(show) {
    state.isLoading = show;
    if (show) {
      elements.loadingState.classList.remove('hidden');
      elements.grid.classList.add('hidden');
      elements.emptyState.classList.add('hidden');
    } else {
      elements.loadingState.classList.add('hidden');
    }
  }

  function renderCards(list) {
    // Actualizar contador
    const count = list.length;
    elements.counter.textContent = `${count} ${count === 1 ? 'profesional encontrado' : 'profesionales encontrados'}`;

    if (count === 0) {
      // 📭 Empty State
      elements.grid.classList.add('hidden');
      elements.emptyState.classList.remove('hidden');
      return;
    }

    elements.emptyState.classList.add('hidden');
    elements.grid.classList.remove('hidden');

    elements.grid.innerHTML = list.map(p => {
      const isFav = state.favorites.includes(p.id);
      const isDestacado = p.destacado;
      const stars = renderStarRating(p.calificacion || 5);

      return `
        <article class="relative flex flex-col justify-between bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border ${isDestacado ? 'border-orange-500/80 ring-2 ring-orange-500/20' : 'border-slate-200 dark:border-slate-700'} overflow-hidden group">
          ${isDestacado ? `
            <div class="absolute top-3 right-3 z-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1 tracking-wide uppercase">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Destacado
            </div>
          ` : ''}

          <!-- Header de Tarjeta -->
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div class="relative shrink-0">
                <img src="${p.foto || p.imagenUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}" 
                     alt="${p.nombre}" 
                     class="w-16 h-16 rounded-2xl object-cover ring-2 ring-orange-500/30 group-hover:scale-105 transition-transform duration-300"
                     loading="lazy"
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nombre)}&background=0f172a&color=f97316&bold=true'">
                ${p.verificado ? `
                  <span title="Perfil Verificado por Impulso Barrial" class="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full ring-2 ring-white dark:ring-slate-800 flex items-center justify-center">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </span>
                ` : ''}
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <h3 class="text-lg font-bold text-slate-900 dark:text-white truncate">${p.nombre}</h3>
                </div>
                <p class="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-0.5">${p.rubro}</p>
                <div class="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span>Barrio ${p.barrio}</span>
                </div>
              </div>
            </div>

            <!-- Calificación y Reseñas -->
            <div class="mt-4 flex items-center justify-between text-xs border-y border-slate-100 dark:border-slate-700/60 py-2.5">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-slate-800 dark:text-slate-100 text-sm">${p.calificacion.toFixed(1)}</span>
                <div class="flex text-amber-400">${stars}</div>
              </div>
              <span class="text-slate-400">(${p.resenasCount || 1} opiniones)</span>
            </div>

            <!-- Descripción Corta -->
            <p class="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              ${p.descripcion || 'Profesional de confianza listo para presupuestos y atención personalizada.'}
            </p>

            <!-- Tags de Servicios Principales -->
            ${p.servicios && p.servicios.length > 0 ? `
              <div class="mt-3 flex flex-wrap gap-1.5">
                ${p.servicios.slice(0, 2).map(s => `
                  <span class="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-md">
                    ${s}
                  </span>
                `).join('')}
                ${p.servicios.length > 2 ? `<span class="text-xs text-slate-400 self-center">+${p.servicios.length - 2} más</span>` : ''}
              </div>
            ` : ''}
          </div>

          <!-- Footer de Tarjeta con CTAs -->
          <div class="p-6 pt-0 bg-white dark:bg-slate-800">
            <div class="grid grid-cols-2 gap-2 mt-2">
              <button type="button" 
                      data-id="${p.id}" 
                      class="view-detail-btn w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold transition-all">
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                Ver Perfil
              </button>

              <a href="${getWhatsAppUrl(p.telefono, p.nombre, p.rubro)}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-sm shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                WhatsApp
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Adjuntar listeners a botones "Ver Perfil"
    document.querySelectorAll('.view-detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prof = state.professionals.find(p => p.id === id);
        if (prof) openDetailModal(prof);
      });
    });
  }

  function renderStarRating(rating) {
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.5;
    let stars = '';
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars += '<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
      } else if (i === full && hasHalf) {
        stars += '<svg class="w-3.5 h-3.5 fill-current text-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
      } else {
        stars += '<svg class="w-3.5 h-3.5 fill-slate-300 dark:fill-slate-600" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
      }
    }
    return stars;
  }

  // ==========================================
  // 7. MODAL DE DETALLE DEL PROFESIONAL
  // ==========================================
  function openDetailModal(p) {
    state.selectedProfessional = p;
    const waUrl = getWhatsAppUrl(p.telefono, p.nombre, p.rubro);
    const cleanPhone = formatWhatsAppNumber(p.telefono);

    elements.detailModalContent.innerHTML = `
      <div class="relative p-6 sm:p-8">
        <!-- Badge de Destacado / Verificado -->
        <div class="flex items-center gap-2 mb-4">
          ${p.verificado ? `
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              Verificado por Impulso Barrial RIV
            </span>
          ` : ''}
          ${p.destacado ? `
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
              ★ Profesional Destacado
            </span>
          ` : ''}
        </div>

        <!-- Encabezado del Perfil -->
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <img src="${p.foto || p.imagenUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}" 
               alt="${p.nombre}" 
               class="w-24 h-24 rounded-2xl object-cover ring-4 ring-orange-500/20 shadow-lg shrink-0"
               onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nombre)}&background=0f172a&color=f97316&bold=true'">
          <div class="text-center sm:text-left flex-1">
            <h2 class="text-2xl font-black text-slate-900 dark:text-white">${p.nombre}</h2>
            <p class="text-base font-bold text-orange-600 dark:text-orange-400 mt-0.5">${p.rubro}</p>
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Río Cuarto - Barrio <strong>${p.barrio}</strong>
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                ${p.experiencia || 'Años de oficio calificado'}
              </span>
            </div>
          </div>
        </div>

        <!-- Calificaciones y Confianza -->
        <div class="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xl font-black text-slate-900 dark:text-white">${p.calificacion.toFixed(1)}</span>
              <div class="flex text-amber-400">${renderStarRating(p.calificacion)}</div>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Basado en ${p.resenasCount || 1} contrataciones de vecinos</p>
          </div>
          <div class="text-right">
            <span class="text-xs uppercase tracking-wider font-semibold text-slate-400 block">Horario / Turnos</span>
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">${p.disponibilidad || 'Consultar por WhatsApp'}</span>
          </div>
        </div>

        <!-- Biografía y Especialidad -->
        <div class="mt-6">
          <h4 class="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Sobre este profesional</h4>
          <p class="mt-2 text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line">
            ${p.descripcion || 'Profesional matriculado o avalado por la comunidad con amplia experiencia en la zona.'}
          </p>
        </div>

        <!-- Lista de Servicios y Trabajos que realiza -->
        ${p.servicios && p.servicios.length > 0 ? `
          <div class="mt-6">
            <h4 class="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Servicios frecuentes</h4>
            <ul class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              ${p.servicios.map(s => `
                <li class="flex items-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200">
                  <svg class="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  <span>${s}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Call to Action WhatsApp y Copiar Teléfono -->
        <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
          <a href="${waUrl}" 
             target="_blank" 
             rel="noopener noreferrer" 
             class="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
            Contactar por WhatsApp
          </a>

          <button type="button" 
                  id="copy-phone-btn" 
                  data-phone="${cleanPhone}" 
                  class="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-all">
            <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
            Copiar Teléfono
          </button>
        </div>
      </div>
    `;

    // Event listener para copiar teléfono
    const copyBtn = document.getElementById('copy-phone-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const phone = copyBtn.getAttribute('data-phone');
        navigator.clipboard.writeText(phone)
          .then(() => showToast(`Teléfono ${phone} copiado al portapapeles`, 'success'))
          .catch(() => showToast(`Teléfono: ${phone}`, 'info'));
      });
    }

    elements.detailModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  function closeDetailModal() {
    elements.detailModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    state.selectedProfessional = null;
  }

  // ==========================================
  // 8. MODAL Y VALIDACIÓN DEL FORMULARIO (Error State)
  // ==========================================
  function openRegisterModal() {
    elements.registerModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    // Limpiar errores previos
    clearFormErrors();
  }

  function closeRegisterModal() {
    elements.registerModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    elements.registerForm.reset();
    resetPhotoPreview();
    clearFormErrors();
  }

  function resetPhotoPreview() {
    selectedPhotoBase64 = null;
    if (elements.fotoInput) elements.fotoInput.value = '';
    if (elements.fotoPreviewImg && elements.fotoPreviewIcon) {
      elements.fotoPreviewImg.src = '';
      elements.fotoPreviewImg.classList.add('hidden');
      elements.fotoPreviewIcon.classList.remove('hidden');
    }
  }

  function clearFormErrors() {
    elements.registerForm.querySelectorAll('.input-error-msg').forEach(el => el.classList.add('hidden'));
    elements.registerForm.querySelectorAll('input, select, textarea').forEach(input => {
      input.classList.remove('border-rose-500', 'focus:ring-rose-500');
    });
  }

  function handleRegisterSubmit(e) {
    e.preventDefault();
    clearFormErrors();

    const nombre = document.getElementById('reg-nombre').value.trim();
    const rubro = document.getElementById('reg-rubro').value;
    const barrio = document.getElementById('reg-barrio').value;
    const telefono = document.getElementById('reg-telefono').value.trim();
    const experiencia = document.getElementById('reg-experiencia').value.trim();
    const descripcion = document.getElementById('reg-descripcion').value.trim();
    const serviciosRaw = document.getElementById('reg-servicios').value.trim();

    let hasErrors = false;

    // Validación: Nombre
    if (nombre.length < 3) {
      showFieldError('reg-nombre', 'Ingresá tu nombre y apellido (mínimo 3 letras).');
      hasErrors = true;
    }

    // Validación: Rubro
    if (!rubro) {
      showFieldError('reg-rubro', 'Por favor seleccioná tu oficio principal.');
      hasErrors = true;
    }

    // Validación: Barrio
    if (!barrio) {
      showFieldError('reg-barrio', 'Por favor seleccioná el barrio donde prestás servicio.');
      hasErrors = true;
    }

    // Validación: Teléfono (mínimo 8 dígitos)
    const cleanPhone = telefono.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      showFieldError('reg-telefono', 'Ingresá un número de WhatsApp válido (ej. 3584123456).');
      hasErrors = true;
    }

    // Validación: Descripción (mínimo 10 caracteres)
    if (descripcion.length < 10) {
      showFieldError('reg-descripcion', 'Escribí una descripción detallada de tu trabajo (al menos 10 caracteres).');
      hasErrors = true;
    }

    if (hasErrors) {
      // ⚠️ Error State
      showToast('Por favor corregí los campos marcados en rojo', 'error');
      return;
    }

    // Crear nuevo objeto profesional
    const servicios = serviciosRaw
      ? serviciosRaw.split(',').map(s => s.trim()).filter(Boolean)
      : [rubro, 'Presupuestos sin cargo'];

    // Foto seleccionada desde el dispositivo (Base64) o asignación automática con UI Avatars
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=0f172a&color=f97316&bold=true&size=300`;
    const finalPhoto = selectedPhotoBase64 || defaultAvatar;

    const newProfessional = {
      id: 'prof_' + Date.now(),
      nombre,
      rubro,
      barrio,
      telefono: cleanPhone,
      experiencia: experiencia ? `${experiencia} años de experiencia` : 'Oficio calificado',
      descripcion,
      calificacion: 5.0,
      resenasCount: 1,
      verificado: true, // Nuevo miembro avalado por la comunidad
      destacado: true,  // Beneficio de bienvenida
      disponibilidad: 'A coordinar por WhatsApp',
      servicios,
      foto: finalPhoto,
      imagenUrl: finalPhoto,
      fechaRegistro: new Date().toISOString()
    };

    // Guardar en LocalStorage
    const stored = getStoredData(STORAGE_KEYS.PROFESIONALES, []);
    stored.unshift(newProfessional);
    setStoredData(STORAGE_KEYS.PROFESIONALES, stored);

    // Actualizar estado en memoria
    state.professionals.unshift(newProfessional);

    // Renderizar y confirmar (✅ Success State)
    closeRegisterModal();
    applyFilters();
    showToast(`¡Bienvenido ${nombre}! Tu perfil ya está publicado en Oficios Barriales.`, 'success');
  }

  function showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.classList.add('border-rose-500', 'focus:ring-rose-500');
    const errorEl = document.getElementById(`${inputId}-error`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }

  // ==========================================
  // 9. SISTEMA DE TOAST (Success / Error State)
  // ==========================================
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-600/30',
      error: 'bg-rose-600 text-white border-rose-700 shadow-rose-600/30',
      info: 'bg-slate-900 text-white dark:bg-slate-800 border-slate-700 shadow-slate-900/40'
    };

    const icons = {
      success: `<svg class="w-5 h-5 shrink-0 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`,
      error: `<svg class="w-5 h-5 shrink-0 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`,
      info: `<svg class="w-5 h-5 shrink-0 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`
    };

    toast.className = `flex items-center gap-3 px-4 py-3.5 rounded-2xl border shadow-xl text-sm font-semibold transition-all duration-300 transform translate-y-3 opacity-0 pointer-events-auto ${colors[type] || colors.info}`;
    toast.innerHTML = `
      ${icons[type] || icons.info}
      <span class="flex-1">${message}</span>
      <button type="button" class="ml-2 text-white/80 hover:text-white p-1 rounded-lg focus:outline-none">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    `;

    elements.toastContainer.appendChild(toast);

    // Animación de entrada
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-3', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Cierre manual
    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => removeToast(toast));

    // Auto-cierre tras 4 segundos
    setTimeout(() => {
      removeToast(toast);
    }, 4000);
  }

  function removeToast(toast) {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }

  // ==========================================
  // 10. LISTENERS Y ENLACE DE EVENTOS
  // ==========================================
  function setupEventListeners() {
    // Cambio en filtros
    elements.rubroSelect.addEventListener('change', (e) => {
      state.selectedRubro = e.target.value;
      applyFilters();
    });

    elements.barrioSelect.addEventListener('change', (e) => {
      state.selectedBarrio = e.target.value;
      applyFilters();
    });

    // Búsqueda con debounce simple
    let searchDebounce;
    elements.searchField.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        state.searchQuery = e.target.value;
        applyFilters();
      }, 250);
    });

    // Botones para restablecer filtros
    if (elements.resetFiltersBtn) elements.resetFiltersBtn.addEventListener('click', resetFilters);
    if (elements.clearFiltersEmptyBtn) elements.clearFiltersEmptyBtn.addEventListener('click', resetFilters);

    // Toggle de tema
    if (elements.themeToggleBtn) elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // Modal de Detalle
    if (elements.detailModalCloseBtn) elements.detailModalCloseBtn.addEventListener('click', closeDetailModal);
    if (elements.detailModalBackdrop) elements.detailModalBackdrop.addEventListener('click', closeDetailModal);

    // Modal de Registro
    elements.openRegisterBtns.forEach(btn => btn.addEventListener('click', openRegisterModal));
    if (elements.registerModalCloseBtn) elements.registerModalCloseBtn.addEventListener('click', closeRegisterModal);
    if (elements.registerModalBackdrop) elements.registerModalBackdrop.addEventListener('click', closeRegisterModal);
    if (elements.registerForm) elements.registerForm.addEventListener('submit', handleRegisterSubmit);

    // Selección de Foto de Perfil desde el dispositivo (FileReader API)
    if (elements.fotoInput) {
      elements.fotoInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) {
          resetPhotoPreview();
          return;
        }

        // Validación de tipo de archivo (solo imágenes)
        if (!file.type.startsWith('image/')) {
          showToast('El archivo debe ser una imagen válida (PNG, JPG, WebP)', 'error');
          resetPhotoPreview();
          return;
        }

        // Validación de tamaño (máx 4MB para persistencia en LocalStorage)
        if (file.size > 4 * 1024 * 1024) {
          showToast('La foto no debe superar los 4MB', 'error');
          resetPhotoPreview();
          return;
        }

        const reader = new FileReader();
        reader.onload = function(evt) {
          selectedPhotoBase64 = evt.target.result;
          if (elements.fotoPreviewImg && elements.fotoPreviewIcon) {
            elements.fotoPreviewImg.src = selectedPhotoBase64;
            elements.fotoPreviewImg.classList.remove('hidden');
            elements.fotoPreviewIcon.classList.add('hidden');
          }
        };
        reader.onerror = function() {
          showToast('Error al leer el archivo de imagen', 'error');
          resetPhotoPreview();
        };
        reader.readAsDataURL(file);
      });
    }

    // Atajo de teclado: Escape cierra cualquier modal abierto
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!elements.detailModal.classList.contains('hidden')) closeDetailModal();
        if (!elements.registerModal.classList.contains('hidden')) closeRegisterModal();
      }
    });
  }

  // Inicialización
  initTheme();
  setupEventListeners();
  loadInitialData();
});
