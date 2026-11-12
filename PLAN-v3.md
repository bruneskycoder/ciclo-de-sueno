# Plan: versión 3 — datos que dicen la verdad, alarma de un toque y escena pintada

**Nivel:** profundo — cambia el esquema de los datos y redibuja la escena
entera con una pintura generada que pesa cientos de kB.
**Estado:** Etapa A hecha (PR aparte); Etapa B reescrita tras la prueba de
la escena pintada, pendiente
**Última actualización:** 2026-11-12 (paso 16 cerrado: Bruno lo vio en el
iPhone; sigue el 17)

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
| 2. Ser memorable | Escena pintada: una pintura de pixel art de un campo de noche con el gaucho, el fogón, un caballo atado, vacas echadas y un alambrado, generada con IA y animada por código (fuego, viento, brasas, humo, estrellas), bajo el cielo real de esa noche. Ocupa el fondo de la pantalla y cuenta tu noche. |
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
- La lista de horas aparece sin esperar a la escena.
- Alguien de afuera mira una captura de la escena y nombra cada cosa:
  gaucho, fogón, caballo, vacas, alambrado, monte. Lo que no nombra, se
  saca.
- Cuando la luna está sobre el horizonte, la escena la muestra con la
  fase y la inclinación de esa noche; si no salió, no hay luna. Las
  estrellas son las que se ven desde ahí, con la Cruz del Sur donde
  corresponde mirando al sur.
- Las imágenes de la escena caben en el presupuesto que fija el paso 12 y
  Lighthouse de performance sigue en 90 o más.

## Fuera de alcance

- **Android.** El autor usa iPhone. No encontré confirmación de que Chrome
  deje disparar la orden `SET_ALARM` desde una web.
- **Poner la alarma sin Atajos.** iOS no deja que una web programe una
  alarma: hace falta armar el atajo una vez.
- **Calibrar el ciclo personal con los datos.** No se puede: las noches
  confirmadas son el plan copiado y nadie mide en qué fase se despierta.
- **Un motor 3D** (three.js, WebGL a mano o WebGPU). Se hizo el
  prototipo y Bruno lo rechazó: los sprites escritos como texto, de unos
  30 píxeles, no dan para anatomía ni detalle. El límite era la fuente
  del dibujo, no el motor.
- **Mover la cámara o hacer parallax.** Ni con el scroll ni inclinando el
  teléfono: la pintura es una sola capa. La vida de la escena sale de lo
  que se anima adentro.
- **Personajes animados** (la cola del caballo, el mate, el gaucho que se
  mueve). Solo si un generador especializado mantiene al personaje igual
  entre cuadros; no está verificado y no se promete.
- **El Índice de Regularidad del Sueño (SRI).** Es la medida de
  regularidad más citada, pero necesita siete días seguidos completos con
  el estado minuto a minuto. Un diario con huecos no lo soporta, y
  calcularlo igual sería mostrar un número que no vale.
- **Librerías de partículas.** Las brasas y el humo son unas decenas de
  píxeles dibujados a mano en un canvas 2D.
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

> **Actualización 2026-11-11.** Se descartó el motor 3D (ver "La escena").
> Las filas del ejemplo de pixel art de three.js, Texel Splatting y
> folio-2025 quedan como historia de por qué se probó eso y por qué se
> rechazó. Sobreviven dos ideas: la luz que sube y baja en escalones y el
> desplazamiento redondeado a píxeles enteros, que la pintura animada usa
> con el mismo fundamento. suncalc y las estrellas de d3-celestial siguen
> en pie.

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

## La escena: pintura animada

**Qué se ve.** Un claro del monte chaqueño de noche, visto un poco desde
arriba: el gaucho sentado junto al fogón con el mate, un caballo zaino
ensillado y atado a un palenque, un alambrado de postes de quebracho con
tres vacas echadas detrás, el monte en tres planos y el cielo arriba. Es
una pintura de pixel art de 572 × 1024 generada con IA (Gemini; el prompt
está en `docs/escena-pintada.md`) y se muestra sin suavizar. Hoy vive en
`public/escena/noche.png` y pesa 567 kB (medido).

**Cómo se hace.** La pintura es la base y el código la anima en un canvas
2D, sin librerías. Está armado, con las coordenadas medidas sobre la
pintura, en `escena-pintada.html`:

- **Llama:** 4 cuadros que salen de deformar la llama pintada (inclinar la
  punta, ondularla, estirarla), en vez de dibujar otra que desentone.
- **Luz del fuego:** seis anillos de resplandor, elipses chatas alrededor
  del fogón, que suben y bajan de a saltos y no en degradé.
- **Brasas y humo:** 16 brasas y 5 volutas, cada una función pura del
  tiempo y sin estado, así que la misma captura se repite.
- **Viento:** 9 zonas de copas y pasto con la punta móvil y la base
  quieta. El desplazamiento se redondea a píxeles enteros: con fracciones,
  todo tiembla y parece un error de la imagen.
- **Estrellas:** 16 que titilan, cada una a su ritmo.
- Techo de 30 cuadros por segundo; todo quieto con movimiento reducido.

**Lo que la prueba no resolvió.** Cada fila es un supuesto, no un hecho, y
dice dónde se verifica:

| Supuesto | Por qué todavía es un supuesto | Dónde se resuelve |
|---|---|---|
| El código puede poner la luna y las estrellas de esa noche. | La pintura trae una luna en cuarto creciente arriba a la izquierda, la Cruz del Sur arriba al centro y estrellas, todo pintado. Hace falta la misma imagen con el cielo liso, y que Gemini la dé sin mover lo demás. No se probó. | Paso 12 |
| Atardecer y día salen de la pintura de noche. | `docs/escena-pintada.md` supone que alcanza con teñir. Un cielo nocturno con filtro puede leerse como "noche con filtro". No se probó. | Paso 14d |
| El fuego se puede consumir y los leños contar ciclos. | La llama se probó entre 0,94 y 1,05 de escala. Achicarla a la mitad puede deformarla. Los leños nuevos sobre una pila pintada pueden verse pegados. | Paso 15 |
| La pintura entra en la pantalla sin perder nada. | 572 × 1024 es 9:16 y un iPhone 13 es 390 × 844. Llenar la pantalla recortaría unos 50 px por lado, y con ellos el borde del poncho y el anca del caballo. | Paso 16 |
| Se ve nítida en cualquier iPhone. | Agrandar con vecino más cercano un número no entero de veces deja píxeles de ancho desparejo, y en movimiento se nota. Cuentas: 1170 / 572 = 2,05 con 3 px por punto (casi entero); 750 / 572 = 1,31 con 2 px por punto. No se midió en teléfono. | Paso 17 |

