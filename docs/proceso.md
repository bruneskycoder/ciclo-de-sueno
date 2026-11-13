# Cómo se construyó esto

Este documento es el que explica de dónde salió la app. No es un registro
de commits: es el relato de cómo se trabajó, qué se decidió y qué se
equivocó, escrito para alguien que llega de afuera.

Vale la advertencia de entrada: **el autor no programa.** La app está
escrita orquestando un agente de IA (Claude Code), y lo interesante del
proyecto no es que la IA escribiera código, sino cómo se dirigió.

## El proceso

No se arrancó por el código. Se arrancó por entender qué había que
construir, y eso cambió tres veces.

**1. Leer lo que ya existía.** La v1 eran cuatro pantallas, diez campos
de formulario, 64 tests y una PWA funcionando. Antes de proponer nada, el
agente leyó el repo entero: qué módulos había, qué convenciones seguía,
qué decisiones estaban ya tomadas y documentadas.

**2. Entrevistar antes de planificar.** Tres rondas de preguntas cerradas
sobre alcance, destinatario, identidad y tono. Las rondas están en el
historial de la conversación, pero lo que importa es que **cada una
corrigió algo de la anterior**.

**3. Escribir el plan antes del código.** [`PLAN.md`](../PLAN.md) tiene
el objetivo, lo que queda explícitamente fuera de alcance, los supuestos
declarados como supuestos, los pasos con su forma de verificación, los
riesgos, y un registro de decisiones y desvíos que se fue llenando
durante la ejecución.

**4. Ejecutar por pasos verificables**, con un checkpoint obligado antes
de dar la identidad visual por buena.

## Las tres veces que el plan estaba mal

Esto es la parte útil. Un proyecto donde la IA acierta de entrada no
enseña nada.

### Primera: se optimizó lo que no había que optimizar

El pedido original fue "más simple y minimalista". El primer plan
recortaba pantallas, campos, identidad visual y lenguaje.

Estaba mal, y lo destapó una pregunta de la entrevista: **la app se usa
una o dos veces por día, y además se muestra con orgullo.** Tiene un
segundo trabajo —ser memorable— que el plan no contemplaba. Una app
mínima y gris sirve para el primer trabajo y arruina el segundo.

El principio que resolvió la contradicción:

> El recorte va sobre la **fricción**. La ambición va sobre la
> **expresión**.

Campos, pantallas y toques: se podan a fondo. Identidad y prosa: se
invierte. Tratados como una sola variable se contradicen; separados, no.

### Segunda: el diagnóstico del registro abandonado

La v1 tenía un registro de sueño que el autor no usaba. El agente
concluyó que el problema era la cantidad de campos, y diseñó una versión
de dos toques.

Después llegó el dato real: el backup exportado tenía **un solo
registro**, creado el mismo día en que se terminó de construir la
función. O sea, una prueba de la feature: cero usos reales.

Y el autor aportó el diagnóstico que faltaba: **el problema no era cuánto
pedía el formulario, era el momento.** El diseño apoyaba el segundo toque
a la mañana siguiente, y a la mañana la app no se abre. Se abre de noche,
a consultar.

La captura se mudó a ese momento: al entrar, una tarjeta pregunta por
anoche. Aprovecha una visita que ya iba a ocurrir en vez de pedir una
nueva.

### Tercera: el dibujo que no se entendía

La cabecera es una escena de pixel art. El autor reportó que no se
entendían algunas cosas.

La causa no era falta de detalle sino **falta de lugar**: la escena eran
120×52 píxeles y el gaucho ocupaba 20×18. En ese espacio no entra un
brazo, ni una bota. Se subió a 160×72 y se redibujó todo.

Aún así hubo que sacar cosas: un mate que no se leía —y cuyo brazo salía
del cuerpo como un palo— y una tormenta con refusilos que agregaba
complejidad sin agregar claridad. El fogón necesitó cuatro intentos, y
los tres primeros están documentados en `escena.js` con el motivo de cada
fracaso, porque son errores de dibujo bastante generales.

## Qué hizo el agente que vale copiar

