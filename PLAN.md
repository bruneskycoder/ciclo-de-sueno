# Plan: versión 2 — rediseño minimalista

**Nivel:** profundo — toca varios módulos con interfaces entre sí, hay
alternativas reales de enfoque, y hay datos del usuario ya guardados en
el navegador.
**Estado:** borrador — esperando aprobación
**Última actualización:** 2026-09-17

---

## Objetivo

Reducir la app de 4 pantallas y 10 campos de formulario a **una sola
pantalla con un campo**, en la que la acción más frecuente (saber a qué
hora poner el despertador si me acuesto ahora) se resuelve con **un
toque**.

Éxito observable:
- Calcular la hora de despertar acostándose ahora: **1 toque** (hoy: 2-3).
- Registrar una noche completa: **2 toques, sin escribir nada**
  (hoy: 5 campos + recordar a qué hora te acostaste).
- Cero palabras en la interfaz que el propio autor no entienda.
- Una sola pantalla; el resto se abre como capas encima.

## Fuera de alcance

- Alarmas o notificaciones programadas. **Verificado, no es posible**: el
  desarrollo de la Notification Triggers API fue discontinuado por Chrome
  por no poder dar una experiencia consistente entre plataformas, y en
  iOS no existe programación local de notificaciones sin un servidor
  (no hay background sync; el push requiere backend y PWA instalada).
  Se reemplaza por copiar la hora al portapapeles.
- Detección automática de sueño, sensores, micrófono, acelerómetro.
- Backend, cuentas de usuario, sincronización entre dispositivos.
- Reescribir la lógica de cálculo: `calc.js` y `metrics.js` están
  testeados y se conservan.
- Cambiar el nombre del repositorio o la URL de GitHub Pages.

## Contexto y supuestos

**Hechos (verificados leyendo el código):**
- 4 vistas en el nav + 1 informativa; 10 campos de formulario; 10 métricas.
- 64 tests en verde (`calc.test.js`, `metrics.test.js`, `storage.test.js`).
- `calcularSiesta` y `calcularCiclos` ya comparten la misma aritmética
  (`computeTimePoint`) y el mismo tranco configurado: fusionarlas no
  requiere lógica nueva.
- La duración de ciclo se persiste; **la latencia no** — vuelve a 20 en
  cada visita.
- El campo de hora ya se precarga con la hora actual, pero igual hay que
  apretar el botón para calcular.
- La app ya respeta `prefers-reduced-motion` (`components.css:188`).
- El branch `claude/stoic-bardeen-5e44g8` está idéntico a `main`.
- Las dependencias no están instaladas en este contenedor (`npm install`
  es el paso 0 de la ejecución).

**Inferencias (explicación que mejor encaja, no certeza):**
- El abandono del registro se explica por el costo de entrada (5 campos +
  recordar la hora de acostarse a la mañana siguiente) más que por
  desinterés en el dato. → **Se está poniendo a prueba** con la
  investigación externa (prompt 1). Si vuelve refutada, el registro se
  recorta del todo en vez de simplificarse.

**Supuestos declarados (no confirmados, avanzo con ellos):**
- El modo brasa es un interruptor manual persistido, **no** automático
  por horario: adivinar por hora del día sorprende al usuario y acierta
  poco.
- El historial sigue siendo de una sola persona en un solo navegador.

## Reutilización

| Pieza existente | Cómo se usa en la v2 |
|---|---|
| `calc.js` | Intacto. `calcularCiclos`, `calcularSiesta` y `calcularDuracionReal` cubren todo lo nuevo. |
| `metrics.js` | Intacto. La pantalla pinta 3 de sus 5 números; el resto queda disponible sin costo. |
| `storage.js` (export/import, validación, merge) | Se conserva entero. El esquema `sleepLogReal` no cambia. |
| `modal.js`, `toast.js` | Se conservan; el `<dialog>` ya existente pasa a ser la base de las capas. |
| Vista informativa | Se conserva como capa. Se reescribe el texto al registro nuevo. |
| Tests (64) | Deben seguir pasando sin modificarse. Es el criterio de que no rompí la lógica. |
| PWA, service worker, íconos, CI/CD | Sin cambios. |

**Nuevo (y por qué no se pudo reutilizar):**
- Máquina de estados "durmiendo / despierto" — no existe nada parecido.
- Capa genérica de hoja (`sheet`) para cuaderno/ajustes/info — hoy son
  vistas de pantalla completa con nav; el patrón cambia.
- Clave `openSleep` en localStorage — ver más abajo.

---

## Enfoque elegido

### El hallazgo: un solo botón que cambia según el estado

