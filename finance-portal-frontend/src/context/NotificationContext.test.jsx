import { describe, it, expect } from 'vitest';
import { notificationTypeMeta } from './NotificationContext';

/**
 * NotificationContext'in pure helper'ı.
 * Provider hook'unu test etmek hidden setTimeout zincirleri + localStorage effect'leri
 * yüzünden Node workerda heap dolduruyor — Provider integration test'ini ChatWidget /
 * ChangePasswordModal gibi consumer'lara bıraktık.
 */
describe('notificationTypeMeta', () => {
    it('success → buy renkli, CheckCircle2 ikonu', () => {
        const m = notificationTypeMeta('success');
        expect(m.accent).toBe('text-buy');
        expect(m.ring).toBe('border-l-buy');
        expect(m.soft).toBe('bg-buy/10');
        expect(m.icon).toBeDefined();
    });

    it('error → sell renkli', () => {
        const m = notificationTypeMeta('error');
        expect(m.accent).toBe('text-sell');
        expect(m.ring).toBe('border-l-sell');
    });

    it('warning → warning renkli', () => {
        const m = notificationTypeMeta('warning');
        expect(m.accent).toBe('text-warning');
    });

    it('info → primary renkli', () => {
        const m = notificationTypeMeta('info');
        expect(m.accent).toBe('text-primary');
    });

    it('bilinmeyen tip → info fallback', () => {
        expect(notificationTypeMeta('xyz').accent).toBe('text-primary');
        expect(notificationTypeMeta(null).accent).toBe('text-primary');
        expect(notificationTypeMeta(undefined).accent).toBe('text-primary');
    });
});
