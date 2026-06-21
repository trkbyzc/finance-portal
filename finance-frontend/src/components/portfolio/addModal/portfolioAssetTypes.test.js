import { describe, it, expect } from 'vitest';
import { PORTFOLIO_ASSET_TYPES } from './portfolioAssetTypes';

describe('PORTFOLIO_ASSET_TYPES', () => {
    it('9 type içerir (Stock, Crypto, Currency, Gold, Commodity, Bond_TR, Bond, Fund, Viop)', () => {
        expect(PORTFOLIO_ASSET_TYPES).toHaveLength(10);
    });

    it('her tip için uiKey + backendValue + endpoint', () => {
        PORTFOLIO_ASSET_TYPES.forEach(t => {
            expect(t).toHaveProperty('uiKey');
            expect(t).toHaveProperty('backendValue');
            expect(t).toHaveProperty('endpoint');
            expect(t.endpoint).toMatch(/^\/market-data\//);
        });
    });

    it('GOLD ve COMMODITY ikisi de backend COMMODITY enum\'una mapped', () => {
        const gold = PORTFOLIO_ASSET_TYPES.find(t => t.uiKey === 'GOLD');
        const comm = PORTFOLIO_ASSET_TYPES.find(t => t.uiKey === 'COMMODITY');
        expect(gold.backendValue).toBe('COMMODITY');
        expect(comm.backendValue).toBe('COMMODITY');
        expect(gold.endpoint).not.toBe(comm.endpoint); // ama farklı endpoint
    });

    it('BOND ve BOND_TR ikisi de backend BOND enum\'una mapped', () => {
        const bondTr = PORTFOLIO_ASSET_TYPES.find(t => t.uiKey === 'BOND_TR');
        const bond = PORTFOLIO_ASSET_TYPES.find(t => t.uiKey === 'BOND');
        expect(bondTr.backendValue).toBe('BOND');
        expect(bond.backendValue).toBe('BOND');
    });

    it('VIOP → FUTURE', () => {
        const viop = PORTFOLIO_ASSET_TYPES.find(t => t.uiKey === 'VIOP');
        expect(viop.backendValue).toBe('FUTURE');
    });

    it('uiKey değerleri benzersiz', () => {
        const keys = PORTFOLIO_ASSET_TYPES.map(t => t.uiKey);
        expect(new Set(keys).size).toBe(keys.length);
    });
});
