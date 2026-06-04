import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k, fb) => fb ?? k }),
}));
vi.mock('../../../context/CurrencyContext', () => ({
    useCurrency: () => ({ currency: 'TRY', convertPrice: (v) => v }),
}));
vi.mock('../../../utils/formatters/currencyFormatter', () => ({
    formatCurrency: (v) => `₺${v}`,
}));
vi.mock('./portfolioChartColors', () => ({ tooltipStyle: {} }));

// Recharts likes ResponsiveContainer + measured dimensions; mock to render children.
vi.mock('recharts', async () => {
    return {
        BarChart: ({ children }) => <div data-testid="barchart">{children}</div>,
        Bar: ({ children }) => <div data-testid="bar">{children}</div>,
        Cell: () => <div data-testid="cell" />,
        XAxis: () => null,
        YAxis: () => null,
        CartesianGrid: () => null,
        Tooltip: () => null,
        ResponsiveContainer: ({ children }) => <div>{children}</div>,
    };
});

import PnlBarChart from './PnlBarChart';

describe('PnlBarChart', () => {
    it('boş portfolio → noHoldings render', () => {
        render(<PnlBarChart portfolio={[]} calculateProfitLoss={() => ({})} />);
        expect(screen.getByText('holdings.noHoldings')).toBeInTheDocument();
    });

    it('null portfolio → noHoldings', () => {
        render(<PnlBarChart portfolio={null} calculateProfitLoss={() => ({})} />);
        expect(screen.getByText('holdings.noHoldings')).toBeInTheDocument();
    });

    it('portfolio dolu → BarChart + her item için Cell', () => {
        const pf = [
            { symbol: 'A', assetType: 'STOCK' },
            { symbol: 'B', assetType: 'CRYPTO' },
        ];
        const calc = (item) => ({ profitLoss: item.symbol === 'A' ? 100 : -50 });
        render(<PnlBarChart portfolio={pf} calculateProfitLoss={calc} />);
        expect(screen.getByTestId('barchart')).toBeInTheDocument();
        expect(screen.getAllByTestId('cell')).toHaveLength(2);
    });

    it('header çevirileri render', () => {
        render(<PnlBarChart portfolio={[]} calculateProfitLoss={() => ({})} />);
        expect(screen.getByText('stats.totalPnl')).toBeInTheDocument();
        expect(screen.getByText('Varlık bazlı kâr / zarar')).toBeInTheDocument();
    });
});
