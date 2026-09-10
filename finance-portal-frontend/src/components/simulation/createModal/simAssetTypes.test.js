import { describe, it, expect } from 'vitest';
import { SIM_ASSET_TYPES } from './simAssetTypes';

describe('SIM_ASSET_TYPES', () => {
    it('8 type içerir (VIOP simulation\'da yok)', () => {
        expect(SIM_ASSET_TYPES).toHaveLength(8);
    });

    it('VIOP simulation listesinde olmamalı', () => {
        const keys = SIM_ASSET_TYPES.map(t => t.uiKey);
        expect(keys).not.toContain('VIOP');
    });

    it('temel tipler içeriyor', () => {
        const keys = SIM_ASSET_TYPES.map(t => t.uiKey);
        ['STOCK', 'CRYPTO', 'CURRENCY', 'GOLD', 'COMMODITY', 'BOND_TR', 'BOND', 'FUND'].forEach(k => {
            expect(keys).toContain(k);
        });
    });

    it('uiKey benzersiz', () => {
        const keys = SIM_ASSET_TYPES.map(t => t.uiKey);
        expect(new Set(keys).size).toBe(keys.length);
    });
});
