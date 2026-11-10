// Las frases de los patrones. Importa solo las funciones que arman texto:
// no toca el DOM ni localStorage.
import { describe, it, expect } from 'vitest';
import {
    frasesDeAcostarse,
    frasesDeJetLag,
    frasesDeMotivos,
    frasesDeRegularidad,
} from './patrones-vista.js';

describe('frases de "todavía no alcanza"', () => {
    it('el verbo va una sola vez cuando faltan dos cosas', () => {
        const { texto } = frasesDeJetLag({ enough: false, missingWeekend: 4, missingOther: 2 });
        expect(texto).toBe(
            'Todavía no alcanza: faltan 4 noches de fin de semana y 2 de entre semana.',
        );
    });

    it('en singular dice "falta"', () => {
        expect(frasesDeRegularidad({ enough: false, missing: 1 }).texto).toBe(
            'Todavía no alcanza: falta 1 noche con horario.',
        );
    });

    it('si solo falta una de las dos cosas, no nombra la otra', () => {
        const { texto } = frasesDeAcostarse({ enough: false, missingBefore: 0, missingAfter: 3 });
        expect(texto).toBe('Todavía no alcanza: faltan 3 noches acostándote después.');
    });

    it('los motivos también', () => {
        expect(frasesDeMotivos({ enough: false, missing: 5 }).texto).toBe(
            'Todavía no alcanza: faltan 5 noches con la pregunta contestada.',
        );
    });
});

describe('frases con número', () => {
    it('el jet lag dice sobre cuántas noches se apoya y no habla de causas', () => {
        const f = frasesDeJetLag({
            enough: true,
            minutes: 78,
            nights: 10,
            weekendNights: 5,
            otherNights: 5,
        });
        expect(f.texto).toBe(
            'El viernes y el sábado el punto medio de tu noche cae 1h 18m más tarde que el resto de la semana.',
        );
        expect(f.muestra).toBe('Sobre 10 noches con horario, 5 de viernes y sábado.');
    });

    it('un corrimiento chico se dice con minutos', () => {
        const f = frasesDeJetLag({
            enough: true,
            minutes: -48,
            nights: 10,
            weekendNights: 5,
            otherNights: 5,
        });
        expect(f.texto).toContain('48 minutos más temprano');
    });

    it('acostarse contra cómo te levantaste, con la forma "las noches en que"', () => {
        const f = frasesDeAcostarse({
            enough: true,
            nights: 14,
            before: { total: 9, bien: 6 },
            after: { total: 5, bien: 1 },
        });
        expect(f.texto).toBe(
            'Las noches en que te acostaste antes de las 00:00 te levantaste bien 6 de 9 veces; después, 1 de 5.',
        );
    });
});
