import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k }),
}));
vi.mock('../../../../../utils/formatters/numberFormatter', () => ({
    formatNumber: (v) => `${v}`,
}));

import CommodityTabs from './CommodityTabs';
import CommodityTable from './CommodityTable';

describe('CommodityTabs', () => {
    it('5 tab render', () => {
        const { container } = render(<CommodityTabs activeCategory="all" setActiveCategory={() => {}} />);
        expect(container.querySelectorAll('button').length).toBe(5);
    });

    it('aktif tab → primary border class', () => {
        const { container } = render(<CommodityTabs activeCategory="energy" setActiveCategory={() => {}} />);
        const buttons = Array.from(container.querySelectorAll('button'));
        const active = buttons.find(b => b.textContent.includes('commodity.tabs.energy'));
        expect(active.className).toContain('border-primary');
    });

    it('click → setActiveCategory(id)', () => {
        const setActive = vi.fn();
        const { container } = render(<CommodityTabs activeCategory="all" setActiveCategory={setActive} />);
        const buttons = Array.from(container.querySelectorAll('button'));
        const precious = buttons.find(b => b.textContent.includes('commodity.tabs.preciousMetals'));
        fireEvent.click(precious);
        expect(setActive).toHaveBeenCalledWith('precious');
    });
});

describe('CommodityTable', () => {
    it('loading → animate-pulse placeholder', () => {
        const { container } = render(
            <MemoryRouter><CommodityTable data={[]} loading /></MemoryRouter>
        );
        expect(container.querySelector('.animate-pulse')).toBeTruthy();
    });

    it('boş data → noResults mesajı', () => {
        render(
            <MemoryRouter><CommodityTable data={[]} loading={false} /></MemoryRouter>
        );
        expect(screen.getByText('markets:common.noResults')).toBeInTheDocument();
    });

    it('dolu data → satırlar render edilir', () => {
        const data = [
            { symbol: 'GC=F', name: 'Gold', forexBuying: 2000, forexSelling: 2010 },
            { symbol: 'CL=F', name: 'Crude Oil', forexBuying: 80, forexSelling: 81 },
        ];
        render(<MemoryRouter><CommodityTable data={data} loading={false} /></MemoryRouter>);
        expect(screen.getByText('Gold')).toBeInTheDocument();
        expect(screen.getByText('Crude Oil')).toBeInTheDocument();
    });
});
