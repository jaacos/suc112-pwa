// Definición central de los módulos de la app.
// "offline: true"  -> se cachea en IndexedDB y funciona sin conexión (crítico).
// "offline: false" -> requiere conexión, no se cachea localmente (Fase 0-4).
//
// Esta es la ÚNICA lista que hay que tocar para añadir/quitar un módulo del
// menú y de la búsqueda transversal.

export const MODULES = [
  {
    id: 'guias',
    label: 'Guías clínicas',
    icon: 'stethoscope',
    offline: true,
    dataFile: 'guias.json',
    searchFields: ['titulo', 'sintomas_clave', 'definicion'],
    listTitleField: 'titulo',
    listSubtitleField: 'categoria'
  },
  {
    id: 'criterios',
    label: 'Criterios de activación',
    icon: 'alert-triangle',
    offline: true,
    dataFile: 'criterios.json',
    searchFields: ['titulo', 'tipo_incidente'],
    listTitleField: 'titulo',
    listSubtitleField: 'tipo_incidente'
  },
  {
    id: 'directorio',
    label: 'Directorio de centros',
    icon: 'map-pin',
    offline: false,
    dataFile: 'directorio.json',
    searchFields: ['nombre', 'municipio', 'tipo'],
    listTitleField: 'nombre',
    listSubtitleField: 'municipio'
  },
  {
    id: 'documentacion',
    label: 'Documentación interna',
    icon: 'file-text',
    offline: false,
    dataFile: 'documentacion.json',
    searchFields: ['titulo', 'categoria', 'resumen'],
    listTitleField: 'titulo',
    listSubtitleField: 'categoria'
  }
];

export function getModule(id) {
  return MODULES.find((m) => m.id === id);
}
