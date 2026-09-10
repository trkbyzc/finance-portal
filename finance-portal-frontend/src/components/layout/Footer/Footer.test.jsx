import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k, opts) => (opts?.year ? `${k}-${opts.year}` : k) }),
}));

const { authRef } = vi.hoisted(() => ({ authRef: { current: { isAuthenticated: false } } }));
vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => authRef.current,
}));

import Footer from './Footer';

const renderFooter = () => render(<MemoryRouter><Footer /></MemoryRouter>);

describe('Footer', () => {
    it('logo + marka adı render', () => {
        authRef.current.isAuthenticated = false;
        renderFooter();
        expect(screen.getByAltText('FinansPortal')).toBeInTheDocument();
        expect(screen.getByText(/FINANS/)).toBeInTheDocument();
    });

    it('disclaimer + copyright render', () => {
        authRef.current.isAuthenticated = false;
        renderFooter();
        expect(screen.getByText('footer:disclaimer')).toBeInTheDocument();
        expect(screen.getByText(/footer:copyright/)).toBeInTheDocument();
    });

    it('Piyasalar — 6 link', () => {
        authRef.current.isAuthenticated = false;
        renderFooter();
        // marketLinks key'leri t() içine geçer
        ['trStocks', 'usStocks', 'crypto', 'currencies', 'commodities', 'funds']
            .forEach(k => expect(screen.getByText(`footer:links.${k}`)).toBeInTheDocument());
    });

    it('Araçlar — auth=false → 3 public araç', () => {
        authRef.current.isAuthenticated = false;
        renderFooter();
        expect(screen.getByText('footer:links.interest')).toBeInTheDocument();
        expect(screen.queryByText('footer:links.portfolio')).toBeNull();
        expect(screen.queryByText('footer:links.watchlist')).toBeNull();
    });

    it('Araçlar — auth=true → portfolio/watchlist/simulation görünür', () => {
        authRef.current.isAuthenticated = true;
        renderFooter();
        expect(screen.getByText('footer:links.portfolio')).toBeInTheDocument();
        expect(screen.getByText('footer:links.watchlist')).toBeInTheDocument();
        expect(screen.getByText('footer:links.simulation')).toBeInTheDocument();
    });

    it('Kurumsal placeholder — 4 a href="#"', () => {
        authRef.current.isAuthenticated = false;
        renderFooter();
        ['about', 'contact', 'privacy', 'terms']
            .forEach(k => expect(screen.getByText(`footer:links.${k}`)).toBeInTheDocument());
    });
});
