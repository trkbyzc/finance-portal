import { describe, it, expect } from 'vitest';
import { toBackendAssetType } from './assetTypeMapper';

/**
 * assetTypeMapper: frontend kategori → backend AssetType enum.
 * Sembol routing ve portföye ekleme akışında kullanılıyor —
 * yanlış mapping prod'da silent corruption yapar, bu yüzden full coverage hedef.
 */
describe('toBackendAssetType', () => {
    describe('özel mapping kuralları', () => {
        it('VIOP → FUTURE', () => {
            expect(toBackendAssetType('VIOP')).toBe('FUTURE');
        });

        it('TR_BOND → BOND', () => {
            expect(toBackendAssetType('TR_BOND')).toBe('BOND');
        });

        it('EUROBOND → BOND', () => {
            expect(toBackendAssetType('EUROBOND')).toBe('BOND');
        });

        it('TR_FUND → FUND', () => {
            expect(toBackendAssetType('TR_FUND')).toBe('FUND');
        });

        it('INDEX → STOCK (BIST endeksleri hisse gibi)', () => {
            expect(toBackendAssetType('INDEX')).toBe('STOCK');
        });
    });

    describe('passthrough — backend enum zaten doğru', () => {
        it.each(['STOCK', 'CRYPTO', 'CURRENCY', 'COMMODITY', 'BOND', 'FUND', 'FUTURE'])(
            '%s aynen döner',
            (type) => {
                expect(toBackendAssetType(type)).toBe(type);
            }
        );
    });

    describe('fallback davranışı', () => {
        it('null kategori → STOCK default', () => {
            expect(toBackendAssetType(null)).toBe('STOCK');
        });

        it('undefined kategori → STOCK default', () => {
            expect(toBackendAssetType(undefined)).toBe('STOCK');
        });

        it("boş string → boş string'i fallback'e geçirmez, STOCK döner", () => {
            // '' falsy → fallback chain'e düşer → 'STOCK'
            expect(toBackendAssetType('')).toBe('STOCK');
        });

        it('bilinmeyen kategori → kendisini döndürür (passthrough)', () => {
            // Yeni eklenmiş bir kategori varsa backend'in tanıması gerek;
            // mapper engellemiyor — backend Enum.valueOf hata fırlatır.
            expect(toBackendAssetType('XYZ_NEW_TYPE')).toBe('XYZ_NEW_TYPE');
        });
    });
});
