import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k, fb) => fb ?? k }),
}));

const { authRef, notifyMock, currencyRef, portfolioApiMock, assetTypeMapper, currencyConv } = vi.hoisted(() => ({
    authRef: { current: { isAuthenticated: true } },
    notifyMock: vi.fn(),
    currencyRef: { current: { currency: 'TRY', convertPrice: (v) => v, toNative: (v) => v } },
    portfolioApiMock: { getPortfolios: vi.fn(), addManualEntry: vi.fn() },
    assetTypeMapper: { toBackendAssetType: (c) => c },
    currencyConv: { nativeCurrencyForType: () => 'TRY' },
}));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => authRef.current }));
vi.mock('../../context/NotificationContext', () => ({ useNotify: () => notifyMock }));
vi.mock('../../context/CurrencyContext', () => ({ useCurrency: () => currencyRef.current }));
vi.mock('../../services/api/portfolioApi', () => ({ portfolioApi: portfolioApiMock }));
vi.mock('../../utils/assetTypeMapper', () => assetTypeMapper);
vi.mock('../../utils/currencyConversion', () => currencyConv);
vi.mock('../alarm/AlarmModal', () => ({
    default: ({ open }) => open ? <div data-testid="alarm-modal" /> : null,
}));

import AssetActions from './AssetActions';

const wrap = (overrides = {}) => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }) => <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

beforeEach(() => {
    authRef.current.isAuthenticated = true;
    portfolioApiMock.getPortfolios.mockReset().mockResolvedValue([]);
    portfolioApiMock.addManualEntry.mockReset().mockResolvedValue({});
    notifyMock.mockReset();
});

const baseAsset = { symbol: 'BTC', name: 'Bitcoin', assetCategory: 'CRYPTO', displayPrice: 60000 };

describe('AssetActions', () => {
    it('asset null → null render', () => {
        const { container } = render(<AssetActions asset={null} />, { wrapper: wrap() });
        expect(container.firstChild).toBeNull();
    });

    it('isAuthenticated=false → null render', () => {
        authRef.current.isAuthenticated = false;
        const { container } = render(<AssetActions asset={baseAsset} />, { wrapper: wrap() });
        expect(container.firstChild).toBeNull();
    });

    it('iki buton render: Portföye Ekle + Alarm Kur', () => {
        render(<AssetActions asset={baseAsset} />, { wrapper: wrap() });
        expect(screen.getByText('Portföye Ekle')).toBeInTheDocument();
        expect(screen.getAllByText('Alarm Kur').length).toBeGreaterThan(0);
    });

    it('Alarm Kur tıklayınca AlarmModal açılır', () => {
        render(<AssetActions asset={baseAsset} />, { wrapper: wrap() });
        // Alarm Kur button (visible span'i içerir)
        const alarmBtn = screen.getAllByText('Alarm Kur')[0].closest('button');
        fireEvent.click(alarmBtn);
        expect(screen.getByTestId('alarm-modal')).toBeInTheDocument();
    });

    it('Portföye Ekle tıklayınca modal açılır + sembol gösterilir', () => {
        render(<AssetActions asset={baseAsset} />, { wrapper: wrap() });
        fireEvent.click(screen.getByText('Portföye Ekle'));
        expect(screen.getAllByText('BTC').length).toBeGreaterThan(0);
        expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });

    it('Submit → portfolioApi.addManualEntry + notify success', async () => {
        portfolioApiMock.getPortfolios.mockResolvedValue([{ id: 5, name: 'Ana' }]);
        render(<AssetActions asset={baseAsset} />, { wrapper: wrap() });
        fireEvent.click(screen.getByText('Portföye Ekle'));
        await waitFor(() => expect(portfolioApiMock.getPortfolios).toHaveBeenCalled());

        const form = screen.getByText('portfolio:modal.quantity').closest('form');
        fireEvent.submit(form);
        await waitFor(() => expect(portfolioApiMock.addManualEntry).toHaveBeenCalled());
        await waitFor(() => expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' })));
    });

    it('Submit hata → notify error', async () => {
        portfolioApiMock.addManualEntry.mockRejectedValue({ response: { data: { message: 'boom' } } });
        render(<AssetActions asset={baseAsset} />, { wrapper: wrap() });
        fireEvent.click(screen.getByText('Portföye Ekle'));

        const form = screen.getByText('portfolio:modal.quantity').closest('form');
        fireEvent.submit(form);
        await waitFor(() => expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' })));
    });

    it('Multiple portfolios → select görünür', async () => {
        portfolioApiMock.getPortfolios.mockResolvedValue([
            { id: 1, name: 'A' }, { id: 2, name: 'B' }
        ]);
        render(<AssetActions asset={baseAsset} />, { wrapper: wrap() });
        fireEvent.click(screen.getByText('Portföye Ekle'));
        await waitFor(() => expect(screen.getByText('Hangi portföye?')).toBeInTheDocument());
    });

    it('X butonu → modal kapanır', () => {
        const { container } = render(<AssetActions asset={baseAsset} />, { wrapper: wrap() });
        fireEvent.click(screen.getByText('Portföye Ekle'));
        const xBtn = container.querySelector('.bg-surface button');
        fireEvent.click(xBtn);
        expect(screen.queryByText('Bitcoin')).toBeNull();
    });

    it('compact prop → smaller padding class', () => {
        const { container } = render(<AssetActions asset={baseAsset} compact />, { wrapper: wrap() });
        expect(container.innerHTML).toContain('px-3 py-2');
    });

    it('BOND varlığı (yield) → fiyat label\'ında para birimi YOK', () => {
        render(<AssetActions asset={{ symbol: 'TR2030', yield: 25, assetCategory: 'BOND' }} />, { wrapper: wrap() });
        fireEvent.click(screen.getByText('Portföye Ekle'));
        const label = screen.getByText('portfolio:modal.purchasePrice');
        expect(label.textContent).toBe('portfolio:modal.purchasePrice');
    });
});
