import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('./charts/DistributionDonut', () => ({
    default: ({ groupBy, parentAssetType }) => <div data-testid="donut">{groupBy}|{parentAssetType || ''}</div>,
}));
vi.mock('./charts/PnlBarChart', () => ({
    default: () => <div data-testid="bar" />,
}));

import PortfolioCharts from './PortfolioCharts';

describe('PortfolioCharts', () => {
    it('default groupBy=assetType, render', () => {
        render(<PortfolioCharts portfolio={[]} calculateProfitLoss={() => ({})} />);
        expect(screen.getByTestId('donut').textContent).toBe('assetType|');
        expect(screen.getByTestId('bar')).toBeInTheDocument();
    });

    it('symbol mode + parentAssetType prop', () => {
        render(<PortfolioCharts portfolio={[]} calculateProfitLoss={() => ({})} groupBy="symbol" parentAssetType="STOCK" />);
        expect(screen.getByTestId('donut').textContent).toBe('symbol|STOCK');
    });
});