Al cruzar tus respuestas apareció un choque: "Me voy a dormir ahora"
(calcular) y "Me acuesto" (registrar) son **dos botones que dicen lo
mismo**. Poner los dos obliga a elegir entre dos cosas que en la vida
real son un solo acto.

La solución es que sean uno. **La app tiene estado**, y el botón
principal es siempre la única acción que corresponde en ese momento:

| Estado | Botón principal | Qué hace |
|---|---|---|
| Despierto | **Me voy a dormir** | Calcula las horas de despertar **y** abre la noche en el cuaderno. |
| Durmiendo | **Me levanté** | Cierra la noche, muestra "dormiste 7h 20m · 5 ciclos" y ofrece calificarla. |

Cero decisiones por parte tuya, y el registro deja de ser una tarea
aparte: se vuelve un subproducto de usar la calculadora. Esto resuelve
también la objeción que yo mismo había marcado ("te exige abrir la app
dos veces al día"): la primera vez ya la abrías para calcular.

El modo "quiero levantarme a las X" queda como acción secundaria, con un
campo de hora, y **solo calcula** — no registra nada.

### Forma de la pantalla

```
┌──────────────────────────────────┐
│  [fogón sobrio]        [☾] [⚙]  │  ← modo brasa · ajustes
│  <Nombre>                        │
│  Ciclos de sueño de 90 minutos   │
├──────────────────────────────────┤
│   ╔════════════════════════════╗ │
│   ║     Me voy a dormir        ║ │  ← acción única, cambia con el estado
│   ╚════════════════════════════╝ │
│                                  │
│   ...o quiero levantarme a las   │
│   [ 06:30 ]                      │  ← único campo de la app
├──────────────────────────────────┤
│  Pará el despertador a las:      │
│   06:10   en 5h 10m   4 ciclos   │
│   07:40   en 6h 40m   5 ciclos   │  ← resaltados los recomendados
│   09:10   en 8h 10m   6 ciclos   │
│                        [copiar]  │
│                                  │
│  Siesta corta  20 min   14:35    │  ← solo en modo "me acuesto"
│  Siesta larga  1 ciclo  15:45    │
├──────────────────────────────────┤
│  El cuaderno              ▸      │  ← abre capa
│  ¿Por qué 90 minutos?     ▸      │
└──────────────────────────────────┘
```

Tres capas encima, ninguna en una barra de navegación:
- **El cuaderno** — tus últimas noches, 3 números (promedio de horas,
  noches registradas, calidad promedio si calificaste alguna) y el
  gráfico de 30 días que ya existe.
- **Ajustes** — minutos hasta dormirte, duración del ciclo, modo brasa,
  exportar/importar, borrar datos.
- **Por qué 90 minutos** — la página informativa, con el texto reescrito.

### Alternativas descartadas

- *Dos ítems en el nav (Calculadora | Registro)*: más conservador, pero
  mantiene una barra fija ocupando 70px en una app de una pantalla.
- *Calculadora pura, sin registro*: más minimalista todavía, pero tira un
  historial que con 2 toques sí tiene chance de usarse.
- *Menú de tres puntos*: esconde todo detrás de un toque extra sin ganar
  nada frente a las tres entradas visibles.

**Criterio dominante:** costo de interacción por uso real. Entre dos
opciones parecidas, gana la que necesita menos toques en el caso de la
1 de la madrugada.

---

## Lenguaje

Se va todo el vocabulario de la literatura gauchesca del siglo XIX, que
es lenguaje de libro y no de habla: *pilchas, baqueteado, al pago, al
alba, tranco, recuento de 30 lunas, últimos 7 soles, la tropa, ni a
palos, rearmá el cuero, a la sombra del ombú, borrar el rastro, leé la
posta*.

Queda rioplatense de todos los días, con los guiños de campo que se
entienden sin diccionario (fogón, siesta, madrugada, cuaderno):

| Antes | Ahora |
|---|---|
| Me voy a las pilchas a las: | Me voy a dormir ahora |
| Quiero levantarme con el sol a las: | Quiero levantarme a las: |
| Marcar el Rumbo | Pará el despertador a las: |
| Tu tranco de sueño | Duración de tu ciclo |
| Minutos hasta que se me cierren los ojos | Cuánto tardás en dormirte |
| Cuaderno de Ruta / Recuento de 30 Lunas | El cuaderno |
| Últimos 7 soles | Tus últimas noches |
| A la Sombra del Ombú | Siesta |
| Borrar el Rastro | Borrar todo |
| ¡Decime a qué hora, que si no ando a ciegas! | Falta la hora |

## Nombre — **pendiente de tu elección**

Cambiar el nombre visible es barato: toca `<title>`, `manifest.json`, la
meta de iOS y el README. **No** cambia el repo ni la URL de Pages.

| Nombre | A favor | En contra |
|---|---|---|
| **Fogón** | Continuidad con lo que ya tenés, la ilustración ya está hecha, se entiende solo, cálido. Riesgo cero. | No dice nada de sueño por sí mismo. |
| **Lucero** | El lucero del alba es la estrella que se ve al amanecer: liga directo con despertar. Corto, de campo, fácil, y no lo usa nadie. | Hay que saber qué es el lucero para que cierre. |
| **Madrugada** | La palabra más clara de la lista, y nombra exactamente la franja en que se usa la app. | Connota trasnochar, que es lo contrario de lo que la app propone. |
| **Sueñito** | El más cálido y el más rioplatense ("echarse un sueñito"). Cubre siesta y noche por igual. | Tono liviano; puede cansar a la larga. |
| **Cabeceo** | Guiño doble (cabecear de sueño, el caballo que cabecea). Corto y gracioso. | Se lee como dormirse sin querer, no como planificar el descanso. |

Mi recomendación: **Lucero**. Es el único que nombra lo que la app hace
(despertarse bien) sin explicarlo, y sobrevive al recorte del lenguaje de
época porque no es una palabra de época, es una palabra común.

---

## Datos: qué se guarda y qué se rompe

**No se rompe nada.** El esquema `sleepLogReal` queda igual, así que las
noches que ya tengas guardadas se siguen viendo, y los archivos de backup
viejos se siguen importando.

Dos agregados:
- **Clave nueva `openSleep`** para la noche en curso: `{date,
  bedtimeActual, startedAt}`. Vive **aparte** del historial a propósito —
  si una noche a medio registrar entrara en el array principal, rompería
  la validación de import, las métricas y los tests de una sola vez.
  Separándola, todo eso queda intacto.
- **Campo `kind`** (`'noche'` | `'siesta'`) en cada registro cerrado. Se
  deriva de la duración, no del horario: menos de 3 horas es siesta. Las
  siestas no entran en el promedio de noches. Los registros viejos sin
  el campo se leen como `'noche'`.

Si te olvidás de tocar "Me levanté", la noche queda abierta y el cuaderno
la muestra con un botón para completar la hora a mano. No se descarta ni
se inventa un valor.

---

## Pasos

- [ ] 0. `npm install` y correr los 64 tests actuales — **verificación:**
      los 64 pasan antes de tocar nada (línea de base).
- [ ] 1. Exportar los datos actuales a un JSON de respaldo y guardarlo
      fuera del repo — **verificación:** el archivo existe y se puede
      volver a importar en la app actual.
- [ ] 2. `storage.js`: agregar `openSleep`, el campo `kind` y la
      persistencia de la latencia — **verificación:** tests nuevos de
      abrir/cerrar/completar noche y de clasificación siesta/noche; los
      64 anteriores siguen en verde.
- [ ] 3. `calc.js`: agregar el cálculo de "falta Xh Ym" —
      **verificación:** tests de casos normales, cruce de medianoche y
      tiempo ya pasado.
- [ ] 4. Reescribir `index.html`: una pantalla + tres capas, sin nav —
      **verificación:** capturas de las 4 superficies en 360px sin
      desbordes.
- [ ] 5. CSS: recortar la escena a un fogón sobrio (sin estrellas, sin
      glow, sin sombras de texto), agregar el modo brasa —
      **verificación:** capturas en modo normal y brasa; contraste WCAG AA
      medido en ambos.
- [ ] 6. Cablear la pantalla: máquina de estados del botón principal,
      resultados con siesta fusionada, copiar al portapapeles —
      **verificación:** recorrido manual completo, ida y vuelta.
- [ ] 7. Cablear las tres capas (cuaderno, ajustes, info) con el texto
      reescrito — **verificación:** todas abren, cierran, y se navegan con
      teclado.
- [ ] 8. Arreglar los cuatro defectos detectados en la auditoría (ver
      Riesgos) — **verificación:** un test por cada uno.
- [ ] 9. Renombrar en `title`, `manifest.json`, meta de iOS y README —
      **verificación:** la app instalada muestra el nombre nuevo.
- [ ] 10. Actualizar README y borrar lo que quedó sin uso —
      **verificación:** `npm run lint` sin avisos de código muerto.
- [ ] 11. QA final: tests, Lighthouse, emulación móvil, build —
      **verificación:** ver abajo.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| La inferencia sobre el abandono del registro es falsa y el cuaderno tampoco se usa en v2. | Se está poniendo a prueba con investigación externa antes de ejecutar. Y el cuaderno queda en una capa: si no se usa, sacarlo después no toca la pantalla principal. |
| Perder datos guardados durante el rediseño. | El paso 1 es exportar antes de tocar nada. El esquema no cambia, así que la importación siempre funciona como vuelta atrás. |
| El recorte visual se lleva puesto lo que hace tuya la app. | Checkpoint con capturas en el paso 5, antes de seguir. Si quedó frío, se revierte solo ese paso. |
| El botón que cambia de estado confunde ("¿por qué dice otra cosa que ayer?"). | La primera vez que aparece "Me levanté" se acompaña de una línea que explica que hay una noche abierta, con opción de cancelarla. |
| Romper algo que hoy funciona sin darse cuenta. | Los 64 tests actuales no se modifican: si alguno se pone rojo, es una regresión, no un cambio de plan. |

**Defectos ya detectados en el código actual, a corregir en el paso 8:**
1. `renderHistory` filtra a 7 días: una noche cargada hace 10 días cuenta
   en las métricas pero no se puede ver ni borrar desde la interfaz.
2. `innerHTML +=` dentro de bucles (historial y gráfico): reconstruye el
   contenedor entero en cada vuelta.
3. `mergeSleepLogs` deduplica por fecha *o* id: con siesta y noche el
   mismo día, el import se come una. Con el campo `kind` esto hay que
   arreglarlo sí o sí.
4. `sleepLoreDB` (esquema de la Fase 4) sigue ocupando lugar en el
   navegador de quien lo tenga: ofrecer borrarlo desde Ajustes.

## Verificación final

**Automática (la corro yo y muestro la salida):**
- Los 64 tests actuales, sin modificar, en verde.
- Los tests nuevos de estado de noche, clasificación siesta/noche y
  "falta Xh Ym".
- `npm run lint` y `npm run build` limpios.
- Lighthouse sobre el build de producción: performance y accesibilidad
  ≥ 95 (la línea de base actual es 98/96/96/100).
- Emulación en 360px, iPhone SE, iPhone 13 y Pixel 5: cero desbordes
  horizontales, zoom habilitado.

**Manual (para vos, sin leer código):**
1. Abrí la app y tocá **Me voy a dormir**. Esperado: aparecen las horas
   de despertar con "en Xh Ym" al lado, más las dos filas de siesta. Sin
   haber tocado ningún campo.
2. Cerrá la app, volvé a abrirla. Esperado: el botón ahora dice **Me
   levanté**, y avisa que tenés una noche abierta.
3. Tocá **Me levanté**. Esperado: te muestra cuánto dormiste y te ofrece
   calificar la noche. Podés saltear la calificación.
4. Abrí **El cuaderno**. Esperado: la noche que acabás de cerrar está en
   la lista, con el promedio arriba.
5. Escribí una hora en **quiero levantarme a las** y calculá. Esperado:
   te da las horas para acostarte, y **no** registra nada en el cuaderno.
6. Tocá el ícono de luna (modo brasa). Esperado: todo baja de brillo y el
   fuego deja de moverse. Cerrá y reabrí: sigue en modo brasa.
7. Abrí **Ajustes**, cambiá "cuánto tardás en dormirte" a 35, cerrá,
   reabrí la app y calculá. Esperado: sigue en 35 (hoy vuelve a 20).
8. En Ajustes, exportá los datos. Esperado: baja un JSON que la app puede
   volver a importar.

## Registro de decisiones y desvíos

- 2026-09-17 — Nivel profundo, no estándar — hay alternativas reales de
  enfoque y datos del usuario en juego.
- 2026-09-17 — Se descarta cualquier forma de alarma o notificación
  programada — verificado que no es técnicamente posible sin backend, y
  en iOS ni siquiera con él del lado del cliente.
- 2026-09-17 — Se elimina el vocabulario gauchesco — el propio autor
  reportó no entenderlo. Corrige un supuesto anterior mío, que lo daba
  por gratuito en términos de comprensión.
- 2026-09-17 — Un solo botón de estado en vez de dos botones separados
  para calcular y registrar — surgió del choque entre "Me voy a dormir
  ahora" y "Me acuesto", que decían lo mismo.
- 2026-09-17 — La noche en curso va en una clave aparte (`openSleep`) y
  no en el historial — evita romper validación de import, métricas y los
  64 tests existentes.
- 2026-09-17 — Siesta vs. noche se clasifica por duración (< 3h) y no por
  horario — la duración es dato real; el horario sería una adivinanza.
- 2026-09-17 — `metrics.js` se conserva entero aunque la pantalla pinte 3
  de sus 5 números — está testeado, no cuesta nada, y recuperar las
  métricas de consistencia sería una línea si las querés.
