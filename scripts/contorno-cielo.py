"""Mide, para cada columna de la pintura, la fila donde termina el cielo.

Sirve para que las estrellas (paso 14c del plan) no se dibujen delante de
los árboles, del cardón ni de la bruma del horizonte.

Uso (hace falta Pillow: `pip install pillow`):
    python3 scripts/contorno-cielo.py public/escena/noche.png salida.json [overlay.png]

Cómo decide: por encima de la fila 150 el cielo es casi liso, así que se
toma como "color de cielo" la mediana de cada fila. Desde ahí hacia abajo,
el contorno es la primera fila donde tres seguidas se alejan más de
UMBRAL de ese color. Se empieza en la fila 150 porque las estrellas y la
luna pintadas están todas más arriba y, si no, cortarían la columna.
Se corre sobre la pintura de cielo liso apenas esté; con la de hoy sirve
como prueba.
"""
import json
import statistics
import sys

from PIL import Image

DESDE = 150
UMBRAL = 14
SEGUIDAS = 3


def contorno(img):
    ancho, alto = img.size
    px = img.load()
    cielo = []
    for y in range(alto):
        fila = [px[x, y] for x in range(ancho)]
        cielo.append(tuple(statistics.median(p[c] for p in fila) for c in range(3)))
    salida = []
    for x in range(ancho):
        racha = 0
        fila_corte = alto
        for y in range(DESDE, alto):
            dif = max(abs(px[x, y][c] - cielo[y][c]) for c in range(3))
            racha = racha + 1 if dif > UMBRAL else 0
            if racha == SEGUIDAS:
                fila_corte = y - SEGUIDAS + 1
                break
        salida.append(fila_corte)
    return salida


def suavizar(valores, radio=3):
    # Mediana móvil: una columna con una rama suelta no tiene que abrir un
    # hueco de estrellas en medio de un árbol.
    n = len(valores)
    return [
        int(statistics.median(valores[max(0, i - radio) : min(n, i + radio + 1)]))
        for i in range(n)
    ]


if __name__ == '__main__':
    origen, destino = sys.argv[1], sys.argv[2]
    img = Image.open(origen).convert('RGB')
    c = suavizar(contorno(img))
    json.dump(c, open(destino, 'w'))
    print('columnas', len(c), 'mínimo', min(c), 'máximo', max(c))
    if len(sys.argv) > 3:
        rojo = img.copy()
        for x, y in enumerate(c):
            for yy in range(max(0, y - 1), min(img.size[1], y + 1)):
                rojo.putpixel((x, yy), (255, 40, 40))
        rojo.crop((0, 100, img.size[0], 360)).resize((img.size[0] * 2, 520), Image.NEAREST).save(sys.argv[3])
