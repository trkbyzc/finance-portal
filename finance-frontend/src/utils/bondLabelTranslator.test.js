import { describe, it, expect, vi, beforeEach } from 'vitest';

const { i18nMock } = vi.hoisted(() => ({ i18nMock: { language: 'tr' } }));
vi.mock('../i18n', () => ({ default: i18nMock }));

import { translateBondLabel, translateBondName, translateBondDate } from './bondLabelTranslator';

describe('translateBondLabel', () => {
    beforeEach(() => { i18nMock.language = 'tr'; });

    it('boş/null → passthrough', () => {
        expect(translateBondLabel(null)).toBeNull();
        expect(translateBondLabel('')).toBe('');
        expect(translateBondLabel(undefined)).toBeUndefined();
    });

    it('TR aktifken aynen döner (çeviri yok)', () => {
        expect(translateBondLabel('Kısa Vadeli')).toBe('Kısa Vadeli');
        expect(translateBondLabel('5 Yıl+')).toBe('5 Yıl+');
    });

    it('EN: Kısa Vadeli → Short Term', () => {
        i18nMock.language = 'en';
        expect(translateBondLabel('Kısa Vadeli')).toBe('Short Term');
    });

    it('EN: Orta Vadeli → Medium Term', () => {
        i18nMock.language = 'en';
        expect(translateBondLabel('Orta Vadeli')).toBe('Medium Term');
    });

    it('EN: Uzun Vadeli → Long Term', () => {
        i18nMock.language = 'en';
        expect(translateBondLabel('Uzun Vadeli')).toBe('Long Term');
    });

    it('EN: "5 Yıl+" → "5 Yr+"', () => {
        i18nMock.language = 'en';
        expect(translateBondLabel('5 Yıl+')).toBe('5 Yr+');
    });

    it('EN: "3 Ay" → "3 Mo"', () => {
        i18nMock.language = 'en';
        expect(translateBondLabel('3 Ay')).toBe('3 Mo');
    });
});

describe('translateBondName', () => {
    beforeEach(() => { i18nMock.language = 'tr'; });

    it('TR → aynen döner', () => {
        expect(translateBondName('Kısa Vadeli DİBS')).toBe('Kısa Vadeli DİBS');
    });

    it('EN: DİBS → TR Gov. Bond', () => {
        i18nMock.language = 'en';
        expect(translateBondName('Kısa Vadeli DİBS')).toBe('Short Term TR Gov. Bond');
    });

    it('EN: Tahvil → Bond', () => {
        i18nMock.language = 'en';
        expect(translateBondName('Devlet Tahvil')).toContain('Bond');
    });
});

describe('translateBondDate', () => {
    beforeEach(() => { i18nMock.language = 'tr'; });

    it('null/boş → passthrough', () => {
        expect(translateBondDate(null)).toBeNull();
        expect(translateBondDate('')).toBe('');
    });

    it('TR aktif → aynen', () => {
        expect(translateBondDate('8 Tem 2026')).toBe('8 Tem 2026');
    });

    it('EN: TR ay adlarını EN\'e çevirir', () => {
        i18nMock.language = 'en';
        expect(translateBondDate('8 Tem 2026')).toBe('8 Jul 2026');
        expect(translateBondDate('15 Ara 2025')).toBe('15 Dec 2025');
        expect(translateBondDate('1 Oca 2027')).toBe('1 Jan 2027');
    });

    it("EN: kelime sınırı korur (içinde 'May' geçen ama ay olmayan kelimeye dokunmaz)", () => {
        i18nMock.language = 'en';
        // 'May' tek başına ay; "Mayıs2026" gibi bitişikse dokunmaz çünkü \\b sınırı yok
        expect(translateBondDate('1 May 2026')).toBe('1 May 2026');
    });
});
