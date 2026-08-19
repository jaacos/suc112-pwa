# SUC/112 · PWA de apoyo a decisión para coordinación sanitaria

Prototipo funcional (Fase 0 — arquitectura y esqueleto) de la PWA de consulta
rápida para coordinadores sanitarios del SUC/112. Ver el master prompt del
proyecto para contexto completo de objetivos y alcance.

**Estado: Fase 0 completada.** Navegación entre los 4 módulos, buscador
transversal, Service Worker con estrategia offline/online diferenciada,
IndexedDB para los módulos críticos, contraseña de acceso. Contenido de
prueba (ficticio) en todos los módulos — sin contenido clínico real todavía.

## Cómo arrancar en local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Contraseña de prueba: **`suc112demo`**
(cámbiala antes de usar esto fuera de tu máquina — instrucciones abajo).

## Cómo construir para producción

```bash
npm run build
npm run preview   # para comprobar la build localmente antes de desplegar
```

Genera la carpeta `dist/` — es lo que se sube a Cloudflare Pages.

## Despliegue en Cloudflare Pages

1. Sube este repo a GitHub.
2. En Cloudflare Pages: "Create a project" → conectar el repo de GitHub.
3. Configuración de build:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Cada `git push` a la rama principal despliega automáticamente.

HTTPS lo da Cloudflare Pages por defecto — necesario para que el Service
Worker funcione (los navegadores no permiten Service Workers en HTTP salvo
`localhost`).

## Cambiar la contraseña de acceso

El "gate" de `src/js/auth.js` compara un hash SHA-256, no la contraseña en
texto plano, pero **no es seguridad real** — es un sitio estático sin
backend, así que el hash es visible en el código que descarga el navegador.
Sirve para evitar que alguien entre sin querer o comparta el link
accidentalmente, no para proteger información realmente sensible. Está
documentado con más detalle en el propio archivo.

Para cambiarla, en la consola del navegador:
```js
crypto.subtle.digest('SHA-256', new TextEncoder().encode('tu-nueva-contraseña'))
  .then(buf => console.log(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')))
```
Copia el resultado en `PASSWORD_HASH` dentro de `src/js/auth.js`.

## Estructura del proyecto

```
index.html              → HTML raíz
src/main.js              → punto de entrada (gate + montaje de la app)
src/js/config.js          → ÚNICA lista de módulos (añadir/quitar módulos aquí)
src/js/auth.js            → pantalla y lógica de contraseña
src/js/app.js              → layout, router por hash, buscador, indicador de conexión
src/js/views.js            → renderizado de inicio / listado / detalle por módulo
src/js/store.js            → carga de datos: offline vía IndexedDB, online vía red
src/js/db.js                → wrapper de IndexedDB
src/js/search.js            → búsqueda transversal entre módulos
src/js/connection.js         → detección online/offline
src/css/                     → tokens.css (paleta/tipografía), base.css, layout.css, components.css
public/data/*.json            → datos de cada módulo (contenido de prueba ahora)
public/icons/                 → iconos de la PWA (placeholder — ver abajo)
gen_icons.py                   → script para regenerar los iconos placeholder
vite.config.js                  → build + configuración del Service Worker (vite-plugin-pwa)
```

## Decisión técnica: vite-plugin-pwa

El stack acordado es vanilla JS sin framework. Se ha añadido
**`vite-plugin-pwa`** como única dependencia de build (no de runtime) porque
generar a mano la lista de archivos a precachear es fràgil: Vite renombra
los archivos JS/CSS con un hash en cada build, y una lista escrita a mano en
el Service Worker se desincroniza en silencio. Este plugin genera esa lista
automáticamente en cada build. No cambia el stack de la aplicación en sí
(sigue siendo HTML/CSS/JS puro), solo automatiza esta pieza concreta.

## Estrategia offline/online (tal como se decidió)

- **Offline (guías clínicas, criterios de activación):** se cachean en
  IndexedDB. Al arrancar con conexión, se refresca la caché en segundo
  plano. Sin conexión, se sirve la última versión cacheada.
- **Online (directorio de centros, documentación interna):** sin caché
  local a propósito. Si no hay conexión, el módulo muestra un aviso claro
  en vez de fallar en silencio o mostrar datos obsoletos.
- El buscador transversal busca en los 4 módulos; si un módulo online no
  está disponible por falta de red, se omite de los resultados sin romper
  la búsqueda de los demás.

## Limitaciones conocidas (Fase 0)

- **Instalación como app en Firefox de escritorio:** no soportada de forma
  nativa (verificado — Firefox no soporta instalación de PWA vía manifest
  en escritorio a fecha de este prototipo). Firefox funciona igual en todo
  lo demás, incluido el offline. Chrome y Edge sí permiten instalar.
- **Identidad visual:** paleta institucional es un placeholder (azul tipo
  112 europeo + rojo de alerta). Buscar `[PLACEHOLDER]` en
  `src/css/tokens.css` y en `vite.config.js` (sección `manifest`) para
  sustituir por los colores/logo oficiales del SUC. Los iconos actuales
  (`public/icons/`) son generados por script, no el logo real.
  Para regenerarlos: `python3 gen_icons.py`.
- **Contenido:** todo el contenido de `public/data/*.json` es ficticio,
  marcado con `[DATO DE PRUEBA]` y `[PLACEHOLDER: pendiente de validación
  clínica]`. No usar como referencia clínica bajo ningún concepto.
- **Contraseña:** ver aviso de seguridad arriba.
- **Responsive:** hay un ajuste básico para pantallas estrechas, pero el
  diseño está pensado y probado para escritorio, según el alcance acordado.

## Esquema de datos

Cada entrada de cada módulo incluye como mínimo `estado` (`"borrador"` o
`"validado"`), `version` y `fecha_validacion`, para poder auditar qué
contenido está desactualizado. Ver `public/data/*.json` para el esquema
completo de cada módulo (campos distintos por tipo de contenido).

## Siguiente paso: Fase 1

Módulo de guías clínicas con contenido real (10-15 patologías) + ajuste del
buscador transversal sobre datos reales. Pendiente de que Airam aporte el
contenido en el esquema de `public/data/guias.json`.
