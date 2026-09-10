import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k }),
}));

import CryptoStats from './CryptoStats';

describe('CryptoStats', () => {
    it('loading → animate-pulse', () => {
        const { container } = render(<CryptoStats coins={[]} loading />);
        expect(container.querySelector('.animate-pulse')).toBeTruthy();
    });

    it('boş coins → vol/dominance "—"', () => {
        render(<CryptoStats coins={[]} loading={false} />);
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
    });

    it('BTC dominance hesaplanır', () => {
        const coins = [
            { currencyCode: 'BTC', marketCap: 60 },
            { currencyCode: 'ETH', marketCap: 40 },
        ];
        render(<CryptoStats coins={coins} loading={false} />);
        expect(screen.getByText('60.0%')).toBeInTheDocument();
    });

    it('volume24h trillion formatı', () => {
        const coins = [{ currencyCode: 'X', volume24h: 1.5e12, marketCap: 1 }];
        render(<CryptoStats coins={coins} loading={false} />);
        expect(screen.getByText(/\$1\.50T/)).toBeInTheDocument();
    });

    it('volume24h billion formatı', () => {
        const coins = [{ currencyCode: 'X', volume24h: 2.5e9, marketCap: 1 }];
        render(<CryptoStats coins={coins} loading={false} />);
        expect(screen.getByText(/\$2\.50B/)).toBeInTheDocument();
    });

    it('volume24h million formatı', () => {
        const coins = [{ currencyCode: 'X', volume24h: 3.5e6, marketCap: 1 }];
        render(<CryptoStats coins={coins} loading={false} />);
        expect(screen.getByText(/\$3\.50M/)).toBeInTheDocument();
    });

    it('activeCoins → liste uzunluğu', () => {
        const coins = Array.from({ length: 7 }, (_, i) => ({ currencyCode: `C${i}` }));
        render(<CryptoStats coins={coins} loading={false} />);
        expect(screen.getByText('7')).toBeInTheDocument();
    });
});
