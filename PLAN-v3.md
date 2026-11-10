# Plan: versión 3 — datos que dicen la verdad, alarma de un toque y escena HD-2D

**Nivel:** profundo — suma una dependencia que multiplica por 13 el peso
de la app, cambia el esquema de los datos y redibuja la escena entera.
**Estado:** borrador — esperando aprobación
**Última actualización:** 2026-11-10

> El [plan de la v2](./PLAN.md) sigue valiendo como historia y como
> criterio: los tres trabajos de la app y la regla "el recorte va sobre la
> fricción, la ambición va sobre la expresión" no cambian. Este plan sale
> de algo que la v2 no tenía: **53 noches de uso real** en un backup.

---

## De dónde sale este plan

El backup del 8-nov trae 44 registros entre el 16-sep y el 7-nov. Lo que
dice, separado por cuánto se puede afirmar:

**Hechos (medidos sobre el archivo):**

- 41 de 53 noches anotadas: **77% de cobertura**. La v1 tuvo cero usos
  reales. La apuesta central de la v2 —preguntar por anoche al entrar de
  noche, en vez de pedir el dato a la mañana— funcionó.
- **0 de 44 registros se crearon entre las 05 y las 12.** Todos entre las
  12:59 y la 01:01. "A la mañana la app no se abre" ya no es una hipótesis.
- Dos registros imposibles: la noche del 23-oct figura como 23:20 a 22:50
  (**23h 30m, 16 ciclos**) y la del 22-sep como una siesta de 22 minutos.
  Los ids, que son la hora de creación, muestran que se cerraron 13 días y
  2 días después de abiertos. `calcularDuracionReal` resta horas de reloj
  y no puede saber que pasaron días. `isStaleOpenSleep` existe y tiene
  tests, pero ninguna pantalla la usa.
- Mientras la noche del 23-oct estuvo abierta, el botón dijo "Ya me
  levanté" y no había forma de marcar "Me voy a dormir": del 25-oct al
  4-nov las 8 noches se anotaron de memoria, sin horario.
- De las 13 noches válidas con horario, **12 son exactamente el plan**
  (90×n + 20). "Fue así" copia la intención; no mide lo que pasó. El
  21-sep la nota dice "capaz que dormí menos de lo que tenía planeado" y
  el registro dice 7h 50m clavado.
