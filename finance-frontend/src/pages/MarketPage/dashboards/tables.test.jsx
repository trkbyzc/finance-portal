import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k }),
}));
vi.mock('../../../../utils/currencyUtils.js', () => ({
    getFlagUrl: (code) => `flag/${code}.svg`,
}));

import CurrencyTable from './CurrenciesDashboard/components/CurrencyTable';
import CryptoTable from './CryptoDashboard/components/CryptoTable';

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('CurrencyTable', () => {
    it('loading → animate-pulse', () => {
        const { container } = wrap(<CurrencyTable data={[]} loading />);
        expect(container.querySelector('.animate-pulse')).toBeTruthy();
    });

    it('dolu data → satırlar render edilir + currencyCode', () => {
        const data = [
            { currencyCode: 'USD', currencyName: 'US Dollar', forexBuying: 32, forexSelling: 32.5 },
            { currencyCode: 'EUR', currencyName: 'Euro', forexBuying: 35, forexSelling: 35.5 },
        ];
        wrap(<CurrencyTable data={data} loading={false} />);
        expect(screen.getByText('USD')).toBeInTheDocument();
        expect(screen.getByText('EUR')).toBeInTheDocument();
    });

    it('boş data → tablo başlığı yine de render', () => {
        wrap(<CurrencyTable data={[]} loading={false} />);
        expect(screen.getByText('currencies.headerTitle')).toBeInTheDocument();
    });
});

describe('CryptoTable', () => {
    it('loading → animate-pulse', () => {
        const { container } = wrap(<CryptoTable data={[]} loading />);
        expect(container.querySelector('.animate-pulse')).toBeTruthy();
    });

    it('boş data → noResults', () => {
        wrap(<CryptoTable data={[]} loading={false} />);
        expect(screen.getByText('common.noResults')).toBeInTheDocument();
    });

    it('coin row render — USDT silinmez (Tether case)', () => {
        const data = [{ currencyCode: 'USDT', currencyName: 'Tether', forexBuying: 1, changePercent: 0.01 }];
        wrap(<CryptoTable data={data} loading={false} />);
        expect(screen.getByText('USDT')).toBeInTheDocument();
    });

    it("BTCUSDT → 'BTC' display, suffix silinir", () => {
        const data = [{ currencyCode: 'BTCUSDT', currencyName: 'Kripto - Bitcoin', forexBuying: 60000, changePercent: 5 }];
        wrap(<CryptoTable data={data} loading={false} />);
        expect(screen.getAllByText('BTC').length).toBeGreaterThanOrEqual(1);
    });

    it('changePercent pozitif → text-buy class', () => {
        const data = [{ currencyCode: 'BTC', currencyName: 'BTC', forexBuying: 1, changePercent: 5 }];
        const { container } = wrap(<CryptoTable data={data} loading={false} />);
        expect(container.innerHTML).toContain('text-buy');
    });

    it('changePercent negatif → text-sell class', () => {
        const data = [{ currencyCode: 'BTC', currencyName: 'BTC', forexBuying: 1, changePercent: -2 }];
        const { container } = wrap(<CryptoTable data={data} loading={false} />);
        expect(container.innerHTML).toContain('text-sell');
    });
});
