# La escena pintada — prueba y traspaso

Bruno vio el prototipo 3D del paso 12 (`escena-prototipo.html`,
`docs/escena3d-prototipo.png`) y lo rechazó: los sprites escritos como
texto, de unos 30 píxeles, no dan para anatomía ni detalle. Las
referencias que mostró son pinturas con estética de píxel generadas con
IA. La conclusión: el límite es la fuente del dibujo, no el motor.

**Lo que se prueba ahora, antes de tocar `PLAN-v3.md`:** una pintura
generada (Bruno la hace en Gemini) y el código solo la anima.

## Paso 1 — Bruno genera la imagen

Pegar este prompt en Gemini. Guardar el resultado como
`public/escena/noche.png` (o subirlo a la conversación).

```json
{
  "subject": {
    "description": "Un gaucho argentino adulto sentado en el suelo junto a un fogón, visto de tres cuartos de espaldas: sombrero de ala ancha de fieltro, poncho de lana rojo oscuro con guardas, bombacha de campo, botas de cuero, un mate de calabaza con bombilla en la mano. A su derecha, un caballo criollo zaino de pie, ensillado con recado, atado con un cabestro a un palenque de madera. Proporciones anatómicas correctas en el hombre y en el caballo.",
    "pose_or_action": "El gaucho sentado con las piernas cruzadas, quieto, mirando el fuego. El caballo descansa con una pata trasera floja y la cabeza baja.",
    "expression_or_detail": "El fogón: leños apoyados en pirámide dentro de un círculo de piedras, llama mediana, una pava negra de hierro al costado. La luz naranja del fuego recorta el borde del gaucho y el flanco del caballo."
  },
  "scene": {
    "setting": "Un claro en el monte chaqueño del norte argentino: suelo de tierra seca con pasto ralo, un alambrado de cinco hilos con postes de quebracho que se aleja en diagonal, tres vacas criollas echadas en la penumbra detrás del alambrado, y al fondo el monte cerrado de quebrachos, algarrobos, palos borrachos de tronco panzón y cardones",
    "time_of_day": "Noche cerrada, cerca de la medianoche",
    "weather": "Despejado, sin viento, una bruma baja muy leve entre los árboles",
    "season": "Invierno seco"
  },
  "composition": {
    "framing": "Vertical de pantalla completa de celular. El fogón y el gaucho en la franja central (entre el 50% y el 65% de la altura). El tercio superior es cielo. El tercio inferior es solo suelo oscuro y tranquilo, sin objetos importantes, porque va a quedar tapado por texto.",
    "camera_angle": "Vista levemente elevada, como desde tres metros de altura, mirando hacia el monte",
    "focal_point": "La llama del fogón",
    "rule_of_thirds_notes": "Gaucho a la izquierda del fuego, caballo y palenque a la derecha, alambrado saliendo por el borde derecho hacia el fondo. La luna en el cuadrante superior izquierdo."
  },
  "camera": {
    "lens_mm": "",
    "aperture": "",
    "depth_of_field": "Todo en foco, sin desenfoque",
    "shutter_speed_effect": "",
    "film_or_sensor_look": ""
  },
  "lighting": {
    "type": "Luz de fuego como única fuente cálida, más luz de luna tenue y fría",
    "direction": "El fuego ilumina desde el centro hacia afuera y se apaga rápido; la luna desde arriba a la izquierda",
    "color_temperature": "Naranja cálido en el círculo del fuego, azul frío en todo lo demás",
    "quality": "Contrastada, con sombras largas que se alejan del fuego, nunca negro puro"
  },
  "color_palette": ["azul noche #0b1220", "azul pizarra #1b2a3d", "naranja fuego #e0701c", "ámbar #ffb640", "rojo poncho #8a2f1f", "ocre tierra #6d5f45", "verde monte seco #3a4530", "crema luna #e8dcc4"],
  "style": {
    "medium": "pixel art detallado y pictórico, de alta densidad de píxeles, con dithering, grilla de píxeles nítida y pareja, paleta limitada",
    "influences": "Fondos de aventuras gráficas de los 90 al estilo de Mark Ferrari, pixel art de paisaje contemporáneo",
    "post_processing": "Sin suavizado, sin degradés lisos, sin desenfoque, sin viñeta"
  },
  "mood_atmosphere": "Quieto, silencioso, íntimo. La calma de alguien que se queda mirando el fuego antes de dormir.",
  "background_environment": "Cielo nocturno limpio con estrellas, la Cruz del Sur visible, luna en cuarto creciente. Monte en tres planos de profundidad, cada plano más azulado y claro que el anterior.",
  "wardrobe_props_details": ["sombrero de fieltro de ala ancha", "poncho rojo con guardas", "bombacha y botas de cuero", "mate de calabaza con bombilla", "pava de hierro", "recado criollo con cojinillo de oveja", "palenque de madera", "alambrado de cinco hilos con postes de quebracho y varillas"],
  "textures_and_materials": ["corteza rugosa", "lana tejida", "cuero gastado", "piedra", "tierra seca", "pelo corto de caballo"],
  "aspect_ratio": "9:16",
  "negative_prompt": "texto, letras, marca de agua, firma, borde, marco, interfaz, fotorrealismo, render 3D, estilo anime, píxeles borrosos, suavizado, anatomía deformada, patas de más, vestimenta de cowboy norteamericano, sombrero texano, cactus saguaro, montañas, nieve, edificios"
}
```

