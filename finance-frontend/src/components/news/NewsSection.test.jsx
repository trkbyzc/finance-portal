import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { navMock } = vi.hoisted(() => ({ navMock: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navMock }));
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k }),
}));

const { newsRef } = vi.hoisted(() => ({ newsRef: { current: { news: [], loading: false } } }));
vi.mock('../../hooks/useNewsData', () => ({
    useNewsData: () => newsRef.current,
}));
vi.mock('../../utils/formatters/dateFormatter', () => ({
    formatDateTime: (d) => `DT:${d}`,
}));
vi.mock('./NewsAssetChip', () => ({
    default: () => <span data-testid="chip" />,
}));

import NewsSection from './NewsSection';

beforeEach(() => navMock.mockReset());

describe('NewsSection', () => {
    it('loading=true → skeleton blok render', () => {
        newsRef.current = { news: [], loading: true };
        const { container } = render(<NewsSection category="Borsa" titleKey="t.x" />);
        expect(container.querySelectorAll('.animate-pulse').length).toBe(6);
    });

    it('boş news → noData mesajı', () => {
        newsRef.current = { news: [], loading: false };
        render(<NewsSection category="Borsa" titleKey="t.x" />);
        expect(screen.getByText('common:status.noData')).toBeInTheDocument();
    });

    it('news dolu → her item kartı render edilir + chip + tarih', () => {
        newsRef.current = {
            news: [
                { title: 'A', source: 'X', link: 'http://a', pubDate: '2026-01-01' },
                { title: 'B', source: 'Y', pubDate: '2026-01-02' },
            ],
            loading: false,
        };
        render(<NewsSection category="Borsa" titleKey="t.x" />);
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
        expect(screen.getByText('DT:2026-01-01')).toBeInTheDocument();
    });

    it("limit prop honored", () => {
        newsRef.current = {
            news: Array.from({ length: 10 }, (_, i) => ({ title: `T${i}`, pubDate: '2026' })),
            loading: false,
        };
        render(<NewsSection category="x" titleKey="t" limit={3} />);
        expect(screen.getByText('T0')).toBeInTheDocument();
        expect(screen.queryByText('T5')).toBeNull();
    });

    it('View all → navigate(/news)', () => {
        newsRef.current = { news: [], loading: false };
        render(<NewsSection category="x" titleKey="t" />);
        fireEvent.click(screen.getByText(/viewAll/));
        expect(navMock).toHaveBeenCalledWith('/news');
    });

    it('item click → navigate(/news/detail) state newsItem', () => {
        newsRef.current = { news: [{ title: 'A', pubDate: 'D' }], loading: false };
        const { container } = render(<NewsSection category="x" titleKey="t" />);
        fireEvent.click(container.querySelector('.cursor-pointer'));
        expect(navMock).toHaveBeenCalledWith('/news/detail', { state: { newsItem: { title: 'A', pubDate: 'D' } } });
    });

    it('accent=buy → buy renk class', () => {
        newsRef.current = { news: [], loading: false };
        const { container } = render(<NewsSection category="x" titleKey="t" accent="buy" />);
        expect(container.innerHTML).toContain('text-buy');
    });

    it('bilinmeyen accent → primary fallback', () => {
        newsRef.current = { news: [], loading: false };
        const { container } = render(<NewsSection category="x" titleKey="t" accent="xxx" />);
        expect(container.innerHTML).toContain('text-primary');
    });
});
