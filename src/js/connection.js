const listeners = new Set();

export function isOnline() {
  return navigator.onLine;
}

export function onConnectionChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

window.addEventListener('online', () => listeners.forEach((cb) => cb(true)));
window.addEventListener('offline', () => listeners.forEach((cb) => cb(false)));