Si sale bien, pedirle a Gemini dos variantes **sobre esa misma imagen**
(adjuntándola): *"la misma escena exacta, mismo encuadre, al atardecer"* y
*"...de día a pleno sol, con el fuego apagado y solo brasas"*. Guardarlas
como `atardecer.png` y `dia.png`. Si la composición cambia entre las
tres, alcanza con la de noche: el resto se resuelve tiñendo.

## Paso 2 — sesión nueva (Sonnet 5.5 alcanza)

Decirle: *"Leé `docs/escena-pintada.md` y hacé el paso 2"*.

Qué tiene que hacer esa sesión:

1. Leer la imagen y ubicar, en píxeles, dónde están la llama, el gaucho,
   el caballo, las copas del monte y el pasto.
2. Armar `escena-pintada.html` (página suelta, fuera del build, como
   `escena-prototipo.html`) que muestre la pintura a pantalla completa en
   tamaño iPhone, con `image-rendering: pixelated`, y encima, en un
   canvas:
   - llama animada sobre la llama pintada, en 3 o 4 cuadros;
   - titileo de la luz: un resplandor cálido en escalones alrededor del
     fuego, que sube y baja;
   - brasas que suben y humo;
   - viento: un shader que corre unos pocos píxeles las copas y el pasto
     según una máscara, con el desplazamiento redondeado a píxeles
     enteros para que no tiemble;
   - titilar de dos o tres estrellas.
   Todo quieto con movimiento reducido y a 30 cuadros como techo.
3. Sin three.js: para componer capas 2D alcanza un canvas 2D o un shader
   chico. Si la prueba se aprueba, three.js se desinstala.
4. Capturar con Playwright (ver cómo se hizo en el paso 12: Chromium con
   `--use-angle=swiftshader`) y grabar 5 segundos para mostrarle a Bruno.
5. No tocar la app ni `PLAN-v3.md`. Frenar y pedir el OK.

## Si la prueba se aprueba

Reescribir la Etapa B de `PLAN-v3.md`. Lo que cambia respecto del plan:

- El enfoque A (three.js) se descarta; el prototipo 3D se borra.
- El cielo real (paso 14) sigue siendo posible si la pintura se genera
  con el cielo liso y las estrellas y la luna las dibuja el código.
- Los leños por ciclo (paso 15) pasan a ser sprites sueltos sobre la
  pintura, o se descartan.
- El peso sube: cada pintura son cientos de kB. Hay que medirlo contra
  el piso de Lighthouse de 90.
- Personajes animados (cola del caballo, el mate): solo si un generador
  especializado mantiene al personaje igual entre cuadros. No verificado.
