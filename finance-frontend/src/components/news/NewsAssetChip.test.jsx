import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { navMock } = vi.hoisted(() => ({ navMock: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navMock }));

const { linkRef } = vi.hoisted(() => ({ linkRef: { current: null } }));
vi.mock('../../utils/newsAssetLink', () => ({
    newsAssetLink: () => linkRef.current,
}));

import NewsAssetChip from './NewsAssetChip';

beforeEach(() => navMock.mockReset());

describe('NewsAssetChip', () => {
    it('link null → null render', () => {
        linkRef.current = null;
        const { container } = render(<NewsAssetChip item={{}} />);
        expect(container.firstChild).toBeNull();
    });

    it('asset link → primary tonu + TrendingUp icon', () => {
        linkRef.current = { to: '/chart/X', label: 'X', type: 'asset' };
        const { container } = render(<NewsAssetChip item={{}} />);
        expect(container.querySelector('button').className).toContain('text-primary');
        expect(screen.getByText('X')).toBeInTheDocument();
    });

    it('category link → nötr ton', () => {
        linkRef.current = { to: '/markets/x', label: 'Borsa', type: 'category' };
        const { container } = render(<NewsAssetChip item={{}} />);
        expect(container.querySelector('button').className).toContain('text-text-muted');
        expect(screen.getByText('Borsa')).toBeInTheDocument();
    });

    it('click → navigate(link.to) + propagation engellenir', () => {
        linkRef.current = { to: '/chart/Y', label: 'Y', type: 'asset' };
        const { container } = render(<NewsAssetChip item={{}} />);
        fireEvent.click(container.querySelector('button'));
        expect(navMock).toHaveBeenCalledWith('/chart/Y');
    });

    it('className prop merge', () => {
        linkRef.current = { to: '/x', label: 'L', type: 'asset' };
        const { container } = render(<NewsAssetChip item={{}} className="ml-2" />);
        expect(container.querySelector('button').className).toContain('ml-2');
    });
});
