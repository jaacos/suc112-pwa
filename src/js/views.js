import { MODULES, getModule } from './config.js';
import { loadModuleData, getLastSync } from './store.js';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

function availabilityBadge(mod) {
  return mod.offline
    ? `<span class="badge badge--offline-ok"><span class="badge__dot"></span>Disponible sin conexión</span>`
    : `<span class="badge badge--online-required"><span class="badge__dot"></span>Requiere conexión</span>`;
}

function nivelBadge(nivel) {
  const map = {
    critico: { cls: 'badge--online-required', label: 'Crítico' },
    alerta: { cls: 'badge--online-required', label: 'Alerta' },
    info: { cls: 'badge--offline-ok', label: 'Info' }
  };
  const conf = map[nivel] || map.info;
  return `<span class="badge ${conf.cls}">${conf.label}</span>`;
}

function statusPill(estado) {
  const cls = estado === 'validado' ? 'status-pill--validado' : 'status-pill--borrador';
  const label = estado === 'validado' ? 'Validado' : 'Borrador';
  return `<span class="status-pill ${cls}">${label}</span>`;
}

export function renderHome(mainEl) {
  mainEl.innerHTML = `
    <div class="view">
      <div class="view-header">
        <div>
          <h1>SUC/112 · Consulta rápida</h1>
          <p>Selecciona un módulo o usa el buscador de arriba.</p>
        </div>
      </div>
      <div class="card-list">
        ${MODULES.map(
          (mod) => `
          <button class="card" data-nav="#/${mod.id}">
            <div class="card__top">
              <div>
                <div class="card__title">${escapeHtml(mod.label)}</div>
              </div>
              ${availabilityBadge(mod)}
            </div>
          </button>
        `
        ).join('')}
      </div>
      ${prototypeFooter()}
    </div>
  `;
  bindNavButtons(mainEl);
}

function prototypeFooter() {
  return `
    <div class="prototype-footer">
      <strong>Prototipo en validación.</strong> Esta herramienta está en fase de
      pruebas internas y aún no ha sido aprobada ni certificada como fuente
      oficial del SUC/112. El contenido clínico mostrado puede estar
      incompleto, marcado como borrador o pendiente de validación.
    </div>
  `;
}

function bindNavButtons(container) {
  container.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.hash = btn.getAttribute('data-nav');
    });
  });
}

export async function renderModuleList(mainEl, moduleId) {
  const mod = getModule(moduleId);
  if (!mod) {
    mainEl.innerHTML = `<div class="view"><p>Módulo no encontrado.</p></div>`;
    return;
  }

  mainEl.innerHTML = `
    <div class="view">
      <div class="view-header">
        <div>
          <h1>${escapeHtml(mod.label)}</h1>
          <p id="sync-info"></p>
        </div>
        ${availabilityBadge(mod)}
      </div>
      <div class="card-list" id="list-container">
        <p class="search-empty">Cargando…</p>
      </div>
    </div>
  `;

  const listContainer = mainEl.querySelector('#list-container');
  const syncInfo = mainEl.querySelector('#sync-info');

  try {
    const items = await loadModuleData(moduleId);

    if (mod.offline) {
      const lastSync = await getLastSync(moduleId);
      syncInfo.textContent = lastSync
        ? `Última actualización local: ${new Date(lastSync).toLocaleString('es-ES')}`
        : 'Sin sincronizar todavía.';
    } else {
      syncInfo.textContent = 'Datos en tiempo real (requiere conexión).';
    }

    if (items.length === 0) {
      listContainer.innerHTML = `<p class="search-empty">No hay entradas todavía en este módulo.</p>`;
      return;
    }

    listContainer.innerHTML = items
      .map(
        (item) => `
        <button class="card" data-nav="#/${mod.id}/${encodeURIComponent(item.id)}">
          <div class="card__top">
            <div>
              <div class="card__title">${escapeHtml(item[mod.listTitleField])}</div>
              <div class="card__subtitle">${escapeHtml(item[mod.listSubtitleField] || '')}</div>
            </div>
            ${statusPill(item.estado)}
          </div>
        </button>
      `
      )
      .join('');
    bindNavButtons(listContainer);
  } catch (err) {
    listContainer.innerHTML = `
      <p class="search-empty">
        No se ha podido cargar este módulo: ${escapeHtml(err.message)}
      </p>
    `;
  }
}

