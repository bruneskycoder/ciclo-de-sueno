"""Genera src/js/estrellas-datos.js con las estrellas más brillantes.

Fuente: stars.6.json de d3-celestial (Olaf Frohn, licencia BSD de 3
cláusulas), que sale del catálogo Hipparcos. Cada estrella lleva su número
HIP como id, la ascensión recta y la declinación en grados (época J2000) y
la magnitud. Se queda con las de magnitud 3,5 o menos: unas 290, que
alcanzan para una ventana de cielo de 572 píxeles.

Uso:
    curl -o stars.6.json https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/stars.6.json
    python3 scripts/generar-estrellas.py stars.6.json src/js/estrellas-datos.js
"""
import json
import sys

MAG_MAX = 3.5

d = json.load(open(sys.argv[1]))
filas = []
for f in d['features']:
    mag = f['properties']['mag']
    if mag > MAG_MAX:
        continue
    lon, dec = f['geometry']['coordinates']
    ra = lon % 360  # el archivo guarda la ascensión recta entre -180 y 180
    filas.append((mag, f['id'], round(ra, 3), round(dec, 3)))
filas.sort()

with open(sys.argv[2], 'w') as out:
    out.write(
        '// estrellas-datos.js — GENERADO por scripts/generar-estrellas.py; no se edita a mano.\n'
        '// Catálogo Hipparcos vía d3-celestial (Olaf Frohn, BSD-3). Magnitud <= %s.\n'
        '// Cada fila: [número HIP, ascensión recta (grados), declinación (grados), magnitud].\n'
        'export const ESTRELLAS_CATALOGO = [\n' % MAG_MAX
    )
    for mag, hip, ra, dec in filas:
        out.write('    [%d, %s, %s, %s],\n' % (hip, ra, dec, mag))
    out.write('];\n')
print(len(filas), 'estrellas')