- De memoria, las respuestas son siempre 6, 7 u 8 horas (27 de 27).
- 7 notas reales, todas entre el 16 y el 29 de septiembre; ninguna en los
  40 días siguientes. 5 de las 7 dicen cómo se descansó; 4 corrigen datos
  que el formulario no dejaba cargar (horario real, "y pico", "me costó
  dormirme", "me desperté antes").
- De las 12 noches sin anotar, **9 son viernes o sábado**. La tarjeta solo
  pregunta por la última noche: si un día no se abre la app, esa noche se
  pierde para siempre.
- El registro del 10-sep es la prueba de la v1: esquema viejo, calidad 3,
  y el mismo texto que el ejemplo del campo de nota.

**Inferencias:**

- Las noches con horario suman los 20 minutos de latencia (tiempo en cama)
  y las de memoria son horas dormidas: dos medidas distintas en el mismo
  promedio.
- La regularidad de horarios (23:34 ± 35 min) sale solo de las noches
  planificadas; la del 27-sep, a las 3 de la mañana, quedó afuera por ser
  de memoria. La regularidad real es peor que la que se muestra.
- La frase libre cargaba la calificación que la v2 sacó. Hipótesis
  alternativa que los datos no descartan: se dejó de escribir porque no
  pasaba nada digno de anotar.

**Trampa que la app no tiene que caer:** las noches planificadas promedian
7h 28m y las de memoria 6h 49m. No quiere decir que planificar con la app
haga dormir más: unas son el plan copiado, incluyen la latencia, y se
planifica justo las noches en que uno ya se acuesta temprano.

---

## Objetivo

| Trabajo | Qué cambia en la v3 |
|---|---|
| 1. Calcular y anotar sin fricción | Lo anotado pasa a ser verdad: ninguna noche olvidada genera un registro, la confirmación deja de copiar el plan, la memoria trae horario. La alarma se pone de un toque. |
| 2. Ser memorable | Escena HD-2D: un campo 3D de noche con el gaucho, el fogón, un caballo atado, vacas echadas y un alambrado, bajo el cielo real de esa noche, que ocupa el fondo de toda la pantalla y cuenta tu noche. |
| 3. Mostrar qué sale de orquestar IA | La historia de esta versión es buena para contar: los datos reales destaparon dos bugs que los 132 tests no veían. |

**Éxito observable:**

- Una noche abierta hace más de 16 horas nunca se convierte sola en un
  registro: la app pregunta a qué hora te levantaste.
- "Me voy a dormir" está siempre disponible.
- Anotar de memoria: 2 toques (a qué hora te acostaste, a qué hora te
  levantaste). Confirmar una noche marcada: 1 toque. Cómo te levantaste:
  1 toque más, opcional.
- Desde una hora de la lista, **un toque** abre el atajo del iPhone que
  crea la alarma.
- En el cuaderno se ven las noches sin anotar de la última semana y se
  pueden cargar.
- Cada patrón del cuaderno dice sobre cuántas noches se apoya, y dice
  "todavía no alcanza" cuando son pocas.
- La lista de horas aparece sin esperar a la escena 3D.
- Alguien de afuera mira una captura de la escena y nombra cada cosa:
  gaucho, fogón, caballo, vacas, alambrado, monte. Lo que no nombra, se
  saca.
- La luna de la escena tiene la misma fase que la del cielo esa noche, y
  la Cruz del Sur está donde está.

## Fuera de alcance

- **Android.** El autor usa iPhone. No encontré confirmación de que Chrome
  deje disparar la orden `SET_ALARM` desde una web.
- **Poner la alarma sin Atajos.** iOS no deja que una web programe una
  alarma: hace falta armar el atajo una vez.
- **Calibrar el ciclo personal con los datos.** No se puede: las noches
  confirmadas son el plan copiado y nadie mide en qué fase se despierta.
- **Modelar el gaucho en 3D.** En HD-2D los personajes siguen siendo
  pixel art; el 3D es el mundo alrededor.
- **Mover la cámara.** Ni con el scroll ni inclinando el teléfono. Ver
  "Lo que se aprendió de otros": en 3D pixelado, una cámara que se
  desliza hace temblar los píxeles. La vida de la escena sale de lo que
  se mueve adentro, no de la cámara.
- **El Índice de Regularidad del Sueño (SRI).** Es la medida de
  regularidad más citada, pero necesita siete días seguidos completos con
  el estado minuto a minuto. Un diario con huecos no lo soporta, y
  calcularlo igual sería mostrar un número que no vale.
- **WebGPU y librerías de partículas.** WebGL alcanza para esta escena y
  es lo más seguro en Safari; tres efectos de partículas no justifican
  una librería general.
- Backend, cuentas, sincronización.

## Supuestos

- El atajo de iPhone puede recibir la hora como texto y crear una alarma
  con ella. El esquema de URL está documentado por Apple. La acción
  "Crear alarma" necesita una fecha, no un texto suelto: los foros
  reportan el error "no se pudo convertir de Texto a Fecha". Por eso la
  app manda fecha y hora completas en ISO 8601
  (`2026-11-09T07:20:00-03:00`), que Atajos sí reconoce, y el atajo pasa
  por la acción "Fecha" antes de crear la alarma. **No está verificado en
  un teléfono**; plan B: copiar la hora.
- El link `shortcuts://` funciona también con la app instalada en la
  pantalla de inicio. Se prueba en el teléfono.
- **Ubicación del cielo, sin pedir permiso:** sol, luna y estrellas se
  calculan para el lugar que indica la **zona horaria del teléfono**, que
  el navegador expone sin pedir nada y que el iPhone cambia solo al
  aterrizar en otro país. Cada zona trae en la base de datos de husos
  horarios las coordenadas de su ciudad de referencia: `Pacific/Auckland`
  es Auckland, "la mayor parte de Nueva Zelanda". En Argentina no
  alcanza: Chaco cae en `America/Argentina/Cordoba`, cuya referencia es
  Córdoba, a unos 650 km, con el atardecer corrido unos 20 minutos. Así
  que **con cualquier zona argentina se usa Resistencia**, la casa; entre
  Resistencia y General José de San Martín la diferencia es de un par de
  minutos. Para quien quiera precisión, Ajustes ofrece **Usar mi
  ubicación**: un toque, un permiso, y queda guardada.
- Un patrón necesita al menos 5 noches en cada grupo que compara. Es un
  piso para no mostrar ruido, no un umbral estadístico.
- Todo lo que mide la app es **tiempo en cama**, de acostarse a
  levantarse. La memoria pregunta "a qué hora te acostaste", no "a qué
  hora te dormiste", para que las dos fuentes midan lo mismo. Las noches
  viejas de memoria quedan como están.

---

## Lo que se aprendió de otros

Antes de diseñar se leyó código y documentación de proyectos que resuelven
bien partes de esto. Lo que se toma de cada uno, y lo que no:

| Fuente | Qué se toma | Qué no |
|---|---|---|
| **Ejemplo oficial de pixel art de three.js** (`webgl_postprocessing_pixel`, leído en el repo) | Cámara **ortográfica** y alineada a la grilla de píxeles, objetos alineados a la grilla, y luz que **sube y baja en escalones**, no en degradé continuo. Así el 3D se ve pixel art y no 3D liso con filtro. | Su escena es un cubo flotante: de ahí sale la técnica, no la estética. |
| **Texel Splatting** (Ebert, arXiv 2026) | La conclusión: con cámara en perspectiva, los píxeles a distinta profundidad se corren a distinto ritmo, y ningún ajuste a la grilla los estabiliza. Es el motivo de la cámara quieta. | La técnica del paper: es investigación, no algo para una app de bolsillo. |
| **folio-2025 de Bruno Simon** (three.js, MIT; leído en el repo) | El día como **presets de luz por momento** —día, atardecer, noche, amanecer— que se interpolan: color e intensidad de la luz, **color de las sombras** (violetas o azules, nunca negras) y dos colores de niebla. Se afina tocando números, no código. Y el pasto: miles de hojas en una sola geometría, con viento que mueve solo las puntas. | WebGPU, física, sonido y el ciclo acelerado: su día dura cuatro minutos; acá el día es el real. |
| **suncalc** (Agafonkin, BSD-2) | Altura del sol, amanecer y atardecer reales, y fase, fracción iluminada e inclinación de la luna. **3,2 kB comprimido** con lo que se usa (medido). Reemplaza escribir una función de fase propia. | Se fija la 2.1.1 (5-oct), no la 2.1.3, publicada el mismo día de este plan. |
| **Datos de d3-celestial** (catálogo de estrellas en GeoJSON) | Las estrellas más brillantes con su posición real, proyectadas para el lugar y la hora: la Cruz del Sur, las Tres Marías en verano, Escorpio en invierno. | El resto de la librería: con unas cien estrellas alcanza. |
| **Consensus Sleep Diary** (Carney y otros, 2012) | El diario de sueño estándar en investigación pregunta exactamente lo que tus notas decían: calidad, cuánto tardaste en dormirte, si te despertaste a la noche, si te despertaste antes de lo que querías. Los motivos de un toque quedan alineados con eso. | El instrumento en sí: su uso está restringido. Se alinean los conceptos, no se copian las preguntas. |
| **Jet lag social** (Wittmann, Roenneberg y otros, 2006) | La comparación "semana contra fin de semana" ya tiene una medida establecida: la diferencia del **punto medio del sueño** entre días libres y días de trabajo. Se usa esa en vez de inventar una. | El cuestionario completo de cronotipo. |
| **Loop Habit Tracker** | Un principio: una métrica que perdona los huecos. Ninguna racha que se corte, porque los huecos de esta app son los viernes y sábados. | El puntaje de hábito: acá no hay hábito que medir. |

---

## Datos: qué cambia en el esquema

Nada se rompe: los backups viejos se siguen importando y los campos nuevos
son opcionales.

| Campo | Qué es | Por qué |
|---|---|---|
| `quality` | Ya existía (1 a 5). Ahora se guarda 1, 3 o 5: mal, normal, bien. | Reusa el campo, su validación y el promedio que ya calcula `metrics.js`, y queda en la misma escala de cinco puntos que usa el diario estándar. |
| `reasons` | Nuevo. Lista de motivos de una lista fija. | Lo que las notas decían, sin escribir. |
| `source` | Nuevo. `live` (tocaste los botones en el momento), `confirmed` (elegiste la hora al día siguiente), `recalled` (las dos horas de memoria). | Con horario en las noches de memoria, `hasClockTimes` ya no distingue cuál fue de memoria. La app tiene que poder seguir diciéndolo. |
| `tz` | Nuevo. La zona horaria del teléfono al anotar la noche. | Las horas se guardan como hora local (`23:30`). Sin la zona, una noche en Nueva Zelanda y una en Chaco se mezclan en los patrones como si fueran el mismo reloj. |

**Validación nueva:** ningún registro de más de 16 horas, ni al guardar ni
al importar.

**Duración de una noche en vivo:** se calcula con `startedAt` y la hora
real del cierre cuando están, no restando horas de reloj. Es la causa de
fondo de los dos registros imposibles.

**Datos de prueba:** los tests usan casos sintéticos que reproducen los
dos bugs. El backup real no entra al repo: es público y tiene notas
personales.

**Dónde viven los datos en iPhone.** Safari borra lo que guarda una web
después de siete días sin abrirla, salvo que esté instalada en la pantalla
de inicio, que lleva su propia cuenta. Con uso diario el riesgo es bajo,
pero el export sigue siendo el único respaldo. Si pasó más de un mes
desde el último, Ajustes lo dice en una línea, sin insistir.

---

## La captura, rehecha

**Noche olvidada.** Si la noche abierta tiene más de 16 horas, la tarjeta
dice *Quedó abierta la noche del jueves 23, desde las 23:20. ¿A qué hora
te levantaste?* con horas para elegir. Si en cambio tocás "Me voy a
dormir", la vieja se descarta y queda como hueco cargable desde el
cuaderno. Nunca más un botón trabado.

**Confirmar una noche marcada.** Hoy son dos botones, "Fue así" y "Fue
distinto", y el primero gana siempre. Pasa a ser una sola fila de horas
alrededor de la planeada (una antes, la planeada, una después, y "otra
hora"). Cuesta lo mismo, un toque, pero elegir 07:20 entre 06:50, 07:20 y
07:50 es una respuesta; tocar "Fue así" es un reflejo.

**De memoria.** *¿A qué hora te acostaste?* y *¿A qué hora te levantaste?*,
cada una con horas de media en media hora centradas en tus horarios de
siempre (la mediana de lo anotado; 23:00 y 07:00 si no hay datos). "Otra
hora" abre el reloj para los casos como el del 27-sep, a las 3 de la
mañana.

**Después de anotar.** *¿Cómo te levantaste?* — Mal / Normal / Bien. Abajo,
opcionales: *Me costó dormirme*, *Me desperté a la noche*, *Me desperté
antes*, *Me dolía algo*. Y la frase libre al final, para lo que no entre en
ningún botón. Los tres primeros motivos son los que pregunta el diario de
sueño estándar, y los cuatro salen de lo que efectivamente escribiste.

**Huecos.** El cuaderno muestra las noches sin anotar de los últimos 7
días como filas propias, *Sin anotar*, y tocarlas abre la misma pregunta
de memoria. No insiste ni avisa: está ahí si la querés cargar.

## La alarma de un toque

Cada hora de la lista suma una acción **Poner alarma**, que abre
`shortcuts://run-shortcut?name=Alarma%20Fog%C3%B3n&input=text&text=<fecha
y hora en ISO 8601>`. La primera vez, una hoja explica cómo armar el atajo
en cuatro pasos: recibir el texto, convertirlo con la acción "Fecha" y
pasarlo a "Crear alarma". Si el atajo no anda o no estás en un iPhone, la
acción copia la hora.

## El cuaderno: patrones con su muestra

Un módulo puro nuevo, `patrones.js`, sin DOM, con tests, como `metrics.js`:

- **Jet lag social:** cuánto se corre el punto medio de tu noche el
  viernes y el sábado respecto del resto. Es la medida establecida para
  eso, y solo se puede calcular con horario: con los datos de hoy no se
  puede, porque los fines de semana casi no tienen.
- **Regularidad:** cuánto varía el punto medio de tu noche, en vez de la
  hora de acostarse sola, que es lo que mide hoy.
- **Hora de acostarse contra cómo te levantaste:** por ejemplo, *Las
  noches en que te acostaste antes de las 00:00 te levantaste bien 6 de 9
  veces; después, 1 de 5.*
- **Los motivos más frecuentes** del último mes.

Cada patrón lleva su cantidad de noches. Por debajo del piso dice
*Todavía no alcanza: faltan 3 noches de fin de semana.* Nunca habla de
causas: dice "las noches en que", no "porque". Nada de rachas.

**Viajes.** Los patrones solo comparan noches de la misma zona horaria:
cuando cambia, la ventana arranca de nuevo. Comparar la regularidad de
alguien que acaba de cruzar 16 horas de diferencia con la de su semana en
Chaco mediría el vuelo, no la costumbre. El cuaderno lo dice: *Desde que
cambiaste de zona horaria van 4 noches.*

---

## La escena: HD-2D

**Qué se ve.** Un campo de noche en 3D, visto un poco desde arriba. Adelante
el gaucho junto al fogón, con el círculo de piedras y los leños. A un
costado, un caballo atado a un poste. Más atrás, un alambrado que se
pierde en la niebla, y vacas echadas que el fuego alumbra apenas. Al
fondo, el monte chaqueño en capas, y arriba el cielo real de esa noche.

**Cómo se hace.** El mundo es 3D: suelo, piedras, postes, leños y monte
tienen volumen y texturas pixeladas. Los personajes —gaucho, caballo,
vacas— siguen siendo sprites escritos como texto, como hoy, pegados en el
mundo 3D de frente a la cámara. La cámara es ortográfica, quieta y
alineada a la grilla de píxeles. La luz del fuego es una luz real: titila
en escalones, proyecta las sombras del gaucho y del caballo sobre el
suelo, y se apaga hacia los bordes. Las sombras toman color según la hora,
nunca negro puro. Encima: brasas que suben, humo, niebla baja, el pasto
moviéndose en la punta, brillo alrededor de la llama, y desenfoque de lo
más lejano. Todo se dibuja a baja resolución y se agranda sin suavizar,
así queda pixel art y no 3D liso.

**El día real.** Cuatro presets de luz —día, atardecer, noche, amanecer—
interpolados según la altura real del sol donde estás, no según
horas fijas: en invierno oscurece antes, y la escena también.

**Cuenta tu noche.**

- Cielo según la altura real del sol; luna con su fase y su inclinación
  reales; las estrellas que se ven esa noche desde ahí, con la Cruz del
  Sur en su lugar.
- Al tocar una hora de la lista, el fuego tiene tantos leños como ciclos.
- Con una noche en curso, el fuego está consumido en proporción a lo que
  llevás en la cama: si abrís la app a las 3 de la mañana, ves cuánto
  quemó.
- De día, la misma escena con luz de sol y el fuego chico.

**La interfaz recibe la luz.** La escena pasa a ser el fondo de toda la
pantalla. Las tarjetas flotan sobre el campo, y la luz del fuego titila
sobre sus bordes, sincronizada con la llama de verdad. Los títulos ganan
detalle pixel; las horas y los textos siguen en letra legible, porque se
leen a la 1 de la mañana.

**Modo brasa.** La escena se queda quieta y muy oscura, sin brillo ni
desenfoque.

### Cómo construirla: tres enfoques

| | A. three.js | B. WebGL a mano | C. Escena prerenderizada |
|---|---|---|---|
| Qué es | La librería 3D más usada en la web, con los efectos ya hechos (pixelado, brillo, desenfoque) | Escribir los shaders y el motor sin librería | Renderizar la escena afuera y armarla con capas de imágenes |
| Peso | +133 kB comprimido (medido, escena mínima) | ~15–25 kB (estimado) | Imágenes, cientos de kB |
| Reutiliza | Los sprites de texto como texturas, y el ejemplo oficial de pixel art | Los sprites | Poco |
| Puede contar tu noche | Sí | Sí | Solo con muchas variantes armadas de antemano |
| Mantenible por quien no programa | Sí: documentación abundante y oficial | No: cada efecto es código propio | Sí, pero cada cambio es rehacer imágenes |
| Riesgo | Peso y batería | Tiempo y bugs propios en lo más difícil | Pierde lo dinámico, que es lo memorable |

**Criterio dominante: que se pueda mantener orquestando IA sin leer
código.** El peso se resuelve cargando la escena después de la lista, así
que no compite con el trabajo 1.

**Recomendación: A, three.js, con `WebGLRenderer`.** B gana en peso pero
pone el código más difícil de la app en manos de un motor propio; C no
puede contar la noche. La versión WebGPU de three.js es la que usa
folio-2025, pero pesa el doble y en Safari es lo menos probado.

**Protecciones del peso:** la escena se carga después de la lista; la
escena 2D de hoy (`escena.js`) queda como respaldo mientras carga y si el
teléfono no tiene WebGL o pierde el contexto; 30 cuadros por segundo como
techo; se pausa con la app en segundo plano; quieta con movimiento
reducido.

---

## Reutilización

| Pieza | Cómo se usa |
|---|---|
| `calc.js` | Intacto, salvo la duración en vivo, que pasa a usar las marcas de tiempo. |
| `metrics.js` | Intacto. `avgQuality` ya promedia la calidad. |
| `sleep-session.js` | `isStaleOpenSleep` se usa por fin; `closeSleepSession` aprende a calcular con marcas de tiempo. |
| `storage.js` | Mismo esquema más tres campos opcionales; la validación suma el techo de 16 horas. |
| `escena.js` | Queda como respaldo 2D, y sus sprites se mudan a un archivo compartido para que los use también la escena 3D. |
| Ejemplo de pixel art de three.js | Cámara alineada a la grilla y luz en escalones, adaptados. |
| suncalc | Sol y luna. No se escribe astronomía propia. |
| Datos de d3-celestial | Las estrellas brillantes, recortadas a lo que se ve. |
| Los 132 tests | No se modifican. Un rojo es una regresión. |

**Nuevo:** `patrones.js`, la escena 3D, los presets de luz, el atajo de
alarma, y los sprites nuevos de caballo, vaca y alambrado.

---

## Pasos

### Etapa A — función (primer PR)

Va primero porque el bug sigue ensuciando datos hoy, y porque es chica y
no depende de la escena.

- [ ] 0. `npm install` y los 132 tests en verde — verificación: la salida
      del comando.
- [ ] 1. La noche olvidada: más de 16 horas no se cierra sola, y "Me voy a
      dormir" nunca queda bloqueado — verificación: tests con los dos casos
      reales reproducidos (23:20 del 23-oct cerrada el 5-nov a las 22:50;
      23:10 del 22-sep cerrada el 24-sep a las 23:32).
- [ ] 2. Duración en vivo por marcas de tiempo y techo de 16 horas al
      guardar e importar — verificación: tests; un backup con un registro
      de 1410 minutos se rechaza.
- [ ] 3. Campos `reasons`, `source` y `tz`; calidad 1/3/5 — verificación:
      tests de import y export, y un backup de la v2 se importa igual.
- [ ] 4. Memoria con hora de acostarse y de levantarse — verificación:
      tests de las horas sugeridas (mediana, sin datos, cruce de
      medianoche) y captura en tamaño iPhone.
- [ ] 5. Confirmación con horas alrededor de la planeada — verificación:
      captura y recorrido con Playwright.
- [ ] 6. *¿Cómo te levantaste?* con motivos y frase opcional —
      verificación: recorrido completo en Playwright, de abrir la app a ver
      la noche en el cuaderno.
- [ ] 7. Huecos de la última semana en el cuaderno — verificación: tests
      de qué noches cuentan como hueco y captura.
- [ ] 8. Poner alarma: link al atajo con fecha ISO, hoja de instrucciones y
      plan B — verificación automática del link armado (incluido el cruce
      de medianoche: 07:20 pedido a las 23:00 es mañana); la real es tuya,
      en el iPhone.
- [ ] 9. `patrones.js` y su pantalla: jet lag social, regularidad del punto
      medio, acostarse contra cómo te levantaste, motivos — verificación:
      tests con casos por debajo y por encima del piso, y el jet lag
      contra un ejemplo calculado a mano; captura.
- [ ] 10. Aviso de respaldo: si el último export tiene más de un mes,
      Ajustes lo dice — verificación: test de la fecha.
- [ ] 11. Lint, tests, build y Lighthouse — verificación: la salida de cada
      uno.

### Etapa B — escena (segundo PR)

- [ ] 12. **Prototipo y checkpoint.** La escena sola, con la cámara
      alineada y la luz en escalones, de noche, al atardecer y de día, con
      todos los elementos. Te mando capturas y no sigo hasta tu OK. Prueba
      de lectura: alguien que no la vio nombra cada cosa.
- [ ] 13. Integrarla: carga diferida, respaldo 2D, pausa en segundo plano —
      verificación: la lista aparece antes que la escena (medido con
      Playwright), y sin WebGL se ve la escena 2D.
- [ ] 14. El cielo real: ubicación por zona horaria (Resistencia para
      cualquier zona argentina) con **Usar mi ubicación** opcional,
      presets de luz por altura del sol, luna con suncalc, estrellas
      proyectadas — verificación: tests de la ubicación para
      `America/Argentina/Cordoba`, `Pacific/Auckland` y una zona
      desconocida; la fase y el atardecer contra los de timeanddate.com
      para tres fechas en Resistencia y una en Auckland; la Cruz del Sur
      contra una carta celeste de esa hora.
- [ ] 15. Contar la noche: leños por ciclo y fuego consumido —
      verificación: capturas con 3 y con 6 ciclos, y con una noche en
      curso a la mitad.
- [ ] 16. La interfaz recibe la luz: fondo de pantalla completa, tarjetas
      flotando, luz del fuego en los bordes — verificación: contraste AA
      de los textos sobre la escena, medido.
- [ ] 17. QA: Lighthouse ≥ 90 de performance y 100 de accesibilidad;
      cuadros por segundo con la CPU frenada 4 veces; sin temblor de
      píxeles en una grabación de 10 segundos — verificación: los números
      y la grabación.
- [ ] 18. README y `docs/proceso.md`: el capítulo de cómo los datos
      reales destaparon lo que los tests no veían, y qué se tomó de otros
      proyectos.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Los elementos nuevos no se leen, como pasó con el recado y la tormenta. | El checkpoint del paso 12 con la prueba de lectura: lo que no se nombra, se saca. |
| Un toque más en la memoria baja la cobertura (la lección de la v1). | Hipótesis: un toque no la mueve. Se verifica con el backup del mes que viene: la cobertura tiene que seguir arriba del 70%. Si cae, la segunda pregunta se vuelve opcional. |
| La acción de alarma de Atajos no recibe la hora. | Fecha ISO y paso por la acción "Fecha"; si igual falla, plan B: copiar la hora. Se sabe en tu primera prueba. |
| 13 veces más peso. | Carga diferida, respaldo 2D, piso de Lighthouse de 90. |
| Los píxeles tiemblan. | Cámara ortográfica quieta y alineada, que es la solución del ejemplo oficial; se verifica en una grabación. |
| Safari pierde el contexto WebGL al pasar a segundo plano. | Se escucha la pérdida y se vuelve a la escena 2D. |
| Batería y calor a la noche. | Baja resolución, 30 cuadros como techo, pausa en segundo plano, quieta en modo brasa. |
| En un viaje, el cielo queda en la ciudad de referencia de la zona y no donde estás (Christchurch está unos 750 km al sur de Auckland). | La diferencia es de minutos en el atardecer; quien quiera exactitud toca **Usar mi ubicación**. |
| Una noche que cruza el vuelo queda absurda. | La duración por marcas de tiempo y el techo de 16 horas ya la frenan; la noche queda como hueco cargable. |
| Datos personales en un repo público. | Tests con casos sintéticos; el backup real no entra. |

## Verificación final

**Automática (la corro yo y muestro la salida):** los 132 tests sin
modificar, más los nuevos; lint y build limpios; Lighthouse; recorridos
con Playwright en tamaño iPhone 13 y SE; contraste medido sobre la escena.

**Manual (para vos, en el iPhone):**

1. **Limpieza de los datos actuales.** En el cuaderno, borrá tres noches:
   la del 10-sep (*dormí tarde y encima tomé vino*, es la prueba de la v1),
   la siesta de 22 minutos del 22-sep, y la del 23-oct de 23h 30m. Esperado:
   en el gráfico de 30 días desaparece la barra que llegaba al tope.
2. Tocá **Me voy a dormir** y no cierres la noche. Al día siguiente a la
   noche, abrí la app. Esperado: te pregunta a qué hora te levantaste, con
   horas para elegir alrededor de la que planeaste.
3. Dejá pasar una noche sin abrir la app. Esperado: el cuaderno la muestra
   como *Sin anotar* y la podés cargar.
4. Armá el atajo siguiendo la hoja de la app y tocá **Poner alarma** en una
   hora. Esperado: queda una alarma en el Reloj a esa hora.
5. Abrí la app con el teléfono en modo avión. Esperado: la lista aparece
   primero, y la escena llega después o queda la versión 2D.
6. Salí a mirar el cielo y compará. Esperado: la luna tiene la misma fase,
   y si la Cruz del Sur está alta, en la escena también.
7. Mostrale una captura de la escena a alguien y pedile que diga qué ve.
   Esperado: nombra cada cosa sin ayuda.
8. Tocá la luna. Esperado: la escena se queda quieta y se apaga.

## Registro de decisiones y desvíos

- 2026-11-08 — **Estética HD-2D** (elegida por Bruno entre HD-2D, 2.5D
  iluminado y diorama 3D pixelado): mundo 3D con personajes en pixel art.
  Reutiliza los sprites de texto, y es la que más se acerca a "realista e
  inmersivo".
- 2026-11-08 — **La interfaz recibe la luz, la letra queda legible.** La
  escena va de fondo de toda la pantalla; las horas no pasan a tipografía
  pixel, porque se leen a la 1 de la mañana.
- 2026-11-08 — **La escena cuenta la noche:** leños por ciclo, fuego
  consumido, luna y cielo reales.
- 2026-11-08 — **Se amplía con caballo, vacas y alambrado**, a pedido de
  Bruno y contra el historial: el recado y la tormenta se sacaron por no
  leerse. Queda condicionado a la prueba de lectura del checkpoint.
- 2026-11-08 — **Vuelve la calificación**, en tres niveles y con motivos de
  un toque. La v2 la había reemplazado por la frase; los datos muestran
  que la frase cargaba justamente eso y se dejó de escribir a las dos
  semanas.
- 2026-11-08 — **La memoria trae horario** (a qué hora te acostaste y a qué
  hora te levantaste) en vez de horas enteras: 27 de 41 noches no tenían
  horario y la regularidad salía solo de las noches planificadas.
- 2026-11-08 — **La confirmación deja de ser "Fue así".** 12 de 13 noches
  confirmadas eran el plan exacto. Pasa a ser elegir la hora real entre
  vecinas, al mismo costo.
- 2026-11-08 — **Primero la función, después la escena**, en PR separados.
  Supuesto declarado sin preguntar: el bug sigue ensuciando datos, y la
  escena es lo más riesgoso del plan.
- 2026-11-08 — **three.js** en vez de WebGL a mano o de una escena
  prerenderizada: el criterio es que se pueda mantener orquestando IA. El
  peso medido (+133 kB comprimido) se contiene con carga diferida.
- 2026-11-08 — **Desvío tras investigar otros proyectos: la cámara queda
  quieta.** El plan decía que la cámara se movería apenas con el scroll.
  El ejemplo oficial de pixel art de three.js y el paper de Texel
  Splatting muestran por qué no: en 3D pixelado, mover una cámara en
  perspectiva hace temblar los píxeles, y ningún ajuste lo arregla. Se
  usa cámara ortográfica alineada a la grilla, y la profundidad sale de la
  luz, las sombras, la niebla y el desenfoque.
- 2026-11-08 — **suncalc para el sol y la luna** en vez de una función de
  fase propia: 3,2 kB comprimido, BSD-2, con la precisión de
  timeanddate.com. De paso agrega lo que la función propia no daba: la
  altura real del sol, que define cuándo es atardecer.
- 2026-11-08 — **El día como presets de luz interpolados**, tomado de
  folio-2025: un juego de números por momento del día, sombras de color.
- 2026-11-08 — **Estrellas reales**, con la Cruz del Sur. Agregado sin
  preguntar: cuesta unos pocos kB y es lo que hace "realista" al cielo.
- 2026-11-08 — **"Semana contra fin de semana" pasa a ser el jet lag
  social**, la medida establecida (diferencia del punto medio del sueño).
  Y se descarta el SRI porque el diario con huecos no lo soporta.
- 2026-11-10 — **El cielo sigue al teléfono, no a una ciudad fija.**
  Bruno confirmó Resistencia o General José de San Martín como casa, y
  preguntó qué pasa cuando viaje a Nueva Zelanda. La zona horaria resuelve
  las dos cosas sin pedir permiso: en Argentina, Resistencia; afuera, la
  ciudad de referencia de la zona. La ubicación exacta queda como opción.
- 2026-11-10 — **Campo `tz` en cada noche**, por la misma pregunta: sin
  él, los patrones mezclarían relojes de dos países.
- 2026-11-10 — La app está instalada en la pantalla de inicio (dato de
  Bruno): el borrado de Safari a los 7 días no la alcanza. El aviso de
  respaldo queda igual, porque cambiar de teléfono se lleva todo.

---

## Cómo retomar en una sesión nueva

Este archivo es el traspaso: alcanza para arrancar sin la conversación que
lo armó. Orden de lectura: este plan, la skill de voz
(`.claude/skills/voz/SKILL.md`) para cualquier texto visible, y después
el paso 0. La Etapa A va en su propio PR; la B, en otro, después del
checkpoint del paso 12.
