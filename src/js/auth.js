// CONTROL DE ACCESO — CONTRASEÑA ÚNICA COMPARTIDA
// ---------------------------------------------------------------------------
// IMPORTANTE (léelo antes de confiar en esto):
// Esta app es un sitio estático sin backend. Este "gate" es una barrera
// disuasoria de entrada, NO seguridad real: el hash de abajo es visible en
// el código fuente que descarga cualquier navegador, y alguien con
// conocimientos técnicos puede extraerlo o desactivar el JS. Es proporcional
// a un prototipo en validación (evita que alguien entre por casualidad o
// comparta el link sin querer) pero NO protege datos realmente sensibles.
// Si "documentación interna" llega a contener algo confidencial de verdad,
// esto tiene que sustituirse por autenticación real en el despliegue
// definitivo del SUC.
//
// Para cambiar la contraseña: genera un nuevo hash SHA-256 (por ejemplo,
// en la consola del navegador: 
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('tu-contraseña'))
// y sustituye PASSWORD_HASH.
//
// Hash de ejemplo para la contraseña de prueba "suc112demo":
const PASSWORD_HASH = 'fba7f052b6fabedf367d9c9af81eba91bf6705fc626bc298c80dc860d3dd4cbd';

const SESSION_KEY = 'suc112-gate-ok';

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function isUnlocked() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export async function tryUnlock(password) {
  const hash = await sha256Hex(password);
  if (hash === PASSWORD_HASH) {
    sessionStorage.setItem(SESSION_KEY, '1');
    return true;
  }
  return false;
}

export function renderGate(onUnlock) {
  const root = document.getElementById('app');
  root.innerHTML = `
    <div class="gate">
      <div class="gate__card">
        <div class="gate__brand">
          <div class="gate__brand-mark">112</div>
          <div>
            <h1>SUC/112 · Coordinación</h1>
            <p>Prototipo en validación</p>
          </div>
        </div>
        <form id="gate-form">
          <label for="gate-password">Contraseña de acceso</label>
          <input type="password" id="gate-password" autocomplete="current-password" autofocus />
          <p class="gate__error" id="gate-error"></p>
          <button type="submit">Entrar</button>
        </form>
        <p class="gate__disclaimer">
          Herramienta de prueba interna del SUC/112, pendiente de validación
          y aprobación. No es una fuente oficial cerrada; el contenido
          clínico mostrado puede estar incompleto o sin validar.
        </p>
      </div>
    </div>
  `;

  const form = document.getElementById('gate-form');
  const errorEl = document.getElementById('gate-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = document.getElementById('gate-password').value;
    const ok = await tryUnlock(value);
    if (ok) {
      onUnlock();
    } else {
      errorEl.textContent = 'Contraseña incorrecta.';
    }
  });
}
