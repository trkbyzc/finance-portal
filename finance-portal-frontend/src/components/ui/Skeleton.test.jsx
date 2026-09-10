import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton, MarketRowSkeleton, MarketTableSkeleton } from './Skeleton';

describe('Skeleton', () => {
    it('default class + aria-hidden', () => {
        const { container } = render(<Skeleton />);
        const div = container.firstChild;
        expect(div.className).toContain('skeleton');
        expect(div.getAttribute('aria-hidden')).toBe('true');
    });

    it('custom className merge', () => {
        const { container } = render(<Skeleton className="h-4 w-24" />);
        expect(container.firstChild.className).toContain('h-4');
        expect(container.firstChild.className).toContain('w-24');
    });

    it('style prop geçer', () => {
        const { container } = render(<Skeleton style={{ height: 10 }} />);
        expect(container.firstChild.style.height).toBe('10px');
    });
});

describe('MarketRowSkeleton', () => {
    it('4 Skeleton parça render eder', () => {
        const { container } = render(<MarketRowSkeleton />);
        const skels = container.querySelectorAll('.skeleton');
        expect(skels.length).toBeGreaterThanOrEqual(4);
    });
});

describe('MarketTableSkeleton', () => {
    it('default 6 row', () => {
        const { container } = render(<MarketTableSkeleton />);
        const rows = container.querySelectorAll('.flex.items-center.gap-3');
        expect(rows.length).toBe(6);
    });

    it('rows prop override', () => {
        const { container } = render(<MarketTableSkeleton rows={3} />);
        const rows = container.querySelectorAll('.flex.items-center.gap-3');
        expect(rows.length).toBe(3);
    });
});