**El día real.** Cuatro momentos —día, atardecer, noche, amanecer— elegidos
según la altura real del sol donde estás, no según horas fijas: en
invierno oscurece antes, y la escena también. De noche es la pintura tal
cual. Para los otros hay dos caminos y se decide con evidencia en el paso
14d:

1. **Variantes** pedidas a Gemini sobre la misma imagen ("la misma escena
   exacta, mismo encuadre, al atardecer"), mezcladas según la altura del
   sol. Sirven si los elementos quedan en el mismo lugar.
2. **Tinte:** un color por momento aplicado sobre la pintura de noche, con
   sombras de color y nunca negras. Sirve si alguien que no la vio dice
   qué momento del día es.

Si ninguno pasa, de día y al atardecer se muestra la escena 2D de hoy
(`escena.js`) hasta que haya una pintura que sí. Orden de esfuerzo: noche,
atardecer, día. No se midió cuánto de la app se usa a cada hora: los
registros se crearon entre las 12:59 y la 01:01, nada más.

**Cuenta tu noche.**

- **Cielo:** luna con su fase y su inclinación reales, en el lugar donde la
  pintura la tenía, y solo si está sobre el horizonte esa noche. Estrellas
  reales proyectadas hacia donde mira la escena (supuesto declarado: al
  sur, porque es donde está la Cruz del Sur), recortadas por el contorno
  del monte. La posición de la luna es fija y la fase es real; las
  estrellas giran como en el cielo.
- **Fuego consumido:** con una noche en curso, la llama, el resplandor y
  las brasas bajan en proporción a lo que llevás en la cama respecto de lo
  planeado. Si abrís la app a las 3 de la mañana, ves cuánto quemó. Los
  leños pintados no cambian.
- **Leños por ciclo:** al tocar una hora de la lista, sprites sueltos sobre
  la pintura, dibujados con su paleta, tantos como ciclos. Condicionado a
  la prueba de lectura del paso 15: si no se leen o desentonan, se
  descartan y la cantidad de ciclos queda en el texto de la tarjeta, que
  ya lo dice.
- **De día,** el fuego chico.

**La interfaz recibe la luz.** La pintura pasa a ser el fondo fijo de toda
la pantalla, anclada arriba y con el ancho completo, sin recortar nada; si
la pantalla es más alta que 9:16, el suelo se extiende hacia abajo, que es
casi liso. El título y la bajada van arriba, sobre el cielo. Las tarjetas
arrancan debajo del fuego, sobre el suelo oscuro, y al scrollear suben y
tapan la escena. La cámara no se mueve: es el contenido el que sube. La luz
del fuego titila sobre los bordes de las tarjetas, con la misma función del
tiempo que la llama. Las horas y los textos siguen en letra legible,
porque se leen a la 1 de la mañana.

**Modo brasa.** La escena se queda quieta y muy oscura, sin resplandor. Se
activa con el botón ☾ de la cabecera, como hoy.

### Cómo se decidió: tres enfoques

| | A. three.js con sprites de texto | B. Pintura generada + animación 2D | C. Una pintura por cada estado |
|---|---|---|---|
| Qué es | Mundo 3D con personajes de unos 30 píxeles escritos como texto | Una pintura de Gemini; el código anima e ilumina encima | Generar con IA cada hora, cada cantidad de leños, cada fase de luna |
| Calidad del dibujo | Limitada por los sprites. Bruno vio el prototipo y lo rechazó | La de las referencias que Bruno mostró | La misma que B |
| Peso | +133 kB comprimido de librería (medido, escena mínima) | Imágenes: 567 kB la de noche (medido); código chico | Decenas de imágenes |
| Puede contar tu noche | Sí | Luz, fuego y cielo, sí; leños sin verificar | Solo con variantes armadas de antemano |
| Mantenible sin leer código | Sí | Sí, salvo que cada cambio visual es otro pedido a Gemini | No: cada cambio es rehacer imágenes |
| Riesgo | Calidad (se concretó) | Que las variantes no coincidan; peso; términos de uso de la imagen | Combinatoria |

**Criterio dominante: la calidad del dibujo.** El plan anterior dejó
"que se pueda mantener orquestando IA sin leer código" como criterio
dominante. Eso eligió three.js y no vio que lo que limitaba era la fuente
del dibujo, no el motor. Ese criterio sigue valiendo, pero como piso.

**Recomendación: B.** C no escala; A ya se probó.

**Protecciones del peso:** la escena se carga después de la lista; la
escena 2D de hoy (`escena.js`) queda como respaldo mientras carga, si la
imagen falla y de día mientras no haya variante; las pinturas se importan
desde `src/` para que el nombre lleve hash (el service worker responde del
cache primero: una pintura nueva con nombre fijo en `public/` no llegaría
a un teléfono que ya guardó la vieja); 30 cuadros por segundo como techo;
se pausa con la app en segundo plano; quieta con movimiento reducido.

---

## Reutilización

| Pieza | Cómo se usa |
|---|---|
| `calc.js` | Intacto, salvo la duración en vivo, que pasa a usar las marcas de tiempo. |
| `metrics.js` | Intacto. `avgQuality` ya promedia la calidad. |
| `sleep-session.js` | `isStaleOpenSleep` se usa por fin; `closeSleepSession` aprende a calcular con marcas de tiempo. |
| `storage.js` | Mismo esquema más tres campos opcionales; la validación suma el techo de 16 horas. |
| `escena.js` | Queda como respaldo 2D: mientras carga la pintura, si falla y de día mientras no haya variante. Sus sprites no se mudan: el 3D que los iba a compartir se descartó. |
| `escena-pintada.html` | Se mueve al build: la llama, la luz, las brasas, el humo, el viento y las estrellas ya están medidos sobre la pintura. |
| `public/escena/noche.png` | La pintura aprobada. Se reemplaza por la versión de cielo liso si el paso 12 sale. |
| suncalc | Sol y luna. No se escribe astronomía propia. |
| Datos de d3-celestial | Las estrellas brillantes, recortadas a lo que se ve. |
| Los 132 tests | No se modifican. Un rojo es una regresión. |

**Nuevo en la Etapa B:** la escena pintada en el build, el cielo
(ubicación, sol, luna y estrellas) y el tinte por momento del día. Las
pinturas son archivos, no código.

---

## Pasos

### Etapa A — función (primer PR)

Va primero porque el bug sigue ensuciando datos hoy, y porque es chica y
no depende de la escena.

- [x] 0. `npm install` y los 132 tests en verde — verificación: la salida
      del comando.
- [x] 1. La noche olvidada: más de 16 horas no se cierra sola, y "Me voy a
      dormir" nunca queda bloqueado — verificación: tests con los dos casos
      reales reproducidos (23:20 del 23-oct cerrada el 5-nov a las 22:50;
      23:10 del 22-sep cerrada el 24-sep a las 23:32).
- [x] 2. Duración en vivo por marcas de tiempo y techo de 16 horas al
      guardar e importar — verificación: tests; un backup con un registro
      de 1410 minutos se rechaza.
- [x] 3. Campos `reasons`, `source` y `tz`; calidad 1/3/5 — verificación:
      tests de import y export, y un backup de la v2 se importa igual.
- [x] 4. Memoria con hora de acostarse y de levantarse — verificación:
      tests de las horas sugeridas (mediana, sin datos, cruce de
      medianoche) y captura en tamaño iPhone.
- [x] 5. Confirmación con horas alrededor de la planeada — verificación:
      captura y recorrido con Playwright.
- [x] 6. *¿Cómo te levantaste?* con motivos y frase opcional —
      verificación: recorrido completo en Playwright, de abrir la app a ver
      la noche en el cuaderno.
- [x] 7. Huecos de la última semana en el cuaderno — verificación: tests
      de qué noches cuentan como hueco y captura.
- [x] 8. Poner alarma: link al atajo con fecha ISO, hoja de instrucciones y
      plan B — verificación automática del link armado (incluido el cruce
      de medianoche: 07:20 pedido a las 23:00 es mañana); la real es tuya,
      en el iPhone.
- [x] 9. `patrones.js` y su pantalla: jet lag social, regularidad del punto
      medio, acostarse contra cómo te levantaste, motivos — verificación:
      tests con casos por debajo y por encima del piso, y el jet lag
      contra un ejemplo calculado a mano; captura.
- [x] 10. Aviso de respaldo: si el último export tiene más de un mes,
      Ajustes lo dice — verificación: test de la fecha.
- [x] 11. Lint, tests, build y Lighthouse — verificación: la salida de cada
      uno.

### Etapa B — escena (segundo PR)

Reescrita el 2026-11-11 tras la prueba de la escena pintada. Se conserva
la numeración 12 a 18 para que las referencias de otros documentos sigan
valiendo. El checkpoint del paso 12 original ya ocurrió: el prototipo 3D
se rechazó y la pintura animada se aprobó.

- [ ] 12. **Cerrar la prueba y preparar la pintura.**
      - a. *Sacar el 3D.* Borrar `escena-prototipo.html`,
        `src/js/escena3d/` y `docs/escena3d-prototipo.png`, y correr
        `npm uninstall three` — verificación: `npm ls three` vacío, los
        219 tests, lint y build en verde. **Hecho 2026-11-12:** los tres
        verificados.
      - b. *Cielo liso.* Bruno le pide a Gemini, adjuntando `noche.png`:
        "la misma imagen exacta, mismo encuadre y mismos elementos, pero
        con el cielo liso: sin estrellas ni luna". Se guarda como
        `noche-cielo-liso.png` — verificación: un script mide cuánto
        cambió la imagen fuera del cielo; gaucho, caballo, fuego, vacas y
        alambrado tienen que quedar en el mismo lugar. Tres intentos; si
        no, plan B: se queda el cielo pintado y se pierden la luna y las
        estrellas reales. Lo demás del plan no cambia. **Hecho
        2026-11-12, primer intento.** Gemini devolvió 1116 × 2000 (JPEG,
        pasado por el chat); se bajó a 572 × 1024 con filtro bilineal, el
        que más se parece a `noche.png` (diferencia media 5,9 sobre 255,
        contra 6,2 a 6,9 de los otros). Se midió: corrimiento global
        (0, 0) píxeles, o sea que nada se movió; la diferencia que queda
        (5 a 6 sobre 255 en todas las zonas, 1 a 2% de píxeles con más
        de 40) cae en los bordes, y es re-escalado más compresión, no
        elementos movidos. Gaucho, caballo, fuego, vacas y alambrado en el
        mismo lugar, mirado a ojo y en el mapa de diferencias. Quedaba una
        estrella suelta de 2 píxeles en (497, 116): se tapó con el cielo
        de al lado. Se guarda en `docs/fuentes/noche-cielo-liso.png` y
        `src/assets/escena/noche-cielo-liso.webp` (84 kB, calidad 90).
        Salvedad: el JPEG del chat ya viene comprimido; si Bruno tiene el
        PNG original de Gemini, conviene reemplazar la fuente y repetir
        la reducción.
      - c. *Contorno del monte.* Para cada columna de la pintura, la
        altura donde termina el cielo, para que las estrellas no se
        dibujen delante de los árboles ni del cardón — verificación:
        captura con el contorno marcado, como el `?mascara=1` de la
        prueba. **Herramienta hecha** (`scripts/contorno-cielo.py`, usa
        Pillow) y probada sobre la pintura de hoy: sigue la copa de la
        izquierda y el cardón, y toma la bruma del horizonte como cielo.
        **Hecho 2026-11-12:** corrida sobre la de cielo liso, 572
        columnas, el contorno cae entre la fila 192 y la 273; guardado en
        `src/assets/escena/contorno-cielo.json`. Sobre la pintura vieja
        daba entre la 178 y la 268: la luna y las estrellas la
        confundían. Captura del contorno revisada a ojo.
      - d. *Peso.* Probar PNG con paleta y WebP sin pérdida y quedarse con
        el más chico que no cambie ningún píxel a ojo. Fijar acá el
        presupuesto de las imágenes (punto de partida, estimado: la mitad
        de los 567 kB de hoy por pintura). Las pinturas pasan a
        `src/assets/` y se importan, para que el nombre lleve hash —
        verificación: kB antes y después, captura lado a lado, y el nombre
        con hash en `dist/`. **Medido 2026-11-12** sobre los 567 kB del PNG:
        PNG optimizado 567 kB (no baja nada); WebP sin pérdida 398 kB;
        PNG de 128 colores 165 kB, **descartado**: la llama sale gris y el
        poncho marrón; WebP con pérdida calidad 90, **95 kB** (−83%) y
        calidad 85, 77 kB, los dos indistinguibles del original a ojo con
        zoom 3× sobre el fuego y el gaucho. **Elegido: WebP calidad 90**
        (`src/assets/escena/noche.webp`); el PNG original quedó en
        `docs/fuentes/noche.png` para adjuntarlo a Gemini. Pendiente: el
        import con hash en `dist/` se comprueba en el paso 13, cuando
        el build use la imagen; `escena-pintada.html` ya la carga desde
        `src/assets/` y anda sin errores. El presupuesto queda en 100 kB
        por pintura.
      - **Checkpoint.** Te mando la pintura de cielo liso y no sigo hasta
        tu OK. Es tu decisión si el cielo real vale más que el cielo
        pintado que ya te gustó; el supuesto por defecto es que sí, por la
        decisión del 8-nov de que la escena cuente la noche.
- [x] 13. **Integrarla.** El código de `escena-pintada.html` pasa al build
      como módulo propio, con la pintura de fondo de pantalla completa
      detrás de la interfaz de hoy (sin tocar las tarjetas todavía). Carga
      diferida: arranca cuando la lista ya se dibujó. Respaldo: `escena.js`
      mientras carga, si la imagen no llega y si el teléfono no puede.
      Pausa en segundo plano, quieta con movimiento reducido y en modo
      brasa, 30 cuadros como techo — verificación con Playwright: la lista
      aparece antes que la escena (medido), con la imagen bloqueada se ve
      la escena 2D y la app sigue andando, el CLS no empeora respecto de
      hoy, y los 219 tests, lint y build en verde.
      **Hecho 2026-11-12.** Código en `src/js/escena-pintura.js` (cuentas
      puras, con tests) y `src/js/ui/escena-pintada.js` (el canvas); se
      carga con `import()` desde `main.js` en un momento ocioso, y el
      chunk sale aparte (5 kB) junto con la imagen con hash
      (`dist/assets/noche-cielo-liso-CzVJVMKi.webp`, 84 kB). Medido con
      Playwright sobre `vite preview`, 390 × 844, sin frenar red ni CPU,
      5 corridas: la lista se dibuja a los 51–64 ms y la pintura a los
      114–145 ms (después, en todas). Con los `.webp` bloqueados: la
      escena 2D queda a la vista, 7 filas de horas, Ajustes abre, 0
      errores de página. CLS 0,0284 con la pintura contra 0,0273–0,0308
      de la versión anterior (igual, dentro del ruido). Movimiento: 6
      cuadros distintos de 6 en uso normal; 1 de 6 con "reducir
      movimiento", en modo brasa y con la pestaña en segundo plano; vuelve
      a moverse al salir de brasa. 237 tests, lint y build en verde.
      Un error apareció en el navegador y no en los tests: el primer
      cuadro de animación traía un tiempo negativo y el cuadro de llama
      quedaba fuera de la secuencia. Corregido y con test.
      **Estado visual, a propósito:** la pintura va fija detrás de todo y
      las tarjetas la tapan; el título y la bajada caen sobre los árboles y
      el fuego queda bajo la primera lista. Eso lo resuelve el paso 16. Las
      estrellas son provisorias (las posiciones de las de la pintura con
      cielo) hasta el 14c. Modo brasa: la pintura se oscurece con
      `brightness(0.6)`; el valor es una primera cuenta, no medida contra
      contraste. Con ahorro de datos prendido no se baja la pintura.
- [x] 14. **El cielo real.**
      - a. *Ubicación.* Por zona horaria: Resistencia para cualquier zona
        argentina, incluidos los alias que devuelve Chromium
        (`America/Cordoba`, `America/Buenos_Aires`, `America/Argentina/*`);
        la ciudad de referencia de la zona afuera; **Usar mi ubicación**
        opcional en Ajustes — verificación: tests para
        `America/Argentina/Cordoba`, `America/Cordoba`, `Pacific/Auckland`
        y una zona desconocida.
      - b. *Sol y luna con suncalc 2.1.1* — verificación: fase y
        atardecer contra timeanddate.com para tres fechas en Resistencia y
        una en Auckland.
      - c. *Luna y estrellas sobre la pintura.* Luna en su lugar, con fase
        e inclinación reales y solo si está sobre el horizonte. Estrellas
        del catálogo proyectadas hacia el sur, recortadas por el contorno
        del paso 12c, titilando — verificación: tests de la proyección
        (función pura); la Cruz del Sur contra una carta celeste para una
        hora de una noche en Resistencia; capturas de luna nueva, cuarto y
        llena.
      - d. *El momento del día.* La altura del sol elige entre día,
        atardecer, noche y amanecer, por variantes o por tinte, según la
        regla de "El día real" — verificación: capturas de los cuatro
        momentos y la prueba de lectura con alguien que no las vio
        (*¿qué momento del día es?*). Si ninguna vía pasa, de día y al
        atardecer queda la escena 2D, y se anota acá.
      **Estado 2026-11-12: 14a, 14b, 14c y 14d hechos.** (14d cerrado
      con el OK de Bruno al tinte; ver la nota al final del 14d.)
      - *14a.* `src/js/ubicacion.js`: cualquier zona argentina (incluidos
        `America/Cordoba` y `America/Buenos_Aires`) da Resistencia; 33
        ciudades de referencia (Auckland entre ellas); una zona que no
        está en la tabla cae en Resistencia y Ajustes lo dice. **Usar mi
        ubicación** en Ajustes guarda la posición redondeada a 0,1°
        (unos 10 km) solo en el navegador; entra en "Borrar todo" y no
        viaja en el respaldo. 24 tests. Probado en navegador con
        geolocalización simulada (Christchurch → guarda -43,5 / 172,6),
        volver a la zona, y permiso denegado.
      - *14b.* `suncalc` 2.1.1 fijada. Contra la API del Observatorio
        Naval de EE.UU. (aa.usno.navy.mil, consultada hoy; **no** contra
        timeanddate.com, que devuelve 403 desde acá): amanecer y
        atardecer dentro de 1 minuto en Resistencia (21-dic, 21-jun,
        20-mar) y Auckland (21-jun); fracción iluminada de la luna dentro
        de 1 punto (91, 47, 3 y 41%). 16 tests.
      - *14c.* 288 estrellas de magnitud 3,5 o menos (Hipparcos vía
        d3-celestial, BSD-3), generadas por `scripts/generar-estrellas.py`
        (10,6 kB sin comprimir). La proyección es una ventana hacia el
        sur, no una carta exacta. **Verificación contra astropy** (no
        contra una carta celeste, que no tengo): 15 combinaciones de 5
        estrellas (Acrux, Gacrux, Canopus, Sirio, Antares) y tres noches
        dan alturas dentro de 0,6° y azimuts dentro de 0,8°; la cuenta
        no corrige precesión (unos 0,36° en 26 años, 1 a 2 píxeles). Las
        estrellas no caen delante del monte ni sobre la luna (tests sobre
        el contorno real). La luna sale con su fase y su inclinación
        (`angle - parallacticAngle`) y solo si está sobre el horizonte.
        **No verificado:** el sentido de la inclinación (qué lado mira la
        parte iluminada) está razonado y probado contra la convención, no
        contra una foto de la luna de una noche conocida. Hace falta que
        Bruno mire la luna una noche y diga si coincide.
      - *14d.* El momento sale de la altura real del sol: día desde 6°,
        noche por debajo de -8°, atardecer o amanecer entre medio según
        suba o baje (umbrales elegidos por mí, no estándar). `tinte.js`
        reemplaza el cielo por un degradé y levanta la luz. **Se probó la
        vía del tinte y se ve mal:** el borde contra el monte es una
        recta con escalones, el horizonte pintado no se acopla, y el día
        se lee como "una noche con filtro" (el monte sigue azul de luna).
        Es mi lectura, no la prueba del plan: **la prueba de lectura con
        alguien que no las vio no se hizo.** Por eso
        `MOMENTOS_PINTADOS` es solo `noche`: de día, al atardecer y al
        amanecer queda la escena 2D y ni se baja la imagen (comprobado
        con la fecha forzada). Las capturas se miran abriendo la app con
        `?cielo=2026-12-21T19:30-03:00`. La vía de las variantes (que
        Bruno pida a Gemini atardecer y día sobre la misma imagen) no se
        intentó. Un caso a mirar: si la app queda abierta pasando del
        atardecer a la noche, no cambia sola a la pintura hasta recargar.
        **Cierre (2026-11-12):** Bruno miró las capturas y aprobó el
        tinte. `MOMENTOS_PINTADOS` pasa a tener los cuatro momentos: la
        pintura se ve a cualquier hora y la escena 2D queda solo como
        respaldo (sin red, ahorro de datos, sin canvas). Con eso se cae el
        caso de la app abierta del atardecer a la noche: el cielo se
        recalcula cada 30 segundos sobre la misma pintura. **Lo que sigue
        abierto:** Bruno ya la había visto, así que la prueba de lectura
        del plan (alguien que no la vio) no está hecha; mi lectura de "el
        día parece una noche con filtro" tampoco se refutó, se decidió
        igual. Si en la prueba de lectura del 15b alguien no reconoce el
        día, se saca `dia` del conjunto y vuelve la escena 2D de día.
      - **Medido:** el chunk de la escena pasó a 25 kB (11 kB comprimido)
        por el catálogo y suncalc; la imagen sigue aparte con hash. 310
        tests, lint y build en verde.

- [x] 15. **Contar la noche.**
      - a. *Fuego consumido:* llama, resplandor y brasas bajan con la noche
        en curso — verificación: capturas con la noche al 25%, 60% y 100%.
        Escalar la llama pintada a la mitad no está probado; si se
        deforma, plan B: una pintura con el fuego en brasas pedida a
        Gemini, y se alterna.
      - b. *Leños por ciclo:* sprites sueltos sobre la pintura —
        verificación: capturas con 3 y con 6 ciclos y prueba de lectura.
        Lo que alguien que no la vio no cuenta, o desentona, se saca.
      - c. *De día, fuego chico,* si el paso 14d dejó una vía para el día.
      **Estado 2026-11-12: 15a, 15b y 15c hechos; falta la prueba de
      lectura del 15b.** Capturas: `docs/fuego-noche.webp`; en la app,
      `?noche=0.6` simula el 60% de la noche y `?lena=4` pone cuatro leños.
      - *15a.* El plan B (pintura de brasas en Gemini) no hizo falta.
        Achicar la llama tal cual arrastraba el fondo, así que primero se
        separa: `separarLlama` marca qué píxeles son fuego (umbrales
        medidos fila por fila sobre la pintura, más un píxel de margen) y
        rellena lo que tapaba con el suelo de los costados, fila por fila.
        La llama baja hacia los leños, se angosta menos de lo que baja, se
        pone roja (pierde verde y azul) y nunca tapa un leño ni una
        piedra. La luz pintada del suelo se apaga con seis anillos que
        oscurecen y enfrían; el resplandor, las chispas y la altura del
        humo bajan con el fuego. Fuerza: 1 al acostarse, 0,3 a la hora de
        despertar (no llega a 0 a propósito). La hora planeada es la que
        elegiste en la lista; si no elegiste, tu hora de levantarte de
        siempre. **Mi lectura:** al 25, 60 y 100% se ve un fuego que se
        consume y no una llama deformada. Al 100%, ampliado, el borde
        izquierdo de la llama queda recto; a tamaño de pantalla no lo veo.
      - *15b.* Leños vistos de punta, en pirámide (3, 2, 1) a la derecha
        del círculo de piedras, con sombra en el suelo. De costado se
        probó en la cabeza y no en pantalla: dos leños uno al lado del
        otro se leerían como uno largo. Primer intento, de 9 × 8 píxeles:
        se leía como cajitas; quedó del grueso de los leños del fogón. Al
        tocar una hora aparecen tantos como ciclos (home.js lo pasa por
        `data-lena`); con una noche en curso, **decisión mía, no del
        plan:** quedan los ciclos que faltan hasta la hora planeada
        (probado: 4 h adentro de una noche de 7,5 h, 3 leños de 5). A
        390 × 844 la pila mide unos 21 × 25 puntos y hoy cae debajo de la
        primera tarjeta; el paso 16 la deja a la vista. **No hecho:** la
        prueba de lectura con alguien que no la vio (*¿qué hay al lado del
        fuego? ¿cuántos?*). Si no se cuentan o desentonan, se saca la
        pila y la cantidad queda en la tarjeta.
      - *15c.* De día, fuego al 45%. Una siesta de día toma el más chico
        de los dos.
      - **Medido:** 332 tests (22 nuevos), lint y build en verde; el chunk
        de la escena pasó de 25 a 29 kB (13 kB comprimido).
- [x] 16. **La interfaz recibe la luz.** Pintura anclada arriba con el
      ancho completo, suelo extendido hacia abajo, título y bajada sobre el
      cielo, tarjetas que arrancan debajo del fuego y suben al scrollear,
      luz del fuego en sus bordes con la misma función del tiempo que la
      llama — verificación: contraste AA de los textos medido sobre los
      píxeles reales de la pintura que quedan detrás, en el peor caso, a
      375 × 667, 390 × 844 y 430 × 932; capturas en reposo y scrolleadas.
      **Adelantado 2026-11-12, pedido de Bruno:** las tarjetas son un velo
      (`--velo`, 0,78 de noche a 0,85 de día; +0,15 en modo brasa) con un
      halo oscuro en las letras. Medido a 390 × 844 en el borde de las
      letras, con el fuego detrás (el peor caso): texto tenue entre 4,6 y
      5,8:1 (percentil 2), de día, al atardecer, de noche y en brasa. Con
      0,6 de velo daba 2,5:1. **Sigue sin resolver acá:** el pie de la
      lista ("Entre la siesta corta…") va suelto sobre el fuego y da 1:1.
      Las otras dos medidas de pantalla, pendientes.
      - a. **Hecho 2026-11-12 (sin el vidrio, que es el 16b).** Capturas en
        `docs/paso16.webp`: de noche en reposo, scrolleada y de día, a los
        tres tamaños.
        - *Layout.* El título y la bajada van arriba, sobre el cielo; lo
          que sigue arranca debajo de las piedras del fogón (y = 663 de la
          pintura, medido), así que en reposo se ven el gaucho, el fuego y
          la leña enteros. La pantalla se arma con la clase `con-pintura`,
          que se pone al abrir y no cuando llega la imagen: medido, la
          lista arranca en el mismo lugar (455 puntos a 390 × 844) antes y
          después de que aparezca la pintura. Si la imagen no llega, la
          clase se saca y vuelve la pantalla de siempre.
        - *Suelo extendido.* De la fila 860 para abajo la pintura es un
          solo color, `rgb(30,20,23)` (medido, sin variación). El canvas
          crece con ese color hasta el alto de la pantalla y toma el mayor
          alto visto para ese ancho, para no redibujarse cuando el iPhone
          esconde las barras al scrollear. Ya no hay difuminado abajo.
        - *Costo, a la vista:* a 375 × 667 en reposo se ven el título de la
          lista y tres horas; las recomendadas (4 a 6 ciclos) quedan abajo
          y hay que scrollear. A 390 × 844 se ve la primera recomendada.
        - *La lista es una sola tarjeta:* el título ("Si te dormís
          ahora…") y el pie van adentro, cada uno con el mismo velo que las
          filas. Sueltos, al pasar sobre el fuego medían 1,1 y 1,3:1. Lo
          mismo con el botón principal y la hora a mano: a 375 × 667 el
          texto de abajo del botón y el rótulo pasaban sobre el fuego con
          1,3:1.
        - *Detrás del título y la bajada,* una sombra suave que se cierra
          de día (`--luz-sol`, que pone la escena). Sin ella, la bajada
          medía 3,4:1 de noche (una estrella cae entre las letras) y 1,8:1
          de día.
        - *Luz del fuego en los bordes:* el borde de cada tarjeta que mira
          al fogón se calienta y la luz entra unos 14 píxeles, según la
          distancia al fuego, la fuerza del fuego y el mismo `titileo(t)`
          del resplandor (`luzDeBorde`, con tests). Va de a escalones de
          0,05: medido, cambia unas 10 veces por segundo. En modo brasa,
          apagada. **Mi lectura:** se nota sin llamar la atención; a
          revisar en el teléfono.
        - **Contraste medido** con `scripts/contraste.cjs` (queda en el
          repo para el 16b): percentil 2 en el borde de las letras, la
          peor posición de scroll, a 375 × 667, 390 × 844 y 430 × 932, de
          noche, al atardecer, de día y en brasa. Todo el texto chico da
          4,5:1 o más; lo más justo es "Poner alarma" en brasa (4,52) y
          la bajada de día a 375 (4,54). El título, que es letra grande
          (AA pide 3:1), da 4,36 de día. Con la escena quieta: el titileo
          mueve la luz hasta un 25% y eso no está medido.
        - **No hecho:** verlo en el iPhone de Bruno (que el canvas no
          salte al esconderse las barras, y que la sombra de la cabecera
          no se lea como una mancha de día).
        - **Medido:** 340 tests (8 nuevos), lint y build en verde; el
          chunk de la escena pasó de 29 a 31 kB (13,7 kB comprimido).
      - b. *Vidrio (pedido de Bruno, 2026-11-12).* Dos partes, en este
        orden y dentro del 16, porque el 16 mueve las tarjetas y hacerlo
        antes sería rehacerlo. Referencias revisadas (todas MIT): la guía
        de Bruno (`GUIA_LIQUID_GLASS`, no está en el repo),
        naplesblue/apple-design-skill (criterio), gentpan/liquidglass
        (mapa de desplazamiento y brillo de borde direccional),
        shuding/liquid-glass y nikdelvin/liquid-glass (solo referencia
        visual). No se instala ninguna librería.
        - **A. Vidrio CSS en los controles:** los dos botones de icono, el
          botón principal, los diálogos y el aviso. Borde fino luminoso,
          reflejo más fuerte del lado de la luz (arriba a la izquierda),
          sombra suave, poco desenfoque; estados normal, apretado, foco y
          deshabilitado; `prefers-reduced-transparency` y
          `prefers-contrast: more` dan superficie sólida. Variables en
          `tokens.css`, no un efecto distinto por botón. **No es
          refracción** y no se describe como tal. Verificación: capturas
          de cada estado de día y de noche, contraste AA del texto y los
          iconos, foco visible con teclado.
        - **B. Refracción propia en la lista, como prototipo:** la escena
          dobla los píxeles que quedan bajo el borde de cada tarjeta
          (franja de unos 8 a 12 px; el centro, plano), con
          desplazamiento en **píxeles enteros**, como el viento: vidrio
          viejo, no lente de iPhone. Se dibuja en `escena-pintada.js`
          leyendo la posición de las tarjetas en cada cuadro; sin WebGL.
          Encima, el borde de A. Verificación: en el iPhone de Bruno, el
          borde no tiembla al scrollear con inercia (riesgo no medido:
          en iOS el scroll puede ir un cuadro adelantado al canvas);
          cuadros por segundo con la CPU frenada 4 veces sin bajar del
          piso del paso 17; el contraste medido arriba no baja de 4,5:1.
          Si tiembla o desentona, la lista queda con el velo y el borde
          de A, y se anota acá.
        **Hechos que condicionan:** el filtro SVG en `backdrop-filter`
        (la técnica de shuding y nikdelvin) solo lo dibuja Chromium; en
        iPhone no se ve (según gentpan, que lo verificó; yo no lo
        repetí). Detrás de las tarjetas hay un canvas, no HTML, y por eso
        la refracción la tiene que hacer la escena. Medido hoy: el
        desenfoque no compra contraste (velo 0,7 con 6 px de desenfoque
        dio 3,2:1; velo 0,8 sin desenfoque, 4:1); el vidrio no deja bajar
        el velo. **Se aparta de Apple a propósito:** su criterio pone el
        vidrio en los controles y no en filas de contenido; la lista lo
        lleva porque acá ver el fuego detrás de las horas es la idea.
        **Estado 2026-11-12: A y B hechos; falta verlos en el iPhone de
        Bruno.** Capturas: `docs/paso16b.webp` (arriba, los estados de
        noche, de día y en brasa; abajo, la lista sobre el fuego con
        `?canto=0`, `0.45` y `0.8`).
        - *A.* Un solo vidrio en `tokens.css` (`--vidrio-*`): tinte,
          borde fino, reflejo de arriba a la izquierda, cantos (claro
          arriba a la izquierda, oscuro abajo a la derecha), sombra y
          3 px de desenfoque. Lo llevan los dos iconos, el botón
          principal y el aviso (en ámbar), y las hojas y el diálogo (casi
          opacos, 0,9). La barra de arriba de las hojas desenfoca lo que
          pasa por debajo. Apretado: el canto de arriba pasa a sombra y
          el botón baja un punto. Deshabilitado: sin reflejo ni color.
          El foco es el de siempre (`base.css`). Con menos transparencia
          o más contraste pedidos, superficies lisas y sin reflejo; en
          brasa, reflejo y cantos casi apagados. No dobla la luz y no se
          describe así.
        - *B.* La escena copia lo que ya dibujó y lo pega corrido en los
          8 puntos del borde de la lista (`tirasDeVidrio`, con tests):
          pegado al borde se ve lo que está unos píxeles más afuera, y
          el corrimiento se apaga hacia adentro. Píxeles enteros de la
          pintura, recortado a la forma redonda de la tarjeta. Para que
          se vea, el velo es más fino en el canto (0,38 menos) y adentro
          las dos capas suman el mismo `--velo` que antes, así que el
          texto no cambia. Mientras se scrollea la escena dibuja cada
          cuadro, no uno de cada dos, para que el canto no quede atrás
          de la lista. En brasa y con menos transparencia, sin canto.
          `?canto=0` lo apaga y `?canto=0.8` dobla casi el doble, para
          comparar.
        - **Mi lectura:** lo que se nota a tamaño de teléfono es el canto
          más claro, como el grueso de un vidrio. La refracción a 0,45 es
          sutil: se ve ampliando, en las vacas y el alambrado que cruzan
          el borde; a 0,8 se ve sin ampliar. Lo dejé en 0,45 porque más
          parece agua y no vidrio viejo; es de las cosas a decidir
          mirándolo en el teléfono.
        - **Medido:** contraste (`scripts/contraste.cjs`, los mismos 4
          casos y 3 tamaños): los mínimos no se movieron, "Poner alarma"
          en brasa 4,52 y la bajada de día a 375 4,54; los iconos sobre
          el vidrio, 5,6 o más. Cuadros por segundo con la CPU frenada 4
          veces (Chromium de escritorio, no un teléfono): quieta, 30 con
          y sin canto; scrolleando, 39 con canto y 46 sin él. 349 tests
          (9 nuevos), lint y build en verde; el chunk de la escena pasó
          de 31 a 32 kB (14,3 kB comprimido) y el CSS a 22,7 kB.
        - **Cierre (2026-11-12):** publicado (PR #12) y Bruno lo miró en
          su iPhone: "todo funciona bien". Con eso se dan por vistos el
          16a y el 16b en el teléfono. **Lo que sigue abierto:** el OK no
          dice nada específico del temblor del canto, del canvas al
          esconderse las barras ni del valor de `?canto`, así que el
          corrimiento queda en 0,45 y el temblor se mide con grabación
          en el paso 17.
- [ ] 17. **QA.** Lighthouse ≥ 90 de performance y 100 de accesibilidad;
      cuadros por segundo con la CPU frenada 4 veces (meta: sostener 30;
      piso aceptable, propuesto: 24); peso total de la escena contra el
      presupuesto del paso 12d; sin temblor de píxeles en una grabación de
      10 segundos a 3 px por punto y a 2 px por punto — verificación: los
      números y las grabaciones. Si hay temblor, escalar por un número
      entero.
- [ ] 18. **README y `docs/proceso.md`:** el capítulo de cómo los datos
      reales destaparon lo que los tests no veían; el de cómo un prototipo
      3D de peso alto se probó, se rechazó y se reemplazó por una pintura
      que cuesta menos código; y qué se tomó de otros proyectos. El README
      dice que la pintura la generó una IA y apunta al prompt. Actualizar
      la descripción de la escena en el README, que todavía habla de
      sprites escritos como texto.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Lo que se suma sobre la pintura (variantes de hora, leños, cielo) no se lee o desentona, como pasó con el recado y la tormenta. | Prueba de lectura con alguien que no la vio en los pasos 14d y 15b. Lo que desentona se saca y la escena sigue con lo que sí funciona. |
| Un toque más en la memoria baja la cobertura (la lección de la v1). | Hipótesis: un toque no la mueve. Se verifica con el backup del mes que viene: la cobertura tiene que seguir arriba del 70%. Si cae, la segunda pregunta se vuelve opcional. |
| La acción de alarma de Atajos no recibe la hora. | Fecha ISO y paso por la acción "Fecha"; si igual falla, plan B: copiar la hora. Se sabe en tu primera prueba. |
| Las pinturas pesan: la de noche son 567 kB (medido) y con atardecer y día serían unos 1,7 MB (suma estimada). | Formato más chico (12d), carga diferida, respaldo 2D, piso de Lighthouse de 90 medido en el 17. El service worker las guarda en el cache al primer pedido, así que después andan sin conexión. |
| Gemini no devuelve "la misma imagen": al pedir cielo liso o una hora distinta, se mueve algo. | Se pide sobre la imagen adjunta y un script mide cuánto cambió fuera del cielo. Tres intentos y se cae al plan B del 12b o al tinte. |
| Una pintura nueva no llega a un teléfono que ya guardó la vieja, porque el service worker responde del cache primero. | Nombre con hash: la pintura se importa desde `src/`, no se sirve desde `public/`. Se verifica en `dist/`. |
| Los píxeles tiemblan: la pintura se agranda un número no entero de veces y algunos píxeles salen más anchos que otros. | El viento ya se redondea a píxeles enteros (probado a ojo en la prueba). El paso 17 graba a 2 y a 3 px por punto; si hay temblor, escalar por un entero. Hipótesis: no se midió en teléfono. |
| La pintura no entra en pantalla: llenar un iPhone 13 recortaría unos 50 px por lado y se llevaría el poncho y el anca del caballo. | Ancho completo y suelo extendido hacia abajo (paso 16); se verifica a tres tamaños. |
| Batería y calor a la noche. | 30 cuadros como techo, pausa en segundo plano, quieta en modo brasa, un solo canvas de 572 × 1024. |
| En un viaje, el cielo queda en la ciudad de referencia de la zona y no donde estás (Christchurch está unos 750 km al sur de Auckland). | La diferencia es de minutos en el atardecer; quien quiera exactitud toca **Usar mi ubicación**. |
| Una noche que cruza el vuelo queda absurda. | La duración por marcas de tiempo y el techo de 16 horas ya la frenan; la noche queda como hueco cargable. |
| Imagen generada por IA en un repo público. No verifiqué los términos de uso de Gemini sobre las imágenes que genera. | Bruno los revisa antes de publicar; el README dice que la pintura es generada y enlaza el prompt. |
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
6. Salí a mirar el cielo hacia el sur y compará. Esperado: si la luna está
   sobre el horizonte, tiene la misma fase; si no salió, la escena no la
   muestra. Si la Cruz del Sur está alta, en la escena también.
7. Mostrale una captura de la escena a alguien y pedile que diga qué ve.
   Esperado: nombra cada cosa sin ayuda.
8. Tocá ☾. Esperado: la escena se queda quieta y se apaga.
9. Mirá la escena un minuto en el teléfono. Esperado: el viento y la llama
   se mueven sin que ningún píxel tiemble ni parpadee. Esto no se puede
   verificar bien en Chromium: depende de la pantalla.

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

- 2026-11-10 — **Etapa A hecha.** 219 tests (los 132 originales sin
  modificar), lint y build limpios, Lighthouse 99 / 100 / 100 en la
  pantalla principal, recorridos con Playwright en iPhone 13 y en 375 px.
  Desvíos y hallazgos:
  - **"Olvidada" es el camino normal, no una rareza.** Una noche abierta a
    las 23:30 pasa las 16 horas a las 15:30 del día siguiente, y la app se
    abre recién de noche. Por eso la tarjeta ofrece las mismas horas para
    elegir en `confirm` y en `stale`; cambia solo el texto.
  - **`askShapeFor` no se tocó:** sus tests fijan que una noche abierta de
    otra fecha da `recall`. La noche olvidada va en `askShapeWithStale`.
  - **Un backup con un registro de más de 16 horas se rechaza entero**, como
    dice el paso 2. El backup real del 8-nov trae el de 1410 minutos, así
    que no se puede importar tal cual: hay que hacer primero la limpieza
    manual 1 (borrar las tres noches) y volver a exportar. La app lo dice:
    *Hay una noche de más de 16 horas en ese archivo. No se tocó nada.*
  - **La zona horaria no es un nombre único.** Chromium devuelve
    `America/Cordoba` donde el plan escribe `America/Argentina/Cordoba`
    (el mismo huso, con el nombre viejo). El paso 14 tiene que tratar los
    alias (`America/Cordoba`, `America/Buenos_Aires`, `America/Argentina/*`)
    como Argentina antes de buscar la ciudad de referencia.
  - **Los huecos incluyen las noches salteadas** con "No la anoto": siguen
    siendo noches sin anotar y se pueden cargar después.
  - **Sin verificar todavía, y solo vos podés:** que el atajo cree la
    alarma en un iPhone (verificación manual 4). La hoja de la app lo dice
    con esas palabras; sacar esa línea cuando se pruebe.

- 2026-11-11 — **La escena pasa de HD-2D con three.js a una pintura animada
  por código.** Bruno vio el prototipo 3D del paso 12 y lo rechazó: los
  sprites escritos como texto, de unos 30 píxeles, no dan para anatomía ni
  detalle. Mostró referencias de pixel art pintado con IA. La prueba
  (`escena-pintada.html`, PR 8 y 9: una pintura de Gemini y el código solo
  la anima) se tomó como aprobada cuando Bruno pidió reescribir la Etapa B.
  **Supuesto declarado sin preguntar:** pedir la reescritura es el OK. Se
  descartan three.js (se desinstala) y el prototipo 3D; el enfoque A del
  plan queda como historia. El criterio dominante del plan anterior
  (mantenible orquestando IA) eligió three.js y no vio que el límite era la
  fuente del dibujo; ahora manda la calidad del dibujo.
- 2026-11-11 — **El cielo real depende de una segunda pintura.** La de
  noche trae luna y estrellas pintadas. Para que el código ponga las de esa
  noche hace falta la misma imagen con el cielo liso. El plan sigue con la
  luna y las estrellas reales (decisión del 8-nov), con plan B si Gemini no
  la da: cielo pintado y sin luna real. La estrella real fue un agregado sin
  preguntar; la luna real, no.
- 2026-11-11 — **La luna queda en un lugar fijo, con fase real, y solo
  aparece si está sobre el horizonte.** Mirando al sur, que es donde está
  la Cruz del Sur, la luna rara vez cae en cuadro (inferencia, no
  calculada), así que la posición real no se puede mostrar. Supuesto
  declarado: la escena mira al sur.
- 2026-11-11 — **Atardecer y día quedan condicionados.** La prueba solo
  tiene la pintura de noche. Variantes de Gemini o tinte según el paso 14d;
  si ninguna se lee, queda la escena 2D de hoy. El orden de esfuerzo es
  noche, atardecer, día.
- 2026-11-11 — **Los leños por ciclo y el fuego consumido pasan a ser
  condicionales**, como pedía `docs/escena-pintada.md`: sprites sueltos
  sobre la pintura, o se descartan. La llama pintada solo se probó entre
  0,94 y 1,05 de escala.
- 2026-11-11 — **La pintura se importa desde `src/` y no se sirve desde
  `public/`.** El service worker es cache-first para todo lo que no sea la
  navegación; con nombre fijo, una pintura nueva no llegaría a quien ya
  guardó la vieja.
- 2026-11-11 — **Ajuste por ancho y suelo extendido, no "cubrir".** Cubrir
  recortaría unos 50 px por lado en un iPhone 13 y se llevaría el poncho y
  el anca del caballo. Las tarjetas suben sobre la escena fija: la cámara
  no se mueve.
- 2026-11-12 — **El tinte queda para día, atardecer y amanecer** (paso
  14d), con el OK de Bruno y sin la prueba de lectura con alguien que no
  la vio.
- 2026-11-12 — **Las tarjetas dejan ver la escena** con un velo medido
  contra el fuego, y **el vidrio entra en el 16b**: CSS en los controles
  (A) y refracción propia en píxeles enteros sobre la lista, como
  prototipo (B). Descartado: librerías de vidrio (no andan sobre un
  canvas en iPhone o suman WebGL y 93 kB).
- 2026-11-12 — **El fuego se achica separando la llama del fondo**
  (paso 15a), no con una pintura de brasas aparte. **Con una noche en
  curso, la leña cuenta los ciclos que faltan** (15b), decisión mía que
  el plan no pedía.
- 2026-11-12 — **El vidrio de la lista dobla en el canto y el velo se
  afina ahí** (16b B): sin afinar el velo, la refracción quedaba debajo
  de 0,78 de oscuro y no se veía. Corrimiento en 0,45 del canto,
  decisión mía a revisar en el teléfono.

---

## Cómo retomar en una sesión nueva

Este archivo es el traspaso: alcanza para arrancar sin la conversación que
lo armó. Orden de lectura: este plan, la skill de voz
(`.claude/skills/voz/SKILL.md`) para cualquier texto visible, y después
el paso 0. La Etapa A va en su propio PR. La Etapa B, en otro: empezar por
`docs/escena-pintada.md` y `escena-pintada.html` (las medidas de la
pintura), y no seguir del paso 12 hasta el OK de Bruno a la pintura de
cielo liso.

**Modelo por etapa** (ver `CLAUDE.md`): la Etapa A, hecha con Sonnet 5.5.
La Etapa B, reescrita, se parte en dos sesiones. Pasos 12 a 14 con Sonnet
5.5: tienen plan detallado y una verificación numérica por paso (el 12
arranca con Bruno generando imágenes en Gemini). Pasos 15 a 17 con Opus
5.5: dependen de criterio visual (leños, layout, contraste, lectura). El
18 con Sonnet 5.5. Al cerrar cada tramo, la sesión le avisa a Bruno con
qué modelo conviene abrir el siguiente.
