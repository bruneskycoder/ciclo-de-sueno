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

### La captura ocurre a la noche, no a la mañana

**Corrección de diseño (17/09), a partir de los datos reales.** El
backup del usuario tiene un solo registro, creado el mismo día en que se
terminó de construir la función: es una prueba de la feature, no una
noche anotada. O sea, cero usos fuera de la sesión en que se construyó.

La causa no era solo la cantidad de campos. Era **el momento**: el
diseño anterior apoyaba el segundo toque a la mañana siguiente, y a la
mañana la app no se abre. La app se abre de noche, a consultar.

Así que la captura se muda a ese momento. Al entrar, si quedó una noche
sin anotar, aparece una tarjeta que pregunta por ella. Se aprovecha una
visita que ya iba a ocurrir en vez de pedir una nueva.

**Qué noche se pregunta:** la última ya terminada, que es
`nightDateFor(ahora)` menos un día. A las 23:00 del 17, a las 00:30 del
18 y a las 14:00 del 17, las tres veces es la noche del 16 — nunca la
que estás por empezar.

**Dos formas, según lo que la app ya sepa:**

| Situación | La tarjeta dice | Costo |
|---|---|---|
| Anoche tocaste "Me voy a dormir" | *Te acostaste 00:30 y calculabas despertarte 07:40. ¿Fue así?* | Un toque |
| No tocaste nada | *¿Cuántas horas dormiste anoche?* | Un toque sobre una opción |

Después de cualquiera de las dos, una sola invitación opcional y
salteable: una línea sobre cómo dormiste. Las horas las pone la app; lo
único que aporta una persona es esa frase.

**Reglas para que no se vuelva un fastidio:** se pregunta una sola vez
por noche; si la salteás, esa noche no se vuelve a preguntar nunca; y a
un desconocido en su primera visita **no se le pregunta nada** — sin
historial ni noche abierta no hay ninguna "anoche" sobre la que
preguntar, y recibir un formulario de entrada sería la peor primera
impresión posible.

El botón principal sigue teniendo estado (**Me voy a dormir** / **Ya me
levanté**), pero ahora es opcional: sirve para dejar registrada la
intención, y si te olvidás, la tarjeta te alcanza igual a la noche
siguiente. Es además lo más demostrable en una charla — la app se abre y
*sabe* si estás durmiendo.

**Consecuencia en los datos, declarada:** una noche respondida de
memoria sabe cuánto se durmió pero no entre qué horas. Se guarda con las
horas en `null`, que es la verdad, en vez de inventar un horario
plausible — inventarlo ensuciaría con ficción cualquier métrica de
regularidad. Esas noches suman a las horas promedio y no aportan a la
regularidad de horarios.

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
- [x] 4. Reescribir `index.html`: una pantalla + tres capas, sin nav —
      **hecho.** 371 líneas contra 461, incluyendo toda la página
      informativa.
- [x] 5. Identidad visual y modo brasa — **hecho, esperando tu visto
      bueno.** El fogón pasó a SVG en línea (tres lenguas con gradiente y
      animación propia) porque en CSS puro se leía como una gota de agua.
      Se fueron las estrellas, la luna, el gaucho y el brillo de los
      títulos. **Medido, no mirado a ojo:** la luz que emite el botón más
      grande de la pantalla baja de 0.66 a 0.014 en modo brasa (47 veces
      menos).
- [x] 6. Cablear la pantalla: cálculo al abrir, máquina de estados,
      siesta fusionada — **hecho.** Se adelantó respecto del plan: con la
      pantalla sin cablear, las capturas del checkpoint habrían sido de
      contenido falso, y el punto del checkpoint es mirar la app de
      verdad. Falta copiar al portapapeles.
- [x] 7. Cablear las tres capas con el texto reescrito — **hecho.** Son
      `<dialog>` nativos: foco atrapado, cierre con Escape y semántica
      correcta sin escribir nada de eso a mano. **Verificado:** las tres
      llegan hasta su último control scrolleando.
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
3. Al día siguiente, a la noche, abrí la app. Esperado: una tarjeta
   pregunta por anoche — confirmando lo que calculaste, si lo marcaste, o
   preguntando cuántas horas dormiste si no. Podés saltearla, y no vuelve
   a preguntar por esa noche.
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

## Bugs encontrados al mirar las capturas

Los tres salieron de mirar la app corriendo, no de leer el código.

1. **La tarjeta de "¿Cómo dormiste anoche?" se le mostraba a un
   desconocido en su primera visita** — justo lo que el código tiene
   prohibido y lo que los tests verifican. La lógica estaba bien; el CSS
   la traicionaba. El atributo `hidden` aplica `display: none` desde la
   hoja del navegador, pero `.tarjeta-anoche { display: flex }` le gana
   por especificidad. Se agregó `[hidden] { display: none !important }`.
2. **Las opciones de horas salían desordenadas y con "7h 30m".** Venían
   de multiplicar el ciclo configurado, que es más exacto y peor: a la
   noche siguiente nadie recuerda haber dormido siete horas y media.
   Pasaron a horas enteras.
3. **Los botones de texto medían 23px de alto.** Es el mismo defecto que
   la Fase 9 ya había corregido en el link de la v1, reaparecido en los
   botones nuevos. Ahora 40px mínimo.

## Registro de decisiones y desvíos

