# Plan: versión 2 — herramienta diaria y pieza de portfolio

**Nivel:** profundo — toca todos los módulos, hay datos del usuario en
juego, y el proyecto tiene tres objetivos simultáneos que tiran en
direcciones distintas.
**Estado:** aprobado — en ejecución
**Última actualización:** 2026-09-17

> **Este plan reemplaza una versión anterior que apuntaba al lugar
> equivocado.** El primer plan optimizaba por eficiencia de interacción
> y proponía podar la identidad visual y el lenguaje. Dos hechos que
> aparecieron después lo invalidaron: la app se usa una o dos veces por
> día (no estaba abandonada, lo abandonado era el registro), y tiene un
> segundo trabajo que no estaba contemplado — se muestra con orgullo,
> va a un portfolio y puede ser ejemplo en una charla sobre IA. Una app
> mínima y gris es eficiente y olvidable: sirve para el primer trabajo y
> arruina el segundo.

---

## Objetivo

La app tiene **tres trabajos** y ninguna decisión se toma sin saber a
cuál sirve:

| # | Trabajo | Usuario | Qué exige |
|---|---|---|---|
| 1 | Calcular a qué hora dormir o despertar | Bruno, 1-2 veces por día | Fricción cero |
| 2 | Ser memorable cuando se la muestra | Quien la mira, en portfolio o charla | Identidad fuerte, primera impresión, algo que se recuerde |
| 3 | Demostrar qué sale de orquestar IA | Bruno y su audiencia | Repo, README y proceso legibles por un tercero |

**El principio que ordena todo:**

> El recorte va sobre la **fricción**. La ambición va sobre la
> **expresión**.

Campos, pantallas y toques: se podan a fondo. Identidad, prosa y
carácter: se invierte. Tratados como una sola variable, se contradicen;
separados, no.

