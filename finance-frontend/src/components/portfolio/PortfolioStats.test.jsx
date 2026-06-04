import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k, fallback) => fallback ?? k }),
}));
vi.mock('../../context/CurrencyContext', () => ({
    useCurrency: () => ({
        formatPrice: (v) => `₺${Number(v).toFixed(2)}`,
    }),
}));

import PortfolioStats from './PortfolioStats';

const portfolio = [
    { symbol: 'A', quantity: 10, averagePrice: 100 },
    { symbol: 'B', quantity: 5, averagePrice: 200 },
];

const calcFn = vi.fn(() => ({ costValue: 1000, currentValue: 1500 }));

describe('PortfolioStats', () => {
    it('toplam değerler hesaplanır + kâr durumu (pnlUp)', () => {
        render(<PortfolioStats portfolio={portfolio} calculateProfitLoss={calcFn} />);
        expect(screen.getByText('stats.totalCost')).toBeInTheDocument();
        expect(screen.getByText('stats.totalValue')).toBeInTheDocument();
        expect(screen.getByText('stats.totalPnl')).toBeInTheDocument();
        expect(screen.getByText(/\+₺1000\.00/)).toBeInTheDocument();
    });

    it('zarar durumu — eksi başlı', () => {
        const calcLoss = (item) => ({ costValue: 1000, currentValue: 800 });
        render(<PortfolioStats portfolio={portfolio} calculateProfitLoss={calcLoss} />);
        expect(screen.getAllByText(/₺-400\.00/).length).toBeGreaterThan(0);
    });

    it('hidden=true → MASK gösterir', () => {
        render(<PortfolioStats portfolio={portfolio} calculateProfitLoss={calcFn} hidden />);
        expect(screen.getAllByText('••••••').length).toBeGreaterThanOrEqual(4);
    });

    it('null portfolio → boş toplamlar', () => {
        render(<PortfolioStats portfolio={null} calculateProfitLoss={() => ({})} />);
        expect(screen.getAllByText('₺0.00').length).toBeGreaterThanOrEqual(2);
    });

    it('inflationFactor verilirse 5. kart Reel K/Z render', () => {
        render(<PortfolioStats portfolio={portfolio} calculateProfitLoss={calcFn} inflationFactor={1.5} />);
        expect(screen.getByText(/Reel K\/Z/)).toBeInTheDocument();
        expect(screen.getByText(/Enflasyon ×1\.50/)).toBeInTheDocument();
    });

    it('inflationFactor ~1 → "yakın tarihli alım" notu', () => {
        render(<PortfolioStats portfolio={portfolio} calculateProfitLoss={calcFn} inflationFactor={1.001} />);
        expect(screen.getByText(/yakın tarihli alım/)).toBeInTheDocument();
    });
});
