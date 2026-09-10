import { describe, it, expect } from 'vitest';
import { newsAssetLink } from './newsAssetLink';

describe('newsAssetLink', () => {
    it('null/undefined → null', () => {
        expect(newsAssetLink(null)).toBeNull();
        expect(newsAssetLink(undefined)).toBeNull();
    });

    it('relatedSymbol var → asset link', () => {
        const r = newsAssetLink({ relatedSymbol: 'THYAO', relatedName: 'Türk Hava Yolları', relatedCategory: 'STOCK' });
        expect(r.type).toBe('asset');
        expect(r.to).toBe('/chart/THYAO?cat=STOCK');
        expect(r.label).toBe('Türk Hava Yolları');
    });

    it('relatedSymbol relatedName yok → label=symbol', () => {
        const r = newsAssetLink({ relatedSymbol: 'BTC', relatedCategory: 'CRYPTO' });
        expect(r.label).toBe('BTC');
    });

    it('GOLD relatedCategory → /markets/turkish-gold', () => {
        const r = newsAssetLink({ relatedSymbol: 'GAU', relatedName: 'Gram Altın', relatedCategory: 'GOLD' });
        expect(r.to).toBe('/markets/turkish-gold');
        expect(r.type).toBe('asset');
    });

    it('GOLD label fallback → "Gram Altın"', () => {
        const r = newsAssetLink({ relatedSymbol: 'X', relatedCategory: 'GOLD' });
        expect(r.label).toBe('Gram Altın');
    });

    it('relatedSymbol var, relatedCategory yok → cat= queryparam YOK', () => {
        const r = newsAssetLink({ relatedSymbol: 'BTC' });
        expect(r.to).toBe('/chart/BTC');
    });

    it('TR category Kripto → /markets/crypto', () => {
        const r = newsAssetLink({ category: 'Kripto' });
        expect(r.to).toBe('/markets/crypto');
        expect(r.type).toBe('category');
    });

    it('TR category "Borsa" → tr-stocks', () => {
        expect(newsAssetLink({ category: 'Borsa' }).to).toBe('/markets/tr-stocks');
    });

    it('TR category "Döviz & Forex" → currencies', () => {
        expect(newsAssetLink({ category: 'Döviz & Forex' }).to).toBe('/markets/currencies');
    });

    it('EN category "crypto" → crypto', () => {
        expect(newsAssetLink({ category: 'crypto' }).to).toBe('/markets/crypto');
    });

    it('EN category "stocks" → tr-stocks', () => {
        expect(newsAssetLink({ category: 'stocks' }).to).toBe('/markets/tr-stocks');
    });

    it('EN category "bonds & rates" → bonds', () => {
        expect(newsAssetLink({ category: 'bonds & rates' }).to).toBe('/markets/bonds');
    });

    it('TR/EN category trim + lowercase', () => {
        expect(newsAssetLink({ category: '  EMTIALAR  ' }).to).toBe('/markets/commodities');
    });

    it('bilinmeyen kategori → null', () => {
        expect(newsAssetLink({ category: 'BilinmeyenX' })).toBeNull();
    });

    it('hiç field yok → null', () => {
        expect(newsAssetLink({})).toBeNull();
    });

    it('relatedSymbol encodeURIComponent', () => {
        const r = newsAssetLink({ relatedSymbol: 'A&B', relatedCategory: 'STOCK' });
        expect(r.to).toBe('/chart/A%26B?cat=STOCK');
    });

    it('genel ekonomi → economy', () => {
        expect(newsAssetLink({ category: 'genel ekonomi' }).to).toBe('/markets/economy');
        expect(newsAssetLink({ category: 'economy' }).to).toBe('/markets/economy');
    });

    it('yatırım fonları → tr-funds', () => {
        expect(newsAssetLink({ category: 'yatırım fonları' }).to).toBe('/markets/tr-funds');
        expect(newsAssetLink({ category: 'funds' }).to).toBe('/markets/tr-funds');
    });
});
