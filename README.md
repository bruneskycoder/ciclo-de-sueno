# A la Luz del Fogón

Calculadora de ciclos de sueño: el sueño avanza en bloques de aproximadamente
90 minutos, y despertar al final de un ciclo (en vez de en medio de uno)
reduce la inercia del sueño. La app calcula, a partir de una hora de
despertar o de acostarse, las horas de acostarse/despertar que caen en un
número entero de ciclos — y permite llevar un registro del descanso real a
lo largo del tiempo.

> Proyecto en rediseño activo. La identidad visual (Fase 1 del rediseño)
> ya migró de un concepto medieval a una estética gauchesca rioplatense
> (campo argentino, ~1800–1900) en la vista de la calculadora. Ver el
> estado del rediseño más abajo.

![Captura de la vista principal](./docs/screenshot.png)

## Demo

https://bruneskycoder.github.io/ciclo-de-sueno/

## Correr en local

Requiere Node.js (18+).

```bash
npm install
npm run dev
```

Abre el servidor de desarrollo de Vite (por defecto en `http://localhost:5173`).

Otros comandos disponibles:

```bash
npm run build      # build de producción en dist/
npm run preview    # sirve el build de producción localmente
npm test           # corre los tests (Vitest)
npm run lint        # ESLint
npm run format      # Prettier
```

## Stack

- **Vite** — bundler y dev server. Sin framework de UI (React/Vue/etc.):
  la app no tiene backend ni estado complejo que lo justifique.
- **JavaScript plano, módulos ES** — sin TypeScript.
- **Vitest** — tests unitarios de la lógica de cálculo.
- **CSS plano** — sin framework de utilidades; la app tiene identidad
  visual propia.
- **GitHub Actions** — build y deploy automático a GitHub Pages en cada
  push a `main`.
- Persistencia: `localStorage` (sin backend).

## Estado del rediseño

Este repo viene de una app de un solo archivo (`index.html`, sin
build) que se está refactorizando y ampliando. El trabajo avanza por
fases; cada fase que cambia algo visible se valida antes de seguir a la
siguiente. Fases planeadas: higiene de repo, identidad visual, refactor
de accesibilidad, duración de ciclo configurable, modo siesta, métricas
de calidad de sueño, export/import de datos, PWA offline, página
informativa sobre la base científica de los ciclos de sueño, y QA final.

## Licencia

MIT — ver [LICENSE](./LICENSE).
