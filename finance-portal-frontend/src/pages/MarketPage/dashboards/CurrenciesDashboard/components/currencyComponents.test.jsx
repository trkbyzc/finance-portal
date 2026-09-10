import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k }),
}));
vi.mock('../../../../../utils/currencyUtils.js', () => ({
    getFlagUrl: (c) => `flag/${c}.svg`,
}));
vi.mock('../../../../../utils/formatters/numberFormatter', () => ({
    formatNumber: (v) => `${v}`,
}));

import MajorCurrencyCards from './MajorCurrencyCards';
import ShowcaseSlider from './ShowcaseSlider';

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('MajorCurrencyCards', () => {
    it('show=false → null', () => {
        const { container } = wrap(<MajorCurrencyCards currencies={[]} loading={false} show={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('loading=true → null', () => {
        const { container } = wrap(<MajorCurrencyCards currencies={[]} loading show />);
        expect(container.firstChild).toBeNull();
    });

    it('show=true → kartlar render edilir', () => {
        const data = [
            { currencyCode: 'USD', currencyName: 'US Dollar', forexBuying: 32, forexSelling: 32.5, changePercent: 1.5 },
            { currencyCode: 'EUR', currencyName: 'Euro', forexBuying: 35, forexSelling: 35.5, changePercent: -2 },
        ];
        wrap(<MajorCurrencyCards currencies={data} loading={false} show />);
        expect(screen.getByText('USD/TRY')).toBeInTheDocument();
        expect(screen.getByText('EUR/TRY')).toBeInTheDocument();
    });

    it('pozitif change → text-buy / negatif → text-sell', () => {
        const data = [
            { currencyCode: 'USD', currencyName: 'X', forexBuying: 1, forexSelling: 2, changePercent: 5 },
            { currencyCode: 'EUR', currencyName: 'Y', forexBuying: 1, forexSelling: 2, changePercent: -5 },
        ];
        const { container } = wrap(<MajorCurrencyCards currencies={data} loading={false} show />);
        expect(container.innerHTML).toContain('text-buy');
        expect(container.innerHTML).toContain('text-sell');
    });
});

describe('ShowcaseSlider', () => {
    it('boş asset list → null', () => {
        const { container } = render(<ShowcaseSlider showcaseAssets={[]} selectedAsset={null} setSelectedAsset={() => {}} />);
        expect(container.firstChild).toBeNull();
    });

    it('null assets → null', () => {
        const { container } = render(<ShowcaseSlider showcaseAssets={null} selectedAsset={null} setSelectedAsset={() => {}} />);
        expect(container.firstChild).toBeNull();
    });

    it('asset list dolu → her item için button', () => {
        const assets = [
            { symbol: 'BTC-USD', price: 60000, changePercent: 2 },
            { symbol: 'ETH-USD', price: 3000, changePercent: -1 },
        ];
        const { container } = render(<ShowcaseSlider showcaseAssets={assets} selectedAsset={null} setSelectedAsset={() => {}} />);
        expect(container.querySelectorAll('button').length).toBe(2);
    });

    it('selectedAsset match → border-primary class', () => {
        const assets = [{ symbol: 'BTC-USD', price: 60000, changePercent: 1 }];
        const { container } = render(
            <ShowcaseSlider showcaseAssets={assets} selectedAsset={{ symbol: 'BTC-USD' }} setSelectedAsset={() => {}} />
        );
        expect(container.querySelector('button').className).toContain('border-primary');
    });

    it('click → setSelectedAsset(asset)', () => {
        const setSelected = vi.fn();
        const assets = [{ symbol: 'X', price: 1, changePercent: 0 }];
        const { container } = render(<ShowcaseSlider showcaseAssets={assets} selectedAsset={null} setSelectedAsset={setSelected} />);
        fireEvent.click(container.querySelector('button'));
        expect(setSelected).toHaveBeenCalledWith(assets[0]);
    });

    it('FUND assetCategory → "labels.performance" gösterir', () => {
        const assets = [{ symbol: 'FNDX', assetCategory: 'FUND', changePercent: 1 }];
        render(<ShowcaseSlider showcaseAssets={assets} selectedAsset={null} setSelectedAsset={() => {}} />);
        expect(screen.getByText('labels.performance')).toBeInTheDocument();
    });
});
