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
    if (name === 'data-id') this.dataset.id = val;
    if (name === 'data-phone') this.dataset.phone = val;
  }
  getAttribute(name) {
    return this.attributes[name] || null;
  }

  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  dispatchEvent(event) {
    const list = this.listeners[event.type] || [];
    list.forEach(fn => fn(event));
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this });
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

    const dataIdMatch = attrsStr.match(/data-id=["']([^"']+)["']/);
    if (dataIdMatch) el.setAttribute('data-id', dataIdMatch[1]);

    const dataPhoneMatch = attrsStr.match(/data-phone=["']([^"']+)["']/);
    if (dataPhoneMatch) el.setAttribute('data-phone', dataPhoneMatch[1]);

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
    if (elementsMap['detail-modal-content']) {
      const found = elementsMap['detail-modal-content'].querySelector('#' + id);
      if (found) return found;
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

// Globalizar mocks en Node
global.window = windowMock;
global.document = documentMock;
global.localStorage = localStorageMock;
global.navigator = navigatorMock;
global.requestAnimationFrame = windowMock.requestAnimationFrame;

// Registrar elementos estáticos de index.html
const requiredIds = [
  'professionals-grid', 'empty-state', 'loading-state', 'results-counter',
  'search-input', 'rubro-filter', 'barrio-filter', 'reset-filters-btn',
  'empty-reset-btn', 'theme-toggle-btn', 'theme-icon-light', 'theme-icon-dark',
  'detail-modal', 'detail-modal-backdrop', 'detail-modal-close', 'detail-modal-content',
  'register-modal', 'register-modal-backdrop', 'register-modal-close',
  'register-form', 'reg-rubro', 'reg-barrio', 'reg-nombre', 'reg-telefono',
  'reg-experiencia', 'reg-servicios', 'reg-descripcion', 'reg-nombre-error',
  'reg-rubro-error', 'reg-barrio-error', 'reg-telefono-error', 'reg-descripcion-error',
  'toast-container'
];

requiredIds.forEach(id => {
  const tag = id.includes('form') ? 'form' : id.includes('select') || id.includes('filter') ? 'select' : id.includes('input') || id.includes('reg-nombre') || id.includes('reg-telefono') ? 'input' : 'div';
  getOrCreateElement(id, tag);
});

// Estructurar jerarquía del modal y formulario
const registerForm = elementsMap['register-form'];
['reg-nombre', 'reg-rubro', 'reg-barrio', 'reg-telefono', 'reg-experiencia', 'reg-servicios', 'reg-descripcion'].forEach(id => {
  registerForm.appendChild(elementsMap[id]);
  const err = elementsMap[`${id}-error`];
  if (err) {
    err.classList.add('input-error-msg', 'hidden');
    registerForm.appendChild(err);
  }
});

// Ocultar modales y estados por defecto como en HTML
elementsMap['detail-modal'].classList.add('hidden');
elementsMap['register-modal'].classList.add('hidden');
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
  let totalTests = 5;

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
