import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k, fb) => fb ?? k }),
}));
vi.mock('../../context/CurrencyContext', () => ({
    useCurrency: () => ({ formatPrice: (v) => `₺${v}` }),
}));
vi.mock('../../utils/currencyConversion', () => ({
    nativeCurrencyForType: (type) => (type === 'CRYPTO' ? 'USD' : 'TRY'),
}));

import HoldingsTable from './HoldingsTable';

const basePortfolio = [
    { symbol: 'A', assetType: 'STOCK', quantity: 5, averagePrice: 100 },
    { symbol: 'B', assetType: 'CRYPTO', quantity: 0.5, averagePrice: 50000 },
];
const calcFn = (item) => {
    if (item.symbol === 'A') return { currentPrice: 110, currentValue: 550, profitLoss: 50, profitLossPercent: 10 };
    return { currentPrice: 60000, currentValue: 30000, profitLoss: -1000, profitLossPercent: -5 };
};

describe('HoldingsTable', () => {
    it('boş portfolio → noHoldings', () => {
        render(<HoldingsTable portfolio={[]} calculateProfitLoss={() => ({})} />);
        expect(screen.getByText('portfolio:holdings.noHoldings')).toBeInTheDocument();
        expect(screen.getByText('portfolio:holdings.addFirst')).toBeInTheDocument();
    });

    it('null portfolio → noHoldings', () => {
        render(<HoldingsTable portfolio={null} calculateProfitLoss={() => ({})} />);
        expect(screen.getByText('portfolio:holdings.noHoldings')).toBeInTheDocument();
    });

    it('row rendering — sembol + currentPrice', () => {
        render(<HoldingsTable portfolio={basePortfolio} calculateProfitLoss={calcFn} />);
        expect(screen.getAllByText('A').length).toBeGreaterThan(0);
        expect(screen.getAllByText('B').length).toBeGreaterThan(0);
    });

    it('hidden=true → MASK gösterir', () => {
        render(<HoldingsTable portfolio={basePortfolio} calculateProfitLoss={calcFn} hidden />);
        expect(screen.getAllByText('••••').length).toBeGreaterThan(0);
    });

    it('onOpenHistory click → callback symbol ile', () => {
        const onOpenHistory = vi.fn();
        const { container } = render(
            <HoldingsTable portfolio={basePortfolio} calculateProfitLoss={calcFn}
                onOpenHistory={onOpenHistory} onOpenBuy={() => {}} onOpenSell={() => {}} />
        );
        const historyBtns = container.querySelectorAll('button[title="portfolio:transactions.openHistory"]');
        fireEvent.click(historyBtns[0]);
        expect(onOpenHistory).toHaveBeenCalledWith('A');
    });

    it('onOpenBuy click → item geçer', () => {
        const onOpenBuy = vi.fn();
        const { container } = render(
            <HoldingsTable portfolio={basePortfolio} calculateProfitLoss={calcFn}
                onOpenHistory={() => {}} onOpenBuy={onOpenBuy} onOpenSell={() => {}} />
        );
        const buyBtns = container.querySelectorAll('button[title="portfolio:trade.buy"]');
        fireEvent.click(buyBtns[1]);
        expect(onOpenBuy).toHaveBeenCalledWith(basePortfolio[1]);
    });

    it('onOpenSell click → item geçer', () => {
        const onOpenSell = vi.fn();
        const { container } = render(
            <HoldingsTable portfolio={basePortfolio} calculateProfitLoss={calcFn}
                onOpenHistory={() => {}} onOpenBuy={() => {}} onOpenSell={onOpenSell} />
        );
        const sellBtns = container.querySelectorAll('button[title="portfolio:trade.sell"]');
        fireEvent.click(sellBtns[0]);
        expect(onOpenSell).toHaveBeenCalledWith(basePortfolio[0]);
    });

    it('FUTURE contractSize > 1 → çarpan gösterimi', () => {
        const pf = [{ symbol: 'F', assetType: 'FUTURE', quantity: 1, averagePrice: 100, contractSize: 10 }];
        const c = () => ({ currentPrice: 100, currentValue: 1000, profitLoss: 0, profitLossPercent: 0 });
        const { container } = render(
            <HoldingsTable portfolio={pf} calculateProfitLoss={c} onOpenHistory={() => {}} onOpenBuy={() => {}} onOpenSell={() => {}} />
        );
        expect(container.textContent).toContain('× 10');
    });

    it('K/Z negatif → text-sell class uygulanır', () => {
        const { container } = render(
            <HoldingsTable portfolio={[basePortfolio[1]]} calculateProfitLoss={calcFn}
                onOpenHistory={() => {}} onOpenBuy={() => {}} onOpenSell={() => {}} />
        );
        expect(container.innerHTML).toContain('text-sell');
    });

    it('K/Z pozitif → text-buy class', () => {
        const { container } = render(
            <HoldingsTable portfolio={[basePortfolio[0]]} calculateProfitLoss={calcFn}
                onOpenHistory={() => {}} onOpenBuy={() => {}} onOpenSell={() => {}} />
        );
        expect(container.innerHTML).toContain('text-buy');
    });
});
