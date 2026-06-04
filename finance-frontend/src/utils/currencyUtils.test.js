import { describe, it, expect, vi } from 'vitest';

vi.mock('../constants/assets', () => ({
    ASSET_CDNS: { FLAGS: 'https://cdn.example/flags' },
    FLAG_MAPPINGS: {
        USD: 'us',
        EUR: 'eu',
        GBP: 'gb',
    },
}));

import { getFlagUrl } from './currencyUtils';

describe('getFlagUrl', () => {
    it('boş kod → boş string', () => {
        expect(getFlagUrl('')).toBe('');
        expect(getFlagUrl(null)).toBe('');
        expect(getFlagUrl(undefined)).toBe('');
    });

    it('haritada olan kod → mapped country', () => {
        expect(getFlagUrl('USD')).toBe('https://cdn.example/flags/us.png');
        expect(getFlagUrl('EUR')).toBe('https://cdn.example/flags/eu.png');
    });

    it('lowercase → uppercase\'e çevirir', () => {
        expect(getFlagUrl('usd')).toBe('https://cdn.example/flags/us.png');
    });

    it("haritada olmayan kod → ilk 2 harf lowercase", () => {
        expect(getFlagUrl('JPY')).toBe('https://cdn.example/flags/jp.png');
        expect(getFlagUrl('XYZ')).toBe('https://cdn.example/flags/xy.png');
    });
});
