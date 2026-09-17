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

## Las reglas del repo

En [`.claude/skills/voz/`](../.claude/skills/voz/SKILL.md) están escritas
las reglas de escritura de la app: qué registro usar, qué vocabulario
está prohibido y por qué, cómo se escriben los errores y los números.
Existe para que una sesión futura no vuelva a escribir la app en un
idioma que su autor no habla.