**Verificar mirando la app corriendo, no solo los tests.** Los tests son
de lógica pura y no pueden ver CSS. El bug más grave del rediseño se
encontró mirando una captura: la tarjeta que pregunta por anoche se le
mostraba a un desconocido en su primera visita, justo lo que el código
tiene prohibido y lo que los tests verifican. La lógica estaba bien; el
CSS la traicionaba, porque `hidden` pierde por especificidad contra una
regla de clase.

**Medir en vez de mirar a ojo.** El modo brasa, en su primera versión,
"parecía" apagado pero el botón principal seguía siendo una losa de
ámbar. Se midió la luminancia relativa de ese botón: pasó de 0.66 a
0.014. Eso es un número, no una impresión.

**Verificar que lo que no debía cambiar no cambió.** El plan prometía que
las 64 pruebas originales quedaban intactas. Prettier les reformateó
líneas largas, y el diff mostraba 24 borrados que podían tapar un cambio
real. Se comparó el archivo viejo contra el nuevo normalizando espacios y
comas finales, para probar que las 64 estaban palabra por palabra.

**Anotar lo que se probó y no quedó.** `PLAN.md` tiene entradas marcadas
como revertidas. En seis meses eso vale tanto como el registro de lo que
sí quedó.

## Lo que salió mal del lado del agente

Por honestidad, porque también es parte del ejemplo:

- Dos veces se le colaron caracteres cirílicos en el código, una de ellas
  dentro de un color hexadecimal, que rompía. Se agregó un chequeo que
  escanea alfabetos que no tienen nada que hacer en este repo.
- Hubo un tramo en que sus scripts de edición imprimían "listo" antes de
  escribir el archivo. Cuando uno fallaba a mitad, los mensajes de éxito
  eran de cambios que se descartaban: una corrección se "hizo" dos veces
  sin existir. Se pasó a verificar leyendo el archivo de vuelta del disco.
- En la v3, para chequear el formato de unos archivos guardó los cambios
  a un costado (`git stash`) mientras otra medición leía esos mismos
  archivos de un servidor en marcha. La medición se cayó a mitad de
  camino. No hizo daño porque se cayó; si hubiera terminado, habría
  medido una versión que no era. Se repitió sin tocar nada mientras
  corría.

## La versión 3

La v2 salió, se usó dos meses y dejó un backup. La v3 arrancó leyendo ese
archivo antes que el código, y el plan está en
[`PLAN-v3.md`](../PLAN-v3.md).

### Los datos reales vieron lo que los tests no veían

La v2 tenía 132 tests en verde. El backup del 8 de noviembre tenía 44
noches, y dos eran imposibles: una de **23 horas y media** (16 ciclos) y
una siesta de 22 minutos que había sido una noche entera.

La causa se encontró leyendo los ids, que son la hora de creación: esas
noches se habían cerrado 13 días y 2 días después de abiertas. La cuenta
de la duración restaba horas de reloj y no podía saber que habían pasado
días. Había una función que detectaba justo eso, una noche olvidada,
con sus tests y todo, pero ninguna pantalla la llamaba. Cada pieza
pasaba sus pruebas; el camino entero, no.

Y había un daño de arrastre. Mientras esa noche estuvo abierta, el botón
decía "Ya me levanté" y no había forma de marcar "Me voy a dormir": las
ocho noches siguientes se anotaron de memoria, sin horario.

El backup también desarmó dos cosas que se daban por ciertas:

- **"Fue así" no medía nada.** De 13 noches con horario, 12 eran
  exactamente el plan: noventa minutos por ciclo más los veinte de
  dormirse. Confirmar copiaba la intención. Ahora la confirmación ofrece
  horas alrededor de la planeada, para elegir la que fue.
- **La frase libre se había apagado.** Siete notas, todas en las primeras
  dos semanas, y cuatro de ellas corregían datos que el formulario no
  dejaba cargar: "me costó dormirme", "me desperté antes". Esas cosas
  pasaron a ser motivos de un toque.

Y una que la v2 apostó y acertó: **0 de 44 noches se anotaron entre las 5
y las 12 del mediodía.** Preguntar por anoche al entrar de noche, en vez
de pedirlo a la mañana, subió la cobertura de cero usos reales al 77%.

La lección es la misma de la v2, más grande: los tests prueban lo que uno
pensó. Los datos de alguien usando la app prueban lo que pasa.

### Un 3D que se probó, se rechazó y se reemplazó

