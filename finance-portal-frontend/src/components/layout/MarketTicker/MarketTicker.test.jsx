import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k }),
}));

const { tickRef } = vi.hoisted(() => ({ tickRef: { current: { tickerData: [] } } }));
vi.mock('../../../hooks/useTickerData', () => ({
    useTickerData: () => tickRef.current,
}));
vi.mock('./components/TickerItem', () => ({
    default: ({ name }) => <span data-testid="item">{name}</span>,
}));
vi.mock('./components/TickerStyles', () => ({
    default: () => <style data-testid="styles" />,
}));

import MarketTicker from './MarketTicker';

describe('MarketTicker', () => {
    it('boş data → null', () => {
        tickRef.current = { tickerData: [] };
        const { container } = render(<MarketTicker />);
        expect(container.firstChild).toBeNull();
    });

    it('USD currencyCode → "USD/TRY"', () => {
        tickRef.current = { tickerData: [{ currencyCode: 'USD', forexSelling: 32 }] };
        const { queryAllByTestId } = render(<MarketTicker />);
        // 4x kopya extendedData
        expect(queryAllByTestId('item')[0].textContent).toBe('USD/TRY');
    });

    it('XU100 → "BIST 100"', () => {
        tickRef.current = { tickerData: [{ symbol: 'XU100', price: 1000 }] };
        const { queryAllByTestId } = render(<MarketTicker />);
        expect(queryAllByTestId('item')[0].textContent).toBe('BIST 100');
    });

    it('BTC → "BTC/USD"', () => {
        tickRef.current = { tickerData: [{ symbol: 'BTC', forexSelling: 60000 }] };
        const { queryAllByTestId } = render(<MarketTicker />);
        expect(queryAllByTestId('item')[0].textContent).toBe('BTC/USD');
    });

    it('extendedData = 4x length', () => {
        tickRef.current = { tickerData: [{ symbol: 'A' }, { symbol: 'B' }] };
        const { queryAllByTestId } = render(<MarketTicker />);
        expect(queryAllByTestId('item')).toHaveLength(8);
    });

    it("gold name içeren → gramGold key", () => {
        tickRef.current = { tickerData: [{ symbol: 'X', name: 'Gram Altın' }] };
        const { queryAllByTestId } = render(<MarketTicker />);
        expect(queryAllByTestId('item')[0].textContent).toBe('gold.gramGold');
    });
});