**Éxito observable:**
- La respuesta más frecuente ("me duermo ahora, ¿a qué hora me
  despierto?") aparece en **cero toques**, con la app recién abierta.
- Anotar una noche completa: **2 toques, sin escribir nada**.
- Un desconocido abre el link sin datos ni contexto y entiende qué está
  mirando en 5 segundos.
- Nadie que lea el repo necesita preguntar qué es ni cómo se construyó.
- Cero palabras en la interfaz que el propio autor no entienda.

## Fuera de alcance

- Alarmas o notificaciones programadas. **Verificado, no es posible:**
  el desarrollo de la Notification Triggers API fue discontinuado por
  Chrome, y en iOS no existe programación local de notificaciones sin un
  servidor. Se reemplaza por copiar la hora al portapapeles.
- Backend, cuentas, sincronización entre dispositivos.
- Sensores, detección automática de sueño, micrófono.
- Reescribir `calc.js` y `metrics.js`: están testeados y se conservan.
- Cambiar el nombre del repositorio o la URL de GitHub Pages.

## Contexto y supuestos

**Hechos (verificados en el código o dichos por el autor):**
- La app se usa 1-2 veces por día. El registro de sueño es lo que se
  abandonó, no la app.
- 4 vistas en el nav + 1 informativa; 10 campos de formulario; 10 métricas.
- 64 tests en verde; PWA con service worker; deploy automático a Pages.
- `calcularSiesta` y `calcularCiclos` ya comparten aritmética
  (`computeTimePoint`): fusionarlas no agrega lógica.
- La duración del ciclo se persiste; **la latencia no** — vuelve a 20 en
  cada visita.
- La app ya respeta `prefers-reduced-motion` (`components.css:188`).
- Las dependencias no están instaladas en este contenedor.

**Inferencia corregida:** el plan anterior decía que el registro se
abandonó por el costo de carga (5 campos + recordar la hora de
acostarse). Sigue siendo la explicación más probable, pero ya **no es
una pieza crítica**: el registro pasa a ser opcional e invisible para
quien no lo use, así que si la hipótesis falla, no arrastra al resto.

**Supuestos declarados:**
- El modo brasa es un interruptor manual persistido, no automático por
  horario: adivinar por hora del día sorprende y acierta poco.
- El historial sigue siendo de una persona en un navegador.

---

## Identidad: campo y noche, con voz propia

El tema nunca estuvo mal elegido — el campo argentino es territorio real
del autor (ganadería, PRV, análisis territorial), no una decoración. Lo
que falló fue la **dicción prestada**: vocabulario de literatura
gauchesca del siglo XIX que el propio autor no hablaba ni entendía.

**La regla que resuelve las dos cosas a la vez:**

> **Etiquetas planas. Prosa con voz.**

Todo lo que sea una acción o un dato se nombra con la palabra más común
que exista: cero ambigüedad, cero diccionario. El carácter vive en los
lugares donde no hay nada que interpretar — subtítulos, estados vacíos,
el resumen de una noche cerrada, la página informativa, el README. Ahí
la personalidad no cuesta comprensión, y es donde de verdad se recuerda.

### Etiquetas (planas)

| Antes | Ahora |
|---|---|
| Me voy a las pilchas a las | Me voy a dormir |
| Quiero levantarme con el sol a las | O quiero levantarme a las |
| Marcar el Rumbo | Poné el despertador a las |
| Tu tranco de sueño | Cuánto dura tu ciclo |
| Minutos hasta que se me cierren los ojos | Cuánto tardás en dormirte |
| Cuaderno de Ruta / Recuento de 30 Lunas | El cuaderno |
| Últimos 7 soles | Tus últimas noches |
| A la Sombra del Ombú | Siesta corta / Siesta larga |
| Borrar el Rastro | Borrar todo |
| ¡Decime a qué hora, que si no ando a ciegas! | Falta la hora |

### Prosa (con voz)

Voseo, coloquial, sin solemnidad ni signos de exclamación. El campo
entra como **imagen**, no como vocabulario:

- Bajo el título: *Los ciclos duran noventa minutos. Conviene despertarse
  cuando uno termina, no en el medio.*
- Al cerrar una noche: *Dormiste 7h 20m. Cinco vueltas completas.*
- Cuaderno vacío: *Acá se van a ir juntando las noches. Todavía no hay
  ninguna.*
- Entre las dos siestas: *En el medio de esas dos no conviene: te agarra
  en lo más hondo y te levantás peor que antes.*

Para que esto no se desarme con el tiempo ni vuelva al gauchesco en una
sesión futura, la voz queda escrita como regla del repo (ver paso 10).

### Nombre

**Recomendación: dejarlo en "A la Luz del Fogón".** Cambió el criterio y
con él la respuesta. Cuando el objetivo era minimalismo, propuse
"Lucero"; ahora que el objetivo es ser memorable, el nombre actual gana
solo. "Fogón" y "a la luz de" son palabras corrientes — nunca fueron el
problema. El problema estaba en las etiquetas de la interfaz, no en el
título. Y un nombre con imagen se recuerda mejor en una charla que uno
descriptivo.

Si igual querés cambiarlo: **Lucero**, **Sereno** o **Madrugada**, en
ese orden.

---

## Forma de la app

```
┌──────────────────────────────────┐
│  [fogón]               [☾] [⚙]  │  ← modo brasa · ajustes
│  A la Luz del Fogón              │
│  Los ciclos duran noventa        │
│  minutos. Conviene despertarse   │
│  cuando uno termina.             │
├──────────────────────────────────┤
│  Si te dormís ahora,             │  ← YA CALCULADO al abrir
│  poné el despertador a las:      │     cero toques
│                                  │
│    06:10    en 5h 10m   4 ciclos │
│    07:40    en 6h 40m   5 ciclos │  ← resaltados los recomendados
│    09:10    en 8h 10m   6 ciclos │
│                        [copiar]  │
│                                  │
│    Siesta corta   20 min   14:35 │
│    Siesta larga   1 ciclo  15:45 │
├──────────────────────────────────┤
│   ╔════════════════════════════╗ │
│   ║     Me voy a dormir        ║ │  ← solo anota; el cálculo ya pasó
│   ╚════════════════════════════╝ │
│                                  │
│   O quiero levantarme a las      │
│   [ 06:30 ]                      │  ← único campo de la app
├──────────────────────────────────┤
│  El cuaderno              ▸      │
│  ¿Por qué 90 minutos?     ▸      │
└──────────────────────────────────┘
```

### La decisión que ordena la pantalla

**El cálculo es ambiente, no una acción.** Al abrir, la app ya muestra
las horas para dormirse ahora — es una función pura del reloj, no
necesita ningún dato guardado ni ninguna decisión del usuario.

Esto resuelve tres cosas de una:
1. **Trabajo 1:** la respuesta más frecuente llega en cero toques.
2. **Trabajo 2:** un desconocido ve contenido real al instante, no un
   formulario vacío.
3. Desambigua el botón principal. En el plan anterior, "Me voy a dormir"
   calculaba *y* anotaba, y chocaba con el botón de registrar. Ahora el
   cálculo ya ocurrió: el botón solo anota, y quiere decir una sola cosa.

### El botón principal tiene estado

| Estado | Dice | Hace |
|---|---|---|
| Despierto | **Me voy a dormir** | Abre la noche en el cuaderno |
| Durmiendo | **Ya me levanté** | La cierra, muestra cuánto dormiste, ofrece calificarla |

Nunca hay dos acciones compitiendo: en cada momento hay una sola cosa
que tiene sentido hacer. Además es lo más demostrable de la app en una
charla — se abre y *sabe* si estás durmiendo.

Si te olvidás de cerrarla, la noche queda abierta y el cuaderno la
muestra con un botón para completar la hora a mano. No se descarta ni se
inventa un valor.

### Tres capas, ninguna barra de navegación

- **El cuaderno** — las últimas noches, 3 números (promedio de horas,
  noches anotadas, y calidad promedio solo si calificaste alguna) y el
  gráfico de 30 días que ya existe.
- **Ajustes** — cuánto tardás en dormirte, cuánto dura tu ciclo, modo
  brasa, exportar/importar, borrar datos.
- **¿Por qué 90 minutos?** — la página informativa, con el texto
  reescrito a la voz nueva.

El registro queda **opcional e invisible**: quien no lo use no se topa
nunca con un cuaderno vacío, porque vive detrás de un toque.

---

## Datos: qué se guarda y qué se rompe

**No se rompe nada.** El esquema `sleepLogReal` no cambia, así que las
noches ya guardadas se siguen viendo y los backups viejos se siguen
importando.

- **Clave nueva `openSleep`** para la noche en curso (`{date,
  bedtimeActual, startedAt}`). Vive **fuera** del historial a propósito:
  una noche a medio anotar dentro del array principal rompería la
  validación de import, las métricas y los tests de una sola vez.
- **Campo `kind`** (`'noche'` | `'siesta'`) en cada registro cerrado,
  derivado de la **duración** (menos de 3h es siesta), no del horario —
  la duración es dato real, el horario sería una adivinanza. Los
  registros viejos sin el campo se leen como `'noche'`.

## Reutilización

| Pieza | Cómo se usa |
|---|---|
| `calc.js` | Intacto. Cubre todo lo nuevo. |
| `metrics.js` | Intacto. La pantalla pinta 3 de sus 5 números. |
| `storage.js` | Se conserva export/import, validación y merge. |
| `modal.js`, `toast.js` | Se conservan; el `<dialog>` pasa a ser la base de las capas. |
| Vista informativa | Se conserva; se reescribe el texto. |
| Los 64 tests | **No se modifican.** Cualquier rojo es una regresión, no un cambio de plan. |
| PWA, service worker, CI/CD | Sin cambios. |

**Nuevo:** máquina de estados de la noche, capa genérica de hoja,
clave `openSleep`, modo brasa, y las reglas de voz del repo.

---

## Pasos

- [x] 0. `npm install` y correr los 64 tests — **hecho:** los 64 pasan.
      Línea de base establecida.
- [ ] 1. **Le toca a Bruno, no a mí.** Los datos viven en el
      `localStorage` de su navegador, no en este contenedor: no tengo
      forma de alcanzarlos. Abrir la app actual → Recuento → Exportar
      datos, y guardar ese JSON. No bloquea la construcción; bloquea el
      deploy a `main`.
- [x] 2. `storage.js`: `openSleep`, campo `kind`, persistencia de la
      latencia y del tema — **hecho.** La lógica pura quedó en
      `sleep-session.js` (mismo criterio que `calc.js` y `metrics.js`).
      **Verificado:** 102 tests en verde; las 64 pruebas originales
      intactas palabra por palabra (solo las tocó el formateo de
      Prettier). Se adelantó acá el defecto 3 del paso 9, porque el campo
      `kind` lo volvía urgente.
- [x] 3. `calc.js`: cálculo de "falta Xh Ym" (`minutesUntilClock` y
      `formatDuration`) — **hecho y testeado**, incluido el cruce de
      medianoche y la hora que ya pasó.
- [ ] 4. Reescribir `index.html`: una pantalla + tres capas, sin nav —
      **verificación:** capturas de las 4 superficies a 360px sin
      desbordes.
- [ ] 5. Identidad visual: fogón y cielo nocturno trabajados, no podados;
      modo brasa — **verificación:** capturas en ambos modos y contraste
      WCAG AA medido en los dos. **Checkpoint con vos antes de seguir.**
- [ ] 6. Cablear la pantalla: cálculo al abrir, máquina de estados,
      siesta fusionada, copiar al portapapeles — **verificación:**
      recorrido manual completo.
- [ ] 7. Cablear las tres capas con el texto reescrito —
      **verificación:** abren, cierran y se navegan con teclado.
- [ ] 8. Primera visita de un desconocido — **verificación:** abrir en
      una ventana privada, sin datos, y confirmar que se entiende sin
      contexto. Estados vacíos que explican en vez de solo avisar.
- [ ] 9. Corregir los cuatro defectos del código actual (ver Riesgos) —
      **verificación:** un test por cada uno.
- [ ] 10. Reglas de voz del repo en `.claude/skills/` — **verificación:**
      una sesión futura que escriba texto nuevo no vuelve al gauchesco.
      Es también material concreto para la charla.
- [ ] 11. README como pieza de portfolio: qué es, cómo se ve (capturas),
      cómo se construyó — **verificación:** alguien que no conoce el
      proyecto entiende los tres puntos sin abrir el código.
- [ ] 12. `docs/proceso.md`: cómo se orquestó con IA, incluida la
      corrección de rumbo de este mismo plan — **verificación:** se lee
      solo y sirve de guion.
- [ ] 13. QA final y deploy — **verificación:** ver abajo.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El recorte de fricción se lleva puesta la identidad otra vez. | El paso 5 es un checkpoint con capturas antes de seguir. Y la regla "etiquetas planas, prosa con voz" separa explícitamente las dos variables. |
| La identidad queda cargada y estorba el uso diario. | El riesgo inverso, igual de real. Se mide en el mismo checkpoint: si la pantalla principal no se lee de un vistazo a la madrugada, se poda. |
| Perder datos guardados. | El paso 1 es exportar antes de tocar nada; el esquema no cambia, así que la importación funciona siempre como vuelta atrás. |
| Romper algo que hoy funciona. | Los 64 tests no se modifican. |
| El alcance se infla con los trabajos 2 y 3. | Los pasos 10-12 van al final y son separables: si hay que cortar, se corta ahí sin tocar la app. |

**Defectos ya detectados en el código actual (paso 9):**
1. `renderHistory` filtra a 7 días: una noche de hace 10 días cuenta en
   las métricas pero no se puede ver ni borrar desde la interfaz.
2. `innerHTML +=` dentro de bucles (historial y gráfico).
3. `mergeSleepLogs` deduplica por fecha *o* id: con siesta y noche el
   mismo día, el import se come una. Con el campo `kind` hay que
   arreglarlo sí o sí.
4. `sleepLoreDB` (esquema viejo) sigue ocupando lugar en el navegador de
   quien lo tenga: ofrecer borrarlo desde Ajustes.

## Verificación final

**Automática (la corro yo y muestro la salida):**
- Los 64 tests actuales, sin modificar, en verde.
- Tests nuevos: estado de la noche, clasificación siesta/noche, "falta
  Xh Ym".
- `npm run lint` y `npm run build` limpios.
- Lighthouse sobre el build: performance y accesibilidad ≥ 95 (línea de
  base actual: 98/96/96/100).
- Emulación a 360px, iPhone SE, iPhone 13 y Pixel 5: cero desbordes, zoom
  habilitado.

**Manual (para vos, sin leer código):**
1. Abrí la app. Esperado: **sin tocar nada**, ya te dice a qué hora poner
   el despertador si te dormís ahora, con "en Xh Ym" al lado, más las dos
   siestas.
2. Tocá **Me voy a dormir**, cerrá la app y volvé a abrirla. Esperado: el
   botón ahora dice **Ya me levanté** y avisa que hay una noche abierta.
3. Tocá **Ya me levanté**. Esperado: te dice cuánto dormiste y te ofrece
   calificar. Podés saltearlo.
4. Abrí **El cuaderno**. Esperado: la noche cerrada está en la lista, con
   el promedio arriba.
5. Escribí una hora en **quiero levantarme a las**. Esperado: te da las
   horas para acostarte y **no** anota nada.
6. Tocá la luna. Esperado: todo baja de brillo y el fuego se queda
   quieto. Cerrá y reabrí: sigue así.
7. En **Ajustes**, poné 35 en "cuánto tardás en dormirte". Cerrá, reabrí,
   mirá el cálculo. Esperado: sigue en 35 (hoy vuelve a 20).
8. Abrí el link en una ventana privada, como si fueras otra persona.
   Esperado: se entiende qué es sin que nadie te explique nada.
9. Leé el README como si cayeras de un portfolio. Esperado: entendés qué
   es, cómo se ve y cómo se hizo, sin abrir el código.

## Registro de decisiones y desvíos

- 2026-09-17 — **Plan reescrito de cero.** El anterior optimizaba por
  eficiencia de interacción y proponía podar identidad y lenguaje. Se
  invalidó al aparecer dos hechos: la app se usa a diario, y tiene un
  segundo trabajo (mostrarla) que impone ser memorable, no mínima.
- 2026-09-17 — Regla "etiquetas planas, prosa con voz" — permite recortar
  fricción y aumentar carácter al mismo tiempo, que tratados como una
  sola variable se contradecían.
- 2026-09-17 — El tema campo/noche se conserva: es territorio real del
  autor, no decoración. Lo que se elimina es la dicción prestada del
  siglo XIX, que el propio autor reportó no entender.
- 2026-09-17 — **La app calcula al abrirse**, sin esperar un toque. El
  cálculo es una función pura del reloj: no hay razón para pedirlo. De
  paso desambigua el botón principal, que en el plan anterior calculaba
  y anotaba a la vez.
- 2026-09-17 — Nombre: se recomienda conservar "A la Luz del Fogón",
  revirtiendo la recomendación anterior ("Lucero"). Cambió el criterio:
  con "memorable" en lugar de "mínimo", el nombre actual gana, y nunca
  fue la parte incomprensible.
- 2026-09-17 — El registro pasa a ser opcional e invisible detrás de una
  capa, así que la hipótesis sobre por qué se abandonó deja de ser
  crítica para el plan.
- 2026-09-17 — Siesta vs. noche se clasifica por duración (< 3h) y no por
  horario.
- 2026-09-17 — Prioridad de la investigación externa revisada a la baja:
  los prompts 1 y 2 (adherencia y competencia) casi no mueven decisiones
  ahora. El 3 (qué métrica vale mostrar, interfaces de bajo brillo) sigue
  alimentando el cuaderno y el modo brasa.
