import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k, def) => def || k })
}));
vi.mock('../../../utils/keycloak', () => ({
    goToRegister: vi.fn()
}));

import DashboardHero from './DashboardHero';
import { goToRegister } from '../../../utils/keycloak';

describe('DashboardHero', () => {
    it('hero başlığı + CTA butonları render', () => {
        render(<DashboardHero navigate={vi.fn()} />);
        expect(screen.getByText('hero.titleLine1')).toBeInTheDocument();
        expect(screen.getByText('hero.titleLine2')).toBeInTheDocument();
        expect(screen.getByText('hero.exploreMarkets')).toBeInTheDocument();
        expect(screen.getByText('cta.createAccount')).toBeInTheDocument();
    });

    it('"Piyasalar" butonu → navigate(/markets/live)', () => {
        const navigate = vi.fn();
        render(<DashboardHero navigate={navigate} />);
        fireEvent.click(screen.getByText('hero.exploreMarkets'));
        expect(navigate).toHaveBeenCalledWith('/markets/live');
    });

    it('"Hesap Oluştur" butonu → goToRegister()', () => {
        render(<DashboardHero navigate={vi.fn()} />);
        fireEvent.click(screen.getByText('cta.createAccount'));
        expect(goToRegister).toHaveBeenCalled();
    });

    it('3 istatistik mini-chip render', () => {
        render(<DashboardHero navigate={vi.fn()} />);
        expect(screen.getByText('hero.stat1')).toBeInTheDocument();
        expect(screen.getByText('hero.stat2')).toBeInTheDocument();
        expect(screen.getByText('hero.stat3')).toBeInTheDocument();
    });
});
