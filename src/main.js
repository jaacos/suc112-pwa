import './css/tokens.css';
import './css/base.css';
import './css/layout.css';
import './css/components.css';

import { isUnlocked, renderGate } from './js/auth.js';
import { mountApp } from './js/app.js';

function boot() {
  if (isUnlocked()) {
    mountApp();
  } else {
    renderGate(() => mountApp());
  }
}

boot();

// Registro del Service Worker — habilita el funcionamiento offline.
// Se registra siempre (también en la pantalla de contraseña) para que el
// cacheado empiece cuanto antes.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.error('No se ha podido registrar el Service Worker:', err);
    });
  });
}
