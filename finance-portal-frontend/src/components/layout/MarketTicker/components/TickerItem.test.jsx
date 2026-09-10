import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => navigateMock };
});

const { i18nMock } = vi.hoisted(() => ({ i18nMock: { language: 'tr' } }));
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ i18n: i18nMock })
}));

import TickerItem from './TickerItem';

const wrap = (props) => render(<MemoryRouter><TickerItem {...props} /></MemoryRouter>);

describe('TickerItem', () => {
    beforeEach(() => { navigateMock.mockClear(); });

    it('name + price + change render', () => {
        wrap({ name: 'BTC', price: 65000, change: 2.5 });
        expect(screen.getByText('BTC')).toBeInTheDocument();
        expect(screen.getByText('2.50%')).toBeInTheDocument();
    });

    it('positive change → buy renkli + TrendingUp', () => {
        const { container } = wrap({ name: 'X', price: 100, change: 5 });
        expect(container.innerHTML).toContain('text-buy');
    });

    it('negative change → sell renkli', () => {
        const { container } = wrap({ name: 'X', price: 100, change: -3 });
        expect(container.innerHTML).toContain('text-sell');
    });

    it('change=0 → positive (buy)', () => {
        const { container } = wrap({ name: 'X', price: 100, change: 0 });
        expect(container.innerHTML).toContain('text-buy');
    });

    it('null change → 0.00%', () => {
        wrap({ name: 'X', price: 100, change: null });
        expect(screen.getByText('0.00%')).toBeInTheDocument();
    });

    it('symbol verilirse cursor-pointer + role=button', () => {
        const { container } = wrap({ name: 'X', price: 100, change: 1, symbol: 'BTC' });
        const wrapper = container.querySelector('button[type="button"]');
        expect(wrapper).toBeInTheDocument();
        expect(wrapper.className).toContain('cursor-pointer');
    });

    it('symbol yoksa cursor pointer yok', () => {
        const { container } = wrap({ name: 'X', price: 100, change: 1 });
        expect(container.querySelector('button[type="button"]')).toBeNull();
    });

    it('click + symbol → navigate /chart/SYMBOL', () => {
        const { container } = wrap({ name: 'X', price: 100, change: 1, symbol: 'BTC' });
        fireEvent.click(container.querySelector('button[type="button"]'));
        expect(navigateMock).toHaveBeenCalledWith('/chart/BTC');
    });

    it('click + symbol + category → /chart/SYMBOL?cat=...', () => {
        const { container } = wrap({ name: 'X', price: 100, change: 1, symbol: 'BTC', category: 'CRYPTO' });
        fireEvent.click(container.querySelector('button[type="button"]'));
        expect(navigateMock).toHaveBeenCalledWith('/chart/BTC?cat=CRYPTO');
    });

    it('Enter tuşu → navigate', () => {
        const { container } = wrap({ name: 'X', price: 100, change: 1, symbol: 'BTC' });
        fireEvent.keyDown(container.querySelector('button[type="button"]'), { key: 'Enter' });
        expect(navigateMock).toHaveBeenCalled();
    });
});
