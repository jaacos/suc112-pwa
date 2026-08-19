import { MODULES } from './config.js';
import { loadModuleData } from './store.js';

function fieldToText(value) {
  if (Array.isArray(value)) return value.join(' ');
  return String(value || '');
}

function matches(item, fields, query) {
  const haystack = fields.map((f) => fieldToText(item[f])).join(' ').toLowerCase();
  return haystack.includes(query);
}

/**
 * Busca en todos los módulos. Los módulos que no se puedan cargar (p.ej.
 * un módulo online sin conexión) se omiten en silencio: la búsqueda
 * transversal no debe romperse porque un módulo no esté disponible.
 */
export async function searchAll(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results = await Promise.all(
    MODULES.map(async (mod) => {
      try {
        const items = await loadModuleData(mod.id);
        const found = items
          .filter((item) => matches(item, mod.searchFields, q))
          .slice(0, 5)
          .map((item) => ({
            moduleId: mod.id,
            moduleLabel: mod.label,
            id: item.id,
            title: item[mod.listTitleField],
            subtitle: item[mod.listSubtitleField]
          }));
        return { moduleId: mod.id, moduleLabel: mod.label, items: found };
      } catch (err) {
        return { moduleId: mod.id, moduleLabel: mod.label, items: [], unavailable: true };
      }
    })
  );

  return results.filter((group) => group.items.length > 0);
}
