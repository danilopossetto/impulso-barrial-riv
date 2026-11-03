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
    FAVORITOS: 'ob_favoritos',
    ACTIVE_USER: 'ob_active_user',
    REVIEWS: 'ob_reviews'
  };

  const state = {
    professionals: [],
    reviews: [],
    currentUser: null,
    selectedRubro: 'Todos los rubros',
    selectedBarrio: 'Todos los barrios',
    searchQuery: '',
    favorites: [],
    selectedProfessional: null,
    isLoading: false,
    selectedReviewRating: 5
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
    authNavContainer: document.getElementById('auth-nav-container'),
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
    registerMatriculaInput: document.getElementById('reg-matricula'),
    fotoInput: document.getElementById('foto-input'),
    fotoPreviewImg: document.getElementById('foto-preview-img'),
    fotoPreviewIcon: document.getElementById('foto-preview-icon'),
    // Modal de Login
    loginModal: document.getElementById('login-modal'),
    loginModalBackdrop: document.getElementById('login-modal-backdrop'),
    loginModalCloseBtn: document.getElementById('login-modal-close'),
    loginForm: document.getElementById('login-form'),
    loginEmailInput: document.getElementById('login-email-input'),
    loginEmailError: document.getElementById('login-email-error'),
    loginDemoSofiaBtn: document.getElementById('login-demo-sofia-btn'),
    loginDemoCarlosBtn: document.getElementById('login-demo-carlos-btn'),
    // Modal de Gestión del Profesional
    profileManageModal: document.getElementById('profile-manage-modal'),
    profileManageBackdrop: document.getElementById('profile-manage-backdrop'),
    profileManageCloseBtn: document.getElementById('profile-manage-close'),
    profileManageForm: document.getElementById('profile-manage-form'),
    manageMatricula: document.getElementById('manage-matricula'),
    manageTelefono: document.getElementById('manage-telefono'),
    manageDisponibilidad: document.getElementById('manage-disponibilidad'),
    manageDescripcion: document.getElementById('manage-descripcion'),
    manageGalleryGrid: document.getElementById('manage-gallery-grid'),
    galleryInput: document.getElementById('gallery-input'),
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
  // 5. AUTENTICACIÓN Y USUARIOS DEMO
  // ==========================================
  function initAuth() {
    state.currentUser = getStoredData(STORAGE_KEYS.ACTIVE_USER, null);
    renderAuthNav();
  }

  function loginUser(email) {
    const demoUsers = window.DEMO_USERS || [];
    let user = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Si el email no coincide con los demo, creamos un cliente con ese email
      user = {
        id: 'user_' + Date.now(),
        email: email,
        nombre: email.split('@')[0],
        rol: 'cliente',
        barrio: 'Río Cuarto',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=0f172a&color=f97316&bold=true`
      };
    }

    state.currentUser = user;
    setStoredData(STORAGE_KEYS.ACTIVE_USER, user);
    closeLoginModal();
    renderAuthNav();
    // Si el modal de detalle está abierto, refrescar para mostrar/ocultar formulario de reseña
    if (state.selectedProfessional) {
      openDetailModal(state.selectedProfessional);
    }
    showToast(`¡Sesión iniciada como ${user.nombre} (${user.rol === 'profesional' ? 'Profesional' : 'Cliente'})!`, 'success');
  }

  function logoutUser() {
    state.currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    renderAuthNav();
    if (state.selectedProfessional) {
      openDetailModal(state.selectedProfessional);
    }
    showToast('Sesión cerrada correctamente', 'info');
  }

  function renderAuthNav() {
    if (!elements.authNavContainer) return;
    const user = state.currentUser;

    if (!user) {
      // Estado Invitado: Botón Iniciar Sesión y atajos rápidos
      elements.authNavContainer.innerHTML = `
        <button type="button" 
                id="open-login-btn" 
                class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all">
          <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
          <span>Ingresar Demo</span>
        </button>
      `;
      const btn = document.getElementById('open-login-btn');
      if (btn) btn.addEventListener('click', openLoginModal);
    } else {
      // Usuario autenticado
      const isPro = user.rol === 'profesional';
      elements.authNavContainer.innerHTML = `
        <div class="flex items-center gap-2">
          <!-- Datos del usuario -->
          <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <img src="${user.avatar}" alt="${user.nombre}" class="w-6 h-6 rounded-lg object-cover ring-1 ring-orange-500/50">
            <div class="hidden sm:flex flex-col text-left">
              <span class="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">${user.nombre}</span>
              <span class="text-[10px] font-semibold ${isPro ? 'text-orange-500' : 'text-blue-500'} uppercase leading-none">${user.rol}</span>
            </div>
          </div>

          <!-- Botón Especial para el Profesional: Gestionar Trabajos -->
          ${isPro ? `
            <button type="button" 
                    id="open-profile-manage-btn" 
                    class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-orange-500 dark:hover:bg-orange-600 text-white text-xs font-bold shadow-sm transition-all" 
                    title="Editar mi perfil y subir fotos a mi galería">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              <span class="hidden md:inline">Mi Perfil & Trabajos</span>
              <span class="md:hidden">Mi Perfil</span>
            </button>
          ` : ''}

          <!-- Selector rápido de cambio / salir -->
          <div class="relative group">
            <button type="button" 
                    id="auth-menu-btn" 
                    class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                    title="Cambiar usuario o cerrar sesión">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg>
            </button>
            <div class="absolute right-0 top-full mt-2 w-48 py-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 hidden group-hover:block z-50">
              <div class="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700">Cambiar Perfil</div>
              <button type="button" id="switch-to-sofia-btn" class="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span> Sofía (Cliente Demo)
              </button>
              <button type="button" id="switch-to-carlos-btn" class="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-orange-500"></span> Carlos (Profesional Demo)
              </button>
              <div class="border-t border-slate-100 dark:border-slate-700 my-1"></div>
              <button type="button" id="logout-btn" class="w-full text-left px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      `;

      // Listeners
      const openProBtn = document.getElementById('open-profile-manage-btn');
      if (openProBtn) openProBtn.addEventListener('click', openProfileManageModal);

      const toSofia = document.getElementById('switch-to-sofia-btn');
      if (toSofia) toSofia.addEventListener('click', () => loginUser('sofia@demo.com'));

      const toCarlos = document.getElementById('switch-to-carlos-btn');
      if (toCarlos) toCarlos.addEventListener('click', () => loginUser('carlos@demo.com'));

      const logout = document.getElementById('logout-btn');
      if (logout) logout.addEventListener('click', logoutUser);
    }
  }

  function openLoginModal() {
    if (!elements.loginModal) return;
    elements.loginModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    if (elements.loginEmailError) elements.loginEmailError.classList.add('hidden');
  }

  function closeLoginModal() {
    if (!elements.loginModal) return;
    elements.loginModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    if (elements.loginForm) elements.loginForm.reset();
  }

  // ==========================================
  // 6. CARGA DE DATOS Y RECÁLCULO DINÁMICO
  // ==========================================
  function loadInitialData() {
    const userProfessionals = getStoredData(STORAGE_KEYS.PROFESIONALES, []);
    const initialList = window.INITIAL_PROFESSIONALS || [];
    state.professionals = [...userProfessionals, ...initialList];
    
    // Carga de reseñas (seed + storage)
    const storedReviews = getStoredData(STORAGE_KEYS.REVIEWS, null);
    if (storedReviews) {
      state.reviews = storedReviews;
    } else {
      state.reviews = window.INITIAL_REVIEWS || [];
      setStoredData(STORAGE_KEYS.REVIEWS, state.reviews);
    }

    // Recalcular estadísticas para todos los profesionales
    state.professionals.forEach(p => recalculateStats(p.id));

    populateFilterSelects();
    applyFilters();
  }

  function recalculateStats(profId) {
    const profReviews = state.reviews.filter(r => r.profesionalId === profId);
    const prof = state.professionals.find(p => p.id === profId);
    if (!prof) return;

    if (profReviews.length > 0) {
      const sum = profReviews.reduce((acc, r) => acc + Number(r.calificacion), 0);
      prof.calificacion = Number((sum / profReviews.length).toFixed(1));
      prof.resenasCount = profReviews.length;
    }
  }

  function populateFilterSelects() {
    const barrios = window.BARRIOS_RIO_CUARTO || ['Todos los barrios', 'Alberdi', 'Banda Norte', 'Centro'];
    const rubros = window.RUBROS_OFICIOS || ['Todos los rubros', 'Electricidad', 'Plomería'];

    elements.rubroSelect.innerHTML = rubros
      .map(r => `<option value="${r}">${r}</option>`)
      .join('');
    elements.barrioSelect.innerHTML = barrios
      .map(b => `<option value="${b}">${b}</option>`)
      .join('');

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
    showLoadingState(true);

    setTimeout(() => {
      const q = state.searchQuery.toLowerCase().trim();
      const rubro = state.selectedRubro;
      const barrio = state.selectedBarrio;

      const filtered = state.professionals.filter(p => {
        const matchesRubro = (rubro === 'Todos los rubros') || (p.rubro === rubro);
        const matchesBarrio = (barrio === 'Todos los barrios') || (p.barrio === barrio);
        const matchesQuery = !q ||
          p.nombre.toLowerCase().includes(q) ||
          p.rubro.toLowerCase().includes(q) ||
          p.barrio.toLowerCase().includes(q) ||
          (p.matricula && p.matricula.toLowerCase().includes(q)) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
          (p.servicios && p.servicios.some(s => s.toLowerCase().includes(q)));

        return matchesRubro && matchesBarrio && matchesQuery;
      });

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
  // 7. RENDERIZADO DE ESTADOS UI (DoD)
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
    const count = list.length;
    elements.counter.textContent = `${count} ${count === 1 ? 'profesional encontrado' : 'profesionales encontrados'}`;

    if (count === 0) {
      elements.grid.classList.add('hidden');
      elements.emptyState.classList.remove('hidden');
      return;
    }

    elements.emptyState.classList.add('hidden');
    elements.grid.classList.remove('hidden');

    elements.grid.innerHTML = list.map(p => {
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
                <h3 class="text-lg font-bold text-slate-900 dark:text-white truncate">${p.nombre}</h3>
                <p class="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-0.5">${p.rubro}</p>
                <div class="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span>Barrio ${p.barrio}</span>
                </div>
              </div>
            </div>

            <!-- Badge Condicional: Matrícula Profesional Opcional -->
            ${p.matricula ? `
              <div class="mt-3 flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-900/40">
                <svg class="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                <span class="truncate">Matriculado: ${p.matricula}</span>
              </div>
            ` : ''}

            <!-- Calificación y Reseñas en tiempo real -->
            <div class="mt-4 flex items-center justify-between text-xs border-y border-slate-100 dark:border-slate-700/60 py-2.5">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-slate-800 dark:text-slate-100 text-sm">${p.calificacion.toFixed(1)}</span>
                <div class="flex text-amber-400">${stars}</div>
              </div>
              <span class="text-slate-400 font-medium">(${p.resenasCount || 0} ${p.resenasCount === 1 ? 'opinión' : 'opiniones'})</span>
            </div>

            <!-- Descripción Corta -->
            <p class="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              ${p.descripcion || 'Profesional de confianza listo para presupuestos y atención personalizada.'}
            </p>

            <!-- Galería Preview Thumbnail -->
            ${p.galeria && p.galeria.length > 0 ? `
              <div class="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <svg class="w-3.5 h-3.5 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span>${p.galeria.length} ${p.galeria.length === 1 ? 'trabajo fotografiado' : 'trabajos fotografiados'}</span>
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
  // 8. MODAL DE DETALLE DEL PROFESIONAL
  // ==========================================
  function openDetailModal(p) {
    state.selectedProfessional = p;
    recalculateStats(p.id);
    const waUrl = getWhatsAppUrl(p.telefono, p.nombre, p.rubro);
    const cleanPhone = formatWhatsAppNumber(p.telefono);

    // Obtener opiniones del profesional
    const profReviews = state.reviews.filter(r => r.profesionalId === p.id);
    const user = state.currentUser;
    const isCliente = user && user.rol === 'cliente';
    const isPro = user && user.rol === 'profesional';

    elements.detailModalContent.innerHTML = `
      <div class="relative p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
        <!-- Badges Superiores -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
          ${p.verificado ? `
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              Verificado
            </span>
          ` : ''}
          ${p.destacado ? `
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
              ★ Destacado
            </span>
          ` : ''}
          ${p.matricula ? `
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              Matriculado (${p.matricula})
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

        <!-- Calificaciones y Turnos -->
        <div class="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xl font-black text-slate-900 dark:text-white">${p.calificacion.toFixed(1)}</span>
              <div class="flex text-amber-400">${renderStarRating(p.calificacion)}</div>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Basado en ${p.resenasCount || 0} contrataciones de vecinos</p>
          </div>
          <div class="text-right">
            <span class="text-xs uppercase tracking-wider font-semibold text-slate-400 block">Horario / Turnos</span>
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">${p.disponibilidad || 'Consultar por WhatsApp'}</span>
          </div>
        </div>

        <!-- Descripción -->
        <div class="mt-6">
          <h4 class="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Sobre este profesional</h4>
          <p class="mt-2 text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line">
            ${p.descripcion || 'Profesional de confianza listo para presupuestos y atención personalizada.'}
          </p>
        </div>

        <!-- Galería de Trabajos Realizados (Requerimiento 3) -->
        <div class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span>Galería de Trabajos Realizados (${(p.galeria && p.galeria.length) || 0})</span>
            </h4>
          </div>
          ${p.galeria && p.galeria.length > 0 ? `
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              ${p.galeria.map((img, idx) => `
                <div class="relative group rounded-xl overflow-hidden aspect-video bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                  <img src="${img}" alt="Trabajo ${idx + 1}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
              El profesional aún no ha subido fotos de sus obras o reparaciones.
            </div>
          `}
        </div>

        <!-- Opiniones y Reseñas (Requerimiento 2) -->
        <div class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              <span>Opiniones de la Comunidad (${profReviews.length})</span>
            </h4>
          </div>

          <!-- Formulario para dejar reseña (Solo Cliente autenticado) -->
          <div class="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700">
            ${isCliente ? `
              <form id="review-submit-form" class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-900 dark:text-white">Dejar tu calificación:</span>
                  <div id="star-selector" class="flex gap-1 cursor-pointer text-amber-400">
                    <!-- 5 Estrellas interactivas -->
                    <button type="button" class="star-btn p-0.5 hover:scale-110 transition-transform" data-rating="1">★</button>
                    <button type="button" class="star-btn p-0.5 hover:scale-110 transition-transform" data-rating="2">★</button>
                    <button type="button" class="star-btn p-0.5 hover:scale-110 transition-transform" data-rating="3">★</button>
                    <button type="button" class="star-btn p-0.5 hover:scale-110 transition-transform" data-rating="4">★</button>
                    <button type="button" class="star-btn p-0.5 hover:scale-110 transition-transform" data-rating="5">★</button>
                  </div>
                </div>
                <textarea id="review-comment-input" 
                          rows="2" 
                          placeholder="Contá tu experiencia con este profesional (puntualidad, prolijidad, precio)..." 
                          class="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"></textarea>
                <div class="flex justify-between items-center">
                  <span id="star-hint" class="text-[11px] text-slate-500">Calificación: <strong>5 estrellas</strong></span>
                  <button type="submit" 
                          id="submit-review-btn" 
                          class="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md transition-all">
                    Publicar Opinión
                  </button>
                </div>
              </form>
            ` : !user ? `
              <div class="flex items-center justify-between gap-4">
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  ¿Contrataste a este profesional? <strong>Iniciá sesión como Cliente</strong> para calificarlo.
                </p>
                <button type="button" 
                        id="open-login-from-reviews" 
                        class="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shrink-0 transition-colors">
                  Ingresar
                </button>
              </div>
            ` : `
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Estás navegando como <strong>${user.nombre} (${user.rol})</strong>. Las opiniones son exclusivas de clientes y vecinos que contrataron servicios.
              </p>
            `}
          </div>

          <!-- Listado de Reseñas -->
          <div class="space-y-3">
            ${profReviews.length > 0 ? profReviews.map(r => `
              <div class="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 shadow-xs">
                <div class="flex items-center justify-between mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 font-bold text-xs flex items-center justify-center">
                      ${r.autorNombre.charAt(0)}
                    </span>
                    <span class="text-xs font-bold text-slate-900 dark:text-white">${r.autorNombre}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div class="flex text-amber-400 text-xs">${renderStarRating(r.calificacion)}</div>
                    <span class="text-[10px] text-slate-400">${r.fecha || 'Reciente'}</span>
                  </div>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
                  "${r.comentario}"
                </p>
              </div>
            `).join('') : `
              <p class="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                Aún no hay opiniones publicadas para este profesional. ¡Sé el primero en dejar una reseña!
              </p>
            `}
          </div>
        </div>

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

    // Listeners del modal de detalle
    const copyBtn = document.getElementById('copy-phone-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const phone = copyBtn.getAttribute('data-phone');
        navigator.clipboard.writeText(phone)
          .then(() => showToast(`Teléfono ${phone} copiado al portapapeles`, 'success'))
          .catch(() => showToast(`Teléfono: ${phone}`, 'info'));
      });
    }

    const openLoginBtn = document.getElementById('open-login-from-reviews');
    if (openLoginBtn) {
      openLoginBtn.addEventListener('click', () => {
        closeDetailModal();
        openLoginModal();
      });
    }

    // Listener de estrellas interactivas
    let chosenRating = 5;
    const starBtns = elements.detailModalContent.querySelectorAll('.star-btn');
    const starHint = document.getElementById('star-hint');
    starBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        chosenRating = parseInt(btn.getAttribute('data-rating'), 10);
        if (starHint) starHint.innerHTML = `Calificación: <strong>${chosenRating} ${chosenRating === 1 ? 'estrella' : 'estrellas'}</strong>`;
        starBtns.forEach((b, i) => {
          if (i < chosenRating) {
            b.classList.remove('opacity-40');
          } else {
            b.classList.add('opacity-40');
          }
        });
      });
    });

    // Formulario de envío de reseña
    const reviewForm = document.getElementById('review-submit-form');
    if (reviewForm) {
      reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const comment = (document.getElementById('review-comment-input').value || '').trim();
        if (comment.length < 3) {
          showToast('Escribí un comentario breve sobre el servicio', 'error');
          return;
        }

        const newReview = {
          id: 'rev_' + Date.now(),
          profesionalId: p.id,
          autorNombre: user.nombre,
          autorEmail: user.email,
          calificacion: chosenRating,
          comentario: comment,
          fecha: new Date().toISOString().split('T')[0]
        };

        state.reviews.unshift(newReview);
        setStoredData(STORAGE_KEYS.REVIEWS, state.reviews);
        
        // Recalcular promedio y total en tiempo real
        recalculateStats(p.id);

        // Guardar profesionales actualizados si es necesario
        setStoredData(STORAGE_KEYS.PROFESIONALES, state.professionals.filter(pr => pr.id.startsWith('prof_') && parseInt(pr.id.replace('prof_', ''), 10) > 1000));

        // Re-renderizar catálogo y modal
        renderCards(state.professionals);
        openDetailModal(p);
        showToast(`¡Gracias ${user.nombre}! Tu opinión fue publicada con éxito.`, 'success');
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
  // 9. GESTIÓN DEL PERFIL Y GALERÍA (PRO)
  // ==========================================
  function openProfileManageModal() {
    const user = state.currentUser;
    if (!user || user.rol !== 'profesional') {
      showToast('Solo los profesionales tienen acceso a este panel', 'error');
      return;
    }

    // Buscar el profesional asociado (por linkedProfessionalId o nombre)
    const profId = user.linkedProfessionalId || 'prof_001';
    let prof = state.professionals.find(p => p.id === profId);
    if (!prof) prof = state.professionals[0];

    // Cargar datos en los inputs
    if (elements.manageMatricula) elements.manageMatricula.value = prof.matricula || '';
    if (elements.manageTelefono) elements.manageTelefono.value = prof.telefono || '';
    if (elements.manageDisponibilidad) elements.manageDisponibilidad.value = prof.disponibilidad || '';
    if (elements.manageDescripcion) elements.manageDescripcion.value = prof.descripcion || '';

    renderManageGallery(prof);

    elements.profileManageModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  function closeProfileManageModal() {
    if (!elements.profileManageModal) return;
    elements.profileManageModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  function renderManageGallery(prof) {
    if (!elements.manageGalleryGrid) return;
    const gallery = prof.galeria || [];

    if (gallery.length === 0) {
      elements.manageGalleryGrid.innerHTML = `
        <div class="col-span-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
          Aún no subiste fotos. ¡Hacé clic en "Subir Fotos" para mostrar tus trabajos!
        </div>
      `;
      return;
    }

    elements.manageGalleryGrid.innerHTML = gallery.map((img, idx) => `
      <div class="relative group rounded-xl overflow-hidden aspect-video bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
        <img src="${img}" alt="Foto ${idx + 1}" class="w-full h-full object-cover">
        <button type="button" 
                data-index="${idx}" 
                class="delete-gallery-photo-btn absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white shadow-md transition-all">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `).join('');

    // Listener para eliminar fotos
    elements.manageGalleryGrid.querySelectorAll('.delete-gallery-photo-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        prof.galeria.splice(idx, 1);
        persistUpdatedProfessional(prof);
        renderManageGallery(prof);
        renderCards(state.professionals);
        showToast('Foto eliminada de tu galería', 'info');
      });
    });
  }

  function persistUpdatedProfessional(prof) {
    // Guardar en array de profesionales en LocalStorage
    const stored = getStoredData(STORAGE_KEYS.PROFESIONALES, []);
    const existingIdx = stored.findIndex(p => p.id === prof.id);
    if (existingIdx !== -1) {
      stored[existingIdx] = prof;
    } else {
      stored.unshift(prof);
    }
    setStoredData(STORAGE_KEYS.PROFESIONALES, stored);
  }

  // ==========================================
  // 10. MODAL Y VALIDACIÓN DEL FORMULARIO DE REGISTRO
  // ==========================================
  function openRegisterModal() {
    elements.registerModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
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
    const matricula = elements.registerMatriculaInput ? elements.registerMatriculaInput.value.trim() : '';
    const descripcion = document.getElementById('reg-descripcion').value.trim();
    const serviciosRaw = document.getElementById('reg-servicios').value.trim();

    let hasErrors = false;

    if (nombre.length < 3) {
      showFieldError('reg-nombre', 'Ingresá tu nombre y apellido (mínimo 3 letras).');
      hasErrors = true;
    }

    if (!rubro) {
      showFieldError('reg-rubro', 'Por favor seleccioná tu oficio principal.');
      hasErrors = true;
    }

    if (!barrio) {
      showFieldError('reg-barrio', 'Por favor seleccioná el barrio donde prestás servicio.');
      hasErrors = true;
    }

    const cleanPhone = telefono.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      showFieldError('reg-telefono', 'Ingresá un número de WhatsApp válido (ej. 3584123456).');
      hasErrors = true;
    }

    if (descripcion.length < 10) {
      showFieldError('reg-descripcion', 'Escribí una descripción detallada de tu trabajo (al menos 10 caracteres).');
      hasErrors = true;
    }

    if (hasErrors) {
      showToast('Por favor corregí los campos marcados en rojo', 'error');
      return;
    }

    const servicios = serviciosRaw
      ? serviciosRaw.split(',').map(s => s.trim()).filter(Boolean)
      : [rubro, 'Presupuestos sin cargo'];

    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=0f172a&color=f97316&bold=true&size=300`;
    const finalPhoto = selectedPhotoBase64 || defaultAvatar;

    const newProfessional = {
      id: 'prof_' + Date.now(),
      nombre,
      rubro,
      barrio,
      telefono: cleanPhone,
      experiencia: experiencia ? `${experiencia} años de experiencia` : 'Oficio calificado',
      matricula: matricula || null, // Matrícula profesional opcional
      descripcion,
      calificacion: 5.0,
      resenasCount: 0,
      verificado: true,
      destacado: true,
      disponibilidad: 'A coordinar por WhatsApp',
      servicios,
      foto: finalPhoto,
      imagenUrl: finalPhoto,
      galeria: [],
      fechaRegistro: new Date().toISOString()
    };

    const stored = getStoredData(STORAGE_KEYS.PROFESIONALES, []);
    stored.unshift(newProfessional);
    setStoredData(STORAGE_KEYS.PROFESIONALES, stored);

    state.professionals.unshift(newProfessional);

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
  // 11. SISTEMA DE TOAST (Success / Error / Info)
  // ==========================================
  function showToast(message, type = 'success') {
    if (!elements.toastContainer) return;
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

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-3', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    const closeBtn = toast.querySelector('button');
    if (closeBtn) closeBtn.addEventListener('click', () => removeToast(toast));

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
  // 12. LISTENERS Y ENLACE DE EVENTOS
  // ==========================================
  function setupEventListeners() {
    // Filtros
    elements.rubroSelect.addEventListener('change', (e) => {
      state.selectedRubro = e.target.value;
      applyFilters();
    });

    elements.barrioSelect.addEventListener('change', (e) => {
      state.selectedBarrio = e.target.value;
      applyFilters();
    });

    let searchDebounce;
    elements.searchField.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        state.searchQuery = e.target.value;
        applyFilters();
      }, 250);
    });

    if (elements.resetFiltersBtn) elements.resetFiltersBtn.addEventListener('click', resetFilters);
    if (elements.clearFiltersEmptyBtn) elements.clearFiltersEmptyBtn.addEventListener('click', resetFilters);
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

        if (!file.type.startsWith('image/')) {
          showToast('El archivo debe ser una imagen válida (PNG, JPG, WebP)', 'error');
          resetPhotoPreview();
          return;
        }

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

    // Modal de Login
    if (elements.loginModalCloseBtn) elements.loginModalCloseBtn.addEventListener('click', closeLoginModal);
    if (elements.loginModalBackdrop) elements.loginModalBackdrop.addEventListener('click', closeLoginModal);

    if (elements.loginDemoSofiaBtn) {
      elements.loginDemoSofiaBtn.addEventListener('click', () => loginUser('sofia@demo.com'));
    }
    if (elements.loginDemoCarlosBtn) {
      elements.loginDemoCarlosBtn.addEventListener('click', () => loginUser('carlos@demo.com'));
    }

    if (elements.loginForm) {
      elements.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = (elements.loginEmailInput.value || '').trim();
        if (!email || !email.includes('@')) {
          if (elements.loginEmailError) {
            elements.loginEmailError.textContent = 'Ingresá un correo electrónico válido';
            elements.loginEmailError.classList.remove('hidden');
          }
          return;
        }
        loginUser(email);
      });
    }

    // Modal de Gestión de Perfil & Galería
    if (elements.profileManageCloseBtn) elements.profileManageCloseBtn.addEventListener('click', closeProfileManageModal);
    if (elements.profileManageBackdrop) elements.profileManageBackdrop.addEventListener('click', closeProfileManageModal);

    if (elements.profileManageForm) {
      elements.profileManageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = state.currentUser;
        if (!user || user.rol !== 'profesional') return;

        const profId = user.linkedProfessionalId || 'prof_001';
        const prof = state.professionals.find(p => p.id === profId);
        if (!prof) return;

        prof.matricula = elements.manageMatricula.value.trim() || null;
        prof.telefono = elements.manageTelefono.value.trim();
        prof.disponibilidad = elements.manageDisponibilidad.value.trim();
        prof.descripcion = elements.manageDescripcion.value.trim();

        persistUpdatedProfessional(prof);
        renderCards(state.professionals);
        closeProfileManageModal();
        showToast('Perfil profesional actualizado con éxito', 'success');
      });
    }

    // Carga de Fotos a la Galería del Profesional (FileReader API multiple)
    if (elements.galleryInput) {
      elements.galleryInput.addEventListener('change', (e) => {
        const user = state.currentUser;
        if (!user || user.rol !== 'profesional') return;
        const profId = user.linkedProfessionalId || 'prof_001';
        const prof = state.professionals.find(p => p.id === profId);
        if (!prof) return;

        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (!prof.galeria) prof.galeria = [];

        let processed = 0;
        files.forEach(file => {
          if (!file.type.startsWith('image/')) return;
          const reader = new FileReader();
          reader.onload = function(evt) {
            prof.galeria.push(evt.target.result);
            processed++;
            if (processed === files.length) {
              persistUpdatedProfessional(prof);
              renderManageGallery(prof);
              renderCards(state.professionals);
              showToast(`${processed} ${processed === 1 ? 'foto agregada' : 'fotos agregadas'} a tu galería`, 'success');
            }
          };
          reader.readAsDataURL(file);
        });
      });
    }

    // Atajo de teclado: Escape cierra cualquier modal abierto
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (elements.detailModal && !elements.detailModal.classList.contains('hidden')) closeDetailModal();
        if (elements.registerModal && !elements.registerModal.classList.contains('hidden')) closeRegisterModal();
        if (elements.loginModal && !elements.loginModal.classList.contains('hidden')) closeLoginModal();
        if (elements.profileManageModal && !elements.profileManageModal.classList.contains('hidden')) closeProfileManageModal();
      }
    });
  }

  // Inicialización
  initTheme();
  setupEventListeners();
  loadInitialData();
  initAuth();
});
