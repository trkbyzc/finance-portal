import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { prefsRef } = vi.hoisted(() => ({ prefsRef: { current: null } }));
vi.mock('../../../hooks/useUserPreferences', () => ({
    default: () => ({ preferences: prefsRef.current }),
}));
vi.mock('./MarketTicker', () => ({
    default: () => <div data-testid="ticker" />,
}));

import GlobalTicker from './GlobalTicker';

const renderAt = (path) => render(
    <MemoryRouter initialEntries={[path]}><GlobalTicker /></MemoryRouter>
);

describe('GlobalTicker', () => {
    it('guest + home → ticker render', () => {
        prefsRef.current = null;
        const { queryByTestId } = renderAt('/');
        expect(queryByTestId('ticker')).toBeTruthy();
    });

    it('guest + non-home → null', () => {
        prefsRef.current = null;
        const { queryByTestId } = renderAt('/portfolio');
        expect(queryByTestId('ticker')).toBeNull();
    });

    it('auth HOME_ONLY + non-home → null', () => {
        prefsRef.current = { tickerScope: 'HOME_ONLY' };
        const { queryByTestId } = renderAt('/markets/crypto');
        expect(queryByTestId('ticker')).toBeNull();
    });

    it('auth ALL_PAGES → her sayfada render', () => {
        prefsRef.current = { tickerScope: 'ALL_PAGES' };
        const { queryByTestId } = renderAt('/portfolio');
        expect(queryByTestId('ticker')).toBeTruthy();
    });

    it('auth HOME_ONLY + home → render', () => {
        prefsRef.current = { tickerScope: 'HOME_ONLY' };
        const { queryByTestId } = renderAt('/');
        expect(queryByTestId('ticker')).toBeTruthy();
    });

    it('auth ALL_PAGES + home → render', () => {
        prefsRef.current = { tickerScope: 'ALL_PAGES' };
        const { queryByTestId } = renderAt('/');
        expect(queryByTestId('ticker')).toBeTruthy();
    });
});
