---
name: voz
description: Cómo se escribe el texto de esta app — etiquetas, prosa, mensajes de error, README y comentarios de código. Usar SIEMPRE que se escriba o edite cualquier texto visible de "A la Luz del Fogón", incluido el de la página informativa y los estados vacíos.
---

# La voz de A la Luz del Fogón

Esta app ya se escribió mal una vez. La v1 usaba vocabulario de la
literatura gauchesca del siglo XIX —_pilchas, baqueteado, al pago,
tranco, recuento de 30 lunas, últimos 7 soles, la tropa, rearmá el
cuero_— y el propio autor reportó que no lo entendía. Era lenguaje de
libro de escuela, no de alguien contando cómo durmió.

Esta skill existe para que eso no vuelva a pasar.

## La regla

> **Etiquetas planas. Prosa con voz.**

Son dos registros distintos según el lugar, y confundirlos es el error.

**Etiquetas planas.** Todo lo que sea una acción o un dato se nombra con
la palabra más común que exista. Cero ambigüedad, cero diccionario. Un
botón no es lugar para lucirse: si alguien tiene que pensar qué significa
una etiqueta, la etiqueta está mal.

**Prosa con voz.** El carácter vive donde no hay nada que interpretar:
subtítulos, estados vacíos, el resumen de una noche cerrada, la página
informativa, el README. Ahí la personalidad no cuesta comprensión, y es
donde de verdad se recuerda.

## Cómo suena

Voseo rioplatense de todos los días. Directo, sin solemnidad y sin
signos de exclamación. El campo entra como **imagen** —fogón, noche,
madrugada, monte— y nunca como vocabulario de época.

Bien:

- _Los ciclos duran noventa minutos. Conviene despertarse cuando uno
  termina, no en el medio._
- _Dormiste 7h 20m. Cinco vueltas completas._
- _Acá se van a ir juntando las noches. Todavía no hay ninguna._
- _Entre la siesta corta y un ciclo entero no conviene: te agarra en lo
  más hondo del sueño y te levantás peor que antes._

Mal:

- _¡Quedó marcado en el cuaderno!_ — el signo de exclamación le pone una
  emoción que nadie siente al anotar una hora.
- _Rearmá el cuero_ — vocabulario de época; nadie dice eso.
- _Registro de sesión de descanso_ — neutro de manual; la app tiene autor.
- _Tu tranco de sueño_ — "tranco" no se entiende sin explicación.

## Tabla de equivalencias

Estas son las que ya se corrigieron. Sirven de calibre.

| No                                           | Sí                          |
| -------------------------------------------- | --------------------------- |
| Me voy a las pilchas a las                   | Me voy a dormir             |
| Marcar el Rumbo                              | Poné el despertador a las   |
| Tu tranco de sueño                           | Cuánto dura tu ciclo        |
| Minutos hasta que se me cierren los ojos     | Cuánto tardás en dormirte   |
| Cuaderno de Ruta / Recuento de 30 Lunas      | El cuaderno                 |
| Últimos 7 soles                              | Tus últimas noches          |
| A la Sombra del Ombú                         | Siesta corta / Siesta larga |
| Borrar el Rastro                             | Borrar todo                 |
| ¡Decime a qué hora, que si no ando a ciegas! | Falta la hora               |

## Errores

Un mensaje de error dice qué falta y nada más. No se disculpa, no hace
chistes y no le habla al usuario como si se hubiera equivocado: _Falta la
hora._ _Ese archivo no es un JSON válido._ _No pude cerrar esa noche._

## Números

Las horas van como `7h 20m`, y se omite la parte que vale cero: `45m`,
`6h`. Nunca `7h 0m`. Las horas de reloj van en 24 horas, `06:10`.

## Honestidad

La app afirma que despertarse al final de un ciclo reduce la inercia del
sueño. **Eso tiene buen respaldo pero no es un hecho cerrado**, y la
página informativa lo dice con esas palabras. No se vende la premisa como
una certeza, ni acá ni en el README ni en ningún texto nuevo. Si se
agrega una afirmación sobre el sueño, va con fuente.

Lo mismo con los datos: cuando la app no sabe algo, lo dice. Una noche
respondida de memoria se muestra como _Anotada de memoria, sin horario_,
y no con un horario inventado que parezca real.

## Comentarios de código

Van en español y explican el **por qué**, no el qué. El qué ya lo dice el
código. Sirve especialmente dejar anotado lo que se probó y no funcionó:
este repo tiene varios comentarios de ese tipo y son los más útiles para
volver en seis meses.
