import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k }),
}));

import CryptoHeader from './CryptoDashboard/components/CryptoHeader';
import CommodityHeader from './CommodityDashboard/components/CommodityHeader';
import CurrencyHeader from './CurrenciesDashboard/components/CurrencyHeader';

describe.each([
    ['CryptoHeader', CryptoHeader, 'crypto.headerTitle'],
    ['CommodityHeader', CommodityHeader, 'commodity.headerTitle'],
    ['CurrencyHeader', CurrencyHeader, 'currencies.headerTitle'],
])('%s', (_name, Component, titleKey) => {
    it('başlık render', () => {
        render(<Component searchQuery="" setSearchQuery={() => {}} />);
        expect(screen.getByText(titleKey)).toBeInTheDocument();
    });

    it('searchQuery input render + change handler', () => {
        const setSearch = vi.fn();
        const { container } = render(<Component searchQuery="abc" setSearchQuery={setSearch} />);
        const input = container.querySelector('input[type="text"]');
        expect(input.value).toBe('abc');
        fireEvent.change(input, { target: { value: 'XYZ' } });
        expect(setSearch).toHaveBeenCalledWith('XYZ');
    });
});
