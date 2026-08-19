import { MODULES, getModule } from './config.js';
import { putAll, getAll, setMeta, getMeta } from './db.js';

// Caché en memoria de la sesión actual, para no releer IndexedDB en cada render.
const memoryCache = new Map();

/**
 * Devuelve los items de un módulo.
 * - Módulos offline: intenta red primero (para tener el dato más fresco);
 *   si falla, cae a IndexedDB. Cada vez que hay red, actualiza IndexedDB.
 * - Módulos online: exige red; si no hay, lanza error controlado.
 */
export async function loadModuleData(moduleId) {
  if (memoryCache.has(moduleId)) {
    return memoryCache.get(moduleId);
  }

  const mod = getModule(moduleId);
  if (!mod) throw new Error(`Módulo desconocido: ${moduleId}`);

  if (mod.offline) {
    let items;
    try {
      const res = await fetch(`./data/${mod.dataFile}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Respuesta de red no válida');
      items = await res.json();
      await putAll(mod.id, items);
      await setMeta(`${mod.id}:lastSync`, new Date().toISOString());
    } catch (err) {
      // Sin red o primer fallo: usar lo que haya en IndexedDB.
      items = await getAll(mod.id);
      if (!items || items.length === 0) {
        throw new Error(
          `No hay datos en caché para "${mod.label}" y no hay conexión. ` +
          `Este módulo necesita haberse cargado al menos una vez con conexión.`
        );
      }
    }
    memoryCache.set(moduleId, items);
    return items;
  }

  // Módulo online: sin caché local por diseño (ver sección 4 del brief).
  const res = await fetch(`./data/${mod.dataFile}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('No se ha podido cargar el módulo (requiere conexión).');
  const items = await res.json();
  memoryCache.set(moduleId, items);
  return items;
}

export async function getLastSync(moduleId) {
  return getMeta(`${moduleId}:lastSync`);
}

/** Precarga todos los módulos offline en IndexedDB. Se llama al arrancar con red. */
export async function warmOfflineCache() {
  const offlineModules = MODULES.filter((m) => m.offline);
  await Promise.allSettled(offlineModules.map((m) => loadModuleData(m.id)));
}

export function clearMemoryCache() {
  memoryCache.clear();
}
