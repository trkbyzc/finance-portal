import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k })
}));

import PortfolioTabs from './PortfolioTabs';

const TABS = ['ALL', 'STOCK', 'CRYPTO'];
const counts = { ALL: 10, STOCK: 5, CRYPTO: 3 };

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
        const { container } = render(<PortfolioTabs tabs={['BOND']} counts={{}} activeTab="BOND" onChange={() => {}} />);
        expect(container.querySelector('span[class*="rounded-full"]').textContent).toBe('0');
    });

    it('tıklayınca onChange(type) çağrılır', () => {
        const onChange = vi.fn();
        const { container } = render(<PortfolioTabs tabs={TABS} counts={counts} activeTab="ALL" onChange={onChange} />);
        fireEvent.click(container.querySelectorAll('button')[1]);
        expect(onChange).toHaveBeenCalledWith('STOCK');
    });

    it('TYPE_META\'da olmayan tip render edilmez', () => {
        const { container } = render(
            <PortfolioTabs tabs={['UNKNOWN_TYPE', 'STOCK']} counts={{}} activeTab="STOCK" onChange={() => {}} />
        );
        // Sadece 1 buton (STOCK)
        expect(container.querySelectorAll('button')).toHaveLength(1);
    });
});
