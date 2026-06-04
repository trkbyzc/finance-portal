import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k })
}));

import MarketCategoryTabs, { COMMODITY_CATEGORIES } from './MarketCategoryTabs';

describe('COMMODITY_CATEGORIES export', () => {
    it('5 kategori (Tümü, Kıymetli, Enerji, Sanayi, Tarım)', () => {
        const keys = Object.keys(COMMODITY_CATEGORIES);
        expect(keys).toHaveLength(5);
        expect(keys).toContain('Tümü');
        expect(keys).toContain('Kıymetli Madenler');
    });

    it('Tümü kategorisi boş list', () => {
        expect(COMMODITY_CATEGORIES['Tümü']).toEqual([]);
    });

    it('Kıymetli Madenler altın/gümüş/platinum/palladium', () => {
        const pm = COMMODITY_CATEGORIES['Kıymetli Madenler'];
        expect(pm).toContain('GC=F'); // gold
        expect(pm).toContain('SI=F'); // silver
    });

    it('Enerji petrol/gaz', () => {
        const e = COMMODITY_CATEGORIES['Enerji'];
        expect(e).toContain('CL=F'); // crude oil
        expect(e).toContain('NG=F'); // natural gas
    });
});

describe('MarketCategoryTabs', () => {
    it('5 tab butonu render eder', () => {
        const { container } = render(<MarketCategoryTabs activeTab="Tümü" setActiveTab={() => {}} />);
        expect(container.querySelectorAll('button')).toHaveLength(5);
    });

    it('active tab → primary bg', () => {
        const { container } = render(<MarketCategoryTabs activeTab="Enerji" setActiveTab={() => {}} />);
        const buttons = container.querySelectorAll('button');
        const enerjiBtn = Array.from(buttons).find(b => b.textContent.includes('energy'));
        expect(enerjiBtn.className).toContain('bg-primary');
    });

    it('butona tık → setActiveTab(name) çağrılır', () => {
        const setActiveTab = vi.fn();
        const { container } = render(<MarketCategoryTabs activeTab="Tümü" setActiveTab={setActiveTab} />);
        const buttons = container.querySelectorAll('button');
        fireEvent.click(buttons[1]); // Kıymetli Madenler
        expect(setActiveTab).toHaveBeenCalledWith('Kıymetli Madenler');
    });
});
