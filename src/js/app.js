import { MODULES } from './config.js';
import { renderHome, renderModuleList, renderModuleDetail } from './views.js';
import { searchAll } from './search.js';
import { isOnline, onConnectionChange } from './connection.js';
import { warmOfflineCache } from './store.js';

const ICONS = {
  stethoscope: '🩺',
  'alert-triangle': '⚠️',
  'map-pin': '📍',
  'file-text': '📄'
};

export function mountApp() {
  const root = document.getElementById('app');

  root.innerHTML = `
    <div class="app-shell">
      <header class="app-header">
        <div class="app-header__brand">
          <div class="app-header__brand-mark">112</div>
          <span>SUC/112 Coordinación</span>
        </div>
        <div class="app-header__search search-box">
          <span class="search-box__icon">🔎</span>
          <input type="text" id="global-search" placeholder="Buscar en guías, criterios, directorio y documentación…" autocomplete="off" />
          <div class="search-results" id="search-results"></div>
        </div>
        <div class="app-header__status">
          <span class="connection-status" id="connection-status">
            <span class="connection-status__dot"></span>
            <span id="connection-label">En línea</span>
          </span>
        </div>
      </header>

      <nav class="app-sidebar">
        <ul class="nav-list" id="nav-list">
          ${MODULES.map(
            (mod) => `
            <li>
              <button class="nav-item" data-nav="#/${mod.id}">
                <span class="nav-item__icon">${ICONS[mod.icon] || '•'}</span>
                <span>${mod.label}</span>
                <span class="nav-item__badge">
                  ${mod.offline
                    ? '<span class="badge badge--offline-ok"><span class="badge__dot"></span>Offline</span>'
                    : '<span class="badge badge--online-required"><span class="badge__dot"></span>Online</span>'}
                </span>
              </button>
            </li>
          `
          ).join('')}
        </ul>
      </nav>

      <main class="app-main" id="main-content"></main>
    </div>
  `;

  setupNav();
  setupSearch();
  setupConnectionIndicator();
  setupRouter();

  // Si hay red al arrancar, refresca la caché offline en segundo plano.
  if (isOnline()) {
    warmOfflineCache();
  }
}

function setupNav() {
  document.querySelectorAll('#nav-list [data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.hash = btn.getAttribute('data-nav');
    });
  });
}

function highlightActiveNav(moduleId) {
  document.querySelectorAll('#nav-list [data-nav]').forEach((btn) => {
    const isActive = btn.getAttribute('data-nav') === `#/${moduleId}`;
    if (isActive) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });
}

function setupConnectionIndicator() {
  const statusEl = document.getElementById('connection-status');
  const labelEl = document.getElementById('connection-label');

  function update(online) {
    labelEl.textContent = online ? 'En línea' : 'Sin conexión';
    statusEl.classList.toggle('connection-status--offline', !online);
    if (online) warmOfflineCache();
  }

  update(isOnline());
  onConnectionChange(update);
}

function setupSearch() {
  const input = document.getElementById('global-search');
  const resultsEl = document.getElementById('search-results');
  let debounceTimer = null;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = input.value;
    if (!query.trim()) {
      resultsEl.innerHTML = '';
      return;
    }
    debounceTimer = setTimeout(async () => {
      const groups = await searchAll(query);
      renderSearchResults(resultsEl, groups, query);
    }, 150);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.app-header__search')) {
      resultsEl.innerHTML = '';
    }
  });
}

function renderSearchResults(container, groups, query) {
  if (groups.length === 0) {
    container.innerHTML = `<p class="search-empty">Sin resultados para “${escapeHtml(query)}”.</p>`;
    return;
  }

  container.innerHTML = groups
    .map(
      (group) => `
      <div class="search-result-group">
        <div class="search-result-group__label">${escapeHtml(group.moduleLabel)}</div>
        ${group.items
          .map(
            (item) => `
          <button class="search-result" data-nav="#/${item.moduleId}/${encodeURIComponent(item.id)}">
            <span class="search-result__title">${escapeHtml(item.title)}</span>
            <span class="search-result__meta">${escapeHtml(item.subtitle || '')}</span>
          </button>
        `
          )
          .join('')}
      </div>
    `
    )
    .join('');

  container.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.hash = btn.getAttribute('data-nav');
      container.innerHTML = '';
      document.getElementById('global-search').value = '';
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

function setupRouter() {
  window.addEventListener('hashchange', route);
  route();
}

function route() {
  const main = document.getElementById('main-content');
  const hash = window.location.hash.replace(/^#\/?/, ''); // "modulo/id" o ""
  const [moduleId, itemId] = hash.split('/').filter(Boolean);

  if (!moduleId) {
    renderHome(main);
    highlightActiveNav(null);
    return;
  }

  highlightActiveNav(moduleId);

  if (itemId) {
    renderModuleDetail(main, moduleId, itemId);
  } else {
    renderModuleList(main, moduleId);
  }
}
