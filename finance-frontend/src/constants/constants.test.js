import { describe, it, expect } from 'vitest';
import { ASSET_CDNS, FLAG_MAPPINGS } from './assets';
import { CHART_COLORS } from './theme';
import { QUERY_CONFIG } from './config';

describe('ASSET_CDNS', () => {
    it('FLAGS CDN URL', () => {
        expect(ASSET_CDNS.FLAGS).toBe('https://flagcdn.com/48x36');
    });
});

describe('FLAG_MAPPINGS', () => {
    it.each([
        ['EUR', 'eu'],
        ['GBP', 'gb'],
        ['JPY', 'jp'],
        ['CHF', 'ch'],
        ['USD', 'us'],
        ['AUD', 'au'],
        ['CAD', 'ca'],
        ['TRY', 'tr'],
    ])('%s → %s', (code, slug) => {
        expect(FLAG_MAPPINGS[code]).toBe(slug);
    });
});

describe('CHART_COLORS', () => {
    it('UP yeşil, DOWN kırmızı', () => {
        expect(CHART_COLORS.UP).toBe('#089981');
        expect(CHART_COLORS.DOWN).toBe('#f23645');
    });
    it('PRIMARY mavi', () => {
        expect(CHART_COLORS.PRIMARY).toBe('#2962ff');
    });
    it.each(['UP', 'DOWN', 'PRIMARY', 'BG_DARK', 'BG_LIGHT', 'TEXT_MUTED', 'GRID', 'CROSSHAIR'])(
        '%s hex format', (key) => {
            expect(CHART_COLORS[key]).toMatch(/^#[0-9a-f]{6}$/i);
        }
    );
});

describe('QUERY_CONFIG', () => {
    it('STALE_TIME tier\'lari sıralı (SHORT < DEFAULT < LONG)', () => {
        const { SHORT, DEFAULT, LONG } = QUERY_CONFIG.STALE_TIME;
        expect(SHORT).toBeLessThan(DEFAULT);
        expect(DEFAULT).toBeLessThan(LONG);
    });

    it('SHORT 30 saniye', () => {
        expect(QUERY_CONFIG.STALE_TIME.SHORT).toBe(30_000);
    });
    it('DEFAULT 1 dakika', () => {
        expect(QUERY_CONFIG.STALE_TIME.DEFAULT).toBe(60_000);
    });
    it('LONG 5 dakika', () => {
        expect(QUERY_CONFIG.STALE_TIME.LONG).toBe(5 * 60_000);
    });

    it('REFETCH_INTERVAL TICKER + LIVE_MARKET', () => {
        expect(QUERY_CONFIG.REFETCH_INTERVAL.TICKER).toBe(30_000);
        expect(QUERY_CONFIG.REFETCH_INTERVAL.LIVE_MARKET).toBe(15_000);
    });

    it('LIMITS DASHBOARD_WIDGET=6 + NEWS_PAGE_SIZE=10', () => {
        expect(QUERY_CONFIG.LIMITS.DASHBOARD_WIDGET).toBe(6);
        expect(QUERY_CONFIG.LIMITS.NEWS_PAGE_SIZE).toBe(10);
    });
});