- 2026-09-17 — **La lista de resultados pasó a ser una sola escalera
  ordenada por cuánto se duerme**, de menos a más, con la siesta corta
  como primer escalón. Antes los ciclos iban arriba y las dos siestas
  pegadas abajo como apéndice, y la escalera saltaba de un ciclo a tres.
  Pedido de Bruno, y de paso tapa ese hueco.
- 2026-09-17 — Con hora de despertar fija la lista arranca en 3 ciclos.
  Ahí "1 ciclo" significa acostarse 05:10 para levantarse 07:00: no es
  una opción, es una fila absurda, y con el orden ascendente quedaba
  arriba de todo empujando las útiles al fondo.
- 2026-09-17 — **La escena subió de 120x52 a 160x72 píxeles.** Bruno
  reportó que no se entendían algunas cosas, y la causa no era falta de
  detalle sino falta de lugar: el gaucho ocupaba 20x18 y en ese espacio
  no entra un brazo, ni una bota, ni un mate. Con un tercio más de
  píxeles por lado se redibujó todo — el gaucho con sombrero de ala,
  poncho a franjas, el brazo afuera con el mate y las botas; el fuego con
  leños que se distinguen en dos tonos; los árboles con tronco y copa; el
  cardón con sus brazos; textura en el suelo; y el recado tirado en el
  pasto, que cuenta que el que está ahí venía a caballo.
- 2026-09-17 — El matorral del claro lleva alturas y huecos irregulares
  fijos. Parejos se leía como un paredón de guiones detrás del gaucho.
- 2026-09-17 — **Monte chaqueño, tormenta y viento en la escena**, a
  pedido de Bruno. El monte no es decorado: es la masa oscura contra la
  que los refusilos se ven, que si no serían destellos en el vacío. Entre
  x=40 y x=84 el monte se abre en un claro, porque con copas ahí atrás la
  silueta del gaucho se perdía (y un fuego no se prende en el medio del
  monte cerrado).
- 2026-09-17 — La tormenta se sortea **una vez al cargar la página** (25%
  de probabilidad), no en cada repintado. La escena se redibuja cada
  minuto y con cada cambio de tema: sorteando ahí, el clima parpadearía
  entre tormenta y sereno mientras uno mira la pantalla.
- 2026-09-17 — Los refusilos son la nube alumbrada por dentro, sin rayo
  dibujado: es lo que efectivamente se ve de una tormenta lejana. La luz
  sigue la silueta del frente, porque como rectángulo sobre el cielo se
  leía como un panel encendido. El perfil de la nube quedó en una
  constante que comparten el dibujo y el destello, para que no se
  desincronicen.
- 2026-09-17 — El viento se ve en tres cosas a la vez: la llama acostada
  (juego de cuadros aparte), los pastos inclinados y polvo cruzando. Con
  una sola de las tres se supone; con las tres se siente.
- 2026-09-17 — **La cabecera pasó de una llama en SVG a una escena de
  pixel art animada**: un gaucho sentado junto al fogón, de día o de
  noche según la hora. Pedido de Bruno. Los sprites están escritos como
  texto en `escena.js` —cada carácter un píxel, cada letra un color— en
  vez de ser un PNG: se leen y se editan en el código, pesan unos cientos
  de bytes y no agregan un pedido de red. En modo brasa usa siempre la
  paleta nocturna aunque sea de día, porque quien pidió bajar el brillo
  no quiere una escena diurna luminosa.
- 2026-09-17 — Los botones de luna y ajustes llevan fondo propio. Se
  apoyan sobre la escena, que de día es clara: sin él quedaban invisibles
  contra el cielo diurno.

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
- 2026-09-17 — El fogón pasó de divs con CSS a SVG en línea. En CSS puro
  la llama se leía como una gota de agua, y es la única ilustración de la
  app: no podía quedar a medias. El SVG viaja dentro del HTML, sin un
  pedido de red más, y deja animar cada lengua por separado.
- 2026-09-17 — En modo brasa el botón principal deja de ser un relleno de
  ámbar encendido y pasa a fondo apagado con texto en brasa. Es el área
  de color más grande de la pantalla, o sea la principal fuente de luz a
  la cara justo cuando uno quiere menos luz.
- 2026-09-17 — `storage.js` dejó de importar vistas. Antes llamaba a mano
  a `renderHistory()`, `renderChart()` y `renderStatsPanels()` después de
  cada cambio, con la capa de datos dependiendo de la de pantalla. Ahora
  solo avisa que algo cambió y cada vista decide. Pedir confirmación y
  mostrar avisos también se fue a las vistas.
- 2026-09-17 — **La captura se muda de la mañana a la noche**, por
  pedido del usuario y respaldada por el backup real: el único registro
  existente se creó el día en que se construyó la función, o sea cero
  usos reales. El error no era solo cuántos campos pedía, sino el
  momento: a la mañana la app no se abre. Ahora pregunta por anoche al
  entrar, aprovechando una visita que ya iba a ocurrir.
- 2026-09-17 — Un registro puede no tener horario (`bedtimeActual` y
  `waketimeActual` en `null`) cuando la noche se responde de memoria. Se
  eligió eso antes que derivar horarios plausibles: inventarlos
  ensuciaría con ficción cualquier métrica de regularidad. `summarize`
  filtra esos registros para la consistencia, igual que ya filtraba las
  calificaciones ausentes.
- 2026-09-17 — Prioridad de la investigación externa revisada a la baja:
  los prompts 1 y 2 (adherencia y competencia) casi no mueven decisiones
  ahora. El 3 (qué métrica vale mostrar, interfaces de bajo brillo) sigue
  alimentando el cuaderno y el modo brasa.