export async function renderModuleDetail(mainEl, moduleId, itemId) {
  const mod = getModule(moduleId);
  if (!mod) {
    mainEl.innerHTML = `<div class="view"><p>Módulo no encontrado.</p></div>`;
    return;
  }

  mainEl.innerHTML = `<div class="view"><p class="search-empty">Cargando…</p></div>`;

  try {
    const items = await loadModuleData(moduleId);
    const item = items.find((i) => String(i.id) === String(itemId));

    if (!item) {
      mainEl.innerHTML = `
        <div class="view">
          <button class="detail-panel__back" data-nav="#/${mod.id}">← Volver a ${escapeHtml(mod.label)}</button>
          <p>Entrada no encontrada.</p>
        </div>
      `;
      bindNavButtons(mainEl);
      return;
    }

    mainEl.innerHTML = `
      <div class="view">
        <button class="detail-panel__back" data-nav="#/${mod.id}">← Volver a ${escapeHtml(mod.label)}</button>
        <div class="detail-panel">
          <div class="card__top">
            <h1 class="card__title">${escapeHtml(item[mod.listTitleField])}</h1>
            ${statusPill(item.estado)}
          </div>
          ${renderModuleFields(mod, item)}
          <p class="version-tag">
            Versión ${escapeHtml(item.version || '—')} ·
            ${item.fecha_validacion ? `validado el ${escapeHtml(item.fecha_validacion)}` : 'sin fecha de validación'}
          </p>
        </div>
      </div>
    `;
    bindNavButtons(mainEl);
  } catch (err) {
    mainEl.innerHTML = `
      <div class="view">
        <button class="detail-panel__back" data-nav="#/${mod.id}">← Volver</button>
        <p class="search-empty">No se ha podido cargar: ${escapeHtml(err.message)}</p>
      </div>
    `;
    bindNavButtons(mainEl);
  }
}

// Renderizado específico por tipo de módulo — cada módulo tiene campos distintos.
function renderModuleFields(mod, item) {
  switch (mod.id) {
    case 'guias':
      return `
        <div class="detail-section">
          <h2>Definición</h2>
          <p>${escapeHtml(item.definicion)}</p>
        </div>
        <div class="detail-section detail-section--alert">
          <h2>Signos de alarma</h2>
          <ul>${(item.signos_alarma || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
        </div>
        <div class="detail-section">
          <h2>Manejo</h2>
          <p>${escapeHtml(item.manejo)}</p>
        </div>
        <div class="detail-section">
          <h2>Derivación</h2>
          <p>${escapeHtml(item.derivacion)}</p>
        </div>
      `;
    case 'criterios':
      return `
        <div class="detail-section">
          <h2>Criterios</h2>
          <ul>
            ${(item.criterios || [])
              .map((c) => `<li>${escapeHtml(c.texto)} ${nivelBadge(c.nivel)}</li>`)
              .join('')}
          </ul>
        </div>
        <div class="detail-section">
          <h2>Recurso recomendado</h2>
          <p>${escapeHtml(item.recurso_recomendado)}</p>
        </div>
      `;
    case 'directorio':
      return `
        <div class="detail-section">
          <h2>Dirección</h2>
          <p>${escapeHtml(item.direccion)}</p>
        </div>
        <div class="detail-section">
          <h2>Teléfono</h2>
          <p>${escapeHtml(item.telefono)}</p>
        </div>
        <div class="detail-section">
          <h2>Horario</h2>
          <p>${escapeHtml(item.horario)}</p>
        </div>
        <div class="detail-section">
          <h2>Notas</h2>
          <p>${escapeHtml(item.notas)}</p>
        </div>
      `;
    case 'documentacion':
      return `
        <div class="detail-section">
          <h2>Resumen</h2>
          <p>${escapeHtml(item.resumen)}</p>
        </div>
        <div class="detail-section">
          <h2>Contenido</h2>
          <p>${escapeHtml(item.contenido)}</p>
        </div>
      `;
    default:
      return '';
  }
}
