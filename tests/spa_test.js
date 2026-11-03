/**
 * Test Automatizado de Navegación y DOM para Oficios Barriales
 * Entorno de simulación DOM en Node.js (Zero-Dependency)
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// MOCK DEL ENTORNO DE NAVEGADOR
// ==========================================

// Mock de LocalStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    _getStore: () => store
  };
})();

// Clases auxiliares para Elementos DOM
class ClassList {
  constructor(element) {
    this.element = element;
    this.classes = new Set();
  }
  add(...names) {
    names.forEach(n => n.split(/\s+/).filter(Boolean).forEach(c => this.classes.add(c)));
  }
  remove(...names) {
    names.forEach(n => n.split(/\s+/).filter(Boolean).forEach(c => this.classes.delete(c)));
  }
  toggle(name) {
    if (this.classes.has(name)) {
      this.classes.delete(name);
      return false;
    } else {
      this.classes.add(name);
      return true;
    }
  }
  contains(name) {
    return this.classes.has(name);
  }
  toString() {
    return Array.from(this.classes).join(' ');
  }
}

class DOMElement {
  constructor(tagName = 'div', id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.classList = new ClassList(this);
    this._innerHTML = '';
    this._textContent = '';
    this.value = '';
    this.attributes = {};
    this.listeners = {};
    this.children = [];
    this.parentElement = null;
    this.dataset = {};
  }

  get innerHTML() {
    return this._innerHTML;
  }
  set innerHTML(html) {
    this._innerHTML = html;
    // Si contiene elementos con data-id o clases, simular parseo básico
    this.children = parseSimulatedHTML(html, this);
  }

  get textContent() {
    return this._textContent;
  }
  set textContent(text) {
    this._textContent = text;
  }

  setAttribute(name, val) {
    this.attributes[name] = String(val);
    if (name.startsWith('data-')) {
      const prop = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[prop] = String(val);
    }
    if (name === 'value') this.value = String(val);
    if (name === 'src') this.src = String(val);
  }
  getAttribute(name) {
    return this.attributes[name] !== undefined ? this.attributes[name] : null;
  }

  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  dispatchEvent(event) {
    const list = this.listeners[event.type] || [];
    list.forEach(fn => fn(event));
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (matchesSelector(current, selector)) return current;
      current = current.parentElement;
    }
    return null;
  }

  click() {
    const event = { 
      type: 'click', 
      target: this, 
      defaultPrevented: false, 
      preventDefault: () => { event.defaultPrevented = true; } 
    };
    this.dispatchEvent(event);
    let curr = this.parentElement;
    while (curr) {
      curr.dispatchEvent(event);
      curr = curr.parentElement;
    }
    if (global.document && global.document.dispatchEvent) {
      global.document.dispatchEvent(event);
    }
  }

  reset() {
    if (this.tagName === 'FORM') {
      const inputs = this.querySelectorAll('input, select, textarea');
      inputs.forEach(i => (i.value = ''));
    }
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentElement = null;
    }
    return child;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    function search(node) {
      if (!node || !node.children) return;
      for (const child of node.children) {
        if (matchesSelector(child, selector)) {
          results.push(child);
        }
        search(child);
      }
    }
    search(this);
    return results;
  }
}

function matchesSelector(node, selector) {
  if (selector.startsWith('.')) {
    const cls = selector.slice(1);
    return node.classList && node.classList.contains(cls);
  }
  if (selector.startsWith('#')) {
    const id = selector.slice(1);
    return node.id === id;
  }
  if (selector.includes(',')) {
    return selector.split(',').some(s => matchesSelector(node, s.trim()));
  }
  return node.tagName.toLowerCase() === selector.toLowerCase();
}

function parseSimulatedHTML(html, parent) {
  const elements = [];
  const tagRegex = /<([a-zA-Z0-9]+)([^>]*)>/g;
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const tagName = match[1];
    if (['svg', 'path', 'circle', 'polygon'].includes(tagName.toLowerCase())) continue;
    const attrsStr = match[2];

    const idMatch = attrsStr.match(/id=["']([^"']+)["']/);
    const id = idMatch ? idMatch[1] : '';

    const el = new DOMElement(tagName, id);
    el.parentElement = parent;

    const classMatch = attrsStr.match(/class=["']([^"']+)["']/);
    if (classMatch) {
      el.classList.add(...classMatch[1].split(/\s+/));
    }

    const attrRegex = /([a-zA-Z0-9\-]+)=["']([^"']*)["']/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
      el.setAttribute(attrMatch[1], attrMatch[2]);
    }

    if (id) {
      elementsMap[id] = el;
    }

    elements.push(el);
  }
  return elements;
}

// Configuración de Document y Window
const elementsMap = {};
function getOrCreateElement(id, tag = 'div') {
  if (!elementsMap[id]) {
    elementsMap[id] = new DOMElement(tag, id);
  }
  return elementsMap[id];
}

const documentMock = {
  documentElement: new DOMElement('html'),
  body: new DOMElement('body'),
  getElementById: (id) => {
    if (elementsMap[id]) return elementsMap[id];
    for (const key of ['detail-modal-content', 'auth-nav-container', 'profile-manage-modal']) {
      if (elementsMap[key]) {
        const found = elementsMap[key].querySelector('#' + id);
        if (found) return found;
      }
    }
    return getOrCreateElement(id);
  },
  querySelectorAll: (selector) => {
    if (selector === '.open-register-btn') {
      return [getOrCreateElement('btn-open-reg-1', 'button'), getOrCreateElement('btn-open-reg-2', 'button')];
    }
    const results = [];
    for (const key in elementsMap) {
      const el = elementsMap[key];
      if (matchesSelector(el, selector)) results.push(el);
      results.push(...el.querySelectorAll(selector));
    }
    return [...new Set(results)];
  },
  createElement: (tag) => new DOMElement(tag),
  _listeners: {},
  addEventListener: function(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  },
  dispatchEvent: function(event) {
    const list = this._listeners[event.type] || [];
    list.forEach(fn => fn(event));
  }
};

const windowMock = {
  localStorage: localStorageMock,
  matchMedia: () => ({ matches: false }),
  addEventListener: (event, fn) => {
    if (!windowMock._listeners) windowMock._listeners = {};
    if (!windowMock._listeners[event]) windowMock._listeners[event] = [];
    windowMock._listeners[event].push(fn);
  },
  dispatchEvent: (event) => {
    const list = (windowMock._listeners && windowMock._listeners[event.type]) || [];
    list.forEach(fn => fn(event));
  },
  requestAnimationFrame: (cb) => cb()
};

const navigatorMock = {
  clipboard: {
    writeText: async (text) => Promise.resolve()
  }
};

class FileReaderMock {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.result = null;
  }
  readAsDataURL(file) {
    setTimeout(() => {
      this.result = (file && file.base64) || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      if (this.onload) this.onload({ target: { result: this.result } });
    }, 10);
  }
}

// Globalizar mocks en Node
global.window = windowMock;
global.document = documentMock;
global.localStorage = localStorageMock;
global.navigator = navigatorMock;
global.requestAnimationFrame = windowMock.requestAnimationFrame;
global.FileReader = FileReaderMock;

// Registrar elementos estáticos de index.html
const requiredIds = [
  'professionals-grid', 'empty-state', 'loading-state', 'results-counter',
  'search-input', 'rubro-filter', 'barrio-filter', 'reset-filters-btn',
  'empty-reset-btn', 'theme-toggle-btn', 'theme-icon-light', 'theme-icon-dark',
  'detail-modal', 'detail-modal-backdrop', 'detail-modal-close', 'detail-modal-content',
  'register-modal', 'register-modal-backdrop', 'register-modal-close',
  'register-form', 'reg-rubro', 'reg-barrio', 'reg-nombre', 'reg-telefono',
  'reg-experiencia', 'reg-servicios', 'reg-descripcion', 'reg-matricula',
  'reg-nombre-error', 'reg-rubro-error', 'reg-barrio-error', 'reg-telefono-error', 'reg-descripcion-error',
  'toast-container', 'foto-input', 'foto-preview-img', 'foto-preview-icon',
  'auth-nav-container',
  'login-modal', 'login-modal-backdrop', 'login-modal-close', 'login-form',
  'login-email-input', 'login-email-error', 'login-demo-sofia-btn', 'login-demo-carlos-btn',
  'profile-manage-modal', 'profile-manage-backdrop', 'profile-manage-close', 'profile-manage-form',
  'manage-matricula', 'manage-telefono', 'manage-disponibilidad', 'manage-descripcion',
  'manage-gallery-grid', 'gallery-input'
];

requiredIds.forEach(id => {
  const tag = id.includes('form') ? 'form' : id.includes('select') || id.includes('filter') ? 'select' : id.includes('input') || id.includes('reg-nombre') || id.includes('reg-telefono') || id.includes('matricula') ? 'input' : id.includes('btn') ? 'button' : 'div';
  getOrCreateElement(id, tag);
});

// Estructurar jerarquía del modal y formulario de registro
const registerForm = elementsMap['register-form'];
['reg-nombre', 'reg-rubro', 'reg-barrio', 'reg-telefono', 'reg-experiencia', 'reg-servicios', 'reg-matricula', 'reg-descripcion'].forEach(id => {
  registerForm.appendChild(elementsMap[id]);
  const err = elementsMap[`${id}-error`];
  if (err) {
    err.classList.add('input-error-msg', 'hidden');
    registerForm.appendChild(err);
  }
});

// Estructurar jerarquía del modal de login
const loginForm = elementsMap['login-form'];
loginForm.appendChild(elementsMap['login-email-input']);
loginForm.appendChild(elementsMap['login-email-error']);

// Ocultar modales y estados por defecto como en HTML
elementsMap['detail-modal'].classList.add('hidden');
elementsMap['register-modal'].classList.add('hidden');
elementsMap['login-modal'].classList.add('hidden');
elementsMap['profile-manage-modal'].classList.add('hidden');
elementsMap['empty-state'].classList.add('hidden');
elementsMap['loading-state'].classList.add('hidden');

// Cargar data.js y app.js
require('../js/data.js');

// Helper para retardos asíncronos
const wait = (ms) => new Promise(res => setTimeout(res, ms));

// ==========================================
// TEST SUITE AUTOMATIZADO
// ==========================================

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 INICIANDO TEST SUITE AUTOMATIZADO - OFICIOS BARRIALES');
  console.log('======================================================\n');

  let passedTests = 0;
  let totalTests = 10;

  // Cargar app.js y disparar DOMContentLoaded
  const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  eval(appCode);

  // Disparar DOMContentLoaded
  document.dispatchEvent({ type: 'DOMContentLoaded' });
  await wait(250); // Esperar carga inicial y primer render

  // ----------------------------------------------------
  // TEST 1: Carga de datos semilla en LocalStorage y Render
  // ----------------------------------------------------
  try {
    const grid = elementsMap['professionals-grid'];
    const counter = elementsMap['results-counter'];
    const cardsCount = (grid.innerHTML.match(/<article/g) || []).length;
    const initialSeedCount = window.INITIAL_PROFESSIONALS.length;

    if (cardsCount === initialSeedCount && counter.textContent.includes('profesionales encontrados')) {
      console.log(`✅ [PASS] Test 1: Datos semilla cargados correctamente (${cardsCount} tarjetas renderizadas en el catálogo).`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] Test 1: Esperado ${initialSeedCount} tarjetas, pero se encontraron ${cardsCount}.`);
    }
  } catch (err) {
    console.error('❌ [FAIL] Test 1 con excepción:', err.message);
  }

  // ----------------------------------------------------
  // TEST 2: Conmutación de clases dark/light en <html>
  // ----------------------------------------------------
  try {
    const themeBtn = elementsMap['theme-toggle-btn'];
    const html = document.documentElement;

    const initialDark = html.classList.contains('dark');
    themeBtn.click(); // Conmutar
    const toggledDark = html.classList.contains('dark');
    const storedTheme = localStorage.getItem('ob_theme');

    themeBtn.click(); // Revertir
    const revertedDark = html.classList.contains('dark');

    if (initialDark !== toggledDark && revertedDark === initialDark && JSON.parse(storedTheme) === (toggledDark ? 'dark' : 'light')) {
      console.log(`✅ [PASS] Test 2: Conmutación de tema Dark/Light y persistencia en LocalStorage ('ob_theme') verificada.`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] Test 2: Error en toggle de clases o sincronización con LocalStorage.`);
    }
  } catch (err) {
    console.error('❌ [FAIL] Test 2 con excepción:', err.message);
  }

  // ----------------------------------------------------
  // TEST 3: Filtrado Reactivo de Tarjetas (Barrio y Rubro)
  // ----------------------------------------------------
  try {
    const barrioSelect = elementsMap['barrio-filter'];
    const rubroSelect = elementsMap['rubro-filter'];
    const grid = elementsMap['professionals-grid'];
    const emptyState = elementsMap['empty-state'];

    // 3.1 Filtrar por Barrio 'Banda Norte'
    barrioSelect.value = 'Banda Norte';
    barrioSelect.dispatchEvent({ type: 'change', target: barrioSelect });
    await wait(220);

    const cardsBandaNorte = (grid.innerHTML.match(/<article/g) || []).length;
    const expectedBandaNorte = window.INITIAL_PROFESSIONALS.filter(p => p.barrio === 'Banda Norte').length;

    // 3.2 Filtrar por combinación sin resultados para verificar Empty State (Rubro 'Jardinería' en 'Banda Norte')
    rubroSelect.value = 'Jardinería';
    rubroSelect.dispatchEvent({ type: 'change', target: rubroSelect });
    await wait(220);

    const isEmptyStateVisible = !emptyState.classList.contains('hidden') && grid.classList.contains('hidden');

    // Resetear filtros
    elementsMap['reset-filters-btn'].click();
    await wait(220);
    const resetCount = (grid.innerHTML.match(/<article/g) || []).length;

    if (cardsBandaNorte === expectedBandaNorte && isEmptyStateVisible && resetCount === window.INITIAL_PROFESSIONALS.length) {
      console.log(`✅ [PASS] Test 3: Filtrado reactivo por Barrio ('Banda Norte': ${cardsBandaNorte}), Empty State verificado y reseteo funcional.`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] Test 3: Falló filtrado reactivo. BN: ${cardsBandaNorte}/${expectedBandaNorte}, EmptyState: ${isEmptyStateVisible}`);
    }
  } catch (err) {
    console.error('❌ [FAIL] Test 3 con excepción:', err.message);
  }

  // ----------------------------------------------------
  // TEST 4: Apertura y Cierre del Modal de Detalle con Escape
  // ----------------------------------------------------
  try {
    const detailModal = elementsMap['detail-modal'];
    const body = document.body;

    // Obtener un botón "Ver Perfil" generado
    const viewBtn = elementsMap['professionals-grid'].querySelectorAll('.view-detail-btn')[0];
    if (!viewBtn) throw new Error('No se encontró botón .view-detail-btn en las tarjetas renderizadas');

    // Clic en Ver Perfil
    viewBtn.click();

    const isModalOpen = !detailModal.classList.contains('hidden');
    const isBodyLocked = body.classList.contains('overflow-hidden');
    const modalContent = elementsMap['detail-modal-content'].innerHTML;
    const hasWhatsAppLink = modalContent.includes('wa.me/549358');

    // Simular tecla Escape
    window.dispatchEvent({ type: 'keydown', key: 'Escape' });

    const isModalClosed = detailModal.classList.contains('hidden');
    const isBodyUnlocked = !body.classList.contains('overflow-hidden');

    if (isModalOpen && isBodyLocked && hasWhatsAppLink && isModalClosed && isBodyUnlocked) {
      console.log(`✅ [PASS] Test 4: Modal de detalle abre con datos sanitizados de WhatsApp y se cierra correctamente con tecla Escape.`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] Test 4: Modal detalle falló. Open: ${isModalOpen}, LinkWA: ${hasWhatsAppLink}, Closed: ${isModalClosed}`);
    }
  } catch (err) {
    console.error('❌ [FAIL] Test 4 con excepción:', err.message);
  }

  // ----------------------------------------------------
  // TEST 5: Validación de Formulario y Disparo de Toast
  // ----------------------------------------------------
  try {
    const regModal = elementsMap['register-modal'];
    const regForm = elementsMap['register-form'];
    const toastContainer = elementsMap['toast-container'];

    // 5.1 Abrir modal de registro
    elementsMap['btn-open-reg-1'].click();
    const isRegModalOpen = !regModal.classList.contains('hidden');

    // 5.2 Submit con campos vacíos -> Debe disparar Error State
    regForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });

    const nameErrorVisible = !elementsMap['reg-nombre-error'].classList.contains('hidden');
    const rubroErrorVisible = !elementsMap['reg-rubro-error'].classList.contains('hidden');
    const errorToastFired = toastContainer.children.some(c => c.innerHTML.includes('corregí los campos'));

    // 5.3 Llenar formulario válido y enviar
    elementsMap['reg-nombre'].value = 'Héctor Gómez';
    elementsMap['reg-rubro'].value = 'Electricidad';
    elementsMap['reg-barrio'].value = 'Banda Norte';
    elementsMap['reg-telefono'].value = '3584998877';
    elementsMap['reg-descripcion'].value = 'Electricista matriculado con 20 años de trayectoria.';

    regForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    await wait(220);

    const isRegModalClosed = regModal.classList.contains('hidden');
    const storedProfList = JSON.parse(localStorage.getItem('ob_profesionales') || '[]');
    const isStored = storedProfList.some(p => p.nombre === 'Héctor Gómez' && p.barrio === 'Banda Norte');
    const successToastFired = toastContainer.children.some(c => c.innerHTML.includes('¡Bienvenido Héctor Gómez!'));

    if (isRegModalOpen && nameErrorVisible && rubroErrorVisible && errorToastFired && isRegModalClosed && isStored && successToastFired) {
      console.log(`✅ [PASS] Test 5: Formulario valida campos requeridos (Error State), guarda en LocalStorage y notifica vía Toast (Success State).`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] Test 5: Error en formulario o Toast. ValErr: ${nameErrorVisible}, Stored: ${isStored}, SuccessToast: ${successToastFired}`);
    }
  } catch (err) {
    console.error('❌ [FAIL] Test 5 con excepción:', err.message);
  }

  // ----------------------------------------------------
  // TEST 6: Carga de Foto de Perfil (FileReader -> Base64)
  // ----------------------------------------------------
  try {
    const regModal = elementsMap['register-modal'];
    const regForm = elementsMap['register-form'];
    const fotoInput = elementsMap['foto-input'];
    const fotoPreviewImg = elementsMap['foto-preview-img'];
    const fotoPreviewIcon = elementsMap['foto-preview-icon'];

    elementsMap['btn-open-reg-1'].click();

    // Simular selección de archivo de imagen
    const fakeFile = {
      name: 'perfil.png',
      type: 'image/png',
      size: 1024 * 50
    };
    fotoInput.files = [fakeFile];
    fotoInput.dispatchEvent({ type: 'change', target: fotoInput });
    await wait(30);

    const isPreviewVisible = !fotoPreviewImg.classList.contains('hidden') && fotoPreviewImg.src.startsWith('data:image/png;base64');
    const isIconHidden = fotoPreviewIcon.classList.contains('hidden');

    // Llenar datos y enviar
    elementsMap['reg-nombre'].value = 'Lucía Navarro';
    elementsMap['reg-rubro'].value = 'Pintura';
    elementsMap['reg-barrio'].value = 'Alberdi';
    elementsMap['reg-telefono'].value = '3584119900';
    elementsMap['reg-descripcion'].value = 'Pintura de interiores y empapelados de diseño.';

    regForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    await wait(220);

    const storedProfList = JSON.parse(localStorage.getItem('ob_profesionales') || '[]');
    const profWithPhoto = storedProfList.find(p => p.nombre === 'Lucía Navarro');
    const hasBase64Photo = profWithPhoto && profWithPhoto.foto && profWithPhoto.foto.startsWith('data:image/png;base64');

    if (isPreviewVisible && isIconHidden && hasBase64Photo) {
      console.log(`✅ [PASS] Test 6: Carga de foto con FileReader API, vista previa dinámica y persistencia en Base64 ('foto') verificada.`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] Test 6: Falló carga de foto. Preview: ${isPreviewVisible}, IconHidden: ${isIconHidden}, HasBase64: ${!!hasBase64Photo}`);
    }
  } catch (err) {
    console.error('❌ [FAIL] Test 6 con excepción:', err.message);
  }

  // ----------------------------------------------------
  // TEST 7: Sistema de Autenticación y Selector de Usuarios Demo
  // ----------------------------------------------------
  try {
    // 7.1 Login como Sofía (Cliente Demo)
    const btnSofia = elementsMap['login-demo-sofia-btn'];
    btnSofia.click();
    await wait(50);

    const activeUser1 = JSON.parse(localStorage.getItem('ob_active_user') || '{}');
    const isSofiaLoggedIn = activeUser1.email === 'sofia@demo.com' && activeUser1.rol === 'cliente';
    const authContainerHtml1 = elementsMap['auth-nav-container'].innerHTML;
    const showsSofia = authContainerHtml1.includes('Sofía') && authContainerHtml1.includes('cliente');

    // 7.2 Conmutar a Carlos Peralta (Profesional Demo)
    const btnCarlos = elementsMap['login-demo-carlos-btn'];
    btnCarlos.click();
    await wait(50);

    const activeUser2 = JSON.parse(localStorage.getItem('ob_active_user') || '{}');
    const isCarlosLoggedIn = activeUser2.email === 'carlos@demo.com' && activeUser2.rol === 'profesional';
    const authContainerHtml2 = elementsMap['auth-nav-container'].innerHTML;
    const showsCarlos = authContainerHtml2.includes('Carlos Peralta') && authContainerHtml2.includes('profesional');
    const hasManageBtn = !!documentMock.getElementById('open-profile-manage-btn');

    // 7.3 Cerrar Sesión (Logout reactivo y limpieza explícita de LocalStorage)
    const logoutBtn = documentMock.getElementById('logout-btn');
    if (!logoutBtn) throw new Error('No se encontró botón #logout-btn');
    logoutBtn.click();
    await wait(50);

    const activeUserCleared = localStorage.getItem('ob_active_user');
    const authContainerHtmlGuest = elementsMap['auth-nav-container'].innerHTML;
    const showsGuest = authContainerHtmlGuest.includes('Ingresar Demo') && !authContainerHtmlGuest.includes('Cerrar Sesión');
    const isManageBtnGone = !authContainerHtmlGuest.includes('open-profile-manage-btn');
    const isScrollUnlocked = !document.body.classList.contains('overflow-hidden');

    // 7.4 Alternancia libre de nuevo a Sofía y luego a Carlos (sin recargar)
    btnSofia.click();
    await wait(50);
    const isReSofia = JSON.parse(localStorage.getItem('ob_active_user') || '{}').email === 'sofia@demo.com';

    btnCarlos.click();
    await wait(50);
    const isReCarlos = JSON.parse(localStorage.getItem('ob_active_user') || '{}').email === 'carlos@demo.com';

    // Volver a estado invitado
    const logoutBtn2 = documentMock.getElementById('logout-btn');
    if (logoutBtn2) logoutBtn2.click();
    await wait(50);
    const isFinalGuest = localStorage.getItem('ob_active_user') === null;

    if (isSofiaLoggedIn && showsSofia && isCarlosLoggedIn && showsCarlos && hasManageBtn &&
        activeUserCleared === null && showsGuest && isManageBtnGone && isScrollUnlocked &&
        isReSofia && isReCarlos && isFinalGuest) {
      console.log(`✅ [PASS] Test 7: Autenticación, cierre de sesión reactivo y alternancia libre de roles (Sofía <-> Carlos <-> Invitado) verificada.`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] Test 7: Falló alternancia de sesión. Sofia: ${isSofiaLoggedIn}, Carlos: ${isCarlosLoggedIn}, LogoutCleared: ${activeUserCleared === null}, Guest: ${showsGuest}, Scroll: ${isScrollUnlocked}, ReSofia: ${isReSofia}, ReCarlos: ${isReCarlos}`);
    }
  } catch (err) {
    console.error('❌ [FAIL] Test 7 con excepción:', err.message);
  }

  // ----------------------------------------------------
  // TEST 8: Sistema de Reseñas y Calificaciones (Cliente -> Profesional)
  // ----------------------------------------------------
  try {
    // 8.1 Iniciar sesión como Sofía (Cliente)
    elementsMap['login-demo-sofia-btn'].click();
    await wait(50);

    // 8.2 Abrir modal de Carlos Peralta (prof_001)
    const viewCarlosBtn = elementsMap['professionals-grid'].querySelectorAll('.view-detail-btn').find(b => b.getAttribute('data-id') === 'prof_001');
    if (!viewCarlosBtn) throw new Error('No se encontró botón de Carlos Peralta (prof_001)');
    viewCarlosBtn.click();
    await wait(50);

    const reviewForm = documentMock.getElementById('review-submit-form');
    if (!reviewForm) throw new Error('Formulario de reseña no encontrado para cliente autenticado');

    // 8.3 Seleccionar 5 estrellas y escribir comentario
    const starBtns = elementsMap['detail-modal-content'].querySelectorAll('.star-btn');
    if (starBtns.length >= 5) {
      starBtns[4].click(); // 5 estrellas
    }

    const commentInput = documentMock.getElementById('review-comment-input');
    commentInput.value = 'Excelente electricista, resolvió el cortocircuito en menos de 1 hora.';

    const initialReviewsCount = JSON.parse(localStorage.getItem('ob_reviews') || '[]').filter(r => r.profesionalId === 'prof_001').length;

    // Enviar reseña
    reviewForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    await wait(100);

    const storedReviews = JSON.parse(localStorage.getItem('ob_reviews') || '[]');
    const carlosReviews = storedReviews.filter(r => r.profesionalId === 'prof_001');
    const hasNewReview = carlosReviews.some(r => r.autorEmail === 'sofia@demo.com' && r.comentario.includes('cortocircuito'));
    const isCounterIncremented = carlosReviews.length === initialReviewsCount + 1;

    // Verificar recálculo de promedio y renderizado en modal
    const modalHtml = elementsMap['detail-modal-content'].innerHTML;
    const showsUpdatedReview = modalHtml.includes('Sofía Martínez') && modalHtml.includes('cortocircuito');

    if (hasNewReview && isCounterIncremented && showsUpdatedReview) {
      console.log(`✅ [PASS] Test 8: Sistema de reseñas persistente en 'ob_reviews', recálculo dinámico y renderizado en tiempo real verificado.`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] Test 8: Falló reseña. NewReview: ${hasNewReview}, Count: ${carlosReviews.length}/${initialReviewsCount + 1}, Rendered: ${showsUpdatedReview}`);
    }
  } catch (err) {
    console.error('❌ [FAIL] Test 8 con excepción:', err.message);
  }

  // ----------------------------------------------------
  // TEST 9: Galería de Trabajos para Profesionales (Carga Base64 y Gestión)
  // ----------------------------------------------------
  try {
    // 9.1 Iniciar sesión como Carlos Peralta (profesional)
    elementsMap['login-demo-carlos-btn'].click();
    await wait(50);

    // 9.2 Abrir modal de gestión de perfil
    const openManageBtn = documentMock.getElementById('open-profile-manage-btn');
    if (!openManageBtn) throw new Error('No se encontró botón para gestionar perfil profesional');
    openManageBtn.click();
    await wait(50);

    const isManageModalOpen = !elementsMap['profile-manage-modal'].classList.contains('hidden');

    // 9.3 Subir foto de trabajo mediante FileReader API
    const galleryInput = elementsMap['gallery-input'];
    const fakeGalleryImg = {
      name: 'tablero-nuevo.jpg',
      type: 'image/jpeg',
      base64: 'data:image/jpeg;base64,mockTableroCarlos2026'
    };
    galleryInput.files = [fakeGalleryImg];
    galleryInput.dispatchEvent({ type: 'change', target: galleryInput });
    await wait(50);

    // Verificar persistencia en galería de Carlos en LocalStorage
    const storedProfs = JSON.parse(localStorage.getItem('ob_profesionales') || '[]');
    const carlosStored = storedProfs.find(p => p.id === 'prof_001');
    const hasNewGalleryPhoto = carlosStored && carlosStored.galeria && carlosStored.galeria.includes('data:image/jpeg;base64,mockTableroCarlos2026');

    // Verificar renderizado en la grilla del modal de gestión
    const galleryGridHtml = elementsMap['manage-gallery-grid'].innerHTML;
    const isRenderedInGrid = galleryGridHtml.includes('mockTableroCarlos2026');

    // 9.4 Eliminar la foto recién agregada mediante el botón de borrado
    const deleteBtn = elementsMap['manage-gallery-grid'].querySelectorAll('.delete-gallery-photo-btn').pop();
    if (deleteBtn) {
      deleteBtn.click();
      await wait(50);
    }
    const storedProfsAfter = JSON.parse(localStorage.getItem('ob_profesionales') || '[]');
    const carlosAfter = storedProfsAfter.find(p => p.id === 'prof_001');
    const isPhotoDeleted = carlosAfter && (!carlosAfter.galeria || !carlosAfter.galeria.includes('data:image/jpeg;base64,mockTableroCarlos2026'));

    if (isManageModalOpen && hasNewGalleryPhoto && isRenderedInGrid && isPhotoDeleted) {
      console.log(`✅ [PASS] Test 9: Galería de trabajos profesional (subida múltiple Base64, persistencia en 'ob_profesionales' y borrado individual) verificada.`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] Test 9: Falló galería. ModalOpen: ${isManageModalOpen}, Stored: ${hasNewGalleryPhoto}, Grid: ${isRenderedInGrid}, Deleted: ${isPhotoDeleted}`);
    }
  } catch (err) {
    console.error('❌ [FAIL] Test 9 con excepción:', err.message);
  }

  // ----------------------------------------------------
  // TEST 10: Matrícula / Registro Técnico Opcional y Badge Condicional
  // ----------------------------------------------------
  try {
    // 10.1 Carlos Peralta tiene matrícula -> Badge visible en modal
    const viewCarlosBtn = elementsMap['professionals-grid'].querySelectorAll('.view-detail-btn').find(b => b.getAttribute('data-id') === 'prof_001');
    viewCarlosBtn.click();
    await wait(50);

    const carlosModalHtml = elementsMap['detail-modal-content'].innerHTML;
    const hasCarlosMatriculaBadge = carlosModalHtml.includes('Matriculado') && carlosModalHtml.includes('ERSeP Cat. III - Mat. 4812');

    // 10.2 Mariana Ríos no tiene matrícula -> No debe mostrar badge
    const viewMarianaBtn = elementsMap['professionals-grid'].querySelectorAll('.view-detail-btn').find(b => b.getAttribute('data-id') === 'prof_002');
    viewMarianaBtn.click();
    await wait(50);

    const marianaModalHtml = elementsMap['detail-modal-content'].innerHTML;
    const hasMarianaMatriculaBadge = marianaModalHtml.includes('Matriculado');

    // 10.3 Registro de nuevo profesional SIN matrícula (campo opcional sin error)
    elementsMap['btn-open-reg-1'].click();
    elementsMap['reg-nombre'].value = 'Gonzalo Cabrera';
    elementsMap['reg-rubro'].value = 'Carpintería';
    elementsMap['reg-barrio'].value = 'Alberdi';
    elementsMap['reg-telefono'].value = '3584887766';
    elementsMap['reg-matricula'].value = ''; // Matrícula vacía (opcional)
    elementsMap['reg-descripcion'].value = 'Muebles a medida y restauración de aberturas de madera.';

    elementsMap['register-form'].dispatchEvent({ type: 'submit', preventDefault: () => {} });
    await wait(220);

    const storedProfs = JSON.parse(localStorage.getItem('ob_profesionales') || '[]');
    const gonzalo = storedProfs.find(p => p.nombre === 'Gonzalo Cabrera');
    const isRegisteredWithoutMatricula = gonzalo && gonzalo.matricula === null;

    if (hasCarlosMatriculaBadge && !hasMarianaMatriculaBadge && isRegisteredWithoutMatricula) {
      console.log(`✅ [PASS] Test 10: Matrícula técnica opcional (badge condicional en profesionales matriculados y registro flexible sin errores).`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] Test 10: Falló matrícula. CarlosBadge: ${hasCarlosMatriculaBadge}, MarianaBadge: ${!hasMarianaMatriculaBadge}, RegWithoutMatricula: ${isRegisteredWithoutMatricula}`);
    }
  } catch (err) {
    console.error('❌ [FAIL] Test 10 con excepción:', err.message);
  }

  // ----------------------------------------------------
  // RESUMEN FINAL
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log(`📊 RESUMEN FINAL: ${passedTests}/${totalTests} TESTS APROBADOS`);
  if (passedTests === totalTests) {
    console.log('🎉 TODOS LOS COMPONENTES DE LA SPA FUNCIONAN CORRECTAMENTE (DoD Cumplido).');
  } else {
    console.log('⚠️ ALGUNOS TESTS NO PASARON. REVISAR DETALLES ARRIBA.');
  }
  console.log('======================================================\n');

  process.exit(passedTests === totalTests ? 0 : 1);
}

runTestSuite();
