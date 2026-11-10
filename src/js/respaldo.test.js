import { describe, it, expect } from 'vitest';
import { backupReminder } from './respaldo.js';

const ahora = new Date('2026-11-10T12:00:00Z');

describe('backupReminder', () => {
    it('sin noches anotadas no hay nada que respaldar', () => {
        expect(backupReminder({ lastExportAt: null, recordCount: 0, now: ahora })).toBeNull();
    });

    it('con noches y ningún respaldo, lo dice', () => {
        expect(backupReminder({ lastExportAt: null, recordCount: 12, now: ahora })).toBe(
            'Todavía no bajaste ningún respaldo.',
        );
    });

    it('un respaldo de hace 30 días justos todavía no avisa', () => {
        expect(
            backupReminder({ lastExportAt: '2026-10-11T12:00:00Z', recordCount: 12, now: ahora }),
        ).toBeNull();
    });

    it('pasado el mes, dice cuántos días van', () => {
        expect(
            backupReminder({ lastExportAt: '2026-10-08T12:00:00Z', recordCount: 12, now: ahora }),
        ).toBe('Hace 33 días que no bajás un respaldo.');
    });

    it('un respaldo de ayer no avisa', () => {
        expect(
            backupReminder({ lastExportAt: '2026-11-09T12:00:00Z', recordCount: 12, now: ahora }),
        ).toBeNull();
    });

    it('una fecha guardada rota se trata como "ningún respaldo"', () => {
        expect(backupReminder({ lastExportAt: 'basura', recordCount: 3, now: ahora })).toBe(
            'Todavía no bajaste ningún respaldo.',
        );
    });
});
