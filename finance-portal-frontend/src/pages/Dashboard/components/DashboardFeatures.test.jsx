import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k })
}));

import DashboardFeatures from './DashboardFeatures';

describe('DashboardFeatures', () => {
    it('section header + 3 feature card render', () => {
        render(<DashboardFeatures />);
        expect(screen.getByText('features.title')).toBeInTheDocument();
        expect(screen.getByText('features.subtitle')).toBeInTheDocument();
        expect(screen.getByText('features.realtime.title')).toBeInTheDocument();
        expect(screen.getByText('features.tools.title')).toBeInTheDocument();
        expect(screen.getByText('features.portfolio.title')).toBeInTheDocument();
    });

    it('3 FeatureCard grid render', () => {
        const { container } = render(<DashboardFeatures />);
        const cards = container.querySelectorAll('h3');
        expect(cards.length).toBeGreaterThanOrEqual(3);
    });
});
