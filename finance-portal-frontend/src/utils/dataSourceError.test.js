import { describe, it, expect } from 'vitest';
import { asDataSourceError, isDataSourceBody, DATA_SOURCE_UNAVAILABLE } from './dataSourceError';

const body = (over = {}) => ({
    code: DATA_SOURCE_UNAVAILABLE,
    source: 'fintables',
    reason: 'DISABLED',
    message: 'Ücretli abonelik ürünü.',
    status: 503,
    ...over
});

describe('isDataSourceBody', () => {
    it('doğru kodu taşıyan gövdeyi tanır', () => {
        expect(isDataSourceBody(body())).toBe(true);
    });

    it('alakasız gövdeleri reddeder', () => {
        expect(isDataSourceBody(null)).toBe(false);
        expect(isDataSourceBody(undefined)).toBe(false);
        expect(isDataSourceBody('bir hata metni')).toBe(false);
        expect(isDataSourceBody({ error: 'Not Found', status: 404 })).toBe(false);
    });
});

describe('asDataSourceError', () => {
    it('axios hatasından normalize eder', () => {
        const result = asDataSourceError({ response: { data: body() } });
        expect(result).toEqual({
            source: 'fintables',
            reason: 'DISABLED',
            message: 'Ücretli abonelik ürünü.',
            requiresAuth: false
        });
    });

    it('REQUIRES_AUTH → requiresAuth true', () => {
        const result = asDataSourceError({ response: { data: body({ reason: 'REQUIRES_AUTH' }) } });
        expect(result.requiresAuth).toBe(true);
    });

    it('doğrudan gövde verilse de çalışır', () => {
        expect(asDataSourceError(body())?.source).toBe('fintables');
    });

    it('bu duruma ait olmayan hatalarda null döner — normal hata akışı bozulmasın', () => {
        expect(asDataSourceError(new Error('ağ hatası'))).toBeNull();
        expect(asDataSourceError({ response: { status: 500, data: { error: 'boom' } } })).toBeNull();
        expect(asDataSourceError(null)).toBeNull();
    });

    it('eksik alanlarda güvenli varsayılanlara düşer', () => {
        const result = asDataSourceError({ code: DATA_SOURCE_UNAVAILABLE });
        expect(result).toEqual({ source: 'unknown', reason: 'DISABLED', message: '', requiresAuth: false });
    });
});
