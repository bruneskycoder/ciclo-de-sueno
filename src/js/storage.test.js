// storage.test.js — solo cubre la lógica de storage.js que NO toca
// localStorage ni DOM (validateImportPayload, normalizeImportedRecords,
// mergeSleepLogs — Fase 6). El resto del archivo (getSleepLogs,
// saveSleepLog, etc.) depende del navegador y no tiene sentido simularlo
// acá; se verifica a mano/con Playwright, igual que las fases anteriores.
import { describe, it, expect } from 'vitest';
import { validateImportPayload, normalizeImportedRecords, mergeSleepLogs } from './storage.js';

function record(overrides = {}) {
    return {
        id: 'r1', date: '2024-01-14', bedtimeActual: '23:00', waketimeActual: '07:00',
        durationMinutes: 480, cyclesCompleted: 5, quality: 4, notes: 'bien',
        ...overrides,
    };
}

describe('validateImportPayload', () => {
    it('acepta un archivo con la forma esperada', () => {
        expect(validateImportPayload({ version: 1, records: [record()] })).toBe(true);
    });

    it('acepta un array de records vacío (backup sin datos todavía)', () => {
        expect(validateImportPayload({ version: 1, records: [] })).toBe(true);
    });

    it('rechaza si falta el array de records', () => {
        expect(validateImportPayload({ version: 1 })).toBe(false);
        expect(validateImportPayload({ records: 'no-es-array' })).toBe(false);
    });

    it('rechaza null, undefined o un JSON que no es un objeto', () => {
        expect(validateImportPayload(null)).toBe(false);
        expect(validateImportPayload(undefined)).toBe(false);
        expect(validateImportPayload('un string cualquiera')).toBe(false);
        expect(validateImportPayload(42)).toBe(false);
    });

    it('rechaza el archivo COMPLETO si un solo registro tiene la fecha mal formada', () => {
        const data = { records: [record(), record({ id: 'r2', date: '14-01-2024' })] };
        expect(validateImportPayload(data)).toBe(false);
    });

    it('rechaza si falta alguna hora o viene con formato inválido', () => {
        // Mismo criterio de "forma", no de rango, que usa calc.js en toda
        // la app (ahí tampoco se valida que la hora sea <24 ni el minuto
        // <60) — acá solo se chequea que tenga pinta de "HH:MM".
        expect(validateImportPayload({ records: [record({ bedtimeActual: '' })] })).toBe(false);
        expect(validateImportPayload({ records: [record({ waketimeActual: 'no-es-una-hora' })] })).toBe(false);
    });

    it('rechaza si durationMinutes no es un número válido', () => {
        expect(validateImportPayload({ records: [record({ durationMinutes: '480' })] })).toBe(false);
        expect(validateImportPayload({ records: [record({ durationMinutes: -10 })] })).toBe(false);
    });

    it('no exige que vengan quality/notes/cyclesCompleted (son opcionales)', () => {
        const minimo = { date: '2024-01-14', bedtimeActual: '23:00', waketimeActual: '07:00', durationMinutes: 480 };
        expect(validateImportPayload({ records: [minimo] })).toBe(true);
    });
});

describe('normalizeImportedRecords', () => {
    it('completa campos opcionales faltantes con sus defaults', () => {
        const [r] = normalizeImportedRecords([
            { date: '2024-01-14', bedtimeActual: '23:00', waketimeActual: '07:00', durationMinutes: 480 },
        ]);
        expect(r.cyclesCompleted).toBe(0);
        expect(r.quality).toBeNull();
        expect(r.notes).toBe('');
        expect(typeof r.id).toBe('string');
        expect(r.id.length).toBeGreaterThan(0);
    });

    it('conserva el id si viene en el archivo (backup del propio dispositivo)', () => {
        const [r] = normalizeImportedRecords([record({ id: 'ya-existente' })]);
        expect(r.id).toBe('ya-existente');
    });

    it('descarta un quality mal tipado (ej. string) en vez de guardarlo corrupto', () => {
        const [r] = normalizeImportedRecords([record({ quality: '4' })]);
        expect(r.quality).toBeNull();
    });
});

describe('mergeSleepLogs — sin duplicar', () => {
    it('agrega un registro genuinamente nuevo', () => {
        const current = [record({ id: 'r1', date: '2024-01-14' })];
        const merged = mergeSleepLogs(current, [record({ id: 'r2', date: '2024-01-15' })]);
        expect(merged).toHaveLength(2);
    });

    it('no duplica si el id ya existe', () => {
        const current = [record({ id: 'r1', date: '2024-01-14' })];
        const merged = mergeSleepLogs(current, [record({ id: 'r1', date: '2024-01-14' })]);
        expect(merged).toHaveLength(1);
    });

    it('no duplica si la fecha ya existe, aunque el id sea distinto (dos dispositivos, misma noche)', () => {
        const current = [record({ id: 'del-celular', date: '2024-01-14' })];
        const merged = mergeSleepLogs(current, [record({ id: 'de-la-pc', date: '2024-01-14' })]);
        expect(merged).toHaveLength(1);
        expect(merged[0].id).toBe('del-celular'); // el existente no se pisa
    });

    it('no muta el array actual ni los registros existentes', () => {
        const current = [record({ id: 'r1', date: '2024-01-14', notes: 'original' })];
        mergeSleepLogs(current, [record({ id: 'r1', date: '2024-01-14', notes: 'del archivo' })]);
        expect(current[0].notes).toBe('original');
    });

    it('con un historial vacío, fusionar equivale a importar todo', () => {
        const merged = mergeSleepLogs([], [record({ id: 'r1' }), record({ id: 'r2', date: '2024-01-15' })]);
        expect(merged).toHaveLength(2);
    });
});
