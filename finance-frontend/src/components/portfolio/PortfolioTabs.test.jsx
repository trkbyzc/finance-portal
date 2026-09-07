import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k })
}));

import PortfolioTabs from './PortfolioTabs';

const TABS = ['ALL', 'SPOT', 'FIXED'];
const counts = { ALL: 10, SPOT: 5, FIXED: 3 };

describe('PortfolioTabs', () => {
    it('verilen 3 tab render', () => {
        const { container } = render(<PortfolioTabs tabs={TABS} counts={counts} activeTab="ALL" onChange={() => {}} />);
        expect(container.querySelectorAll('button')).toHaveLength(3);
    });

    it('counts badge\'leri her tab\'da gözükür', () => {
        render(<PortfolioTabs tabs={TABS} counts={counts} activeTab="ALL" onChange={() => {}} />);
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('counts eksik → 0 fallback', () => {
        const { container } = render(<PortfolioTabs tabs={['DERIV']} counts={{}} activeTab="DERIV" onChange={() => {}} />);
        expect(container.querySelector('span[class*="rounded-full"]').textContent).toBe('0');
    });

    it('tıklayınca onChange(type) çağrılır', () => {
        const onChange = vi.fn();
        const { container } = render(<PortfolioTabs tabs={TABS} counts={counts} activeTab="ALL" onChange={onChange} />);
        fireEvent.click(container.querySelectorAll('button')[1]);
        expect(onChange).toHaveBeenCalledWith('SPOT');
    });

    it('TYPE_META\'da olmayan tip render edilmez', () => {
        const { container } = render(
            <PortfolioTabs tabs={['UNKNOWN_TYPE', 'SPOT']} counts={{}} activeTab="SPOT" onChange={() => {}} />
        );
        // Sadece 1 buton (SPOT)
        expect(container.querySelectorAll('button')).toHaveLength(1);
    });
});