El plan de la escena pedía un mundo en 3D con three.js, personajes de
unos 30 píxeles escritos como texto y una cámara quieta, con todo el
fundamento técnico en regla: cámara ortográfica alineada a la grilla, luz
en escalones, sombras de color. El criterio que lo eligió fue "que se
pueda mantener orquestando IA sin leer código".

Se armó un prototipo y el autor lo rechazó. Los personajes de texto no
daban para un brazo, un poncho o la anatomía de un caballo: era el mismo
problema de la v2 con más maquinaria encima, y 133 kB comprimidos más de
librería. El criterio estaba mal puesto: miraba el motor, y lo que
limitaba era **de dónde salía el dibujo.**

Lo que lo reemplazó salió de unas referencias que mostró el autor: pixel art
pintado con IA. Una sola pintura generada en Gemini, de 572 × 1024, y el
código animando encima sin librerías:

- La llama se deforma a partir de la pintada; no se dibuja otra que
  desentone.
- El viento corre copas y pasto de a píxeles enteros.
- Gemini rehízo la pintura con el cielo vacío, y el código pone las
  estrellas reales de esa noche y la luna con su fase.
- El fuego se consume con la noche en curso.

Se desinstaló three.js. La pintura pasó de un PNG de 567 kB a un WebP
de 84 kB que a ojo no se distingue.

Lo que no funcionó también quedó anotado. Una pila de leños que contaba
los ciclos al lado del fogón se hizo, se vio en el teléfono y se sacó: la
cantidad ya estaba en la lista. Y un primer intento de los leños, más
chicos, se leía como cajitas.

### Qué se tomó de otros proyectos

Antes de diseñar se leyeron código y documentación de proyectos que
resuelven bien partes de esto. Lo que quedó:

- **suncalc** (Agafonkin): la altura del sol y la fase de la luna, 3 kB
  comprimidos, en vez de escribir una función propia.
- **d3-celestial**: los datos de las estrellas más brillantes, para que
  el cielo sea el de esa noche. La librería no: con unas cien estrellas
  alcanza.
- **El ejemplo de pixel art de three.js** y el paper **Texel Splatting**:
  la luz que sube y baja en escalones y el movimiento redondeado a
  píxeles enteros. Del 3D no sobrevivió nada más; estas dos ideas sí.
- **folio-2025** de Bruno Simon: el día como un juego de números por
  momento (día, atardecer, noche, amanecer), que se afina tocando
  números y no código. Lo heredó el tinte de la pintura.
- **Jet lag social** (Wittmann, Roenneberg y otros, 2006): para comparar
  la semana con el fin de semana ya existe una medida establecida, y se
  usa esa en vez de inventar una.
- **Consensus Sleep Diary** (Carney y otros, 2012): los motivos de un
  toque siguen los conceptos del diario de sueño estándar. El
  instrumento no se copia: su uso está restringido.
- **Loop Habit Tracker**: una métrica que perdona los huecos. No hay
  rachas, porque los huecos de esta app son los viernes y sábados.
- **Liquid glass** (gentpan, shuding, nikdelvin, todos MIT) para el
  vidrio de los controles: se leyó cómo lo hacen y no se instaló
  ninguno. El filtro que usan dos de ellos lo dibuja solo Chrome, según
  verificó el tercero, y detrás de las tarjetas hay un canvas, no una
  página. El canto que dobla la escena detrás de la lista lo hace la
  propia escena. Del tercero quedó la idea del brillo más fuerte en el
  borde que mira a la luz.

### Medir antes de dar algo por hecho

En el último tramo, la prueba de calidad encontró un error que la
medición anterior había dejado pasar. Lighthouse daba entre 72 y 77 de
rendimiento, y no por el peso: la lista aparecía arriba y enseguida bajaba para dejar
ver el fuego. El paso anterior había medido ese lugar **después** de
cargar, y ahí la lista estaba bien. Lo que se movía era el primer
instante. Arreglado, dio entre 94 y 99.

## Las reglas del repo

En [`.claude/skills/voz/`](../.claude/skills/voz/SKILL.md) están escritas
las reglas de escritura de la app: qué registro usar, qué vocabulario
está prohibido y por qué, cómo se escriben los errores y los números.
Existe para que una sesión futura no vuelva a escribir la app en un
idioma que su autor no habla.
